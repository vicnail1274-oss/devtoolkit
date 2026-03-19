import { useState } from 'preact/hooks';

function jsonToCsv(jsonStr: string, delimiter: string): string {
  const data = JSON.parse(jsonStr);
  const arr = Array.isArray(data) ? data : [data];
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

function csvToJson(csvStr: string, delimiter: string): string {
  const lines = csvStr.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return '[]';

  const parseRow = (line: string): string[] => {
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
  };

  const headers = parseRow(lines[0]);
  const result = lines.slice(1).map((line) => {
    const vals = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] || '';
    });
    return obj;
  });
  return JSON.stringify(result, null, 2);
}

const SAMPLE_JSON = `[
  { "name": "Alice", "age": 30, "city": "New York" },
  { "name": "Bob", "age": 25, "city": "San Francisco" },
  { "name": "Charlie", "age": 35, "city": "Chicago" }
]`;

const SAMPLE_CSV = `name,age,city
Alice,30,New York
Bob,25,San Francisco
Charlie,35,Chicago`;

export default function JsonToCsv() {
  const [mode, setMode] = useState<'json2csv' | 'csv2json'>('json2csv');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = () => {
    setError('');
    try {
      if (mode === 'json2csv') {
        setOutput(jsonToCsv(input, delimiter));
      } else {
        setOutput(csvToJson(input, delimiter));
      }
    } catch (e: any) {
      setError(e.message || 'Conversion failed');
      setOutput('');
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => {
    setInput(mode === 'json2csv' ? SAMPLE_JSON : SAMPLE_CSV);
    setOutput('');
    setError('');
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const swapMode = () => {
    const newMode = mode === 'json2csv' ? 'csv2json' : 'json2csv';
    setMode(newMode as any);
    if (output) {
      setInput(output);
      setOutput('');
    }
    setError('');
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="flex items-center gap-4">
        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => { setMode('json2csv'); setOutput(''); setError(''); }}
            class={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'json2csv' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            JSON → CSV
          </button>
          <button
            onClick={() => { setMode('csv2json'); setOutput(''); setError(''); }}
            class={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'csv2json' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            CSV → JSON
          </button>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 dark:text-gray-400">Delimiter:</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter((e.target as HTMLSelectElement).value)}
            class="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
          >
            <option value=",">, (comma)</option>
            <option value=";">; (semicolon)</option>
            <option value={'\t'}>tab</option>
            <option value="|">| (pipe)</option>
          </select>
        </div>
      </div>

      {/* Input */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {mode === 'json2csv' ? 'JSON Input' : 'CSV Input'}
          </label>
          <div class="flex gap-2">
            <button onClick={loadSample} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Sample</button>
            <button onClick={handleClear} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Clear</button>
          </div>
        </div>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder={mode === 'json2csv' ? 'Paste JSON array...' : 'Paste CSV data...'}
          class="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          spellcheck={false}
        />
      </div>

      {/* Convert Button */}
      <div class="flex gap-3">
        <button
          onClick={convert}
          disabled={!input.trim()}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Convert
        </button>
        <button
          onClick={swapMode}
          class="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          ↕ Swap
        </button>
      </div>

      {/* Error */}
      {error && (
        <div class="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'json2csv' ? 'CSV Output' : 'JSON Output'}
            </label>
            <button
              onClick={handleCopy}
              class={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                copied
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre class="w-full max-h-64 overflow-auto p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
