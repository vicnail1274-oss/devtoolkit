export { md5 } from './md5';

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Hash a string using the Web Crypto API (SHA family).
 * @returns Lowercase hex string.
 */
export async function hashWithCrypto(algorithm: string, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute a hash using the specified algorithm.
 * MD5 uses a pure-JS implementation; SHA algorithms use Web Crypto.
 */
export async function computeHash(algo: HashAlgorithm, text: string): Promise<string> {
  if (algo === 'MD5') {
    const { md5 } = await import('./md5');
    return md5(text);
  }
  return hashWithCrypto(algo, text);
}
