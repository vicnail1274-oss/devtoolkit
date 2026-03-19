import { useState, useEffect } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

type InputMode = 'timestamp' | 'datetime';

function formatDate(date: Date): string {
  return date.toISOString();
}

function toLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function TimestampConverter() {
  const [mode, setMode] = useState<InputMode>('timestamp');
  const { value: tsInput, setValue: setTsInput } = useToolState('timestamp-converter');
  const [dtInput, setDtInput] = useState('');
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDate = new Date(now);
  const currentUnix = Math.floor(now / 1000);

  // Timestamp -> Date
  let tsResult: Date | null = null;
  let tsError = '';
  if (tsInput.trim()) {
    const num = Number(tsInput.trim());
    if (isNaN(num)) {
      tsError = 'Please enter a valid number.';
    } else {
      // Auto-detect seconds vs milliseconds
      const ms = num > 1e12 ? num : num * 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) {
        tsError = 'Invalid timestamp.';
      } else {
        tsResult = d;
      }
    }
  }

  // Date -> Timestamp
  let dtResult: number | null = null;
  let dtError = '';
  if (dtInput.trim()) {
    const d = new Date(dtInput.trim());
    if (isNaN(d.getTime())) {
      dtError = 'Invalid date format.';
    } else {
      dtResult = Math.floor(d.getTime() / 1000);
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      class="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
    >
      {copied === label ? 'Copied!' : 'Copy'}
    </button>
  );

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'UUID Generator', href: '/tools/uuid-generator' },
        { label: 'Cron Generator', href: '/tools/cron-generator' },
      ]} />
      {/* Current Time */}
      <div class="p-4 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-lg">
        <div class="text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">Current Time</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-lg text-gray-900 dark:text-gray-100">{currentUnix}</span>
            <CopyBtn text={String(currentUnix)} label="now-unix" />
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-sm text-gray-700 dark:text-gray-300">{formatDate(currentDate)}</span>
            <CopyBtn text={formatDate(currentDate)} label="now-iso" />
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setMode('timestamp')}
          class={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'timestamp'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Timestamp &rarr; Date
        </button>
        <button
          onClick={() => setMode('datetime')}
          class={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'datetime'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Date &rarr; Timestamp
        </button>
      </div>

      {/* Timestamp -> Date */}
      {mode === 'timestamp' && (
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unix Timestamp
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                value={tsInput}
                onInput={(e) => setTsInput((e.target as HTMLInputElement).value)}
                placeholder="1710720000 or 1710720000000"
                class="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                onClick={() => setTsInput(String(currentUnix))}
                class="px-4 py-3 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Now
              </button>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Auto-detects seconds vs milliseconds.
            </p>
          </div>

          {tsError && (
            <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {tsError}
            </div>
          )}

          {tsResult && (
            <div class="space-y-3">
              {[
                { label: 'ISO 8601', value: tsResult.toISOString() },
                { label: 'UTC', value: tsResult.toUTCString() },
                { label: 'Local', value: tsResult.toLocaleString() },
                { label: 'Local (ISO)', value: toLocalString(tsResult) },
                { label: 'Relative', value: getRelative(tsResult) },
              ].map(({ label, value }) => (
                <div key={label} class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
                    <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{value}</div>
                  </div>
                  <CopyBtn text={value} label={`ts-${label}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date -> Timestamp */}
      {mode === 'datetime' && (
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date/Time
            </label>
            <div class="flex gap-2">
              <input
                type="datetime-local"
                value={dtInput}
                onInput={(e) => setDtInput((e.target as HTMLInputElement).value)}
                class="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                onClick={() => setDtInput(toLocalString(new Date()))}
                class="px-4 py-3 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Now
              </button>
            </div>
          </div>

          {dtError && (
            <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {dtError}
            </div>
          )}

          {dtResult !== null && (
            <div class="space-y-3">
              {[
                { label: 'Unix (seconds)', value: String(dtResult) },
                { label: 'Unix (milliseconds)', value: String(dtResult * 1000) },
                { label: 'ISO 8601', value: new Date(dtResult * 1000).toISOString() },
              ].map(({ label, value }) => (
                <div key={label} class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
                    <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{value}</div>
                  </div>
                  <CopyBtn text={value} label={`dt-${label}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getRelative(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const past = diff < 0;
  const secs = Math.floor(abs / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  let str = '';
  if (years > 0) str = `${years} year${years > 1 ? 's' : ''}`;
  else if (days > 0) str = `${days} day${days > 1 ? 's' : ''}, ${hours % 24}h`;
  else if (hours > 0) str = `${hours}h ${mins % 60}m`;
  else if (mins > 0) str = `${mins}m ${secs % 60}s`;
  else str = `${secs}s`;

  return past ? `${str} ago` : `in ${str}`;
}
