import { useState, useEffect } from 'preact/hooks';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: 'free' | 'pro';
  subscriptionStatus: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  user: User | null;
  isPro: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    user: null,
    isPro: false,
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Auth check failed');
        return res.json();
      })
      .then(data => {
        if (data.authenticated) {
          setState({
            loading: false,
            authenticated: true,
            user: data.user,
            isPro: data.user.plan === 'pro',
          });
        } else {
          setState({ loading: false, authenticated: false, user: null, isPro: false });
        }
      })
      .catch(() => {
        setState({ loading: false, authenticated: false, user: null, isPro: false });
      });
  }, []);

  return state;
}

export function loginWithGoogle(redirect?: string) {
  const url = redirect ? `/api/auth/google?redirect=${encodeURIComponent(redirect)}` : '/api/auth/google';
  window.location.href = url;
}

export async function startCheckout(): Promise<void> {
  const res = await fetch('/api/stripe/checkout', { method: 'POST' });
  if (!res.ok) throw new Error('Checkout request failed');
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  }
}

export async function openBillingPortal(): Promise<void> {
  const res = await fetch('/api/stripe/portal', { method: 'POST' });
  if (!res.ok) throw new Error('Billing portal request failed');
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  }
}
