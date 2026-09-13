/**
 * Apply Compustar branded auth email templates to Supabase Auth.
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 *   node scripts/apply-email-templates.mjs
 */
import { authSubjects, authTemplates } from '../supabase/email-templates/auth.mjs';

const projectRef = 'fuenxerwefmwiaonrxkc';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN before running this script.');
  process.exit(1);
}

const payload = { ...authSubjects, ...authTemplates };

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const text = await res.text();
if (!res.ok) {
  console.error(res.status, text);
  process.exit(1);
}

console.log('Auth email templates applied.');
const data = JSON.parse(text);
console.log({
  confirmation: data.mailer_subjects_confirmation,
  recovery: data.mailer_subjects_recovery,
  magic_link: data.mailer_subjects_magic_link
});
