import type { NextDaySubscriptionDetail, ReminderSubscriptionRow } from "./queries";

const DASH_URL = "https://dash.saascription.app";
const DEFAULT_FROM = "Saascription <reminders@saascription.app>";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatMoney(costCents: number | null, currency: string): string {
  if (costCents === null || costCents === undefined) {
    return "—";
  }
  const amount = costCents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "USD"}`;
  }
}

function formatBillingInterval(interval: string): string {
  if (interval === "yearly") {
    return "yearly";
  }
  if (interval === "custom") {
    return "custom";
  }
  return "monthly";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

function subscriptionRowHtml(row: ReminderSubscriptionRow): string {
  const workspace = row.workspaceName
    ? `<div style="color:#64748b;font-size:13px;">${escapeHtml(row.workspaceName)}</div>`
    : "";
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
      <div style="font-weight:600;color:#0f172a;">${escapeHtml(row.saasName)}</div>
      ${workspace}
    </td>
    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#334155;">
      ${escapeHtml(formatDate(row.nextBillingAt))}
    </td>
    <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#334155;text-align:right;">
      ${escapeHtml(formatMoney(row.costCents, row.currency))}
      <span style="color:#64748b;font-size:12px;"> / ${escapeHtml(formatBillingInterval(row.billingInterval))}</span>
    </td>
  </tr>`;
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
            <tr>
              <td style="padding:28px 28px 8px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6366f1;">Saascription</div>
                <h1 style="margin:12px 0 0;font-size:24px;line-height:1.3;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

export function buildMonthlyReminderEmail(input: {
  recipientName: string | null;
  subscriptions: ReminderSubscriptionRow[];
  monthLabel: string;
}): SendEmailInput {
  const greeting = input.recipientName?.trim()
    ? `Hi ${input.recipientName.trim()},`
    : "Hi there,";
  const rows = input.subscriptions.map(subscriptionRowHtml).join("");
  const html = emailShell(
    `Your ${input.monthLabel} subscription renewals`,
    `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">${escapeHtml(greeting)}</p>
     <p style="margin:0 0 20px;color:#334155;line-height:1.6;">
       Here are your upcoming subscription renewals for ${escapeHtml(input.monthLabel)}.
     </p>
     <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
       <thead>
         <tr>
           <th align="left" style="padding:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Service</th>
           <th align="left" style="padding:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Renews</th>
           <th align="right" style="padding:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
         </tr>
       </thead>
       <tbody>${rows}</tbody>
     </table>
     ${ctaButton("View subscriptions", `${DASH_URL}/configure/subscriptions`)}`,
  );

  return {
    to: "",
    subject: `Your ${input.monthLabel} subscription renewals`,
    html,
  };
}

export function buildNextDayReminderEmail(
  detail: NextDaySubscriptionDetail,
): SendEmailInput {
  const greeting = detail.recipientName?.trim()
    ? `Hi ${detail.recipientName.trim()},`
    : "Hi there,";
  const amount = formatMoney(detail.costCents, detail.currency);
  const interval = formatBillingInterval(detail.billingInterval);
  const renewDate = formatDate(detail.nextBillingAt);
  const html = emailShell(
    `${detail.saasName} renews soon`,
    `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">${escapeHtml(greeting)}</p>
     <p style="margin:0 0 20px;color:#334155;line-height:1.6;">
       <strong>${escapeHtml(detail.saasName)}</strong> is scheduled to renew on
       <strong>${escapeHtml(renewDate)}</strong>.
     </p>
     <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
       <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Renewal amount</div>
       <div style="font-size:22px;font-weight:700;color:#0f172a;">${escapeHtml(amount)} <span style="font-size:14px;font-weight:500;color:#64748b;">/ ${escapeHtml(interval)}</span></div>
     </div>
     ${ctaButton("Manage subscription", `${DASH_URL}/configure/subscriptions`)}`,
  );

  return {
    to: detail.recipientEmail,
    subject: `Reminder: ${detail.saasName} renews on ${renewDate}`,
    html,
  };
}

export async function sendEmailViaResend(
  apiKey: string,
  input: SendEmailInput,
  from = DEFAULT_FROM,
): Promise<SendEmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  const body = (await res.json().catch(() => null)) as
    | { id?: string; message?: string }
    | null;

  if (!res.ok) {
    const message =
      body?.message ?? `Resend API error (${res.status})`;
    return { ok: false, error: message };
  }

  if (!body?.id) {
    return { ok: false, error: "Resend API returned no message id" };
  }

  return { ok: true, id: body.id };
}
