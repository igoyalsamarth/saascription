export type SyncJobStatus = "queued" | "running" | "completed" | "failed";

export type SyncJobPhase =
  | "listing"
  | "filtering"
  | "extracting"
  | "ingesting"
  | "done";

export type SyncJobRow = {
  id: string;
  workspace_id: string;
  status: SyncJobStatus;
  phase: SyncJobPhase;
  total_messages: number;
  processed_messages: number;
  candidate_count: number;
  extracted_count: number;
  imported_count: number;
  skipped_duplicates: number;
  workflow_instance_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type SyncJobPublic = {
  id: string;
  workspaceId: string;
  status: SyncJobStatus;
  phase: SyncJobPhase;
  totalMessages: number;
  processedMessages: number;
  candidateCount: number;
  extractedCount: number;
  importedCount: number;
  skippedDuplicates: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type GmailSyncWorkflowParams = {
  jobId: string;
  workspaceId: string;
  ownerUserId: string;
};

export function mapSyncJobRow(row: SyncJobRow): SyncJobPublic {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    status: row.status,
    phase: row.phase,
    totalMessages: row.total_messages,
    processedMessages: row.processed_messages,
    candidateCount: row.candidate_count,
    extractedCount: row.extracted_count,
    importedCount: row.imported_count,
    skippedDuplicates: row.skipped_duplicates,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function createSyncJob(
  db: D1Database,
  workspaceId: string,
): Promise<SyncJobRow> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO sync_jobs (id, workspace_id, status, phase, created_at, updated_at)
       VALUES (?, ?, 'queued', 'listing', datetime('now'), datetime('now'))`,
    )
    .bind(id, workspaceId)
    .run();

  const row = await getSyncJob(db, id);
  if (!row) {
    throw new Error("Failed to create sync job");
  }
  return row;
}

export async function getSyncJob(
  db: D1Database,
  jobId: string,
): Promise<SyncJobRow | null> {
  const row = await db
    .prepare(`SELECT * FROM sync_jobs WHERE id = ?`)
    .bind(jobId)
    .first<SyncJobRow>();
  return row ?? null;
}

export async function getLatestSyncJobForWorkspace(
  db: D1Database,
  workspaceId: string,
): Promise<SyncJobRow | null> {
  const row = await db
    .prepare(
      `SELECT * FROM sync_jobs WHERE workspace_id = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(workspaceId)
    .first<SyncJobRow>();
  return row ?? null;
}

export async function hasRunningSyncJob(
  db: D1Database,
  workspaceId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT id FROM sync_jobs
       WHERE workspace_id = ? AND status IN ('queued', 'running')
       LIMIT 1`,
    )
    .bind(workspaceId)
    .first<{ id: string }>();
  return Boolean(row);
}

export async function updateSyncJob(
  db: D1Database,
  jobId: string,
  patch: Partial<{
    status: SyncJobStatus;
    phase: SyncJobPhase;
    totalMessages: number;
    processedMessages: number;
    candidateCount: number;
    extractedCount: number;
    importedCount: number;
    skippedDuplicates: number;
    workflowInstanceId: string;
    errorMessage: string;
    completedAt: string;
  }>,
): Promise<void> {
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (patch.status !== undefined) {
    sets.push("status = ?");
    values.push(patch.status);
  }
  if (patch.phase !== undefined) {
    sets.push("phase = ?");
    values.push(patch.phase);
  }
  if (patch.totalMessages !== undefined) {
    sets.push("total_messages = ?");
    values.push(patch.totalMessages);
  }
  if (patch.processedMessages !== undefined) {
    sets.push("processed_messages = ?");
    values.push(patch.processedMessages);
  }
  if (patch.candidateCount !== undefined) {
    sets.push("candidate_count = ?");
    values.push(patch.candidateCount);
  }
  if (patch.extractedCount !== undefined) {
    sets.push("extracted_count = ?");
    values.push(patch.extractedCount);
  }
  if (patch.importedCount !== undefined) {
    sets.push("imported_count = ?");
    values.push(patch.importedCount);
  }
  if (patch.skippedDuplicates !== undefined) {
    sets.push("skipped_duplicates = ?");
    values.push(patch.skippedDuplicates);
  }
  if (patch.workflowInstanceId !== undefined) {
    sets.push("workflow_instance_id = ?");
    values.push(patch.workflowInstanceId);
  }
  if (patch.errorMessage !== undefined) {
    sets.push("error_message = ?");
    values.push(patch.errorMessage);
  }
  if (patch.completedAt !== undefined) {
    sets.push("completed_at = ?");
    values.push(patch.completedAt);
  }

  values.push(jobId);
  await db
    .prepare(`UPDATE sync_jobs SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function insertMessageIds(
  db: D1Database,
  jobId: string,
  messageIds: string[],
): Promise<void> {
  if (messageIds.length === 0) {
    return;
  }
  const stmts = messageIds.map((messageId) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO sync_job_candidates (job_id, gmail_message_id, created_at, updated_at)
         VALUES (?, ?, datetime('now'), datetime('now'))`,
      )
      .bind(jobId, messageId),
  );
  await db.batch(stmts);
}

export async function getUnfilteredMessageIds(
  db: D1Database,
  jobId: string,
  limit: number,
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT gmail_message_id FROM sync_job_candidates
       WHERE job_id = ? AND is_candidate IS NULL
       ORDER BY gmail_message_id
       LIMIT ?`,
    )
    .bind(jobId, limit)
    .all<{ gmail_message_id: string }>();
  return (result.results ?? []).map((r) => r.gmail_message_id);
}

export async function countUnfilteredMessages(
  db: D1Database,
  jobId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM sync_job_candidates
       WHERE job_id = ? AND is_candidate IS NULL`,
    )
    .bind(jobId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function updateCandidateMetadata(
  db: D1Database,
  jobId: string,
  messageId: string,
  data: {
    sender: string;
    subject: string;
    receivedAt: string | null;
    heuristicScore: number;
    isCandidate: boolean;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE sync_job_candidates SET
         sender = ?,
         subject = ?,
         received_at = ?,
         heuristic_score = ?,
         is_candidate = ?,
         updated_at = datetime('now')
       WHERE job_id = ? AND gmail_message_id = ?`,
    )
    .bind(
      data.sender,
      data.subject,
      data.receivedAt,
      data.heuristicScore,
      data.isCandidate ? 1 : 0,
      jobId,
      messageId,
    )
    .run();
}

export async function countCandidates(
  db: D1Database,
  jobId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM sync_job_candidates
       WHERE job_id = ? AND is_candidate = 1`,
    )
    .bind(jobId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function getCandidatesForExtraction(
  db: D1Database,
  jobId: string,
  limit: number,
): Promise<
  Array<{
    gmail_message_id: string;
    sender: string | null;
    subject: string | null;
  }>
> {
  const result = await db
    .prepare(
      `SELECT gmail_message_id, sender, subject FROM sync_job_candidates
       WHERE job_id = ? AND is_candidate = 1 AND llm_result IS NULL
       ORDER BY heuristic_score DESC
       LIMIT ?`,
    )
    .bind(jobId, limit)
    .all<{
      gmail_message_id: string;
      sender: string | null;
      subject: string | null;
    }>();
  return result.results ?? [];
}

export async function countPendingExtraction(
  db: D1Database,
  jobId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM sync_job_candidates
       WHERE job_id = ? AND is_candidate = 1 AND llm_result IS NULL`,
    )
    .bind(jobId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function saveLlmResult(
  db: D1Database,
  jobId: string,
  messageId: string,
  result: unknown,
): Promise<void> {
  await db
    .prepare(
      `UPDATE sync_job_candidates SET
         llm_result = ?,
         updated_at = datetime('now')
       WHERE job_id = ? AND gmail_message_id = ?`,
    )
    .bind(JSON.stringify(result), jobId, messageId)
    .run();
}

export async function getAllLlmExtractions(
  db: D1Database,
  jobId: string,
): Promise<Array<{ gmail_message_id: string; llm_result: string | null }>> {
  const result = await db
    .prepare(
      `SELECT gmail_message_id, llm_result FROM sync_job_candidates
       WHERE job_id = ? AND is_candidate = 1 AND llm_result IS NOT NULL`,
    )
    .bind(jobId)
    .all<{ gmail_message_id: string; llm_result: string | null }>();
  return result.results ?? [];
}

export async function countListedMessages(
  db: D1Database,
  jobId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM sync_job_candidates WHERE job_id = ?`,
    )
    .bind(jobId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
