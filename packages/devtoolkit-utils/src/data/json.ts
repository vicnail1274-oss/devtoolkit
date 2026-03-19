/**
 * Evaluate a JSONPath expression against a parsed JSON object.
 * Supports: property access ($.key), array index ([0]), wildcards (*).
 */
export function evaluateJsonPath(obj: unknown, pathExpr: string): unknown[] {
  const path = pathExpr.trim();
  if (!path || path === '$') return [obj];

  let normalized = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path;
  if (normalized.startsWith('.')) normalized = normalized.slice(1);

  const segments: string[] = [];
  let current = '';
  let i = 0;
  while (i < normalized.length) {
    if (normalized[i] === '[') {
      if (current) { segments.push(current); current = ''; }
      const end = normalized.indexOf(']', i);
      if (end === -1) return [];
      segments.push(normalized.slice(i, end + 1));
      i = end + 1;
      if (normalized[i] === '.') i++;
    } else if (normalized[i] === '.') {
      if (current) { segments.push(current); current = ''; }
      i++;
    } else {
      current += normalized[i];
      i++;
    }
  }
  if (current) segments.push(current);

  let results: unknown[] = [obj];
  for (const seg of segments) {
    const next: unknown[] = [];
    for (const item of results) {
      if (item == null || typeof item !== 'object') continue;

      if (seg === '*') {
        const values = Array.isArray(item) ? item : Object.values(item as Record<string, unknown>);
        next.push(...values);
      } else if (seg.startsWith('[') && seg.endsWith(']')) {
        const inner = seg.slice(1, -1).replace(/['"]/g, '');
        if (Array.isArray(item)) {
          const idx = parseInt(inner, 10);
          if (!isNaN(idx) && idx >= 0 && idx < item.length) {
            next.push(item[idx]);
          }
        } else if (inner in (item as Record<string, unknown>)) {
          next.push((item as Record<string, unknown>)[inner]);
        }
      } else if (!Array.isArray(item) && seg in (item as Record<string, unknown>)) {
        next.push((item as Record<string, unknown>)[seg]);
      }
    }
    results = next;
    if (results.length === 0) break;
  }
  return results;
}

/**
 * Format (pretty-print) a JSON string.
 */
export function jsonFormat(input: string, indent = 2): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

/**
 * Minify a JSON string (remove all whitespace).
 */
export function jsonMinify(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

/**
 * Validate a JSON string. Returns true if valid.
 */
export function jsonValidate(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}
