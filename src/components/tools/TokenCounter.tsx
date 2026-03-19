import { useState, useMemo } from 'preact/hooks';

type ModelKey = 'gpt4' | 'gpt35' | 'claude-opus' | 'claude-sonnet' | 'llama';

interface ModelConfig {
  label: string;
  charsPerToken: number;
  inputCostPer1K: number;
  costLabel: string;
}

const MODELS: Record<ModelKey, ModelConfig> = {
  'gpt4': { label: 'GPT-4o', charsPerToken: 4, inputCostPer1K: 0.0025, costLabel: '$0.0025 / 1K input' },
  'gpt35': { label: 'GPT-4o mini', charsPerToken: 4, inputCostPer1K: 0.00015, costLabel: '$0.00015 / 1K input' },
  'claude-opus': { label: 'Claude Opus', charsPerToken: 3.5, inputCostPer1K: 0.015, costLabel: '$0.015 / 1K input' },
  'claude-sonnet': { label: 'Claude Sonnet', charsPerToken: 3.5, inputCostPer1K: 0.003, costLabel: '$0.003 / 1K input' },
  'llama': { label: 'Llama', charsPerToken: 4, inputCostPer1K: 0, costLabel: 'Open source' },
};

const SAMPLE_TEXT = `You are a helpful AI assistant. Your task is to analyze the following document and provide a comprehensive summary.

The document covers several key topics:
1. Introduction to large language models (LLMs)
2. How tokenization works in practice
3. Cost optimization strategies for API usage
4. Best practices for prompt engineering

Please provide your analysis in a structured format with clear headings and bullet points. Focus on actionable insights that developers can immediately apply to their projects.

Remember to consider both the technical and business aspects of LLM deployment when formulating your recommendations.`;

export default function TokenCounter() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelKey>('gpt4');

  const stats = useMemo(() => {
    const text = input;
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lineCount = text === '' ? 0 : text.split('\n').length;

    const model = MODELS[selectedModel];
    // Use word-based heuristic (~1.3 tokens/word) combined with char-based for better accuracy
    let tokenCount = 0;
    if (charCount > 0) {
      const charEstimate = Math.ceil(charCount / model.charsPerToken);
      const wordEstimate = wordCount > 0 ? Math.ceil(wordCount * 1.3) : charEstimate;
      // Weight word-based estimate higher as it's more accurate for natural text
      tokenCount = wordCount >= 3 ? Math.ceil(wordEstimate * 0.7 + charEstimate * 0.3) : charEstimate;
    }
    const cost = (tokenCount / 1000) * model.inputCostPer1K;

    return { charCount, wordCount, lineCount, tokenCount, cost };
  }, [input, selectedModel]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      // clipboard not available
    }
  };

  const handleClear = () => {
    setInput('');
  };

  const loadSample = () => {
    setInput(SAMPLE_TEXT);
  };

  const formatCost = (cost: number): string => {
    if (cost === 0) return '$0.00';
    if (cost < 0.0001) return '< $0.0001';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(4)}`;
  };

  const statCards = [
    { label: 'Estimated Tokens', value: stats.tokenCount.toLocaleString(), icon: '⚡', accent: 'primary' },
    { label: 'Words', value: stats.wordCount.toLocaleString(), icon: '📝', accent: 'blue' },
    { label: 'Characters', value: stats.charCount.toLocaleString(), icon: '🔤', accent: 'green' },
    { label: 'Lines', value: stats.lineCount.toLocaleString(), icon: '📄', accent: 'purple' },
  ];

  const accentClasses: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800',
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  };

  const accentText: Record<string, string> = {
    primary: 'text-primary-600 dark:text-primary-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <div class="space-y-6">
      {/* Model Selector */}
      <div class="flex flex-wrap gap-2">
        {(Object.keys(MODELS) as ModelKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedModel(key)}
            class={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedModel === key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {MODELS[key].label}
          </button>
        ))}

        <div class="flex items-center gap-2 ml-auto">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            ~{MODELS[selectedModel].charsPerToken} chars/token &middot; {MODELS[selectedModel].costLabel}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            class={`rounded-xl border p-4 transition-all duration-200 ${accentClasses[card.accent]}`}
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base">{card.icon}</span>
              <span class={`text-xs font-medium ${accentText[card.accent]}`}>{card.label}</span>
            </div>
            <p class={`text-2xl font-bold ${accentText[card.accent]}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Cost Estimation */}
      {selectedModel !== 'llama' && (
        <div class="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <span class="text-lg">💰</span>
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
              Estimated Input Cost ({MODELS[selectedModel].label})
            </p>
            <p class="text-lg font-bold text-amber-700 dark:text-amber-300">
              {formatCost(stats.cost)}
            </p>
          </div>
          <span class="ml-auto text-xs text-amber-600 dark:text-amber-400">
            {stats.tokenCount.toLocaleString()} tokens &times; {MODELS[selectedModel].inputCostPer1K}/1K
          </span>
        </div>
      )}

      {/* Textarea */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Input Text</label>
          <div class="flex gap-2">
            <button
              onClick={handlePaste}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Paste
            </button>
            <button
              onClick={loadSample}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Sample
            </button>
            <button
              onClick={handleClear}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Type or paste your text here to count tokens..."
          class="w-full h-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
          spellcheck={false}
        />
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>{stats.charCount.toLocaleString()} characters</span>
          <span>{stats.lineCount} lines</span>
        </div>
      </div>

      {/* Info Note */}
      <div class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
        <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Estimation Note</p>
          <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Token counts are estimated using character-based heuristics. Actual tokenization may vary depending on the model's specific tokenizer. Use this as a quick approximation for cost planning.
          </p>
        </div>
      </div>
    </div>
  );
}
