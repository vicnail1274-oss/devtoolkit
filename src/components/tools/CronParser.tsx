import { useState, useMemo } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EXAMPLES = [
  { expr: '* * * * *', label: 'Every minute' },
  { expr: '*/5 * * * *', label: 'Every 5 minutes' },
  { expr: '0 * * * *', label: 'Every hour' },
  { expr: '0 0 * * *', label: 'Daily at midnight' },
  { expr: '0 9 * * 1-5', label: 'Weekdays at 9am' },
  { expr: '0 9 * * 1', label: 'Every Monday at 9am' },
  { expr: '0 0 1 * *', label: '1st of every month' },
  { expr: '0 0 1 1 *', label: 'Every January 1st' },
  { expr: '*/15 * * * *', label: 'Every 15 minutes' },
  { expr: '0 */2 * * *', label: 'Every 2 hours' },
  { expr: '30 4 * * 0', label: 'Every Sunday at 4:30am' },
  { expr: '0 22 * * 1-5', label: 'Weekdays at 10pm' },
];

interface FieldInfo {
  name: string;
  value: string;
  range: string;
  description: string;
  valid: boolean;
}

function describeField(name: string, value: string, range: [number, number], nameMap?: string[]): { description: string; valid: boolean } {
  const [min, max] = range;

  if (value === '*') return { description: `Every ${name.toLowerCase()}`, valid: true };

  if (value.startsWith('*/')) {
    const step = parseInt(value.slice(2));
    if (isNaN(step) || step <= 0 || step > max) return { description: `Invalid step value`, valid: false };
    return { description: `Every ${step} ${name.toLowerCase()}${step > 1 ? 's' : ''}`, valid: true };
  }

  if (value.includes(',')) {
    const parts = value.split(',');
    const vals: string[] = [];
    for (const p of parts) {
      const n = parseInt(p.trim());
      if (isNaN(n) || n < min || n > max) return { description: `Invalid value: ${p}`, valid: false };
      vals.push(nameMap ? (nameMap[n] || String(n)) : String(n));
    }
    return { description: vals.join(', '), valid: true };
  }

  if (value.includes('-')) {
    const rangeMatch = value.match(/^(\d+)-(\d+)(\/(\d+))?$/);
    if (!rangeMatch) return { description: 'Invalid range syntax', valid: false };
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const step = rangeMatch[4] ? parseInt(rangeMatch[4]) : null;
    if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
      return { description: `Invalid range ${start}-${end}`, valid: false };
    }
    const startLabel = nameMap ? (nameMap[start] || String(start)) : String(start);
    const endLabel = nameMap ? (nameMap[end] || String(end)) : String(end);
    let desc = `${startLabel} through ${endLabel}`;
    if (step) desc += ` (every ${step})`;
    return { description: desc, valid: true };
  }

  const n = parseInt(value);
  if (isNaN(n) || n < min || n > max) return { description: `Invalid value (expected ${min}-${max})`, valid: false };
  const label = nameMap ? (nameMap[n] || String(n)) : String(n);
  return { description: `At ${name.toLowerCase()} ${label}`, valid: true };
}

function describeHumanReadable(parts: string[]): string {
  if (parts.length !== 5) return 'Invalid cron expression (expected 5 fields)';

  const [min, hour, dom, mon, dow] = parts;
  const segments: string[] = [];

  if (min === '*' && hour === '*') {
    segments.push('Every minute');
  } else if (min.startsWith('*/')) {
    segments.push(`Every ${min.slice(2)} minutes`);
  } else if (hour === '*') {
    segments.push(`At minute ${min} of every hour`);
  } else if (hour.startsWith('*/')) {
    segments.push(`Every ${hour.slice(2)} hours at minute ${min}`);
  } else {
    const h = parseInt(hour);
    const m = parseInt(min);
    if (!isNaN(h) && !isNaN(m)) {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      segments.push(`At ${h12}:${String(m).padStart(2, '0')} ${period}`);
    } else {
      segments.push(`At ${hour}:${min}`);
    }
  }

  if (dom !== '*') {
    segments.push(`on day ${dom} of the month`);
  }

  if (mon !== '*') {
    const monthNum = parseInt(mon);
    if (!isNaN(monthNum) && MONTHS[monthNum]) {
      segments.push(`in ${MONTHS[monthNum]}`);
    } else {
      segments.push(`in month ${mon}`);
    }
  }

  if (dow !== '*') {
    const dayNames = dow.split(',').map(d => {
      if (d.includes('-')) {
        const [s, e] = d.split('-').map(Number);
        return `${DAYS[s] || s} through ${DAYS[e] || e}`;
      }
      const n = parseInt(d);
      return DAYS[n] || d;
    });
    segments.push(`on ${dayNames.join(', ')}`);
  }

  return segments.join(' ');
}

function matchField(fieldValue: string, actual: number): boolean {
  if (fieldValue === '*') return true;
  if (fieldValue.startsWith('*/')) {
    const step = parseInt(fieldValue.slice(2));
    return step > 0 && actual % step === 0;
  }
  if (fieldValue.includes(',')) {
    return fieldValue.split(',').some(v => matchField(v.trim(), actual));
  }
  if (fieldValue.includes('-')) {
    const rangeMatch = fieldValue.match(/^(\d+)-(\d+)(\/(\d+))?$/);
    if (!rangeMatch) return false;
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const step = rangeMatch[4] ? parseInt(rangeMatch[4]) : 1;
    if (actual < start || actual > end) return false;
    return (actual - start) % step === 0;
  }
  return parseInt(fieldValue) === actual;
}

function getNextRuns(expression: string, count = 10): Date[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const results: Date[] = [];
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  for (let i = 0; i < 525600 && results.length < count; i++) {
    const d = new Date(start.getTime() + i * 60000);
    if (
      matchField(parts[0], d.getMinutes()) &&
      matchField(parts[1], d.getHours()) &&
      matchField(parts[2], d.getDate()) &&
      matchField(parts[3], d.getMonth() + 1) &&
      matchField(parts[4], d.getDay())
    ) {
      results.push(d);
    }
  }
  return results;
}

export default function CronParser() {
  const { value: input, setValue: setInput } = useToolState('cron-parser', '0 9 * * 1-5');
  const [copied, setCopied] = useState(false);
  const [showCount, setShowCount] = useState(10);

  const analysis = useMemo(() => {
    const expr = input.trim();
    if (!expr) return null;

    const parts = expr.split(/\s+/);
    if (parts.length !== 5) {
      return { error: `Expected 5 fields but got ${parts.length}. Standard cron format: minute hour day-of-month month day-of-week`, fields: [], humanReadable: '', nextRuns: [] };
    }

    const fields: FieldInfo[] = [
      { name: 'Minute', value: parts[0], range: '0-59', ...describeField('Minute', parts[0], [0, 59]) },
      { name: 'Hour', value: parts[1], range: '0-23', ...describeField('Hour', parts[1], [0, 23]) },
      { name: 'Day of Month', value: parts[2], range: '1-31', ...describeField('Day', parts[2], [1, 31]) },
      { name: 'Month', value: parts[3], range: '1-12', ...describeField('Month', parts[3], [1, 12], MONTHS) },
      { name: 'Day of Week', value: parts[4], range: '0-6', ...describeField('Day', parts[4], [0, 6], DAYS) },
    ];

    const hasError = fields.some(f => !f.valid);
    const humanReadable = hasError ? 'Contains invalid fields' : describeHumanReadable(parts);
    const nextRuns = hasError ? [] : getNextRuns(expr, showCount);

    return { error: '', fields, humanReadable, nextRuns };
  }, [input, showCount]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(input);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = input;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Cron Generator', href: '/tools/cron-generator' },
        { label: 'Timestamp Converter', href: '/tools/timestamp-converter' },
        { label: 'Chmod Calculator', href: '/tools/chmod-calculator' },
      ]} />

      {/* Expression Input */}
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Cron Expression</label>
        <div class="flex gap-3">
          <input
            type="text"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            placeholder="* * * * *"
            class="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
            spellcheck={false}
          />
          <button
            onClick={handleCopy}
            class={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              copied
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
          Format: minute hour day-of-month month day-of-week
        </p>
      </div>

      {/* Common Examples */}
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Common Expressions</label>
        <div class="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.expr}
              onClick={() => setInput(ex.expr)}
              class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                input.trim() === ex.expr
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
              title={ex.expr}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Error */}
      {analysis?.error && (
        <div class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-600 dark:text-red-400">{analysis.error}</p>
        </div>
      )}

      {/* Human Readable Description */}
      {analysis && !analysis.error && (
        <div class="bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-xl p-5">
          <div class="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">Human-Readable Schedule</div>
          <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">{analysis.humanReadable}</div>
        </div>
      )}

      {/* Field Breakdown */}
      {analysis && analysis.fields.length > 0 && (
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Field Breakdown</label>
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {analysis.fields.map((field) => (
              <div
                key={field.name}
                class={`rounded-xl p-4 border ${
                  field.valid
                    ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                    : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                }`}
              >
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{field.name}</div>
                <div class="text-xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-1">{field.value}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mb-2">Range: {field.range}</div>
                <div class={`text-xs font-medium ${field.valid ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
                  {field.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Execution Times */}
      {analysis && analysis.nextRuns.length > 0 && (
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Next Execution Times</h3>
            <select
              value={showCount}
              onChange={(e) => setShowCount(parseInt((e.target as HTMLSelectElement).value))}
              class="text-xs px-2 py-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <option value={5}>Show 5</option>
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
            </select>
          </div>
          <div class="space-y-2">
            {analysis.nextRuns.map((d, i) => {
              const now = new Date();
              const diffMs = d.getTime() - now.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);

              let relativeTime = '';
              if (diffDays > 0) relativeTime = `in ${diffDays}d ${diffHours % 24}h`;
              else if (diffHours > 0) relativeTime = `in ${diffHours}h ${diffMins % 60}m`;
              else relativeTime = `in ${diffMins}m`;

              return (
                <div key={i} class="flex items-center gap-3 text-sm">
                  <span class="w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span class="font-mono text-gray-700 dark:text-gray-300 flex-1">
                    {d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    {' '}
                    {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{relativeTime}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Reference */}
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cron Syntax Quick Reference</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {[
            ['*', 'Any value'],
            ['*/N', 'Every N units'],
            ['N', 'Specific value'],
            ['N,M', 'List of values'],
            ['N-M', 'Range of values'],
            ['N-M/S', 'Range with step S'],
          ].map(([syntax, desc]) => (
            <div key={syntax} class="flex items-baseline gap-2">
              <code class="font-mono font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded min-w-[60px] text-center">
                {syntax}
              </code>
              <span class="text-gray-500 dark:text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
