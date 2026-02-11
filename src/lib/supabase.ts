import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Public client (respects RLS)
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Server-side client with service role key (bypasses RLS)
export const supabaseAdmin: SupabaseClient = (isSupabaseConfigured && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase

// Helper: wraps a Supabase query and returns null + error on failure
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>
): Promise<{ data: T | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.' }
  }
  try {
    const { data, error } = await queryFn()
    if (error) {
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown database error' }
  }
}