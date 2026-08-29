// Supabase client. Reads config from Vite env vars.
//
// The app runs fine WITHOUT these set — it stays in local/demo mode (data in
// localStorage, seeded friends). The moment both vars are present it switches
// to live backend: real accounts, live presence, real friends and chat.
//
// These two values are the *public* client keys (safe to ship in the frontend;
// data is protected by Row Level Security). NEVER put the service_role key or
// the database password here.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ParkPals production project (public client keys — safe to ship; RLS protects
// the data). Env vars still override for a different environment.
const DEFAULT_URL = 'https://ipmpjgpyxhotxrfguurk.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_eYFZe46U6X_ZSUM5vZTcXQ_DuKq5OsI'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// A single shared client, or null when not configured (so the app can branch).
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes the magic-link redirect
      },
    })
  : null
