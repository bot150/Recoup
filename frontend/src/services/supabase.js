import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Check if Supabase environment variables are properly configured
 */
export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl && 
    supabaseUrl !== 'YOUR_SUPABASE_URL' &&
    supabasePublishableKey &&
    supabasePublishableKey !== 'YOUR_SUPABASE_PUBLISHABLE_KEY'
  );
}

// Safely create Supabase Client instance
let client = null;

if (isSupabaseConfigured()) {
  try {
    client = createClient(supabaseUrl, supabasePublishableKey);
  } catch (err) {
    console.error('[Recoup Auth Error] Failed to initialize Supabase client:', err);
  }
} else {
  console.warn('[Recoup Auth Notice] Supabase environment variables are missing in frontend/.env.local');
}

export const supabase = client;
