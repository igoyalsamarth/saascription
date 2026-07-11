import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import {
  createGmailClient,
  extractPlainTextBody,
  getHeader,
} from "../gmail/client";
import { markSyncCompleted } from "../gmail/token-store";
import { isSubscriptionCandidate, scoreEmailMetadata } from "./heuristics";
import { ingestExtractedSubscriptions } from "./ingest";
import type { GmailSyncWorkflowParams } from "./jobs";
import {
  countCandidates,
  countListedMessages,
  countPendingExtraction,
  countUnfilteredMessages,
  getAllLlmExtractions,
  getCandidatesForExtraction,
  getUnfilteredMessageIds,
  insertMessageIds,
  saveLlmResult,
  updateCandidateMetadata,
  updateSyncJob,
} from "./jobs";
import {
  type ExtractedSubscription,
  extractSubscriptionsFromEmails,
} from "./llm";

const GMAIL_QUERY = "newer_than:365d -in:spam -in:trash";
const FILTER_BATCH_SIZE = 100;
const EXTRACT_BATCH_SIZE = 5;

const STEP_CONFIG = {
  retries: {
    limit: 3,
    delay: "5 seconds" as const,
    backoff: "exponential" as const,
  },
  timeout: "30 seconds" as const,
};

export class GmailSyncWorkflow extends WorkflowEntrypoint<
  CloudflareBindings,
  GmailSyncWorkflowParams
> {
  async run(
    event: WorkflowEvent<GmailSyncWorkflowParams>,
    step: WorkflowStep,
  ): Promise<void> {
    const { jobId, workspaceId, ownerUserId } = event.payload;

    try {
      await step.do("init", STEP_CONFIG, async () => {
        await updateSyncJob(this.env.DB, jobId, {
          status: "running",
          phase: "listing",
        });
      });

      let pageToken: string | undefined;
      let pageIndex = 0;

      do {
        const token = pageToken;
        const result = await step.do(
          `list-page-${pageIndex}`,
          STEP_CONFIG,
          async () => {
            const client = await createGmailClient(
              this.env.DB,
              this.env,
              workspaceId,
            );
            const list = await client.listMessages({
              query: GMAIL_QUERY,
              pageToken: token,
              maxResults: 500,
            });
            const ids = (list.messages ?? []).map((m) => m.id);
            if (ids.length > 0) {
              await insertMessageIds(this.env.DB, jobId, ids);
            }
            const total = await countListedMessages(this.env.DB, jobId);
            await updateSyncJob(this.env.DB, jobId, {
              totalMessages: total,
              phase: "listing",
            });
            return {
              nextPageToken: list.nextPageToken,
              pageCount: ids.length,
            };
          },
        );
        pageToken = result.nextPageToken;
        pageIndex++;
      } while (pageToken);

      await step.do("listing-complete", STEP_CONFIG, async () => {
        const total = await countListedMessages(this.env.DB, jobId);
        await updateSyncJob(this.env.DB, jobId, {
          totalMessages: total,
          phase: "filtering",
          processedMessages: 0,
        });
      });

      let filterBatch = 0;
      while (true) {
        const remaining = await step.do(
          `filter-batch-${filterBatch}`,
          STEP_CONFIG,
          async () => {
            const pending = await countUnfilteredMessages(this.env.DB, jobId);
            if (pending === 0) {
              return { done: true, processed: 0 };
            }

            const messageIds = await getUnfilteredMessageIds(
              this.env.DB,
              jobId,
              FILTER_BATCH_SIZE,
            );
            if (messageIds.length === 0) {
              return { done: true, processed: 0 };
            }

            const client = await createGmailClient(
              this.env.DB,
              this.env,
              workspaceId,
            );
            let candidatesInBatch = 0;

            for (const messageId of messageIds) {
              const message = await client.getMessageMetadata(messageId);
              const sender = getHeader(message, "From") ?? "";
              const subject = getHeader(message, "Subject") ?? "";
              const receivedAt = message.internalDate
                ? new Date(Number(message.internalDate)).toISOString()
                : null;
              const meta = { messageId, sender, subject, receivedAt };
              const score = scoreEmailMetadata(meta);
              const isCandidate = isSubscriptionCandidate(meta);

              await updateCandidateMetadata(this.env.DB, jobId, messageId, {
                sender,
                subject,
                receivedAt,
                heuristicScore: score,
                isCandidate,
              });
              if (isCandidate) {
                candidatesInBatch++;
              }
            }

            const job = await this.env.DB.prepare(
              `SELECT processed_messages, candidate_count FROM sync_jobs WHERE id = ?`,
            )
              .bind(jobId)
              .first<{ processed_messages: number; candidate_count: number }>();

            const processed =
              (job?.processed_messages ?? 0) + messageIds.length;
            const candidateCount =
              (job?.candidate_count ?? 0) + candidatesInBatch;

            await updateSyncJob(this.env.DB, jobId, {
              processedMessages: processed,
              candidateCount,
              phase: "filtering",
            });

            return { done: false, processed: messageIds.length };
          },
        );

        if (remaining.done || remaining.processed === 0) {
          break;
        }
        filterBatch++;
      }

      await step.do("filtering-complete", STEP_CONFIG, async () => {
        const candidates = await countCandidates(this.env.DB, jobId);
        await updateSyncJob(this.env.DB, jobId, {
          candidateCount: candidates,
          phase: "extracting",
        });
      });

      let extractBatch = 0;
      while (true) {
        const batchResult = await step.do(
          `extract-batch-${extractBatch}`,
          STEP_CONFIG,
          async () => {
            const pending = await countPendingExtraction(this.env.DB, jobId);
            if (pending === 0) {
              return { done: true, extracted: 0 };
            }

            const rows = await getCandidatesForExtraction(
              this.env.DB,
              jobId,
              EXTRACT_BATCH_SIZE,
            );
            if (rows.length === 0) {
              return { done: true, extracted: 0 };
            }

            const client = await createGmailClient(
              this.env.DB,
              this.env,
              workspaceId,
            );
            const emails = [];

            for (const row of rows) {
              const message = await client.getMessageFull(row.gmail_message_id);
              const body = extractPlainTextBody(message);
              emails.push({
                messageId: row.gmail_message_id,
                sender: row.sender ?? getHeader(message, "From") ?? "",
                subject: row.subject ?? getHeader(message, "Subject") ?? "",
                body,
              });
            }

            const extractions = await extractSubscriptionsFromEmails(
              this.env,
              emails,
            );

            for (const email of emails) {
              const match = extractions.find(
                (e) => e.messageId === email.messageId,
              );
              await saveLlmResult(
                this.env.DB,
                jobId,
                email.messageId,
                match ?? null,
              );
            }

            const job = await this.env.DB.prepare(
              `SELECT extracted_count FROM sync_jobs WHERE id = ?`,
            )
              .bind(jobId)
              .first<{ extracted_count: number }>();

            await updateSyncJob(this.env.DB, jobId, {
              extractedCount: (job?.extracted_count ?? 0) + extractions.length,
              phase: "extracting",
            });

            return { done: false, extracted: extractions.length };
          },
        );

        if (batchResult.done) {
          break;
        }
        extractBatch++;
      }

      const ingestResult = await step.do("ingest", STEP_CONFIG, async () => {
        await updateSyncJob(this.env.DB, jobId, { phase: "ingesting" });

        const rows = await getAllLlmExtractions(this.env.DB, jobId);
        const extractions: ExtractedSubscription[] = [];

        for (const row of rows) {
          if (!row.llm_result) {
            continue;
          }
          try {
            const parsed = JSON.parse(
              row.llm_result,
            ) as ExtractedSubscription | null;
            if (parsed?.name && parsed.confidence >= 0.7) {
              extractions.push({
                ...parsed,
                messageId: row.gmail_message_id,
              });
            }
          } catch {
            // skip invalid JSON
          }
        }

        return ingestExtractedSubscriptions(
          this.env.DB,
          workspaceId,
          ownerUserId,
          extractions,
        );
      });

      await step.do("complete", STEP_CONFIG, async () => {
        await updateSyncJob(this.env.DB, jobId, {
          status: "completed",
          phase: "done",
          importedCount: ingestResult.imported,
          skippedDuplicates: ingestResult.skippedDuplicates,
          completedAt: new Date().toISOString(),
        });
        await markSyncCompleted(this.env.DB, workspaceId);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateSyncJob(this.env.DB, jobId, {
        status: "failed",
        errorMessage: message,
        completedAt: new Date().toISOString(),
      });
      throw new NonRetryableError(message);
    }
  }
}
