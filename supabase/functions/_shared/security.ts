import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const ALLOWED_ORIGINS = [
  'https://compustar.co.bw',
  'https://www.compustar.co.bw',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];

export function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

export function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
  });
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
  const ip = forwarded.split(',')[0]?.trim();
  return ip || 'unknown';
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function clampText(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max);
}

export function parseStaffEmails(...chunks: unknown[]) {
  const set = new Set<string>();
  for (const chunk of chunks) {
    String(chunk || '')
      .split(/[,;\s]+/)
      .map((v) => v.trim().toLowerCase())
      .filter((email) => isValidEmail(email))
      .forEach((email) => set.add(email));
  }
  if (!set.size) set.add('compustarbw@gmail.com');
  return [...set];
}

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/** Returns true when request is allowed. */
export async function enforceRateLimit(
  req: Request,
  action: string,
  limit = 5,
  windowSeconds = 3600,
  extraKey = ''
) {
  const ip = getClientIp(req);
  const bucket = `${action}:${ip}${extraKey ? `:${extraKey}` : ''}`.toLowerCase();
  const client = serviceClient();
  if (!client) {
    // Fail closed for abuse-sensitive endpoints when service role is missing
    console.error('Rate limit unavailable: missing service role');
    return { ok: false, error: 'Service temporarily unavailable' };
  }
  const { data, error } = await client.rpc('consume_rate_limit', {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds
  });
  if (error) {
    console.error('Rate limit RPC error', error.message);
    return { ok: false, error: 'Service temporarily unavailable' };
  }
  if (data !== true) {
    return { ok: false, error: 'Too many requests. Please try again later.' };
  }
  return { ok: true };
}

export function isHoneypotTripped(body: Record<string, unknown>) {
  const trap = String(body.website || body.company || body.fax || '').trim();
  return Boolean(trap);
}

export async function readJsonBody(req: Request, maxBytes = 20_000) {
  const text = await req.text();
  if (text.length > maxBytes) {
    return { ok: false as const, error: 'Request too large' };
  }
  try {
    return { ok: true as const, body: JSON.parse(text || '{}') as Record<string, unknown> };
  } catch {
    return { ok: false as const, error: 'Invalid JSON body' };
  }
}
