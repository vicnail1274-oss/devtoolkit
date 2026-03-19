/**
 * Convert standard Base64 to URL-safe Base64.
 * Replaces +, / and strips trailing = padding.
 */
export function toUrlSafeBase64(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert URL-safe Base64 back to standard Base64.
 * Restores +, / and re-adds padding.
 */
export function fromUrlSafeBase64(b64: string): string {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return s;
}

/**
 * Encode a UTF-8 string to Base64.
 * @param input - The string to encode.
 * @param urlSafe - If true, returns URL-safe Base64.
 */
export function base64Encode(input: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  let result = btoa(binary);
  if (urlSafe) result = toUrlSafeBase64(result);
  return result;
}

/**
 * Decode a Base64 string to UTF-8.
 * @param input - The Base64 string to decode.
 * @param urlSafe - If true, treats input as URL-safe Base64.
 */
export function base64Decode(input: string, urlSafe = false): string {
  let b64 = input.trim();
  if (urlSafe) b64 = fromUrlSafeBase64(b64);
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
