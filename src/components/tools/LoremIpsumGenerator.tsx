import { useState, useCallback } from 'preact/hooks';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi',
  'nesciunt', 'neque', 'porro', 'quisquam', 'nihil', 'impedit', 'quo', 'minus',
];

const FIRST_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(): string {
  const len = randomInt(6, 15);
  const words: string[] = [];
  for (let i = 0; i < len; i++) {
    words.push(LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)]);
  }
  return capitalize(words.join(' ')) + '.';
}

function generateParagraph(): string {
  const sentenceCount = randomInt(4, 8);
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(' ');
}

type Unit = 'paragraphs' | 'sentences' | 'words';

function generate(count: number, unit: Unit, startWithLorem: boolean): string {
  if (unit === 'words') {
    const words: string[] = [];
    if (startWithLorem) {
      words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
    }
    while (words.length < count) {
      words.push(LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)]);
    }
    return capitalize(words.slice(0, count).join(' ')) + '.';
  }

  if (unit === 'sentences') {
    const sentences: string[] = [];
    if (startWithLorem) {
      sentences.push(FIRST_SENTENCE);
    }
    while (sentences.length < count) {
      sentences.push(generateSentence());
    }
    return sentences.slice(0, count).join(' ');
  }

  // paragraphs
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0 && startWithLorem) {
      paragraphs.push(FIRST_SENTENCE + ' ' + generateParagraph());
    } else {
      paragraphs.push(generateParagraph());
    }
  }
  return paragraphs.join('\n\n');
}

export default function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setOutput(generate(count, unit, startWithLorem));
    setCopied(false);
  }, [count, unit, startWithLorem]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unitOptions: { key: Unit; label: string }[] = [
    { key: 'paragraphs', label: 'Paragraphs' },
    { key: 'sentences', label: 'Sentences' },
    { key: 'words', label: 'Words' },
  ];

  return (
    <div class="space-y-6">
      {/* Controls */}
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Count</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onInput={(e) => setCount(Math.max(1, Math.min(100, parseInt((e.target as HTMLInputElement).value) || 1)))}
            class="w-24 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label>
          <div class="flex gap-2">
            {unitOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setUnit(opt.key)}
                class={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  unit === opt.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label class="flex items-center gap-2 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem((e.target as HTMLInputElement).checked)}
            class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Start with "Lorem ipsum..."</span>
        </label>
      </div>

      {/* Generate Button */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Generate
        </button>
        {output && (
          <button
            onClick={handleCopy}
            class={`px-4 py-2.5 font-medium rounded-xl transition-all duration-200 ${
              copied
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        )}
      </div>

      {/* Output */}
      {output ? (
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
            {output}
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
            {output.split(/\s+/).filter(Boolean).length} words &middot; {output.length} characters
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">Click Generate to create lorem ipsum text</p>
        </div>
      )}
    </div>
  );
}
