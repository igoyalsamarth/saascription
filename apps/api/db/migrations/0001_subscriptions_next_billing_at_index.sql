-- Reminder cron queries filter subscriptions by next_billing_at.
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_at
  ON subscriptions (next_billing_at);
