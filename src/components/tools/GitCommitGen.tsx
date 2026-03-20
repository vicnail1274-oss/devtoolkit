import { useState, useCallback } from 'preact/hooks';
import { useToolStorage } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

type CommitType = 'feat' | 'fix' | 'refactor' | 'docs' | 'style' | 'test' | 'chore' | 'perf' | 'ci' | 'build';

interface CommitSuggestion {
  type: CommitType;
  scope?: string;
  description: string;
  body?: string;
  full: string;
}

const TYPE_DESCRIPTIONS: Record<CommitType, string> = {
  feat: 'New feature',
  fix: 'Bug fix',
  refactor: 'Code refactor (no behavior change)',
  docs: 'Documentation update',
  style: 'Formatting / style (no logic change)',
  test: 'Add or update tests',
  chore: 'Build process or auxiliary tools',
  perf: 'Performance improvement',
  ci: 'CI/CD configuration',
  build: 'Build system or dependencies',
};

function inferTypes(summary: string): CommitType[] {
  const s = summary.toLowerCase();
  const types: CommitType[] = [];
  if (/fix|bug|crash|error|broken|patch|resolve|issue/.test(s)) types.push('fix');
  if (/add|new|creat|implement|introduc|feature|support/.test(s)) types.push('feat');
  if (/refactor|clean|reorgan|restructur|simplif|extract|move/.test(s)) types.push('refactor');
  if (/doc|readme|comment|changelog|guide|explain/.test(s)) types.push('docs');
  if (/test|spec|coverage|unit|e2e|assert/.test(s)) types.push('test');
  if (/perf|optim|speed|fast|slow|latency|memory/.test(s)) types.push('perf');
  if (/style|format|lint|indent|whitespace|prettier/.test(s)) types.push('style');
  if (/ci|cd|pipeline|workflow|action|deploy|github action/.test(s)) types.push('ci');
  if (/build|webpack|vite|rollup|tsconfig|package|depend|npm|yarn|pnpm/.test(s)) types.push('build');
  if (/chore|bump|version|update|upgrade|config|setting/.test(s)) types.push('chore');
  // ensure at least 3
  const fallback: CommitType[] = ['feat', 'fix', 'refactor', 'chore', 'docs'];
  for (const t of fallback) {
    if (types.length >= 5) break;
    if (!types.includes(t)) types.push(t);
  }
  return types.slice(0, 5);
}

function extractScope(summary: string): string | undefined {
  // Look for patterns like "in X", "for X", "X component", "X module", "X page"
  const patterns = [
    /\bin\s+(\w+)\b/i,
    /\bfor\s+(\w+)\b/i,
    /\b(\w+)\s+(?:component|module|page|hook|util|service|controller|handler|middleware)\b/i,
    /\b(?:the\s+)?(\w+)\s+(?:button|form|table|modal|dropdown|menu|navbar|sidebar)\b/i,
  ];
  for (const p of patterns) {
    const m = summary.match(p);
    if (m && m[1] && m[1].length < 20) return m[1].toLowerCase();
  }
  return undefined;
}

function toImperative(summary: string): string {
  // Normalise to imperative mood (add/fix/update/remove ...)
  return summary
    .replace(/^(added|adds|adding)\s+/i, 'add ')
    .replace(/^(fixed|fixes|fixing)\s+/i, 'fix ')
    .replace(/^(updated|updates|updating)\s+/i, 'update ')
    .replace(/^(removed|removes|removing)\s+/i, 'remove ')
    .replace(/^(created|creates|creating)\s+/i, 'create ')
    .replace(/^(implemented|implements|implementing)\s+/i, 'implement ')
    .replace(/^(refactored|refactors|refactoring)\s+/i, 'refactor ')
    .replace(/^(improved|improves|improving)\s+/i, 'improve ')
    .replace(/^\s+/, '')
    .replace(/\.$/, '');
}

function buildDescription(type: CommitType, base: string): string {
  const verbs: Record<CommitType, string> = {
    feat: 'add',
    fix: 'fix',
    refactor: 'refactor',
    docs: 'update docs for',
    style: 'format',
    test: 'add tests for',
    chore: 'update',
    perf: 'optimize',
    ci: 'configure CI for',
    build: 'update build config for',
  };

  const cleaned = toImperative(base.trim()).toLowerCase();
  // If already starts with the expected verb, keep it; otherwise prepend
  const verb = verbs[type];
  if (cleaned.startsWith(verb) || cleaned.startsWith(type)) return cleaned;
  if (['docs', 'test', 'ci', 'build'].includes(type)) return `${verb} ${cleaned}`;
  return cleaned;
}

function generateCommits(summary: string): CommitSuggestion[] {
  if (!summary.trim()) return [];
  const types = inferTypes(summary);
  const scope = extractScope(summary);

  return types.map((type) => {
    const description = buildDescription(type, summary);
    const header = scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;
    const truncated = header.length > 72 ? header.slice(0, 69) + '...' : header;
    return {
      type,
      scope,
      description,
      full: truncated,
    };
  });
}

const TYPE_COLOR: Record<CommitType, string> = {
  feat: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300',
  fix: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  refactor: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300',
  docs: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  style: 'bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300',
  test: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
  chore: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  perf: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300',
  ci: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
  build: 'bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300',
};

export default function GitCommitGen() {
  const { value: summary, setValue: setSummary } = useToolStorage('git-commit-gen', 'summary');
  const [suggestions, setSuggestions] = useState<CommitSuggestion[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(() => {
    const results = generateCommits(summary || '');
    setSuggestions(results);
    setGenerated(true);
  }, [summary]);

  const copyCommit = useCallback((msg: string, idx: number) => {
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate();
  }, [generate]);

  return (
    <div>
      <QuickNav links={[
        { label: 'Git Command Generator', href: '/tools/git-command-generator' },
        { label: 'Diff Checker', href: '/tools/diff-checker' },
        { label: 'JSON Diff Viewer', href: '/tools/json-diff' },
      ]} />

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Describe your changes
        </label>
        <textarea
          class="w-full h-28 text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          placeholder="e.g. Fixed a bug where the login form crashed when email field was empty"
          value={summary}
          onInput={(e) => { setSummary((e.target as HTMLTextAreaElement).value); setGenerated(false); }}
          onKeyDown={handleKeyDown}
          spellcheck={false}
        />
        <p class="text-xs text-gray-400 mt-1">Tip: Press Ctrl+Enter to generate</p>
      </div>

      <button
        onClick={generate}
        disabled={!summary?.trim()}
        class="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mb-6"
      >
        Generate Commit Messages
      </button>

      {generated && suggestions.length === 0 && (
        <div class="text-sm text-gray-500 dark:text-gray-400">No suggestions — try describing your change in more detail.</div>
      )}

      {suggestions.length > 0 && (
        <div class="space-y-3">
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {suggestions.length} suggestions — click to copy
          </p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => copyCommit(s.full, i)}
              class="w-full text-left group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl p-4 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 flex-wrap min-w-0">
                  <span class={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLOR[s.type]}`}>
                    {s.type}
                  </span>
                  <code class="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">{s.full}</code>
                </div>
                <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 group-hover:text-primary-500 transition-colors">
                  {copiedIdx === i ? '✓ Copied!' : 'Copy'}
                </span>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-0.5">{TYPE_DESCRIPTIONS[s.type]}</p>
            </button>
          ))}
        </div>
      )}

      {/* Convention reference */}
      <div class="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Conventional Commits Reference</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(TYPE_DESCRIPTIONS) as [CommitType, string][]).map(([type, desc]) => (
            <div key={type} class="flex items-center gap-2">
              <span class={`text-xs font-bold px-1.5 py-0.5 rounded ${TYPE_COLOR[type]}`}>{type}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
        <p class="text-xs text-gray-400 mt-3">Format: <code class="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">type(scope): description</code></p>
      </div>
    </div>
  );
}
