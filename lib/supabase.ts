
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  if (typeof window !== 'undefined') {
    // Check various common locations for injected env vars
    return (window as any).process?.env?.[name] || (window as any).import?.meta?.env?.[name];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

// Fallback to avoid crashing on initialization
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
