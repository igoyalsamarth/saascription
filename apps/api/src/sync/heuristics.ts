export type EmailMetadata = {
  messageId: string;
  sender: string;
  subject: string;
  receivedAt: string | null;
};

const SUBJECT_KEYWORDS = [
  "receipt",
  "invoice",
  "subscription",
  "renewal",
  "renewed",
  "billing",
  "payment",
  "charged",
  "your plan",
  "membership",
  "auto-renew",
  "order confirmation",
];

const SENDER_DOMAINS = [
  "stripe.com",
  "paypal.com",
  "apple.com",
  "google.com",
  "amazon.com",
  "microsoft.com",
  "notion.so",
  "figma.com",
  "linear.app",
  "github.com",
  "vercel.com",
  "cloudflare.com",
  "openai.com",
  "anthropic.com",
  "slack.com",
  "zoom.us",
  "adobe.com",
  "dropbox.com",
  "spotify.com",
  "netflix.com",
];

const NEGATIVE_KEYWORDS = [
  "unsubscribe",
  "newsletter",
  "webinar",
  "sale ends",
  "% off",
  "limited time",
  "job alert",
  "digest",
];

export function scoreEmailMetadata(meta: EmailMetadata): number {
  const subject = meta.subject.toLowerCase();
  const sender = meta.sender.toLowerCase();
  let score = 0;

  for (const kw of SUBJECT_KEYWORDS) {
    if (subject.includes(kw)) {
      score += 2;
    }
  }

  for (const domain of SENDER_DOMAINS) {
    if (sender.includes(domain)) {
      score += 3;
    }
  }

  for (const kw of NEGATIVE_KEYWORDS) {
    if (subject.includes(kw)) {
      score -= 2;
    }
  }

  if (/\$\d+/.test(subject) || /usd|eur|gbp/i.test(subject)) {
    score += 1;
  }

  return score;
}

export function isSubscriptionCandidate(meta: EmailMetadata): boolean {
  return scoreEmailMetadata(meta) >= 3;
}
