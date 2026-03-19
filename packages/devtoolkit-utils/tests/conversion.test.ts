import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  splitWords,
  convertCase,
  convertBase,
} from '../src';

describe('Color conversion', () => {
  it('hexToRgb parses 6-digit hex', () => {
    expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('xyz')).toBeNull();
  });

  it('rgbToHex converts back', () => {
    expect(rgbToHex(59, 130, 246)).toBe('#3b82f6');
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('rgbToHsl and hslToRgb round-trip', () => {
    const hsl = rgbToHsl(59, 130, 246);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(Math.abs(rgb.r - 59)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb.g - 130)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb.b - 246)).toBeLessThanOrEqual(1);
  });
});

describe('Text case conversion', () => {
  it('splitWords handles camelCase', () => {
    expect(splitWords('helloWorld')).toEqual(['hello', 'World']);
  });

  it('splitWords handles snake_case', () => {
    expect(splitWords('hello_world')).toEqual(['hello', 'world']);
  });

  it('convertCase to camelCase', () => {
    expect(convertCase('hello world', 'camelcase')).toBe('helloWorld');
  });

  it('convertCase to PascalCase', () => {
    expect(convertCase('hello_world', 'pascalcase')).toBe('HelloWorld');
  });

  it('convertCase to snake_case', () => {
    expect(convertCase('helloWorld', 'snakecase')).toBe('hello_world');
  });

  it('convertCase to kebab-case', () => {
    expect(convertCase('HelloWorld', 'kebabcase')).toBe('hello-world');
  });

  it('convertCase to CONSTANT_CASE', () => {
    expect(convertCase('hello-world', 'constantcase')).toBe('HELLO_WORLD');
  });
});

describe('Number base conversion', () => {
  it('converts decimal to all bases', () => {
    const result = convertBase('255', 10);
    expect(result).toEqual({
      decimal: '255',
      binary: '11111111',
      octal: '377',
      hex: 'ff',
    });
  });

  it('converts hex to all bases', () => {
    const result = convertBase('ff', 16);
    expect(result?.decimal).toBe('255');
  });

  it('returns null for invalid input', () => {
    expect(convertBase('xyz', 10)).toBeNull();
  });
});
