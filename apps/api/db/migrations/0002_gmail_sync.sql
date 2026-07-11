-- Gmail sync: connections, jobs, and per-message processing state.

CREATE TABLE IF NOT EXISTS gmail_connections (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TEXT,
  scopes TEXT NOT NULL DEFAULT '[]',
  connected_at TEXT NOT NULL DEFAULT (datetime('now')),
  sync_completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gmail_connections_workspace
  ON gmail_connections (workspace_id);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'running', 'completed', 'failed')
  ),
  phase TEXT NOT NULL DEFAULT 'listing' CHECK (
    phase IN ('listing', 'filtering', 'extracting', 'ingesting', 'done')
  ),
  total_messages INTEGER NOT NULL DEFAULT 0,
  processed_messages INTEGER NOT NULL DEFAULT 0,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  extracted_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_duplicates INTEGER NOT NULL DEFAULT 0,
  workflow_instance_id TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_workspace
  ON sync_jobs (workspace_id);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_workspace_status
  ON sync_jobs (workspace_id, status);

CREATE TABLE IF NOT EXISTS sync_job_candidates (
  job_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  sender TEXT,
  subject TEXT,
  received_at TEXT,
  heuristic_score REAL,
  is_candidate INTEGER CHECK (is_candidate IN (0, 1)),
  llm_result TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (job_id, gmail_message_id),
  FOREIGN KEY (job_id) REFERENCES sync_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_job_candidates_job_candidate
  ON sync_job_candidates (job_id, is_candidate);
