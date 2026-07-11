import { findOrCreateSaasByName } from "../controllers/saas";
import type { ExtractedSubscription } from "./llm";

const GMAIL_SYNC_SUB_TYPE = "gmail_sync";
const GMAIL_SYNC_STATUS = "new";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function defaultNextBillingAt(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

export type IngestResult = {
  imported: number;
  skippedDuplicates: number;
};

export async function ingestExtractedSubscriptions(
  db: D1Database,
  workspaceId: string,
  ownerUserId: string,
  extractions: ExtractedSubscription[],
): Promise<IngestResult> {
  let imported = 0;
  let skippedDuplicates = 0;

  const existingRows = await db
    .prepare(
      `SELECT sa.name
       FROM subscriptions s
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE s.workspace_id = ?
       AND s.status NOT IN ('cancelled', 'expired')`,
    )
    .bind(workspaceId)
    .all<{ name: string }>();

  const existingNames = new Set(
    (existingRows.results ?? []).map((r) => normalizeName(r.name)),
  );

  const seenExternalRefs = new Set<string>();
  const seenNames = new Set<string>();

  for (const ext of extractions) {
    const externalRef = `gmail:${ext.messageId}`;
    if (seenExternalRefs.has(externalRef)) {
      continue;
    }
    seenExternalRefs.add(externalRef);

    const existingRef = await db
      .prepare(`SELECT id FROM subscriptions WHERE external_ref = ? LIMIT 1`)
      .bind(externalRef)
      .first<{ id: string }>();
    if (existingRef) {
      skippedDuplicates++;
      continue;
    }

    const normalized = normalizeName(ext.name);
    if (existingNames.has(normalized) || seenNames.has(normalized)) {
      skippedDuplicates++;
      continue;
    }
    seenNames.add(normalized);

    const saas = await findOrCreateSaasByName(db, ext.name);
    const id = crypto.randomUUID();
    const nextBillingAt = ext.nextBillingAt ?? defaultNextBillingAt();

    await db
      .prepare(
        `INSERT INTO subscriptions (
           id, created_by, workspace_id, saas_id, sub_type, status,
           cost, currency, billing_interval, subscribed_at,
           next_billing_at, external_ref,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, datetime('now'), datetime('now'))`,
      )
      .bind(
        id,
        ownerUserId,
        workspaceId,
        saas.id,
        GMAIL_SYNC_SUB_TYPE,
        GMAIL_SYNC_STATUS,
        amountToCents(ext.amount),
        ext.currency,
        ext.interval,
        nextBillingAt,
        externalRef,
      )
      .run();

    existingNames.add(normalized);
    imported++;
  }

  return { imported, skippedDuplicates };
}
