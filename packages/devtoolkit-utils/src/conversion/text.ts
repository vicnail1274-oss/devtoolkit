export type CaseType =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase';

/**
 * Split a string into words, handling camelCase, PascalCase,
 * snake_case, kebab-case, dot.case, and mixed formats.
 */
export function splitWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Convert text between common case formats.
 */
export function convertCase(text: string, type: CaseType): string {
  if (!text) return '';

  switch (type) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    case 'sentencecase':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    case 'camelcase': {
      const words = splitWords(text);
      return words
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }
    case 'pascalcase': {
      const words = splitWords(text);
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    }
    case 'snakecase':
      return splitWords(text).map((w) => w.toLowerCase()).join('_');
    case 'kebabcase':
      return splitWords(text).map((w) => w.toLowerCase()).join('-');
    case 'constantcase':
      return splitWords(text).map((w) => w.toUpperCase()).join('_');
    case 'dotcase':
      return splitWords(text).map((w) => w.toLowerCase()).join('.');
    default:
      return text;
  }
}
