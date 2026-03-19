/**
 * Convert a decimal value to binary, octal, and hexadecimal.
 * Supports BigInt for large numbers.
 */
export function convertFromDecimal(decimal: bigint): {
  binary: string;
  octal: string;
  hex: string;
} {
  return {
    binary: decimal.toString(2),
    octal: decimal.toString(8),
    hex: decimal.toString(16),
  };
}

/**
 * Parse a number string in any base and convert to all bases.
 */
export function convertBase(
  value: string,
  fromBase: 2 | 8 | 10 | 16
): { decimal: string; binary: string; octal: string; hex: string } | null {
  try {
    const decimal = fromBase === 10
      ? BigInt(value)
      : BigInt(
          fromBase === 2 ? `0b${value}` :
          fromBase === 8 ? `0o${value}` :
          `0x${value}`
        );
    const result = convertFromDecimal(decimal);
    return { decimal: decimal.toString(), ...result };
  } catch {
    return null;
  }
}
