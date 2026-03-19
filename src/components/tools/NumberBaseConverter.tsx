import { useState } from 'preact/hooks';

type Base = 'binary' | 'octal' | 'decimal' | 'hex';

const BASES: { id: Base; label: string; prefix: string; radix: number; pattern: RegExp }[] = [
  { id: 'binary', label: 'Binary', prefix: '0b', radix: 2, pattern: /^[01]+$/ },
  { id: 'octal', label: 'Octal', prefix: '0o', radix: 8, pattern: /^[0-7]+$/ },
  { id: 'decimal', label: 'Decimal', prefix: '', radix: 10, pattern: /^-?\d+$/ },
  { id: 'hex', label: 'Hexadecimal', prefix: '0x', radix: 16, pattern: /^[0-9a-fA-F]+$/ },
];

function convertFromDecimal(decimal: bigint): Record<Base, string> {
  const isNeg = decimal < 0n;
  const abs = isNeg ? -decimal : decimal;
  const sign = isNeg ? '-' : '';
  return {
    binary: sign + abs.toString(2),
    octal: sign + abs.toString(8),
    decimal: decimal.toString(10),
    hex: sign + abs.toString(16).toUpperCase(),
  };
}

export default function NumberBaseConverter() {
  const [values, setValues] = useState<Record<Base, string>>({
    binary: '',
    octal: '',
    decimal: '',
    hex: '',
  });
  const [activeBase, setActiveBase] = useState<Base>('decimal');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<Base | null>(null);

  const handleInput = (base: Base, val: string) => {
    setActiveBase(base);
    setError('');

    const clean = val.trim().replace(/\s/g, '');
    if (!clean) {
      setValues({ binary: '', octal: '', decimal: '', hex: '' });
      return;
    }

    const info = BASES.find((b) => b.id === base)!;
    const testVal = base === 'decimal' ? clean : clean.replace(/^-/, '');

    if (!info.pattern.test(testVal)) {
      setValues((prev) => ({ ...prev, [base]: val }));
      setError(`Invalid ${info.label} number`);
      return;
    }

    try {
      let decimal: bigint;
      if (base === 'decimal') {
        decimal = BigInt(clean);
      } else {
        const isNeg = clean.startsWith('-');
        const absVal = isNeg ? clean.slice(1) : clean;
        const prefixMap: Record<string, string> = { binary: 'b', octal: 'o', hex: 'x' };
        decimal = BigInt(`${isNeg ? '-' : ''}0${prefixMap[base]}${absVal}`);
      }
      const converted = convertFromDecimal(decimal);
      setValues(converted);
    } catch {
      setValues((prev) => ({ ...prev, [base]: val }));
      setError('Number too large or invalid');
    }
  };

  const handleCopy = async (base: Base) => {
    const val = values[base];
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = val;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(base);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadSample = () => handleInput('decimal', '255');
  const handleClear = () => {
    setValues({ binary: '', octal: '', decimal: '', hex: '' });
    setError('');
  };

  return (
    <div class="space-y-6">
      {/* Actions */}
      <div class="flex gap-2">
        <button onClick={loadSample} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Sample (255)</button>
        <button onClick={handleClear} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Clear</button>
      </div>

      {/* Converters */}
      <div class="space-y-4">
        {BASES.map((base) => (
          <div key={base.id} class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {base.label}
                {base.prefix && <span class="text-xs text-gray-400 ml-1">({base.prefix})</span>}
              </label>
              <button
                onClick={() => handleCopy(base.id)}
                disabled={!values[base.id]}
                class={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  copied === base.id
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied === base.id ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input
              type="text"
              value={values[base.id]}
              onInput={(e) => handleInput(base.id, (e.target as HTMLInputElement).value)}
              placeholder={`Enter ${base.label.toLowerCase()} number...`}
              class={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${
                activeBase === base.id
                  ? 'border-primary-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              spellcheck={false}
            />
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div class="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Bit Info */}
      {values.decimal && !error && (
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Bits', value: values.binary ? values.binary.replace('-', '').length : 0 },
            { label: 'Bytes', value: values.binary ? Math.ceil(values.binary.replace('-', '').length / 8) : 0 },
            { label: 'Hex digits', value: values.hex ? values.hex.replace('-', '').length : 0 },
            { label: 'Is power of 2', value: values.decimal && BigInt(values.decimal) > 0n && (BigInt(values.decimal) & (BigInt(values.decimal) - 1n)) === 0n ? 'Yes' : 'No' },
          ].map((info) => (
            <div key={info.label} class="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
              <span class="text-xs text-gray-400 block">{info.label}</span>
              <span class="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">{info.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
