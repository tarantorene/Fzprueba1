import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Gets the singleton Supabase client instance.
 * Checks for credentials and returns null if not configured,
 * preventing any crash on application startup.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // @ts-ignore
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // @ts-ignore
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Gracefully handle missing configuration
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://your-project-id.supabase.co' || 
      supabaseAnonKey === 'your-anon-key-here') {
    return null;
  }

  // Normalize/Sanitize the Supabase URL
  let formattedUrl = supabaseUrl.trim();
  
  // If it's just a project reference ID (no dots, no slashes, e.g., "pcfcafafihtsummdraip")
  if (!formattedUrl.includes('.') && !formattedUrl.includes('/')) {
    formattedUrl = `https://${formattedUrl}.supabase.co`;
  } else if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Trim trailing slash
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }

  try {
    supabaseClientInstance = createClient(formattedUrl, supabaseAnonKey.trim());
    return supabaseClientInstance;
  } catch (error) {
    console.warn('Error al inicializar el cliente de Supabase:', error);
    return null;
  }
}

let supabaseSyncEnabled = true;

/**
 * Checks if Supabase connection credentials are correctly set up and synchronization is enabled.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null && supabaseSyncEnabled;
}

/**
 * Dynamically enables or disables Supabase synchronization (e.g. in case of connection or schema issues).
 */
export function setSupabaseSyncEnabled(enabled: boolean): void {
  supabaseSyncEnabled = enabled;
}
