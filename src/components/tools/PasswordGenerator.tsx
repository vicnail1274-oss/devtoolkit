import { useState, useCallback } from 'preact/hooks';
import QuickNav from '../QuickNav';

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePassword(length: number, options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }): string {
  let chars = '';
  if (options.uppercase) chars += CHAR_SETS.uppercase;
  if (options.lowercase) chars += CHAR_SETS.lowercase;
  if (options.numbers) chars += CHAR_SETS.numbers;
  if (options.symbols) chars += CHAR_SETS.symbols;
  if (!chars) chars = CHAR_SETS.lowercase + CHAR_SETS.numbers;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('');
}

function getStrength(password: string): { label: string; color: string; width: string } {
  // Calculate entropy based on character pool size and length
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/\d/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
  if (poolSize === 0) poolSize = 26; // fallback

  const entropy = password.length * Math.log2(poolSize);

  // NIST-inspired thresholds: <36 weak, <60 fair, <80 strong, 80+ very strong
  if (entropy < 36) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
  if (entropy < 60) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
  if (entropy < 80) return { label: 'Strong', color: 'bg-blue-500', width: 'w-3/4' };
  return { label: 'Very Strong', color: 'bg-green-500', width: 'w-full' };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = useCallback(() => {
    const results = Array.from({ length: count }, () => generatePassword(length, options));
    setPasswords(results);
    setCopiedIdx(null);
  }, [length, count, options]);

  const handleCopy = async (pw: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(pw);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = pw;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = async () => {
    const text = passwords.join('\n');
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
    setCopiedIdx(-1);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggleOption = (key: keyof typeof options) => {
    const next = { ...options, [key]: !options[key] };
    // Ensure at least one is checked
    if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) return;
    setOptions(next);
  };

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Hash Generator', href: '/tools/hash-generator' },
        { label: 'JWT Decoder', href: '/tools/jwt-decoder' },
        { label: 'UUID Generator', href: '/tools/uuid-generator' },
      ]} />
      {/* Length Slider */}
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Password Length</label>
          <span class="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">{length}</span>
        </div>
        <input
          type="range"
          min={4}
          max={64}
          value={length}
          onInput={(e) => setLength(Number((e.target as HTMLInputElement).value))}
          class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>4</span>
          <span>64</span>
        </div>
      </div>

      {/* Count */}
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Number of Passwords</label>
        <div class="flex gap-2">
          {[1, 5, 10, 25].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              class={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                count === n
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Character Options */}
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Character Types</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(CHAR_SETS) as (keyof typeof CHAR_SETS)[]).map((key) => (
            <label
              key={key}
              class={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                options[key]
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggleOption(key)}
                class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300 capitalize">{key}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Generate Password{count > 1 ? 's' : ''}
        </button>
        {passwords.length > 1 && (
          <button
            onClick={handleCopyAll}
            class={`px-4 py-2.5 font-medium rounded-xl transition-all duration-200 ${
              copiedIdx === -1
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {copiedIdx === -1 ? 'Copied All!' : 'Copy All'}
          </button>
        )}
      </div>

      {/* Output */}
      {passwords.length > 0 ? (
        <div class="space-y-3">
          {passwords.map((pw, idx) => {
            const strength = getStrength(pw);
            return (
              <div key={idx} class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div class="flex items-center gap-3">
                  <code class="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all select-all">
                    {pw}
                  </code>
                  <button
                    onClick={() => handleCopy(pw, idx)}
                    class={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      copiedIdx === idx
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {copiedIdx === idx ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {/* Strength bar */}
                <div class="mt-2 flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{strength.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div class="flex items-center justify-center h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">Generated passwords will appear here</p>
        </div>
      )}
    </div>
  );
}
