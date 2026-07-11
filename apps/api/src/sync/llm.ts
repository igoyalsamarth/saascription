export type ExtractedSubscription = {
  messageId: string;
  name: string;
  amount: number;
  currency: string;
  interval: "monthly" | "yearly" | "custom";
  nextBillingAt: string | null;
  confidence: number;
};

export type EmailForExtraction = {
  messageId: string;
  sender: string;
  subject: string;
  body: string;
};

const SYSTEM_PROMPT = `You extract recurring SaaS subscription billing details from emails.
Return only valid JSON: an array of objects with keys:
messageId, name, amount, currency, interval, nextBillingAt, confidence.

Rules:
- messageId must match the input email messageId.
- name is the SaaS/product name (not the payment processor).
- amount is a number in major currency units (e.g. 9.99).
- currency is ISO 4217 (default USD).
- interval is monthly, yearly, or custom.
- nextBillingAt is YYYY-MM-DD or null if unknown.
- confidence is 0-1; use <0.7 for uncertain or one-time purchases.
- Skip marketing emails, one-time purchases, and non-subscription receipts.
- If an email has no subscription, omit it from the array.`;

function truncateBody(body: string, maxLen = 4000): string {
  if (body.length <= maxLen) {
    return body;
  }
  return `${body.slice(0, maxLen)}\n...[truncated]`;
}

function parseInterval(v: unknown): "monthly" | "yearly" | "custom" {
  if (v === "monthly" || v === "yearly" || v === "custom") {
    return v;
  }
  return "monthly";
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function extractSubscriptionsFromEmails(
  env: CloudflareBindings,
  emails: EmailForExtraction[],
): Promise<ExtractedSubscription[]> {
  if (emails.length === 0) {
    return [];
  }

  const userContent = emails
    .map(
      (e) =>
        `messageId: ${e.messageId}\nFrom: ${e.sender}\nSubject: ${e.subject}\nBody:\n${truncateBody(e.body)}`,
    )
    .join("\n\n---\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract subscriptions from these emails. Respond with {"subscriptions": [...]}.\n\n${userContent}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return [];
  }

  let parsed: { subscriptions?: unknown[] };
  try {
    parsed = JSON.parse(content) as { subscriptions?: unknown[] };
  } catch {
    return [];
  }

  const results: ExtractedSubscription[] = [];
  for (const item of parsed.subscriptions ?? []) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const messageId = typeof o.messageId === "string" ? o.messageId : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const amount = typeof o.amount === "number" ? o.amount : Number(o.amount);
    const confidence =
      typeof o.confidence === "number" ? o.confidence : Number(o.confidence);
    if (!messageId || !name || !Number.isFinite(amount) || amount < 0) {
      continue;
    }
    if (!Number.isFinite(confidence) || confidence < 0.7) {
      continue;
    }
    const currency =
      typeof o.currency === "string" && o.currency.trim()
        ? o.currency.trim().toUpperCase()
        : "USD";
    const interval = parseInterval(o.interval);
    let nextBillingAt: string | null = null;
    if (typeof o.nextBillingAt === "string" && isValidDate(o.nextBillingAt)) {
      nextBillingAt = o.nextBillingAt;
    }

    results.push({
      messageId,
      name,
      amount,
      currency,
      interval,
      nextBillingAt,
      confidence,
    });
  }

  return results;
}
