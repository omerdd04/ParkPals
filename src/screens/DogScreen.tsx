import { useEffect, useMemo, useRef, useState } from 'react'
import {
  happinessAverage, happinessLabel, happinessToday, levelFor, useStore,
} from '../store'
import { TRICKS, TRICK_TIERS, trickPoints } from '../data/tricks'
import { FRAMES, frameForPoints, frameIndexForPoints, nextFrame, prestigePoints } from '../data/frames'
import type { CareAction } from '../types'
import { useNow } from '../ui/useNow'
import FramedAvatar from '../ui/FramedAvatar'
import Confetti from '../ui/Confetti'
import Sheet from '../ui/Sheet'

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
  const academy = useStore((s) => s.academy)
  const logCare = useStore((s) => s.logCare)

  const showToast = useStore((s) => s.showToast)
  const score = useMemo(() => happinessToday(log, now), [log, now])
  const avg = useMemo(() => happinessAverage(log, now), [log, now])
  const { mood, emoji } = happinessLabel(score)
  const lessonsDone = Object.values(academy).filter(Boolean).length
  const level = useMemo(() => levelFor(dog.tricks, lessonsDone), [dog.tricks, lessonsDone])

  // Prestige frame (collectible ladder friends can see).
  const prestige = useMemo(
    () => prestigePoints(trickPoints(dog.tricks), lessonsDone, avg),
    [dog.tricks, lessonsDone, avg],
  )
  const frame = frameForPoints(prestige)
  const next = nextFrame(prestige)
  const [showFrames, setShowFrames] = useState(false)

  const [confetti, setConfetti] = useState(false)
  const prevScore = useRef(score)
  const prevFrame = useRef(frameIndexForPoints(prestige))

  // Confetti when the dog crosses into "happy" (>=85).
  useEffect(() => {
    if (prevScore.current < 85 && score >= 85) setConfetti(true)
    prevScore.current = score
  }, [score])

  // Celebrate unlocking a new prestige frame.
  useEffect(() => {
    const idx = frameIndexForPoints(prestige)
    if (idx > prevFrame.current) {
      setConfetti(true)
      showToast({ text: `פתחת מסגרת ${FRAMES[idx].name}! ${FRAMES[idx].emoji}`, photo: dog.photo })
    }
    prevFrame.current = idx
  }, [prestige, showToast, dog.photo])

  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const todayCounts = useMemo(() => {
    const c: Partial<Record<CareAction, number>> = {}
    for (const l of log) if (l.at >= startOfDay.getTime()) c[l.action] = (c[l.action] ?? 0) + 1
    return c
  }, [log, startOfDay])

  const R = 54
  const C = 2 * Math.PI * R
  const dash = (score / 100) * C

  const tricksByTier = useMemo(() => {
    const m: Record<string, number> = {}
    for (const id of dog.tricks) {
      const t = TRICKS.find((x) => x.id === id)
      if (t) m[t.tier] = (m[t.tier] ?? 0) + 1
    }
    return m
  }, [dog.tricks])

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      {confetti && <Confetti onDone={() => setConfetti(false)} />}
      <h1 className="text-lg font-extrabold text-park-800">מד השמחה של {dog.name || 'הכלב שלי'}</h1>

      {/* Happiness ring */}
      <div className="card flex flex-col items-center gap-2 py-6">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#dcf2d9" strokeWidth="12" />
            <circle cx="70" cy="70" r={R} fill="none" stroke="#3ea033" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${C}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center">
              <FramedAvatar photo={dog.photo} frame={frame} size={62} />
              <div className="text-2xl font-extrabold text-park-700 mt-1">{score}</div>
            </div>
          </div>
        </div>
        <div className="text-lg font-bold text-park-800">{emoji} {mood}</div>
        <span className="text-sm text-park-600">ממוצע שבועי: <b className="text-park-800">{avg}</b></span>

        {/* Prestige frame — the collectible players want to climb */}
        <button onClick={() => setShowFrames(true)} className="w-full mt-1 rounded-2xl border border-park-100 bg-park-50 p-3 flex items-center gap-3 active:scale-[0.99] transition">
          <FramedAvatar photo={dog.photo} frame={frame} size={40} pad={2.5} />
          <div className="flex-1 text-start">
            <div className="text-sm font-bold text-park-800">מסגרת {frame.name} {frame.emoji}</div>
            <div className="text-xs text-park-500">
              {next ? `עוד ${next.min - prestige} נק' למסגרת ${next.name} ${next.emoji}` : 'המסגרת הכי יוקרתית — כל הכבוד! 🏆'}
            </div>
          </div>
          <span className="text-park-400 text-xs font-semibold">איך משיגים?</span>
        </button>
      </div>

      {/* Level / owner progress */}
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-park-500">הרמה שלך</div>
            <div className="text-lg font-extrabold text-park-800">רמה {level.level} · {level.title}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl grid place-items-center text-2xl" style={{ background: level.color + '22' }}>
            {level.level >= 4 ? '💎' : '⭐'}
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-park-100 overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${level.nextAt ? Math.min(100, (level.points / level.nextAt) * 100) : 100}%`, background: level.color }} />
        </div>
        <div className="mt-1 text-xs text-park-500">
          {level.nextAt ? `${level.points}/${level.nextAt} נק' לרמה הבאה` : 'הגעת לרמה המקסימלית! 🏆'}
          {' · '}לומדים תרגילים חדשים כדי לעלות
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRICK_TIERS.map((t) => (
            <span key={t.tier} className="chip bg-park-100 text-park-700 text-xs">
              {t.emoji} {t.title}: {tricksByTier[t.tier] ?? 0}
            </span>
          ))}
        </div>
      </section>

      {/* Care actions */}
      <section>
        <h2 className="font-bold text-park-800 mb-2">מה עשיתם היום?</h2>
        <div className="grid grid-cols-4 gap-2">
          {CARE.map((c) => {
            const count = todayCounts[c.action] ?? 0
            return (
              <button key={c.action} onClick={() => logCare(c.action)} className={`relative rounded-2xl border p-2 flex flex-col items-center gap-1 active:scale-95 transition ${count > 0 ? 'border-park-400 bg-park-50' : 'border-park-200 bg-white'}`}>
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-[11px] font-semibold text-park-700">{c.label}</span>
                {count > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-park-500 text-white text-[11px] font-bold">{count}</span>}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-park-400 mt-2">לחצו על כל פעולה שביצעתם. אפשר יותר מפעם ביום 🐾</p>
      </section>

      {/* Dog card */}
      <section className="card">
        <div className="flex items-center gap-3">
          <FramedAvatar photo={dog.photo} frame={frame} size={50} />
          <div>
            <div className="font-bold text-park-800">{dog.name}</div>
            <div className="text-sm text-park-500">{dog.breed} · {dog.ageYears} שנים · {dog.gender === 'male' ? 'זכר' : 'נקבה'}</div>
          </div>
        </div>
        <ProfileChips title="🎭 אופי" items={dog.traits} />
        <ProfileChips title="🥩 חטיפים" items={dog.treats} />
        <ProfileChips title="🧸 צעצועים" items={dog.toys} />
        <ProfileChips title="💚 אוהב" items={dog.favorites} />
      </section>

      {/* Frame ladder explanation */}
      <Sheet open={showFrames} onClose={() => setShowFrames(false)} title="מסגרות הכלב 🖼️">
        <p className="text-sm text-park-600 mb-4">
          המסגרת עוטפת את תמונת הכלב שלך — <b>וכולם רואים אותה</b> בפארק וברשימת החברים.
          זה חלק מהמשחק: ככל שתלמדו תרגילים, תסיימו שיעורים באקדמיה ותשמרו על כלב מאושר,
          תעלו בסולם המסגרות עד היהלום 💎.
        </p>
        <div className="space-y-2">
          {FRAMES.map((f) => {
            const reached = prestige >= f.min
            const current = frame.id === f.id
            return (
              <div key={f.id} className={`flex items-center gap-3 rounded-2xl p-2.5 border ${current ? 'border-park-400 bg-park-50' : 'border-park-100'}`}>
                <FramedAvatar photo={reached ? dog.photo : '🐾'} frame={f} size={38} pad={2.5} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-park-800">מסגרת {f.name} {f.emoji}</div>
                  <div className="text-xs text-park-500">{f.min === 0 ? 'מסגרת התחלה' : `${f.min} נקודות יוקרה`}</div>
                </div>
                {current ? <span className="chip bg-park-500 text-white text-[11px]">שלך עכשיו</span>
                  : reached ? <span className="text-park-500 text-sm">✓</span>
                  : <span className="text-park-300 text-lg">🔒</span>}
              </div>
            )
          })}
        </div>
        <div className="mt-4 rounded-2xl bg-park-50 border border-park-100 p-3 text-xs text-park-600">
          יש לך כרגע <b className="text-park-800">{prestige}</b> נקודות יוקרה — מכל תרגיל, שיעור וסיבוב מאושר 🐾
        </div>
      </Sheet>
    </div>
  )
}

function ProfileChips({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold text-park-500 mb-1">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => <span key={i} className="chip bg-park-100 text-park-700 text-xs">{i}</span>)}
      </div>
    </div>
  )
}
