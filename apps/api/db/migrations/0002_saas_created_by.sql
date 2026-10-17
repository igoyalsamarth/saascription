-- Seller listings record which user created the catalog row.
-- Existing rows stay unowned (created_by NULL) so subscription find-or-create keeps working.
ALTER TABLE saas ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saas_created_by ON saas (created_by);
