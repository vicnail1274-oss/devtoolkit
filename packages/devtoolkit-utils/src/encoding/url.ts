/**
 * URL-encode a string (component mode).
 * Encodes all special characters including &, =, ?, etc.
 */
export function urlEncodeComponent(input: string): string {
  return encodeURIComponent(input);
}

/**
 * URL-decode a component-encoded string.
 */
export function urlDecodeComponent(input: string): string {
  return decodeURIComponent(input);
}

/**
 * URL-encode a full URL (preserves :, /, ?, #, etc.).
 */
export function urlEncode(input: string): string {
  return encodeURI(input);
}

/**
 * URL-decode a full URL.
 */
export function urlDecode(input: string): string {
  return decodeURI(input);
}
