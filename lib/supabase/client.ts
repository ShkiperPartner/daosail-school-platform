import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser components.
 * This is the primary way to interact with Supabase from the client-side.
 */
export function createClient() {
  // Получаем переменные окружения, которые мы добавили в .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Создаем и возвращаем клиент Supabase, который может работать в браузере.
  // Восклицательные знаки (!) говорят TypeScript, что мы уверены,
  // что эти переменные точно существуют.
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
