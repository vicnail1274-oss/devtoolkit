/**
 * Convert a JSON array (or single object) to CSV.
 * @param jsonStr - JSON string to convert.
 * @param delimiter - Column delimiter (default: comma).
 */
export function jsonToCsv(jsonStr: string, delimiter = ','): string {
  const data = JSON.parse(jsonStr);
  const arr: Record<string, unknown>[] = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return '';

  const headers = [...new Set(arr.flatMap((row) => Object.keys(row)))];
  const escapeField = (val: unknown): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeField).join(delimiter);
  const rows = arr.map((row) =>
    headers.map((h) => escapeField(row[h])).join(delimiter)
  );
  return [headerLine, ...rows].join('\n');
}

/**
 * Parse a CSV row handling quoted fields.
 */
function parseRow(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Convert a CSV string to a JSON string.
 * @param csvStr - CSV string to convert.
 * @param delimiter - Column delimiter (default: comma).
 */
export function csvToJson(csvStr: string, delimiter = ','): string {
  const lines = csvStr.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return '[]';

  const headers = parseRow(lines[0], delimiter);
  const result = lines.slice(1).map((line) => {
    const vals = parseRow(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] || '';
    });
    return obj;
  });
  return JSON.stringify(result, null, 2);
}
