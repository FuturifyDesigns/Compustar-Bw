import { serviceClient } from './security.ts';

type SendEmailArgs = {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  replyTo?: { email: string; name?: string };
  kind?: string;
  meta?: Record<string, unknown>;
};

function formatAddress(entry: { email: string; name?: string }) {
  const email = String(entry.email || '').trim();
  const name = String(entry.name || '').trim().replace(/[<>\r\n]/g, '');
  if (!email) return '';
  return name ? `"${name}" <${email}>` : email;
}

async function sendViaRestApi(
  apiKey: string,
  senderEmail: string,
  senderName: string,
  args: SendEmailArgs
) {
  const body: Record<string, unknown> = {
    sender: { name: senderName, email: senderEmail },
    to: args.to,
    subject: args.subject,
    htmlContent: args.html
  };
  if (args.replyTo?.email) {
    body.replyTo = {
      email: args.replyTo.email,
      name: args.replyTo.name || 'Customer'
    };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    return { ok: false as const, status: res.status, detail: await res.text() };
  }
  return { ok: true as const, status: res.status, detail: '', mode: 'api' as const };
}

async function queueViaOutbox(args: SendEmailArgs) {
  const client = serviceClient();
  if (!client) {
    return { ok: false as const, status: 500, detail: 'Service role unavailable for email queue' };
  }

  const rows = args.to.map((recipient) => ({
    kind: args.kind || 'generic',
    to_email: recipient.email,
    to_name: recipient.name || '',
    reply_to_email: args.replyTo?.email || '',
    reply_to_name: args.replyTo?.name || '',
    subject: args.subject,
    html: args.html,
    meta: args.meta || {},
    status: 'pending'
  }));

  const { error } = await client.from('email_outbox').insert(rows);
  if (error) {
    return { ok: false as const, status: 500, detail: error.message };
  }
  return { ok: true as const, status: 200, detail: '', mode: 'queued' as const };
}

/**
 * Send email through Brevo.
 * - xkeysib- API keys send immediately over HTTPS
 * - xsmtpsib- SMTP keys are queued (Edge runtimes cannot open SMTP ports)
 */
export async function sendTransactionalEmail(args: SendEmailArgs) {
  const apiOrSmtpKey = Deno.env.get('BREVO_API_KEY') || '';
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'futurifydesigns@gmail.com';
  const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Compustar Botswana';

  if (!apiOrSmtpKey) {
    return { ok: false as const, status: 500, detail: 'Missing BREVO_API_KEY' };
  }
  if (!args.to.length) {
    return { ok: false as const, status: 400, detail: 'No recipients' };
  }

  if (apiOrSmtpKey.startsWith('xkeysib-')) {
    return sendViaRestApi(apiOrSmtpKey, senderEmail, senderName, args);
  }

  // SMTP key — queue for the GitHub Action / worker that can speak SMTP.
  return queueViaOutbox(args);
}

export { formatAddress };
