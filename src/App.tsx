import { useEffect, useRef, useState } from 'react'
import { presenceActive, useStore } from './store'
import { allParks, cityCenter, distanceKm } from './data/parks'
import { AUTO_CHECKIN_RADIUS_M } from './config'
import Onboarding from './screens/Onboarding'
import MapScreen from './screens/MapScreen'
import FriendsScreen from './screens/FriendsScreen'
import AcademyScreen from './screens/AcademyScreen'
import DogScreen from './screens/DogScreen'
import MoreScreen from './screens/MoreScreen'
import Login from './screens/Login'
import Toast from './ui/Toast'
import { isSupabaseConfigured } from './lib/supabase'
import { useSession } from './lib/useSession'
import { loadMyProfile, saveMyProfile } from './lib/backend'
import { startLiveSync, stopLiveSync } from './lib/liveSync'
import { unlockAudio } from './lib/ding'

export type Tab = 'map' | 'friends' | 'dog' | 'academy' | 'more'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: 'מפה', icon: '🗺️' },
  { id: 'friends', label: 'חברים', icon: '👥' },
  { id: 'dog', label: 'הכלב שלי', icon: '🐾' },
  { id: 'academy', label: 'אקדמיה', icon: '🎓' },
  { id: 'more', label: 'עוד', icon: '⚙️' },
]

const TEXT_SCALE: Record<string, string> = { normal: '16px', large: '18px', xlarge: '20px' }

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const shareLocation = useStore((s) => s.shareLocation)
  const userLoc = useStore((s) => s.userLoc)
  const setUserLoc = useStore((s) => s.setUserLoc)
  const settings = useStore((s) => s.settings)
  const ownerCity = useStore((s) => s.owner.city)
  const owner = useStore((s) => s.owner)
  const dog = useStore((s) => s.dog)
  const hydrateProfile = useStore((s) => s.hydrateProfile)
  const [tab, setTab] = useState<Tab>('map')

  // Unlock audio on the first touch so incoming-message chimes can play (iOS).
  useEffect(() => {
    const unlock = () => { unlockAudio() }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // Tapping a chat toast anywhere jumps to the friends tab (which opens the chat).
  const openChatFriendId = useStore((s) => s.openChatFriendId)
  useEffect(() => {
    if (openChatFriendId) setTab('friends')
  }, [openChatFriendId])

  // ---- Backend session (no-op unless Supabase is configured) ----
  const { loading: authLoading, userId } = useSession()
  const hydratedFor = useRef<string | null>(null)

  // On sign-in, load the profile from the backend as the source of truth,
  // then start live sync (friends, presence, chat). Stops on sign-out.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      stopLiveSync()
      return
    }
    if (hydratedFor.current !== userId) {
      hydratedFor.current = userId
      loadMyProfile().then((p) => {
        if (p) hydrateProfile(p.owner, p.dog, p.onboarded)
      })
    }
    void startLiveSync(userId)
    return () => stopLiveSync()
  }, [userId, hydrateProfile])

  // Once loaded, keep the backend profile in sync with local edits.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId || !onboarded) return
    if (hydratedFor.current !== userId) return // wait until first load completes
    void saveMyProfile(owner, dog)
  }, [owner, dog, onboarded, userId])

  // Apply accessibility settings to the document root.
  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = TEXT_SCALE[settings.textScale] ?? '16px'
    root.classList.toggle('a11y-contrast', settings.highContrast)
    root.classList.toggle('a11y-reduce-motion', settings.reduceMotion)
  }, [settings])

  // Keep location fresh: whenever the app opens, try real GPS (high accuracy).
  // If the browser declines, fall back to the onboarding city's center — and
  // mark it as such so the map knows not to show it as "you are here".
  useEffect(() => {
    if (!onboarded) return
    const fallback = cityCenter(ownerCity)
    if (!('geolocation' in navigator)) {
      if (!userLoc) setUserLoc(fallback, 'fallback')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps'),
      () => { if (!userLoc) setUserLoc(fallback, 'fallback') },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarded, shareLocation])

  // Refresh GPS whenever the app returns to the foreground, so the auto
  // check-in below fires the moment someone arrives at the park and opens us.
  useEffect(() => {
    if (!onboarded || !('geolocation' in navigator)) return
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps'),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
      )
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarded])

  // ---- Auto check-in ----
  // With location approved: standing within AUTO_CHECKIN_RADIUS_M of a park
  // automatically starts the 1-hour "at the park" presence — no tap needed.
  const autoCheckin = useStore((s) => s.autoCheckin)
  const myPresence = useStore((s) => s.myPresence)
  const locSource = useStore((s) => s.locSource)
  const setPresence = useStore((s) => s.setPresence)
  const showToast = useStore((s) => s.showToast)
  const pushNotification = useStore((s) => s.pushNotification)
  useEffect(() => {
    if (!onboarded || !autoCheckin || locSource !== 'gps' || !userLoc) return
    if (presenceActive(myPresence)) return // already checked in / heading
    let best: { id: string; name: string; d: number } | null = null
    for (const p of allParks()) {
      const d = distanceKm(userLoc.lat, userLoc.lng, p.lat, p.lng) * 1000
      if (!best || d < best.d) best = { id: p.id, name: p.name, d }
    }
    if (best && best.d <= AUTO_CHECKIN_RADIUS_M) {
      setPresence(best.id, 'at_park', shareLocation)
      showToast({ text: `זיהינו אותך ב${best.name} — סומנת אוטומטית לשעה 🐾`, photo: '📍' })
      pushNotification({ text: `צ'ק-אין אוטומטי: ${best.name}`, kind: 'system' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoc, locSource, onboarded, autoCheckin])

  // Backend gate: when connected, require sign-in before the app.
  if (isSupabaseConfigured) {
    if (authLoading) {
      return (
        <div className="mx-auto max-w-md h-full flex flex-col items-center justify-center bg-[var(--ground)] text-center">
          <div className="text-5xl animate-pulse">🐾</div>
        </div>
      )
    }
    if (!userId) return <Login />
  }

  if (!onboarded) return <Onboarding />

  return (
    <div className="mx-auto max-w-md h-full flex flex-col bg-[var(--ground)] relative">
      <Toast />
      <main className="flex-1 overflow-hidden relative">
        {tab === 'map' && <MapScreen />}
        {tab === 'friends' && <FriendsScreen />}
        {tab === 'dog' && <DogScreen />}
        {tab === 'academy' && <AcademyScreen />}
        {tab === 'more' && <MoreScreen />}
      </main>

      {/* Floating pill nav */}
      <nav className="shrink-0 px-3 pt-1.5 safe-bottom pointer-events-none">
        <div className="pointer-events-auto mx-auto flex items-center justify-between gap-1 rounded-[26px] bg-white/95 backdrop-blur px-1.5 py-1.5 border border-[var(--line)]"
          style={{ boxShadow: '0 8px 26px rgba(20,60,30,0.12)' }}>
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                className={`relative flex-1 flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] font-semibold transition-colors ${
                  active ? 'text-white' : 'text-park-400'
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-[20px]"
                    style={{ background: 'linear-gradient(135deg,#4fb84a,#2d9c3a)' }}
                  />
                )}
                <span className={`relative text-lg leading-none transition-transform ${active ? 'scale-110' : ''}`}>{t.icon}</span>
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
