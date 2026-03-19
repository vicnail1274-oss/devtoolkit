import { useState, useCallback, useMemo } from 'preact/hooks';

interface FormData {
  name: string;
  subtitle: string;
  about: string;
  currentWork: string;
  learning: string;
  collaborate: string;
  askMe: string;
  funFact: string;
  email: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
  skills: string[];
  githubStats: boolean;
  streakStats: boolean;
  topLangs: boolean;
  template: string;
  visitorBadge: boolean;
  trophies: boolean;
}

const defaultForm: FormData = {
  name: '',
  subtitle: '',
  about: '',
  currentWork: '',
  learning: '',
  collaborate: '',
  askMe: '',
  funFact: '',
  email: '',
  website: '',
  twitter: '',
  linkedin: '',
  github: '',
  skills: [],
  githubStats: true,
  streakStats: true,
  topLangs: true,
  template: 'minimal',
  visitorBadge: false,
  trophies: false,
};

const skillOptions: Record<string, { label: string; color: string; logo: string }[]> = {
  Languages: [
    { label: 'JavaScript', color: 'F7DF1E', logo: 'javascript' },
    { label: 'TypeScript', color: '3178C6', logo: 'typescript' },
    { label: 'Python', color: '3776AB', logo: 'python' },
    { label: 'Rust', color: '000000', logo: 'rust' },
    { label: 'Go', color: '00ADD8', logo: 'go' },
    { label: 'Java', color: 'ED8B00', logo: 'openjdk' },
    { label: 'C++', color: '00599C', logo: 'cplusplus' },
    { label: 'C#', color: '239120', logo: 'csharp' },
    { label: 'PHP', color: '777BB4', logo: 'php' },
    { label: 'Ruby', color: 'CC342D', logo: 'ruby' },
    { label: 'Swift', color: 'F05138', logo: 'swift' },
    { label: 'Kotlin', color: '7F52FF', logo: 'kotlin' },
  ],
  Frontend: [
    { label: 'React', color: '61DAFB', logo: 'react' },
    { label: 'Vue.js', color: '4FC08D', logo: 'vuedotjs' },
    { label: 'Angular', color: 'DD0031', logo: 'angular' },
    { label: 'Svelte', color: 'FF3E00', logo: 'svelte' },
    { label: 'Next.js', color: '000000', logo: 'nextdotjs' },
    { label: 'Tailwind CSS', color: '06B6D4', logo: 'tailwindcss' },
    { label: 'HTML5', color: 'E34F26', logo: 'html5' },
    { label: 'CSS3', color: '1572B6', logo: 'css3' },
    { label: 'Astro', color: 'BC52EE', logo: 'astro' },
  ],
  Backend: [
    { label: 'Node.js', color: '339933', logo: 'nodedotjs' },
    { label: 'Express', color: '000000', logo: 'express' },
    { label: 'Django', color: '092E20', logo: 'django' },
    { label: 'FastAPI', color: '009688', logo: 'fastapi' },
    { label: 'Spring', color: '6DB33F', logo: 'spring' },
    { label: 'NestJS', color: 'E0234E', logo: 'nestjs' },
  ],
  Database: [
    { label: 'PostgreSQL', color: '4169E1', logo: 'postgresql' },
    { label: 'MongoDB', color: '47A248', logo: 'mongodb' },
    { label: 'MySQL', color: '4479A1', logo: 'mysql' },
    { label: 'Redis', color: 'DC382D', logo: 'redis' },
    { label: 'SQLite', color: '003B57', logo: 'sqlite' },
    { label: 'Supabase', color: '3FCF8E', logo: 'supabase' },
  ],
  'DevOps & Tools': [
    { label: 'Docker', color: '2496ED', logo: 'docker' },
    { label: 'Kubernetes', color: '326CE5', logo: 'kubernetes' },
    { label: 'AWS', color: '232F3E', logo: 'amazonwebservices' },
    { label: 'Git', color: 'F05032', logo: 'git' },
    { label: 'GitHub Actions', color: '2088FF', logo: 'githubactions' },
    { label: 'Vercel', color: '000000', logo: 'vercel' },
    { label: 'Cloudflare', color: 'F38020', logo: 'cloudflare' },
    { label: 'Linux', color: 'FCC624', logo: 'linux' },
  ],
};

function generateMarkdown(form: FormData): string {
  const lines: string[] = [];
  const ghUser = form.github || 'yourusername';

  if (form.template === 'banner') {
    lines.push(`# Hi there, I'm ${form.name || 'Your Name'} 👋`);
    lines.push('');
    if (form.subtitle) {
      lines.push(`### ${form.subtitle}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  } else if (form.template === 'centered') {
    lines.push(`<h1 align="center">Hi 👋, I'm ${form.name || 'Your Name'}</h1>`);
    if (form.subtitle) {
      lines.push(`<h3 align="center">${form.subtitle}</h3>`);
    }
    lines.push('');
  } else {
    // minimal
    lines.push(`# ${form.name || 'Your Name'}`);
    lines.push('');
    if (form.subtitle) {
      lines.push(`**${form.subtitle}**`);
      lines.push('');
    }
  }

  if (form.about) {
    lines.push(form.about);
    lines.push('');
  }

  // Info bullets
  const bullets: string[] = [];
  if (form.currentWork) bullets.push(`🔭 I'm currently working on **${form.currentWork}**`);
  if (form.learning) bullets.push(`🌱 I'm currently learning **${form.learning}**`);
  if (form.collaborate) bullets.push(`👯 I'm looking to collaborate on **${form.collaborate}**`);
  if (form.askMe) bullets.push(`💬 Ask me about **${form.askMe}**`);
  if (form.email) bullets.push(`📫 How to reach me: **${form.email}**`);
  if (form.funFact) bullets.push(`⚡ Fun fact: **${form.funFact}**`);

  if (bullets.length > 0) {
    for (const b of bullets) {
      lines.push(`- ${b}`);
    }
    lines.push('');
  }

  // Social links
  const socials: string[] = [];
  if (form.website) {
    socials.push(`[![Website](https://img.shields.io/badge/Website-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](${form.website})`);
  }
  if (form.twitter) {
    socials.push(`[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/${form.twitter})`);
  }
  if (form.linkedin) {
    socials.push(`[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/${form.linkedin})`);
  }

  if (socials.length > 0) {
    if (form.template === 'centered') {
      lines.push(`<p align="center">`);
      lines.push(socials.join(' '));
      lines.push(`</p>`);
    } else {
      lines.push(socials.join(' '));
    }
    lines.push('');
  }

  // Skills
  if (form.skills.length > 0) {
    lines.push('## 🛠️ Tech Stack');
    lines.push('');
    const badges = form.skills.map((skillLabel) => {
      for (const cat of Object.values(skillOptions)) {
        const found = cat.find((s) => s.label === skillLabel);
        if (found) {
          const encodedLabel = found.label.replace(/-/g, '--').replace(/ /g, '%20');
          return `![${found.label}](https://img.shields.io/badge/${encodedLabel}-${found.color}?style=for-the-badge&logo=${found.logo}&logoColor=white)`;
        }
      }
      return '';
    }).filter(Boolean);

    if (form.template === 'centered') {
      lines.push('<p align="center">');
      lines.push(badges.join(' '));
      lines.push('</p>');
    } else {
      lines.push(badges.join(' '));
    }
    lines.push('');
  }

  // GitHub Stats
  if (form.githubStats || form.streakStats || form.topLangs || form.trophies) {
    lines.push('## 📊 GitHub Stats');
    lines.push('');

    const align = form.template === 'centered' ? ' align="center"' : '';

    if (form.template === 'centered') lines.push(`<p align="center">`);

    if (form.githubStats) {
      lines.push(`![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${ghUser}&show_icons=true&theme=tokyonight&hide_border=true)`);
    }
    if (form.streakStats) {
      lines.push(`![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=${ghUser}&theme=tokyonight&hide_border=true)`);
    }
    if (form.topLangs) {
      lines.push(`![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${ghUser}&layout=compact&theme=tokyonight&hide_border=true)`);
    }
    if (form.trophies) {
      lines.push(`![Trophies](https://github-profile-trophy.vercel.app/?username=${ghUser}&theme=tokyonight&no-frame=true&row=1&column=7)`);
    }

    if (form.template === 'centered') lines.push(`</p>`);
    lines.push('');
  }

  // Visitor badge
  if (form.visitorBadge) {
    lines.push('---');
    lines.push('');
    if (form.template === 'centered') {
      lines.push(`<p align="center">`);
      lines.push(`![Visitor Count](https://komarev.com/ghpvc/?username=${ghUser}&color=blue&style=flat-square)`);
      lines.push(`</p>`);
    } else {
      lines.push(`![Visitor Count](https://komarev.com/ghpvc/?username=${ghUser}&color=blue&style=flat-square)`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Generated with [DevToolkit](https://devtoolkit.cc/tools/github-readme-generator)*`);

  return lines.join('\n');
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
      />
    </div>
  );
}

export default function GitHubReadmeGenerator() {
  const [form, setForm] = useState<FormData>({ ...defaultForm });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [skillCategory, setSkillCategory] = useState('Languages');

  const update = useCallback((key: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSkill = useCallback((skill: string) => {
    setForm((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  }, []);

  const markdown = useMemo(() => generateMarkdown(form), [form]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (template: string) => {
    const templates: Record<string, Partial<FormData>> = {
      minimal: {
        template: 'minimal',
        name: form.name,
        subtitle: 'Software Developer',
        githubStats: true,
        streakStats: false,
        topLangs: true,
        trophies: false,
        visitorBadge: false,
      },
      banner: {
        template: 'banner',
        name: form.name,
        subtitle: 'Full Stack Developer | Open Source Enthusiast',
        githubStats: true,
        streakStats: true,
        topLangs: true,
        trophies: false,
        visitorBadge: true,
      },
      centered: {
        template: 'centered',
        name: form.name,
        subtitle: 'Passionate developer building cool things',
        githubStats: true,
        streakStats: true,
        topLangs: true,
        trophies: true,
        visitorBadge: true,
      },
    };
    if (templates[template]) {
      setForm((prev) => ({ ...prev, ...templates[template] }));
    }
  };

  const templates = [
    { key: 'minimal', label: 'Minimal', desc: 'Clean & simple' },
    { key: 'banner', label: 'Banner', desc: 'With dividers' },
    { key: 'centered', label: 'Centered', desc: 'Everything centered' },
  ];

  return (
    <div class="space-y-6">
      {/* Template Selection */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template</label>
        <div class="grid grid-cols-3 gap-3">
          {templates.map((t) => (
            <button
              key={t.key}
              onClick={() => applyTemplate(t.key)}
              class={`p-3 rounded-lg border text-left transition-all ${
                form.template === t.key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div class={`text-sm font-medium ${form.template === t.key ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}`}>{t.label}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div class="flex sm:hidden border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('edit')}
          class={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'edit'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400'
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          class={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400'
          }`}
        >
          Preview
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Form */}
        <div class={`space-y-5 ${activeTab === 'preview' ? 'hidden sm:block' : ''}`}>
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Basic Info</h3>
            <TextInput label="Name" value={form.name} onChange={(v) => update('name', v)} placeholder="John Doe" />
            <TextInput label="Subtitle" value={form.subtitle} onChange={(v) => update('subtitle', v)} placeholder="Full Stack Developer" />
            <TextInput label="GitHub Username" value={form.github} onChange={(v) => update('github', v)} placeholder="johndoe" />
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About</label>
              <textarea
                value={form.about}
                onInput={(e) => update('about', (e.target as HTMLTextAreaElement).value)}
                placeholder="A short bio about yourself..."
                rows={2}
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">What are you up to?</h3>
            <TextInput label="Currently working on" value={form.currentWork} onChange={(v) => update('currentWork', v)} placeholder="an awesome project" />
            <TextInput label="Currently learning" value={form.learning} onChange={(v) => update('learning', v)} placeholder="Rust, WebAssembly" />
            <TextInput label="Looking to collaborate on" value={form.collaborate} onChange={(v) => update('collaborate', v)} placeholder="open source projects" />
            <TextInput label="Ask me about" value={form.askMe} onChange={(v) => update('askMe', v)} placeholder="React, Node.js, TypeScript" />
            <TextInput label="Fun fact" value={form.funFact} onChange={(v) => update('funFact', v)} placeholder="I code while listening to lo-fi" />
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Social Links</h3>
            <TextInput label="Email" value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" />
            <TextInput label="Website URL" value={form.website} onChange={(v) => update('website', v)} placeholder="https://yoursite.com" />
            <TextInput label="Twitter username" value={form.twitter} onChange={(v) => update('twitter', v)} placeholder="johndoe" />
            <TextInput label="LinkedIn username" value={form.linkedin} onChange={(v) => update('linkedin', v)} placeholder="johndoe" />
          </div>

          {/* Skills */}
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Tech Stack</h3>
            <div class="flex flex-wrap gap-1.5">
              {Object.keys(skillOptions).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSkillCategory(cat)}
                  class={`px-3 py-1 text-xs rounded-full transition-all ${
                    skillCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div class="flex flex-wrap gap-2">
              {(skillOptions[skillCategory] || []).map((skill) => (
                <button
                  key={skill.label}
                  onClick={() => toggleSkill(skill.label)}
                  class={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    form.skills.includes(skill.label)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {skill.label}
                </button>
              ))}
            </div>
            {form.skills.length > 0 && (
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Selected: {form.skills.join(', ')}
              </div>
            )}
          </div>

          {/* Widgets */}
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Widgets</h3>
            <div class="space-y-2">
              {[
                { key: 'githubStats' as const, label: 'GitHub Stats Card' },
                { key: 'streakStats' as const, label: 'Streak Stats' },
                { key: 'topLangs' as const, label: 'Top Languages' },
                { key: 'trophies' as const, label: 'GitHub Trophies' },
                { key: 'visitorBadge' as const, label: 'Visitor Counter' },
              ].map((widget) => (
                <label key={widget.key} class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[widget.key] as boolean}
                    onChange={(e) => update(widget.key, (e.target as HTMLInputElement).checked)}
                    class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{widget.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview / Output */}
        <div class={`space-y-4 ${activeTab === 'edit' ? 'hidden sm:block' : ''}`}>
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Generated Markdown</label>
            <button
              onClick={copyToClipboard}
              class={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                copied
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
          </div>
          <pre class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-[600px] whitespace-pre-wrap break-all">
            {markdown}
          </pre>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Copy and paste into your GitHub profile repository's README.md
          </p>
        </div>
      </div>
    </div>
  );
}
