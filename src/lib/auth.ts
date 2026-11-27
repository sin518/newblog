import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';

export const SESSION_COOKIE_NAME = 'sin_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getEnv(key: string): string {
  return process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key] ?? '';
}

function getAuthConfig() {
  const username = getEnv('ADMIN_USERNAME') || 'sin';
  const password = getEnv('ADMIN_PASSWORD') || '';
  const secret = getEnv('AUTH_SECRET') || 'dev-fallback-secret-change-in-env';
  return { username, password, secret };
}

function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) {
    // Compare against self to keep constant time regardless of length mismatch
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/** Verify single-owner credentials against .env configuration. */
export function verifyCredentials(username: string, password: string): boolean {
  const cfg = getAuthConfig();
  if (!cfg.password) return false;
  return safeEqualString(username.trim(), cfg.username) && safeEqualString(password, cfg.password);
}

/** Create an HMAC-SHA256 signed session token. */
export function createSessionToken(username: string): string {
  const { secret } = getAuthConfig();
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + SESSION_TTL_MS,
    }),
    'utf8',
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/** Verify an HMAC-SHA256 signed session token and return payload if valid. */
export function verifySessionToken(token: string | undefined): { username: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const { secret, username: configuredUsername } = getAuthConfig();
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqualString(sig, expectedSig)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      u?: string;
      exp?: number;
    };
    if (!data.u || typeof data.exp !== 'number') return null;
    if (Date.now() > data.exp) return null;
    if (!safeEqualString(data.u, configuredUsername)) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export function getSessionFromCookies(cookies: AstroCookies): { username: string } | null {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function isHttpsRequest(request: Request): boolean {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0]?.trim() === 'https';
  return request.url.startsWith('https://');
}
