import { useState, useCallback } from 'preact/hooks';
import { useToolStorage } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  lineNum1?: number;
  lineNum2?: number;
  text: string;
}

function computeDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const m = lines1.length;
  const n = lines2.length;

  // LCS via DP
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = lines1[i - 1] === lines2[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      result.push({ type: 'equal', lineNum1: i, lineNum2: j, text: lines1[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'added', lineNum2: j, text: lines2[j - 1] });
      j--;
    } else {
      result.push({ type: 'removed', lineNum1: i, text: lines1[i - 1] });
      i--;
    }
  }
  return result.reverse();
}

export default function DiffChecker() {
  const { value: left, setValue: setLeft } = useToolStorage('diff-checker', 'left');
  const { value: right, setValue: setRight } = useToolStorage('diff-checker', 'right');
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });
  const [warning, setWarning] = useState('');

  const handleCompare = useCallback(() => {
    const lineCount1 = left.split('\n').length;
    const lineCount2 = right.split('\n').length;
    if (lineCount1 > 5000 || lineCount2 > 5000) {
      setWarning('Input exceeds 5,000 lines. Comparison may be slow.');
    } else {
      setWarning('');
    }
    const result = computeDiff(left, right);
    setDiff(result);
    setStats({
      added: result.filter(d => d.type === 'added').length,
      removed: result.filter(d => d.type === 'removed').length,
      unchanged: result.filter(d => d.type === 'equal').length,
    });
  }, [left, right]);

  const handleClear = () => {
    setLeft('');
    setRight('');
    setDiff(null);
    setStats({ added: 0, removed: 0, unchanged: 0 });
  };

  const handleSwap = () => {
    setLeft(right);
    setRight(left);
    setDiff(null);
  };

  const lineClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'added': return 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300';
      case 'removed': return 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  const prefixChar = (type: DiffLine['type']) => {
    switch (type) {
      case 'added': return '+';
      case 'removed': return '-';
      default: return ' ';
    }
  };

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Regex Tester', href: '/tools/regex-tester' },
        { label: 'JSON Formatter', href: '/tools/json-formatter' },
      ]} />
      {/* Input Areas */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Text</label>
          <textarea
            value={left}
            onInput={(e) => setLeft((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste original text here..."
            class="w-full h-56 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modified Text</label>
          <textarea
            value={right}
            onInput={(e) => setRight((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste modified text here..."
            class="w-full h-56 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
          />
        </div>
      </div>

      {/* Buttons */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleCompare}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Compare
        </button>
        <button
          onClick={handleSwap}
          class="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          Swap
        </button>
        <button
          onClick={handleClear}
          class="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          Clear
        </button>
      </div>

      {/* Stats */}
      {diff && (
        <div class="flex flex-wrap gap-4 text-sm">
          <span class="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg font-medium">
            +{stats.added} added
          </span>
          <span class="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg font-medium">
            -{stats.removed} removed
          </span>
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-medium">
            {stats.unchanged} unchanged
          </span>
        </div>
      )}

      {/* Diff Output */}
      {diff ? (
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm font-mono">
              <tbody>
                {diff.map((line, i) => (
                  <tr key={i} class={lineClass(line.type)}>
                    <td class="w-10 px-2 py-0.5 text-right text-xs text-gray-400 dark:text-gray-600 select-none border-r border-gray-100 dark:border-gray-800">
                      {line.lineNum1 ?? ''}
                    </td>
                    <td class="w-10 px-2 py-0.5 text-right text-xs text-gray-400 dark:text-gray-600 select-none border-r border-gray-100 dark:border-gray-800">
                      {line.lineNum2 ?? ''}
                    </td>
                    <td class="w-6 px-1 py-0.5 text-center select-none font-bold">
                      {prefixChar(line.type)}
                    </td>
                    <td class="px-3 py-0.5 whitespace-pre">{line.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">Paste two texts above and click Compare to see differences</p>
        </div>
      )}
    </div>
  );
}
