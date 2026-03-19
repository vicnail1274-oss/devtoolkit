import { useState, useMemo } from 'preact/hooks';

const PRESETS_5 = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 min', cron: '*/5 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Daily midnight', cron: '0 0 * * *' },
  { label: 'Daily 9am', cron: '0 9 * * *' },
  { label: 'Monday 9am', cron: '0 9 * * 1' },
  { label: 'Weekdays 9am', cron: '0 9 * * 1-5' },
  { label: '1st of month', cron: '0 0 1 * *' },
];

const PRESETS_6 = [
  { label: 'Every second', cron: '* * * * * *' },
  { label: 'Every 10 sec', cron: '*/10 * * * * *' },
  { label: 'Every 30 sec', cron: '*/30 * * * * *' },
  { label: 'Every minute', cron: '0 * * * * *' },
  { label: 'Every 5 min', cron: '0 */5 * * * *' },
  { label: 'Daily midnight', cron: '0 0 0 * * *' },
  { label: 'Daily 9am', cron: '0 0 9 * * *' },
  { label: 'Weekdays 9am', cron: '0 0 9 * * 1-5' },
];

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function describeCron(p: string[], hasSec: boolean): string {
  const expected = hasSec ? 6 : 5;
  if (p.length !== expected) return 'Invalid cron expression';

  const sec = hasSec ? p[0] : null;
  const [min, hour, dom, mon, dow] = hasSec ? p.slice(1) : p;

  const parts: string[] = [];

  // Seconds
  if (hasSec && sec !== null) {
    if (sec === '*') parts.push('Every second');
    else if (sec.startsWith('*/')) parts.push(`Every ${sec.slice(2)} seconds`);
    else if (sec === '0') { /* at second 0, implicit */ }
    else parts.push(`At second ${sec}`);
  }

  // Minutes
  if (min === '*') {
    if (!hasSec || sec === '0' || sec === '*') {
      if (sec !== '*') parts.push('every minute');
    }
  } else if (min.startsWith('*/')) {
    parts.push(`every ${min.slice(2)} minutes`);
  } else {
    parts.push(`at minute ${min}`);
  }

  // Hours
  if (hour === '*') {
    // every hour implied
  } else if (hour.startsWith('*/')) {
    parts.push(`every ${hour.slice(2)} hours`);
  } else {
    parts.push(`past hour ${hour}`);
  }

  // Day of month
  if (dom !== '*') parts.push(`on day ${dom} of month`);

  // Month
  if (mon !== '*') parts.push(`in month ${mon}`);

  // Day of week
  if (dow !== '*') {
    const dn = dow.split(',').map(x => {
      const n = parseInt(x);
      return isNaN(n) ? x : (DAYS[n] || x);
    }).join(', ');
    parts.push(`on ${dn}`);
  }

  if (parts.length === 0) return 'Every minute';
  // Capitalize first letter
  const result = parts.join(', ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function getNextRuns(cs: string, hasSec: boolean, count = 5): Date[] {
  const p = cs.trim().split(/\s+/);
  const expected = hasSec ? 6 : 5;
  if (p.length !== expected) return [];

  const results: Date[] = [];
  const start = new Date();

  if (hasSec) {
    start.setMilliseconds(0);
    start.setSeconds(start.getSeconds() + 1);
  } else {
    start.setSeconds(0, 0);
    start.setMinutes(start.getMinutes() + 1);
  }

  const matchF = (f: string, v: number): boolean => {
    if (f === '*') return true;
    if (f.startsWith('*/')) { const s = parseInt(f.slice(2)); return s > 0 && v % s === 0; }
    if (f.includes(',')) return f.split(',').some(x => matchF(x, v));
    if (f.includes('-')) { const [a, b] = f.split('-').map(Number); return v >= a && v <= b; }
    return parseInt(f) === v;
  };

  if (hasSec) {
    // Iterate by seconds, limit search to 86400 seconds (1 day)
    for (let i = 0; i < 86400 && results.length < count; i++) {
      const d = new Date(start.getTime() + i * 1000);
      if (matchF(p[0], d.getSeconds()) && matchF(p[1], d.getMinutes()) && matchF(p[2], d.getHours()) &&
          matchF(p[3], d.getDate()) && matchF(p[4], d.getMonth() + 1) && matchF(p[5], d.getDay())) {
        results.push(d);
      }
    }
  } else {
    for (let i = 0; i < 525600 && results.length < count; i++) {
      const d = new Date(start.getTime() + i * 60000);
      if (matchF(p[0], d.getMinutes()) && matchF(p[1], d.getHours()) &&
          matchF(p[2], d.getDate()) && matchF(p[3], d.getMonth() + 1) && matchF(p[4], d.getDay())) {
        results.push(d);
      }
    }
  }
  return results;
}

export default function CronGenerator() {
  const [sixField, setSixField] = useState(false);
  const [parts5, setParts5] = useState(['0', '9', '*', '*', '*']);
  const [parts6, setParts6] = useState(['0', '0', '9', '*', '*', '*']);
  const [manual, setManual] = useState('');
  const [copied, setCopied] = useState(false);

  const parts = sixField ? parts6 : parts5;
  const setParts = sixField ? setParts6 : setParts5;
  const presets = sixField ? PRESETS_6 : PRESETS_5;

  const active = manual.trim() || parts.join(' ');
  const parsed = active.trim().split(/\s+/);
  const expected = sixField ? 6 : 5;
  const valid = parsed.length === expected;
  const desc = useMemo(() => valid ? describeCron(parsed, sixField) : 'Invalid expression', [active, sixField]);
  const runs = useMemo(() => valid ? getNextRuns(active, sixField) : [], [active, sixField]);

  const updatePart = (i: number, v: string) => {
    const n = [...parts];
    n[i] = v;
    setParts(n);
    setManual('');
  };

  const applyPreset = (c: string) => {
    const p = c.split(' ');
    setParts(p);
    setManual('');
  };

  const toggleFormat = () => {
    setManual('');
    setSixField(!sixField);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active);
    } catch {
      const t = document.createElement('textarea');
      t.value = active;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const labels5 = ['Minute', 'Hour', 'Day (Month)', 'Month', 'Day (Week)'];
  const hints5 = ['0-59', '0-23', '1-31', '1-12', '0-6'];
  const labels6 = ['Second', 'Minute', 'Hour', 'Day (Month)', 'Month', 'Day (Week)'];
  const hints6 = ['0-59', '0-59', '0-23', '1-31', '1-12', '0-6'];
  const labels = sixField ? labels6 : labels5;
  const hints = sixField ? hints6 : hints5;

  return (
    <div class="space-y-6">
      {/* Format Toggle */}
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Presets</label>
        <button
          onClick={toggleFormat}
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200"
        >
          <span class={`w-2 h-2 rounded-full ${sixField ? 'bg-purple-500' : 'bg-primary-500'}`} />
          {sixField ? '6-field (with seconds)' : '5-field (standard)'}
        </button>
      </div>

      {/* Presets */}
      <div class="flex flex-wrap gap-2">
        {presets.map(p => (
          <button key={p.cron} onClick={() => applyPreset(p.cron)}
            class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${active === p.cron ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Field Editors */}
      <div class={`grid gap-3 ${sixField ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {labels.map((l, i) => (
          <div key={l}>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{l}</label>
            <input type="text" value={manual ? parsed[i] || '' : parts[i]}
              onInput={(e) => updatePart(i, (e.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            <span class="text-[10px] text-gray-400 mt-0.5 block text-center">{hints[i]}</span>
          </div>
        ))}
      </div>

      {/* Manual Input */}
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Manual Input / Reverse Parse</label>
        <input type="text" value={manual || parts.join(' ')} onInput={(e) => setManual((e.target as HTMLInputElement).value)}
          placeholder={sixField ? '* * * * * *' : '* * * * *'}
          class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
          Paste any cron expression to see its description and next runs
        </p>
      </div>

      {/* Result */}
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">{active}</div>
            <div class={`text-sm mt-1 ${valid ? 'text-gray-500 dark:text-gray-400' : 'text-red-500'}`}>{desc}</div>
          </div>
          <button onClick={copy}
            class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${copied ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {runs.length > 0 && (
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next 5 Executions</h3>
            <div class="space-y-1">
              {runs.map((d, i) => (
                <div key={i} class="flex items-center gap-2 text-sm">
                  <span class="w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span class="font-mono text-gray-700 dark:text-gray-300">
                    {d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    {' '}
                    {sixField
                      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
