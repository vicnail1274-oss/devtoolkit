import { describe, it, expect } from 'vitest';
import {
  base64Encode,
  base64Decode,
  toUrlSafeBase64,
  fromUrlSafeBase64,
  urlEncodeComponent,
  urlDecodeComponent,
} from '../src';

describe('Base64', () => {
  it('encodes and decodes ASCII', () => {
    const encoded = base64Encode('Hello, World!');
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(base64Decode(encoded)).toBe('Hello, World!');
  });

  it('encodes and decodes UTF-8', () => {
    const input = '你好世界';
    expect(base64Decode(base64Encode(input))).toBe(input);
  });

  it('handles URL-safe Base64', () => {
    const encoded = base64Encode('subjects?_d', true);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    expect(base64Decode(encoded, true)).toBe('subjects?_d');
  });

  it('toUrlSafeBase64 and fromUrlSafeBase64 round-trip', () => {
    const standard = 'SGVsbG8=';
    const safe = toUrlSafeBase64(standard);
    expect(safe).toBe('SGVsbG8');
    expect(fromUrlSafeBase64(safe)).toBe(standard);
  });
});

describe('URL encoding', () => {
  it('encodes and decodes component', () => {
    const input = 'hello world&foo=bar';
    const encoded = urlEncodeComponent(input);
    expect(encoded).toBe('hello%20world%26foo%3Dbar');
    expect(urlDecodeComponent(encoded)).toBe(input);
  });
});
