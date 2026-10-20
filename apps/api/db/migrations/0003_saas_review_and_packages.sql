-- Seller listings: review status, and package prices.
-- Existing catalog rows stay published so subscription search keeps working.
-- New and edited seller submissions set status to 'review' in application code.

ALTER TABLE saas ADD COLUMN status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('review', 'published'));

CREATE INDEX IF NOT EXISTS idx_saas_status ON saas (status);

CREATE TABLE IF NOT EXISTS saas_packages (
  id TEXT PRIMARY KEY NOT NULL,
  saas_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (
    billing_interval IN ('monthly', 'yearly')
  ),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (saas_id) REFERENCES saas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saas_packages_saas
  ON saas_packages (saas_id, sort_order);

-- Admins can publish seller listings that are waiting for review.
-- Existing users stay non-admin. Grant access with:
-- UPDATE users SET admin = 1 WHERE email = 'person@example.com';

ALTER TABLE users ADD COLUMN admin INTEGER NOT NULL DEFAULT 0
  CHECK (admin IN (0, 1));
