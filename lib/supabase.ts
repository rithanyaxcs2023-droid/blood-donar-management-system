import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  if (typeof window !== 'undefined') {
    const candidates = [
      (import.meta.env && import.meta.env[name]),
      (import.meta.env && import.meta.env[`VITE_${name}`]),
      (import.meta.env && import.meta.env[`EXPO_PUBLIC_${name}`]),
      (window as any).process?.env?.[name],
      (window as any).process?.env?.[`VITE_${name}`],
      (window as any).process?.env?.[`EXPO_PUBLIC_${name}`],
      (window as any).import?.meta?.env?.[name],
      (window as any).import?.meta?.env?.[`VITE_${name}`],
      (window as any).import?.meta?.env?.[`EXPO_PUBLIC_${name}`]
    ];
    
    // Find first non-empty string candidate
    return candidates.find(c => typeof c === 'string' && c.length > 0);
  }
  return undefined;
};

// Map URL and KEY specifically as they might have different names in different environments
const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_KEY') || getEnvVar('KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

if (!isSupabaseConfigured) {
  console.group("🏥 HemoFlow: Database Connection Status");
  console.warn("Status: Offline (Missing Credentials)");
  console.info("Detection Log:");
  console.info("- SUPABASE_URL detected:", !!supabaseUrl);
  console.info("- SUPABASE_ANON_KEY detected:", !!supabaseAnonKey);
  console.info("Supported Prefixes: VITE_, EXPO_PUBLIC_, or direct names.");
  console.groupEnd();
}

// Fallback to avoid crashing on initialization
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);