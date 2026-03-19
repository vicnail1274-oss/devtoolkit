import { useState, useCallback } from 'preact/hooks';
import QuickNav from '../QuickNav';

type UuidFormat = 'lowercase' | 'uppercase' | 'no-dashes';

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Math.random fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatUuid(uuid: string, format: UuidFormat): string {
  switch (format) {
    case 'uppercase':
      return uuid.toUpperCase();
    case 'no-dashes':
      return uuid.replace(/-/g, '');
    case 'lowercase':
    default:
      return uuid.toLowerCase();
  }
}

export default function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [format, setFormat] = useState<UuidFormat>('lowercase');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback((count: number) => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUuidV4());
    }
    setUuids(newUuids);
    setCopiedIndex(null);
    setCopiedAll(false);
  }, []);

  const formattedUuids = uuids.map((u) => formatUuid(u, format));

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleCopyAll = () => {
    if (formattedUuids.length === 0) return;
    copyToClipboard(formattedUuids.join('\n'));
  };

  const handleClear = () => {
    setUuids([]);
    setCopiedIndex(null);
    setCopiedAll(false);
  };

  const bulkOptions = [1, 5, 10, 25];

  const formatOptions: { key: UuidFormat; label: string }[] = [
    { key: 'lowercase', label: 'lowercase' },
    { key: 'uppercase', label: 'UPPERCASE' },
    { key: 'no-dashes', label: 'No Dashes' },
  ];

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Hash Generator', href: '/tools/hash-generator' },
        { label: 'Timestamp Converter', href: '/tools/timestamp-converter' },
        { label: 'Password Generator', href: '/tools/password-generator' },
      ]} />
      {/* Generate Buttons */}
      <div class="space-y-3">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Generate UUIDs</label>
        <div class="flex flex-wrap gap-2">
          {bulkOptions.map((count) => (
            <button
              key={count}
              onClick={() => generate(count)}
              class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              {count === 1 ? 'Generate 1 UUID' : `Generate ${count}`}
            </button>
          ))}
        </div>
      </div>

      {/* Format Options */}
      <div class="flex flex-wrap items-center gap-4">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
        <div class="flex flex-wrap gap-2">
          {formatOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFormat(opt.key)}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                format === opt.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right side actions */}
        {uuids.length > 0 && (
          <div class="flex gap-2 ml-auto">
            <button
              onClick={handleCopyAll}
              class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                copiedAll
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {copiedAll ? 'Copied All!' : 'Copy All'}
            </button>
            <button
              onClick={handleClear}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Output Area */}
      {formattedUuids.length > 0 ? (
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated UUIDs ({formattedUuids.length})
            </label>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {formattedUuids.map((uuid, i) => (
              <div
                key={i}
                class={`flex items-center justify-between px-4 py-2.5 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ${
                  i !== formattedUuids.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                <code class="font-mono text-sm text-gray-900 dark:text-gray-100 select-all">{uuid}</code>
                <button
                  onClick={() => copyToClipboard(uuid, i)}
                  class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                    copiedIndex === i
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 opacity-100'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {copiedIndex === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">Click a button above to generate UUIDs</p>
        </div>
      )}
    </div>
  );
}
