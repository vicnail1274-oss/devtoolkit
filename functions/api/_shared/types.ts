// Cloudflare Pages Functions environment bindings
export interface Env {
  DB: D1Database;
  NEWSLETTER_KV: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID: string;
  AI_API_KEY: string;
  AI_MODEL: string;
  JWT_SECRET: string;
  SITE_URL: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
}

// JWT payload
export interface TokenPayload {
  sub: string;        // user id
  email: string;
  plan: 'free' | 'pro';
  exp: number;
  iat: number;
}
