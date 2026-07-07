import { createClient } from '@supabase/supabase-js'

/** Node scripts: service role bypasses RLS for inserts/deletes. */
export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin credentials — set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY',
    )
  }
  return createClient(url, key)
}
