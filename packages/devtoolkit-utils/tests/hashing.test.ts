import { describe, it, expect } from 'vitest';
import { md5 } from '../src';

describe('MD5', () => {
  it('hashes empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('hashes "Hello, World!"', () => {
    expect(md5('Hello, World!')).toBe('65a8e27d8879283831b664bd8b7f0ad4');
  });

  it('hashes UTF-8 content', () => {
    const hash = md5('你好');
    expect(hash).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(hash)).toBe(true);
  });
});
