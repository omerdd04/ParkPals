// Tracks the Supabase auth session in React. Returns:
//   loading — still checking on first mount
//   userId  — the signed-in user's id, or null
// When Supabase isn't configured, loading is false and userId is null forever
// (the app then runs in local/demo mode).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useSession(): { loading: boolean; userId: string | null } {
  const [loading, setLoading] = useState(Boolean(supabase))
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUserId(data.session?.user.id ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { loading, userId }
}
