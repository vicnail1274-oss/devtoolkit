import type { Env, TokenPayload } from './types';

// Simple HMAC-SHA256 JWT implementation for Cloudflare Workers
// (no npm dependencies needed — uses Web Crypto API)

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function signJWT(payload: TokenPayload, secret: string): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64url(sig)}`;
}

export async function verifyJWT(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;

    const key = await getKey(secret);
    // Decode signature
    const sigStr = base64urlDecode(sig);
    const sigBuf = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);

    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBuf, new TextEncoder().encode(`${header}.${body}`)
    );
    if (!valid) return null;

    const payload: TokenPayload = JSON.parse(base64urlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// Extract and verify user from request
export async function getAuthUser(request: Request, env: Env): Promise<TokenPayload | null> {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyJWT(authHeader.slice(7), env.JWT_SECRET);
  }

  // Check cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/dt_session=([^;]+)/);
    if (match) {
      return verifyJWT(match[1], env.JWT_SECRET);
    }
  }

  return null;
}

// Helper: require auth, return 401 if not authenticated
export async function requireAuth(request: Request, env: Env): Promise<TokenPayload | Response> {
  const user = await getAuthUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

// Helper: require Pro subscription
export async function requirePro(request: Request, env: Env): Promise<TokenPayload | Response> {
  const result = await requireAuth(request, env);
  if (result instanceof Response) return result;
  if (result.plan !== 'pro') {
    return new Response(JSON.stringify({ error: 'Pro subscription required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return result;
}

// Generate a random UUID
export function generateId(): string {
  return crypto.randomUUID();
}
