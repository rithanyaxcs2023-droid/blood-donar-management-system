
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely
const env = (typeof process !== 'undefined' && process.env) ? process.env : (window as any).process?.env || {};

const supabaseUrl = (env as any).SUPABASE_URL;
const supabaseAnonKey = (env as any).SUPABASE_ANON_KEY;

// Check if we have valid-looking configuration
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));

/**
 * We initialize the client even if keys are missing using placeholders 
 * to prevent the "supabaseUrl is required" crash on startup.
 * If configured correctly, requests will work. 
 * If not, requests will fail gracefully with 401/404 instead of crashing the whole JS bundle.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
