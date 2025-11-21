// Environment variables validation utility
// Based on REVIEW.md Section 3: ENV и секреты

interface EnvConfig {
  OPENAI_API_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export function validateApiEnv(): EnvConfig {
  const config: EnvConfig = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const missing: string[] = [];

  if (!config.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY');
  }

  if (!config.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please check your .env.local file against .env.example'
    );
  }

  return config;
}

export function validateOpenAI(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required for this API route. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error(
      'Invalid OPENAI_API_KEY format. API key should start with "sk-"'
    );
  }

  return apiKey;
}