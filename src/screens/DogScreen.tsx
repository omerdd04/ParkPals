import { useMemo } from 'react'
import { happinessLabel, happinessToday, useStore } from '../store'
import type { CareAction } from '../types'
import { useNow } from '../ui/useNow'
import DogAvatar from '../ui/DogAvatar'

const CARE: { action: CareAction; emoji: string; label: string }[] = [
  { action: 'walk', emoji: '🦮', label: 'סיבוב' },
  { action: 'play', emoji: '🎾', label: 'משחק' },
  { action: 'training', emoji: '🎓', label: 'אילוף' },
  { action: 'food', emoji: '🍖', label: 'אוכל' },
  { action: 'water', emoji: '💧', label: 'מים' },
  { action: 'treat', emoji: '🦴', label: 'חטיף' },
  { action: 'pee', emoji: '🚹', label: 'פיפי' },
  { action: 'poop', emoji: '💩', label: 'קקי' },
]

export default function DogScreen() {
  const now = useNow(30000)
  const dog = useStore((s) => s.dog)
  const log = useStore((s) => s.happinessLog)
  const logCare = useStore((s) => s.logCare)

  const score = useMemo(() => happinessToday(log, now), [log, now])
  const { mood, emoji } = happinessLabel(score)

  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const todayCounts = useMemo(() => {
    const c: Partial<Record<CareAction, number>> = {}
    for (const l of log) {
      if (l.at >= startOfDay.getTime()) c[l.action] = (c[l.action] ?? 0) + 1
    }
    return c
  }, [log, startOfDay])

  // ring geometry
  const R = 54
  const C = 2 * Math.PI * R
  const dash = (score / 100) * C

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      <h1 className="text-lg font-extrabold text-park-800">מד השמחה של {dog.name || 'הכלב שלי'}</h1>

      {/* Happiness ring */}
      <div className="card flex flex-col items-center gap-2 py-6">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#dcf2d9" strokeWidth="12" />
            <circle
              cx="70" cy="70" r={R} fill="none" stroke="#3ea033" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-5xl">{dog.photo}</div>
              <div className="text-2xl font-extrabold text-park-700 mt-1">{score}</div>
            </div>
          </div>
        </div>
        <div className="text-lg font-bold text-park-800">{emoji} {mood}</div>
        <p className="text-xs text-park-500 text-center max-w-xs">
          המד מתאפס כל בוקר. ככל שאתם מטפלים ומתעדים יותר — הכלב מאושר יותר, ואתם עולים ברמות.
        </p>
      </div>

      {/* Care actions */}
      <section>
        <h2 className="font-bold text-park-800 mb-2">מה עשיתם היום?</h2>
        <div className="grid grid-cols-4 gap-2">
          {CARE.map((c) => {
            const count = todayCounts[c.action] ?? 0
            return (
              <button
                key={c.action}
                onClick={() => logCare(c.action)}
                className={`relative rounded-2xl border p-2 flex flex-col items-center gap-1 active:scale-95 transition ${
                  count > 0 ? 'border-park-400 bg-park-50' : 'border-park-200 bg-white'
                }`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-[11px] font-semibold text-park-700">{c.label}</span>
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-park-500 text-white text-[11px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-park-400 mt-2">לחצו על כל פעולה שביצעתם. אפשר יותר מפעם ביום 🐾</p>
      </section>

      {/* Dog card */}
      <section className="card">
        <div className="flex items-center gap-3">
          <DogAvatar photo={dog.photo} size={56} />
          <div>
            <div className="font-bold text-park-800">{dog.name}</div>
            <div className="text-sm text-park-500">
              {dog.breed} · {dog.ageYears} שנים · {dog.gender === 'male' ? 'זכר' : 'נקבה'}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip bg-park-100 text-park-700">
            {dog.energy === 'energetic' ? '⚡ אנרגטי' : dog.energy === 'calm' ? '😌 רגוע' : '⚖️ מאוזן'}
          </span>
          {dog.favoriteToy && <span className="chip bg-park-100 text-park-700">🎾 {dog.favoriteToy}</span>}
          {dog.favoriteTreat && <span className="chip bg-park-100 text-park-700">🦴 {dog.favoriteTreat}</span>}
          {dog.knownExercises.map((ex) => (
            <span key={ex} className="chip bg-park-100 text-park-700">✓ {ex}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
