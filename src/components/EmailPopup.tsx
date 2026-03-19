import { useState, useEffect, useCallback } from 'preact/hooks';

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const show = useCallback(() => {
    if (localStorage.getItem('newsletter_subscribed') || localStorage.getItem('popup_dismissed')) return;
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem('popup_dismissed', Date.now().toString());
  }, []);

  useEffect(() => {
    // Don't show if already subscribed or dismissed recently
    if (localStorage.getItem('newsletter_subscribed')) return;
    const dismissed = localStorage.getItem('popup_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 86400000) return; // 24h cooldown

    // Exit-intent: mouse leaves viewport top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };

    // Scroll trigger: 60% of page scrolled
    const handleScroll = () => {
      const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct > 0.5) show();
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [show]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        localStorage.setItem('newsletter_subscribed', '1');
        setStatus('done');
        setTimeout(() => setVisible(false), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      // Fallback local storage
      const q = JSON.parse(localStorage.getItem('newsletter_queue') || '[]');
      q.push({ email: email.trim(), ts: Date.now() });
      localStorage.setItem('newsletter_queue', JSON.stringify(q));
      localStorage.setItem('newsletter_subscribed', '1');
      setStatus('done');
      setTimeout(() => setVisible(false), 2000);
    }
  };

  if (!visible) return null;

  return (
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={dismiss}>
      <div
        class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === 'done' ? (
          <div class="text-center py-4">
            <div class="text-4xl mb-3">&#127881;</div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're in!</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm">Welcome to the DevToolkit community.</p>
          </div>
        ) : (
          <>
            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Free Developer Cheatsheet Pack
              </h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                Subscribe and get our curated cheatsheet collection (Git, Docker, Regex, SQL & more) plus weekly dev tips and new tool launches.
              </p>
            </div>
            <form onSubmit={handleSubmit} class="space-y-3">
              <input
                type="email"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="you@example.com"
                required
                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200 disabled:opacity-60"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe — It\'s Free'}
              </button>
              {status === 'error' && (
                <p class="text-red-500 text-xs text-center">Something went wrong. Please try again.</p>
              )}
            </form>
            <p class="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
              Join 500+ developers. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
