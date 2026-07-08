import { useState } from 'react'
import { useStore } from './store'
import Onboarding from './screens/Onboarding'
import MapScreen from './screens/MapScreen'
import FriendsScreen from './screens/FriendsScreen'
import AcademyScreen from './screens/AcademyScreen'
import DogScreen from './screens/DogScreen'
import MoreScreen from './screens/MoreScreen'

export type Tab = 'map' | 'friends' | 'dog' | 'academy' | 'more'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: 'מפה', icon: '🗺️' },
  { id: 'friends', label: 'חברים', icon: '👥' },
  { id: 'dog', label: 'הכלב שלי', icon: '🐾' },
  { id: 'academy', label: 'אקדמיה', icon: '🎓' },
  { id: 'more', label: 'עוד', icon: '⋯' },
]

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const [tab, setTab] = useState<Tab>('map')

  if (!onboarded) return <Onboarding />

  return (
    <div className="mx-auto max-w-md h-full flex flex-col bg-park-50 relative">
      <main className="flex-1 overflow-hidden relative">
        {tab === 'map' && <MapScreen />}
        {tab === 'friends' && <FriendsScreen />}
        {tab === 'dog' && <DogScreen />}
        {tab === 'academy' && <AcademyScreen />}
        {tab === 'more' && <MoreScreen />}
      </main>

      <nav className="shrink-0 bg-white border-t border-park-100 safe-bottom">
        <div className="flex">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-park-600' : 'text-park-400'
                }`}
              >
                <span className={`text-xl transition ${active ? 'scale-110' : ''}`}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
