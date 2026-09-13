/**
 * Apply supabase/orders-auth.sql using a Supabase personal access token.
 * Usage (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 *   node scripts/apply-orders-auth.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRef = 'fuenxerwefmwiaonrxkc';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN before running this script.');
  process.exit(1);
}

const sql = await readFile(path.resolve('supabase/orders-auth.sql'), 'utf8');
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
});

const text = await res.text();
if (!res.ok) {
  console.error(res.status, text);
  process.exit(1);
}
console.log('Schema applied.');
console.log(text.slice(0, 500));
