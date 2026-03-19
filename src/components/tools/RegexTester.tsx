import { useState, useMemo, useEffect, useCallback } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

const PRESETS = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'URL', pattern: 'https?://[\\w.-]+(?:\\.[\\w]+)+[\\w.,@?^=%&:/~+#-]*', flags: 'g' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g' },
  { label: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'gi' },
  { label: 'Phone', pattern: '\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}', flags: 'g' },
  { label: 'HTML Tag', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)</\\1>', flags: 'gs' },
];

const CHEAT_SHEET = [
  { title: 'Character Classes', items: [
    ['.', 'Any character (except newline)'],
    ['\\d', 'Digit [0-9]'],
    ['\\D', 'Not a digit'],
    ['\\w', 'Word character [a-zA-Z0-9_]'],
    ['\\W', 'Not a word character'],
    ['\\s', 'Whitespace'],
    ['\\S', 'Not whitespace'],
    ['\\b', 'Word boundary'],
  ]},
  { title: 'Quantifiers', items: [
    ['*', '0 or more'],
    ['+', '1 or more'],
    ['?', '0 or 1 (optional)'],
    ['{n}', 'Exactly n'],
    ['{n,}', 'n or more'],
    ['{n,m}', 'Between n and m'],
    ['*?', '0 or more (lazy)'],
    ['+?', '1 or more (lazy)'],
  ]},
  { title: 'Anchors & Groups', items: [
    ['^', 'Start of string/line'],
    ['$', 'End of string/line'],
    ['(abc)', 'Capture group'],
    ['(?:abc)', 'Non-capturing group'],
    ['(?<name>abc)', 'Named capture group'],
    ['a|b', 'Alternation (a or b)'],
    ['\\1', 'Backreference to group 1'],
  ]},
  { title: 'Lookaround', items: [
    ['(?=abc)', 'Positive lookahead'],
    ['(?!abc)', 'Negative lookahead'],
    ['(?<=abc)', 'Positive lookbehind'],
    ['(?<!abc)', 'Negative lookbehind'],
  ]},
];

interface MatchResult {
  match: string;
  index: number;
  groups: { name: string | null; value: string }[];
  namedGroups: Record<string, string>;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getUrlParams(): { pattern: string; flags: string; testStr: string; replace: string } {
  if (typeof window === 'undefined') return { pattern: '', flags: 'g', testStr: '', replace: '' };
  const params = new URLSearchParams(window.location.search);
  // URL params take priority, then localStorage
  const stored = (() => {
    try {
      const s = localStorage.getItem('devtoolkit_regex-tester');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  })();
  return {
    pattern: params.get('p') || stored.pattern || '',
    flags: params.get('f') || stored.flags || 'g',
    testStr: params.get('t') || stored.testStr || '',
    replace: params.get('r') || stored.replace || '',
  };
}

export default function RegexTester() {
  const urlParams = getUrlParams();
  const [pattern, setPattern] = useState(urlParams.pattern);
  const [flags, setFlags] = useState(urlParams.flags);
  const [testStr, setTestStr] = useState(urlParams.testStr);
  const [replaceStr, setReplaceStr] = useState(urlParams.replace);
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [mode, setMode] = useState<'match' | 'replace'>('match');
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('devtoolkit_regex-tester', JSON.stringify({ pattern, flags, testStr, replace: replaceStr }));
    } catch {}
  }, [pattern, flags, testStr, replaceStr]);

  const flagToggles = ['g', 'i', 'm', 's', 'u'] as const;
  const flagLabels: Record<string, string> = {
    g: 'global', i: 'case-insensitive', m: 'multiline', s: 'dotAll', u: 'unicode',
  };

  const toggleFlag = (f: string) =>
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f));

  const { matches, error, highlighted, replaceResult } = useMemo(() => {
    const empty = { matches: [] as MatchResult[], error: '', highlighted: '', replaceResult: '' };
    if (!pattern || !testStr) return empty;
    try {
      const re = new RegExp(pattern, flags);
      const ms: MatchResult[] = [];

      if (flags.includes('g')) {
        let m;
        while ((m = re.exec(testStr)) !== null) {
          const groups: { name: string | null; value: string }[] = [];
          for (let i = 1; i < m.length; i++) {
            groups.push({ name: null, value: m[i] ?? '' });
          }
          // Attach named group names
          if (m.groups) {
            for (const [name, val] of Object.entries(m.groups)) {
              const idx = groups.findIndex((g) => g.value === (val ?? '') && g.name === null);
              if (idx !== -1) groups[idx].name = name;
            }
          }
          ms.push({
            match: m[0],
            index: m.index,
            groups,
            namedGroups: m.groups ? { ...m.groups } : {},
          });
          if (!m[0]) re.lastIndex++;
        }
      } else {
        const m = re.exec(testStr);
        if (m) {
          const groups: { name: string | null; value: string }[] = [];
          for (let i = 1; i < m.length; i++) {
            groups.push({ name: null, value: m[i] ?? '' });
          }
          if (m.groups) {
            for (const [name, val] of Object.entries(m.groups)) {
              const idx = groups.findIndex((g) => g.value === (val ?? '') && g.name === null);
              if (idx !== -1) groups[idx].name = name;
            }
          }
          ms.push({
            match: m[0],
            index: m.index,
            groups,
            namedGroups: m.groups ? { ...m.groups } : {},
          });
        }
      }

      // Build highlighted HTML
      let hl = '';
      let last = 0;
      const colors = [
        'bg-yellow-200 dark:bg-yellow-800',
        'bg-blue-200 dark:bg-blue-800',
        'bg-green-200 dark:bg-green-800',
        'bg-pink-200 dark:bg-pink-800',
        'bg-purple-200 dark:bg-purple-800',
      ];
      for (let i = 0; i < ms.length; i++) {
        const mt = ms[i];
        hl += escapeHtml(testStr.slice(last, mt.index));
        const color = colors[i % colors.length];
        hl += `<mark class="${color} rounded px-0.5">${escapeHtml(mt.match)}</mark>`;
        last = mt.index + mt.match.length;
      }
      hl += escapeHtml(testStr.slice(last));

      // Replace result
      let rr = '';
      if (mode === 'replace') {
        try {
          const re2 = new RegExp(pattern, flags);
          rr = testStr.replace(re2, replaceStr);
        } catch {
          rr = '';
        }
      }

      return { matches: ms, error: '', highlighted: hl, replaceResult: rr };
    } catch (e: any) {
      return { matches: [] as MatchResult[], error: e.message || 'Invalid regex', highlighted: '', replaceResult: '' };
    }
  }, [pattern, flags, testStr, replaceStr, mode]);

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setPattern(p.pattern);
    setFlags(p.flags);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText('/' + pattern + '/' + flags);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = useCallback(async () => {
    const params = new URLSearchParams();
    if (pattern) params.set('p', pattern);
    if (flags) params.set('f', flags);
    if (testStr) params.set('t', testStr);
    if (replaceStr && mode === 'replace') params.set('r', replaceStr);
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
    } catch {
      setShareMsg('URL updated!');
    }
    setTimeout(() => setShareMsg(''), 2500);
  }, [pattern, flags, testStr, replaceStr, mode]);

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Diff Checker', href: '/tools/diff-checker' },
        { label: 'Text Case Converter', href: '/tools/text-case-converter' },
      ]} />
      {/* Mode Tabs */}
      <div class="flex gap-2">
        <button
          onClick={() => setMode('match')}
          class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === 'match'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Match
        </button>
        <button
          onClick={() => setMode('replace')}
          class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === 'replace'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Replace
        </button>
        <div class="flex-1" />
        <button
          onClick={() => setShowCheatSheet(!showCheatSheet)}
          class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            showCheatSheet
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {showCheatSheet ? 'Hide' : 'Show'} Cheat Sheet
        </button>
      </div>

      {/* Presets */}
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Templates</label>
        <div class="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern + Flags */}
      <div class="flex gap-3 items-end flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Pattern</label>
          <div class="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
            <span class="pl-3 text-gray-400 font-mono">/</span>
            <input
              type="text"
              value={pattern}
              onInput={(e) => setPattern((e.target as HTMLInputElement).value)}
              placeholder="Enter regex..."
              class="flex-1 px-1 py-3 bg-transparent font-mono text-sm outline-none"
            />
            <span class="text-gray-400 font-mono">/</span>
            <span class="pr-3 font-mono text-primary-600 dark:text-primary-400 text-sm">{flags}</span>
          </div>
        </div>
        <button
          onClick={copy}
          class={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
            copied
              ? 'bg-green-100 dark:bg-green-900 text-green-600'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={share}
          class={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
            shareMsg
              ? 'bg-green-100 dark:bg-green-900 text-green-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          }`}
        >
          {shareMsg || 'Share'}
        </button>
      </div>

      {/* Flag toggles */}
      <div class="flex gap-3 flex-wrap">
        {flagToggles.map((f) => (
          <button
            key={f}
            onClick={() => toggleFlag(f)}
            title={flagLabels[f]}
            class={`w-10 h-10 rounded-lg font-mono text-sm font-bold transition-all duration-200 ${
              flags.includes(f)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
        <div class="text-xs text-gray-400 self-center ml-2 hidden sm:block">
          {flagToggles.map((f) => `${f}=${flagLabels[f]}`).join('  ')}
        </div>
      </div>

      {/* Replace input (only in replace mode) */}
      {mode === 'replace' && (
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Replace With
          </label>
          <input
            type="text"
            value={replaceStr}
            onInput={(e) => setReplaceStr((e.target as HTMLInputElement).value)}
            placeholder="Replacement string... ($1, $2, $<name> for groups)"
            class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-mono">
          {error}
        </div>
      )}

      {/* Main area: test string + highlighted / cheat sheet */}
      <div class={`grid grid-cols-1 ${showCheatSheet ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
        {/* Test String */}
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Test String</label>
          <textarea
            value={testStr}
            onInput={(e) => setTestStr((e.target as HTMLTextAreaElement).value)}
            placeholder="Enter text to test against your regex..."
            class="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            spellcheck={false}
          />
        </div>

        {/* Highlighted / Replace Result */}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'replace' ? 'Replace Result' : 'Highlighted'}
            </label>
            <span class="text-xs text-primary-600 dark:text-primary-400 font-semibold">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          {mode === 'replace' ? (
            <div class="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm overflow-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {replaceResult || (
                <span class="text-gray-400">Replace result will appear here...</span>
              )}
            </div>
          ) : (
            <div
              class="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm overflow-auto whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html:
                  highlighted ||
                  '<span class="text-gray-400">Matches highlighted here...</span>',
              }}
            />
          )}
        </div>

        {/* Cheat Sheet Sidebar */}
        {showCheatSheet && (
          <div class="space-y-2 xl:col-span-1 col-span-full">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Regex Cheat Sheet
            </label>
            <div class="h-48 xl:h-auto overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
              {CHEAT_SHEET.map((section) => (
                <div key={section.title}>
                  <h4 class="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h4>
                  <div class="space-y-1">
                    {section.items.map(([token, desc]) => (
                      <div key={token} class="flex items-baseline gap-2 text-xs">
                        <code class="font-mono font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded min-w-[60px] text-center">
                          {token}
                        </code>
                        <span class="text-gray-500 dark:text-gray-400">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Match Details with Capture Groups */}
      {matches.length > 0 && (
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Match Details</h3>
          <div class="space-y-3 max-h-64 overflow-auto">
            {matches.map((m, i) => (
              <div
                key={i}
                class="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-700"
              >
                <div class="flex items-center gap-3 text-sm">
                  <span class="w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span class="font-mono text-gray-700 dark:text-gray-300 break-all">
                    "{m.match}"
                  </span>
                  <span class="text-xs text-gray-400 flex-shrink-0">index {m.index}</span>
                </div>

                {/* Capture Groups */}
                {m.groups.length > 0 && (
                  <div class="mt-2 ml-9 space-y-1">
                    {m.groups.map((g, gi) => (
                      <div key={gi} class="flex items-center gap-2 text-xs">
                        <span class="font-mono text-gray-400">
                          {g.name ? (
                            <>
                              <span class="text-purple-500 dark:text-purple-400">
                                {g.name}
                              </span>
                              <span class="text-gray-400"> (${gi + 1})</span>
                            </>
                          ) : (
                            `$${gi + 1}`
                          )}
                        </span>
                        <span class="text-gray-300 dark:text-gray-600">=</span>
                        <span class="font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded break-all">
                          "{g.value}"
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
