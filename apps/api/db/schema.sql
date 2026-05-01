-- Saascription — D1 schema (subscription tracking per workspace / email)
-- Apply: bun run db:migrate:local | bun run db:migrate:remote
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Users (auth profile: id from your IdP e.g. Clerk, plus display fields)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ---------------------------------------------------------------------------
-- Workspaces (one per sign-up; holds many tracked emails)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces (owner_user_id);

-- ---------------------------------------------------------------------------
-- Emails attached to a workspace (exactly one is primary per workspace)
-- Global UNIQUE(email): one mailbox belongs to one workspace.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_emails (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  email TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE (workspace_id, email),
  UNIQUE (email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_one_primary_email
  ON workspace_emails (workspace_id)
  WHERE is_primary = 1;

CREATE INDEX IF NOT EXISTS idx_workspace_emails_workspace
  ON workspace_emails (workspace_id);

-- ---------------------------------------------------------------------------
-- SaaS catalog (subscriptions reference saas.id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saas (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT,
  icon_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saas_name ON saas (name);

-- ---------------------------------------------------------------------------
-- Subscriptions: one row per tracked plan for a given workspace email + SaaS
--
-- sub_type: billing tier label (free, pro, enterprise, team, …)
-- status:
--   new       — recently started / onboarding
--   old       — established, still active (long-lived)
--   cancelled — explicitly cancelled (see cancelled_at)
--   expired   — ended without a cancel record (trial ended, plan ended, etc.)
--   failed    — billing / payment / sync failure (see failed_at, failure_reason)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_email_id TEXT NOT NULL,
  saas_id TEXT NOT NULL,
  sub_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('new', 'old', 'cancelled', 'expired', 'failed')
  ),
  cost INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT DEFAULT 'monthly',
  subscribed_at TEXT NOT NULL,
  next_billing_at TEXT,
  cancelled_at TEXT,
  failed_at TEXT,
  failure_reason TEXT,
  external_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_email_id) REFERENCES workspace_emails(id) ON DELETE CASCADE,
  FOREIGN KEY (saas_id) REFERENCES saas(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email
  ON subscriptions (workspace_email_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_saas
  ON subscriptions (saas_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_failed_at
  ON subscriptions (failed_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscribed_at
  ON subscriptions (subscribed_at);
