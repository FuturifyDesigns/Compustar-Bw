import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const smtpUser = process.env.BREVO_SMTP_USER || 'a01a5d001@smtp-brevo.com';
const smtpPass = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL || 'futurifydesigns@gmail.com';
const senderName = process.env.BREVO_SENDER_NAME || 'Compustar Botswana';

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!smtpPass) {
  console.error('Missing BREVO_API_KEY / BREVO_SMTP_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: smtpUser, pass: smtpPass }
});

function formatAddress(email, name = '') {
  const cleanEmail = String(email || '').trim();
  const cleanName = String(name || '').trim().replace(/[<>\r\n]/g, '');
  if (!cleanEmail) return '';
  return cleanName ? `"${cleanName}" <${cleanEmail}>` : cleanEmail;
}

const { data: rows, error } = await supabase
  .from('email_outbox')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: true })
  .limit(40);

if (error) {
  console.error('Load outbox failed', error.message);
  process.exit(1);
}

if (!rows?.length) {
  console.log('No pending emails');
  process.exit(0);
}

let sent = 0;
let failed = 0;

for (const row of rows) {
  await supabase
    .from('email_outbox')
    .update({ status: 'sending', attempts: (row.attempts || 0) + 1 })
    .eq('id', row.id);

  try {
    await transporter.sendMail({
      from: formatAddress(senderEmail, senderName),
      to: formatAddress(row.to_email, row.to_name),
      replyTo: row.reply_to_email
        ? formatAddress(row.reply_to_email, row.reply_to_name)
        : undefined,
      subject: row.subject,
      html: row.html,
      text: 'Please view this message in an HTML-capable email client.'
    });

    await supabase
      .from('email_outbox')
      .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: '' })
      .eq('id', row.id);
    sent += 1;
    console.log('sent', row.id, row.to_email, row.subject);
  } catch (err) {
    failed += 1;
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from('email_outbox')
      .update({ status: 'failed', last_error: message.slice(0, 500) })
      .eq('id', row.id);
    console.error('failed', row.id, message);
  }
}

console.log(JSON.stringify({ pending: rows.length, sent, failed }));
