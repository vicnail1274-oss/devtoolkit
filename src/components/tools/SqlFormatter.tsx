import { useState, useCallback } from 'preact/hooks';

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
  'ALL', 'AS', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'NOT', 'NULL', 'IS', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'ASC', 'DESC',
  'WITH', 'RECURSIVE', 'RETURNING',
]);

const CLAUSE_STARTERS = new Set([
  'SELECT', 'FROM', 'WHERE', 'SET', 'VALUES', 'JOIN', 'LEFT', 'RIGHT',
  'INNER', 'OUTER', 'FULL', 'CROSS', 'ON', 'GROUP', 'ORDER', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
  'ALTER', 'DROP', 'WITH', 'AND', 'OR', 'RETURNING',
]);

function formatSql(sql: string, indentSize: number, uppercase: boolean): string {
  // Tokenize preserving strings and identifiers
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    // Skip whitespace
    if (/\s/.test(sql[i])) {
      i++;
      continue;
    }
    // String literal
    if (sql[i] === "'" || sql[i] === '"') {
      const quote = sql[i];
      let j = i + 1;
      while (j < sql.length && sql[j] !== quote) {
        if (sql[j] === '\\') j++;
        j++;
      }
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    // Parentheses, commas, semicolons
    if ('(),;'.includes(sql[i])) {
      tokens.push(sql[i]);
      i++;
      continue;
    }
    // Word or number
    let j = i;
    while (j < sql.length && !/[\s(),;]/.test(sql[j])) j++;
    tokens.push(sql.slice(i, j));
    i = j;
  }

  const tab = ' '.repeat(indentSize);
  let result = '';
  let indent = 0;

  for (let t = 0; t < tokens.length; t++) {
    const raw = tokens[t];
    const upper = raw.toUpperCase();
    const isKeyword = KEYWORDS.has(upper);
    const display = isKeyword && uppercase ? upper : isKeyword ? raw.toLowerCase() : raw;

    if (raw === '(') {
      result += ' (';
      indent++;
      result += '\n' + tab.repeat(indent);
    } else if (raw === ')') {
      indent = Math.max(0, indent - 1);
      result += '\n' + tab.repeat(indent) + ')';
    } else if (raw === ',') {
      result += ',\n' + tab.repeat(indent);
    } else if (raw === ';') {
      result += ';\n\n';
    } else if (CLAUSE_STARTERS.has(upper) && t > 0) {
      // GROUP BY, ORDER BY — merge with next
      if ((upper === 'BY') && t > 0 && ['GROUP', 'ORDER'].includes(tokens[t - 1].toUpperCase())) {
        result += ' ' + display;
      } else {
        result += '\n' + tab.repeat(indent) + display;
      }
    } else {
      if (result.length > 0 && !result.endsWith('\n') && !result.endsWith('(')) {
        result += ' ';
      }
      result += display;
    }
  }

  return result.trim();
}

export default function SqlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [indentSize, setIndentSize] = useState(2);
  const [uppercase, setUppercase] = useState(true);

  const handleFormat = useCallback(() => {
    if (!input.trim()) return;
    setOutput(formatSql(input, indentSize, uppercase));
    setCopied(false);
  }, [input, indentSize, uppercase]);

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

  const handleClear = () => {
    setInput('');
    setOutput('');
    setCopied(false);
  };

  const handleSample = () => {
    setInput(`SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY total_spent DESC LIMIT 20;`);
    setOutput('');
    setCopied(false);
  };

  return (
    <div class="space-y-6">
      {/* Options */}
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500 dark:text-gray-400">Indent:</label>
          <select
            value={indentSize}
            onChange={(e) => setIndentSize(Number((e.target as HTMLSelectElement).value))}
            class="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase((e.target as HTMLInputElement).checked)}
            class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400">Uppercase keywords</span>
        </label>
      </div>

      {/* Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SQL Input</label>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste your SQL query here..."
          class="w-full h-48 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
        />
      </div>

      {/* Buttons */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleFormat}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Format SQL
        </button>
        <button
          onClick={handleSample}
          class="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          Sample
        </button>
        <button
          onClick={handleClear}
          class="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          Clear
        </button>
        {output && (
          <button
            onClick={handleCopy}
            class={`px-4 py-2.5 font-medium rounded-xl transition-all duration-200 ${
              copied
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Output'}
          </button>
        )}
      </div>

      {/* Output */}
      {output ? (
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formatted SQL</label>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <pre class="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">Formatted SQL will appear here</p>
        </div>
      )}
    </div>
  );
}
