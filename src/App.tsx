import { useEffect, useState } from 'react'
import { useStore } from './store'
import { DEFAULT_LOCATION } from './data/parks'
import Onboarding from './screens/Onboarding'
import MapScreen from './screens/MapScreen'
import FriendsScreen from './screens/FriendsScreen'
import AcademyScreen from './screens/AcademyScreen'
import DogScreen from './screens/DogScreen'
import MoreScreen from './screens/MoreScreen'
import Toast from './ui/Toast'

export type Tab = 'map' | 'friends' | 'dog' | 'academy' | 'more'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: 'מפה', icon: '🗺️' },
  { id: 'friends', label: 'חברים', icon: '👥' },
  { id: 'dog', label: 'הכלב שלי', icon: '🐾' },
  { id: 'academy', label: 'אקדמיה', icon: '🎓' },
  { id: 'more', label: 'עוד', icon: '⚙️' },
]

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const shareLocation = useStore((s) => s.shareLocation)
  const userLoc = useStore((s) => s.userLoc)
  const setUserLoc = useStore((s) => s.setUserLoc)
  const [tab, setTab] = useState<Tab>('map')

  // Keep location working across sessions: once the app is entered, refresh the
  // position if sharing is on (or if we have none yet) so "nearest park" stays
  // accurate. Falls back to the default area silently if the browser declines.
  useEffect(() => {
    if (!onboarded) return
    if (!('geolocation' in navigator)) {
      if (!userLoc) setUserLoc({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng })
      return
    }
    if (shareLocation || !userLoc) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { if (!userLoc) setUserLoc({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }) },
        { timeout: 6000, maximumAge: 60000 },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarded, shareLocation])

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
