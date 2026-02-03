
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely across different environments
const getEnvVar = (name: string): string | undefined => {
  try {
    // Try browser-shimmed process.env first
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
    // Try window.process.env (common for some bundlers/environments)
    if ((window as any).process?.env?.[name]) {
      return (window as any).process.env[name];
    }
  } catch (e) {
    console.warn(`Error accessing env var ${name}:`, e);
  }
  return undefined;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Check if we have valid-looking configuration
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

/**
 * Initialize the client with fallbacks to prevent the app from crashing.
 * If keys are missing, the UI will still render but network requests will fail with 401.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
