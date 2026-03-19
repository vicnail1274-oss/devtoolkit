import { useState } from 'preact/hooks';

const PERMS = ['Read', 'Write', 'Execute'] as const;
const ROLES = ['Owner', 'Group', 'Others'] as const;
const BITS = [4, 2, 1] as const;

const COMMON_MODES = [
  { mode: '755', desc: 'Owner rwx, Group rx, Others rx (directories, scripts)' },
  { mode: '644', desc: 'Owner rw, Group r, Others r (regular files)' },
  { mode: '777', desc: 'Everyone rwx (not recommended)' },
  { mode: '600', desc: 'Owner rw only (private files)' },
  { mode: '700', desc: 'Owner rwx only (private directories)' },
  { mode: '400', desc: 'Owner read only (SSH keys)' },
  { mode: '666', desc: 'Everyone rw (shared files)' },
  { mode: '750', desc: 'Owner rwx, Group rx (shared directories)' },
];

function octalToPerms(octal: string): boolean[][] {
  const digits = octal.padStart(3, '0').split('').map(Number);
  return digits.map((d) => BITS.map((b) => (d & b) !== 0));
}

function permsToOctal(perms: boolean[][]): string {
  return perms
    .map((role) => role.reduce((sum, on, i) => sum + (on ? BITS[i] : 0), 0))
    .join('');
}

function permsToSymbolic(perms: boolean[][]): string {
  return perms
    .map((role) =>
      role.map((on, i) => (on ? ['r', 'w', 'x'][i] : '-')).join('')
    )
    .join('');
}

function permsToCommand(octal: string): string {
  return `chmod ${octal} filename`;
}

export default function ChmodCalculator() {
  const [perms, setPerms] = useState<boolean[][]>([
    [true, true, true],
    [true, false, true],
    [true, false, true],
  ]);
  const [octalInput, setOctalInput] = useState('755');
  const [copied, setCopied] = useState<string | null>(null);

  const octal = permsToOctal(perms);
  const symbolic = permsToSymbolic(perms);
  const command = permsToCommand(octal);

  const togglePerm = (role: number, perm: number) => {
    const next = perms.map((r) => [...r]);
    next[role][perm] = !next[role][perm];
    setPerms(next);
    setOctalInput(permsToOctal(next));
  };

  const handleOctalChange = (val: string) => {
    setOctalInput(val);
    if (/^[0-7]{3}$/.test(val)) {
      setPerms(octalToPerms(val));
    }
  };

  const applyPreset = (mode: string) => {
    setOctalInput(mode);
    setPerms(octalToPerms(mode));
  };

  const handleCopy = async (text: string, label: string) => {
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
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div class="space-y-6">
      {/* Octal Input */}
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Octal</label>
        <input
          type="text"
          value={octalInput}
          onInput={(e) => handleOctalChange((e.target as HTMLInputElement).value)}
          maxLength={3}
          class="w-24 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-2xl text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
        />
        <span class="font-mono text-lg text-gray-600 dark:text-gray-400">-{symbolic}</span>
      </div>

      {/* Permission Matrix */}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-3" />
              {PERMS.map((p) => (
                <th key={p} class="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-4">
                  {p}
                </th>
              ))}
              <th class="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-3 px-4">Value</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role, ri) => (
              <tr key={role} class="border-t border-gray-100 dark:border-gray-800">
                <td class="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{role}</td>
                {PERMS.map((_, pi) => (
                  <td key={pi} class="py-3 text-center px-4">
                    <button
                      onClick={() => togglePerm(ri, pi)}
                      class={`w-10 h-10 rounded-lg font-mono text-sm font-bold transition-all duration-200 ${
                        perms[ri][pi]
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {perms[ri][pi] ? ['r', 'w', 'x'][pi] : '-'}
                    </button>
                  </td>
                ))}
                <td class="py-3 text-center px-4 font-mono text-lg text-primary-600 dark:text-primary-400">
                  {perms[ri].reduce((s, on, i) => s + (on ? BITS[i] : 0), 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Octal', value: octal },
          { label: 'Symbolic', value: `-${symbolic}` },
          { label: 'Command', value: command },
        ].map((item) => (
          <div
            key={item.label}
            class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
          >
            <div>
              <span class="text-xs text-gray-400 block">{item.label}</span>
              <code class="text-sm font-mono text-gray-800 dark:text-gray-200">{item.value}</code>
            </div>
            <button
              onClick={() => handleCopy(item.value, item.label)}
              class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                copied === item.label
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {copied === item.label ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ))}
      </div>

      {/* Common Presets */}
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Common Permissions</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMMON_MODES.map((preset) => (
            <button
              key={preset.mode}
              onClick={() => applyPreset(preset.mode)}
              class={`text-left p-3 rounded-xl border transition-all duration-200 ${
                octal === preset.mode
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <code class="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">{preset.mode}</code>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
