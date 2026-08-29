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

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

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
