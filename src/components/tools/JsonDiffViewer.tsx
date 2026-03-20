import { useState, useCallback } from 'preact/hooks';
import { useToolStorage } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

type DiffType = 'added' | 'removed' | 'changed' | 'equal';

interface DiffNode {
  key: string;
  path: string;
  type: DiffType;
  leftValue?: unknown;
  rightValue?: unknown;
  children?: DiffNode[];
}

function formatValue(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'object') return Array.isArray(val) ? `[…${(val as unknown[]).length}]` : '{…}';
  return String(val);
}

function diffObjects(left: unknown, right: unknown, path = ''): DiffNode[] {
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      return [{ key: path, path, type: 'changed', leftValue: left, rightValue: right }];
    }
    return [];
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  const nodes: DiffNode[] = [];

  if (leftIsArray && rightIsArray) {
    const la = left as unknown[];
    const ra = right as unknown[];
    const maxLen = Math.max(la.length, ra.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= la.length) {
        nodes.push({ key: `[${i}]`, path: childPath, type: 'added', rightValue: ra[i] });
      } else if (i >= ra.length) {
        nodes.push({ key: `[${i}]`, path: childPath, type: 'removed', leftValue: la[i] });
      } else {
        const children = diffObjects(la[i], ra[i], childPath);
        if (children.length > 0) {
          const isLeaf = typeof la[i] !== 'object' || la[i] === null;
          if (isLeaf) {
            nodes.push(...children);
          } else {
            nodes.push({ key: `[${i}]`, path: childPath, type: 'changed', children });
          }
        }
      }
    }
    return nodes;
  }

  const lo = left as Record<string, unknown>;
  const ro = right as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(lo), ...Object.keys(ro)]);

  for (const k of allKeys) {
    const childPath = path ? `${path}.${k}` : k;
    if (!(k in lo)) {
      nodes.push({ key: k, path: childPath, type: 'added', rightValue: ro[k] });
    } else if (!(k in ro)) {
      nodes.push({ key: k, path: childPath, type: 'removed', leftValue: lo[k] });
    } else {
      const children = diffObjects(lo[k], ro[k], childPath);
      if (children.length > 0) {
        const isLeaf = typeof lo[k] !== 'object' || lo[k] === null;
        if (isLeaf) {
          nodes.push(...children);
        } else {
          nodes.push({ key: k, path: childPath, type: 'changed', children });
        }
      }
    }
  }
  return nodes;
}

function DiffTree({ nodes, depth = 0 }: { nodes: DiffNode[]; depth?: number }) {
  if (nodes.length === 0) return null;
  return (
    <div class={depth > 0 ? 'ml-4 border-l border-gray-200 dark:border-gray-700 pl-4' : ''}>
      {nodes.map((node) => {
        const bg =
          node.type === 'added' ? 'bg-green-50 dark:bg-green-950/40' :
          node.type === 'removed' ? 'bg-red-50 dark:bg-red-950/40' :
          node.type === 'changed' && !node.children ? 'bg-yellow-50 dark:bg-yellow-950/40' : '';
        const badge =
          node.type === 'added' ? <span class="text-xs font-bold text-green-600 dark:text-green-400 ml-2">+added</span> :
          node.type === 'removed' ? <span class="text-xs font-bold text-red-600 dark:text-red-400 ml-2">−removed</span> :
          node.type === 'changed' && !node.children ? <span class="text-xs font-bold text-yellow-600 dark:text-yellow-400 ml-2">~changed</span> : null;

        return (
          <div key={node.path} class={`rounded px-2 py-1 my-0.5 font-mono text-sm ${bg}`}>
            <span class="font-semibold text-gray-700 dark:text-gray-300">{node.key}:</span>
            {node.type === 'added' && (
              <span class="ml-2 text-green-700 dark:text-green-300">{formatValue(node.rightValue)}</span>
            )}
            {node.type === 'removed' && (
              <span class="ml-2 text-red-700 dark:text-red-300 line-through">{formatValue(node.leftValue)}</span>
            )}
            {node.type === 'changed' && !node.children && (
              <>
                <span class="ml-2 text-red-600 dark:text-red-400 line-through">{formatValue(node.leftValue)}</span>
                <span class="mx-1 text-gray-400">→</span>
                <span class="text-green-600 dark:text-green-400">{formatValue(node.rightValue)}</span>
              </>
            )}
            {badge}
            {node.children && <DiffTree nodes={node.children} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
}

export default function JsonDiffViewer() {
  const { value: leftText, setValue: setLeftText } = useToolStorage('json-diff', 'left');
  const { value: rightText, setValue: setRightText } = useToolStorage('json-diff', 'right');
  const [result, setResult] = useState<{ nodes: DiffNode[]; added: number; removed: number; changed: number } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const runDiff = useCallback(() => {
    setError('');
    let left: unknown, right: unknown;
    try {
      left = JSON.parse(leftText || '{}');
    } catch {
      setError('Left JSON is invalid');
      return;
    }
    try {
      right = JSON.parse(rightText || '{}');
    } catch {
      setError('Right JSON is invalid');
      return;
    }
    const nodes = diffObjects(left, right);

    const countTypes = (ns: DiffNode[]): { added: number; removed: number; changed: number } => {
      let a = 0, r = 0, c = 0;
      for (const n of ns) {
        if (n.children) { const sub = countTypes(n.children); a += sub.added; r += sub.removed; c += sub.changed; }
        else if (n.type === 'added') a++;
        else if (n.type === 'removed') r++;
        else if (n.type === 'changed') c++;
      }
      return { added: a, removed: r, changed: c };
    };
    const counts = countTypes(nodes);
    setResult({ nodes, ...counts });
  }, [leftText, rightText]);

  const copyReport = useCallback(() => {
    if (!result) return;
    const lines: string[] = [`JSON Diff Report`, `Added: ${result.added}, Removed: ${result.removed}, Changed: ${result.changed}`, ''];
    const flatten = (nodes: DiffNode[], prefix = '') => {
      for (const n of nodes) {
        if (n.children) {
          lines.push(`${prefix}${n.key}: (changed)`);
          flatten(n.children, prefix + '  ');
        } else if (n.type === 'added') {
          lines.push(`${prefix}+ ${n.key}: ${formatValue(n.rightValue)}`);
        } else if (n.type === 'removed') {
          lines.push(`${prefix}- ${n.key}: ${formatValue(n.leftValue)}`);
        } else if (n.type === 'changed') {
          lines.push(`${prefix}~ ${n.key}: ${formatValue(n.leftValue)} → ${formatValue(n.rightValue)}`);
        }
      }
    };
    flatten(result.nodes);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [result]);

  return (
    <div>
      <QuickNav links={[
        { label: 'JSON Formatter', href: '/tools/json-formatter' },
        { label: 'Diff Checker', href: '/tools/diff-checker' },
        { label: 'JSON to YAML', href: '/tools/json-to-yaml' },
      ]} />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original JSON (Left)</label>
          <textarea
            class="w-full h-52 font-mono text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            placeholder={'{\n  "name": "Alice",\n  "age": 30\n}'}
            value={leftText}
            onInput={(e) => setLeftText((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modified JSON (Right)</label>
          <textarea
            class="w-full h-52 font-mono text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            placeholder={'{\n  "name": "Alice",\n  "age": 31,\n  "city": "NYC"\n}'}
            value={rightText}
            onInput={(e) => setRightText((e.target as HTMLTextAreaElement).value)}
            spellcheck={false}
          />
        </div>
      </div>

      <div class="flex items-center gap-3 mb-6">
        <button
          onClick={runDiff}
          class="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Compare JSON
        </button>
        {result && (
          <button
            onClick={copyReport}
            class="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy Report'}
          </button>
        )}
        {result && (
          <div class="flex gap-3 text-sm ml-2">
            <span class="text-green-600 dark:text-green-400 font-medium">+{result.added} added</span>
            <span class="text-red-600 dark:text-red-400 font-medium">−{result.removed} removed</span>
            <span class="text-yellow-600 dark:text-yellow-400 font-medium">~{result.changed} changed</span>
          </div>
        )}
      </div>

      {error && (
        <div class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      {result !== null && (
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          {result.nodes.length === 0 ? (
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              <div class="text-3xl mb-2">✓</div>
              <div class="font-medium">JSON objects are identical</div>
            </div>
          ) : (
            <DiffTree nodes={result.nodes} />
          )}
        </div>
      )}
    </div>
  );
}
