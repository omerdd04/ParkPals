import { useState } from 'react'
import { LESSONS, type Lesson } from '../data/academy'
import { useStore } from '../store'
import Sheet from '../ui/Sheet'
import Confetti from '../ui/Confetti'

export default function AcademyScreen() {
  const academy = useStore((s) => s.academy)
  const dog = useStore((s) => s.dog)
  const completeLesson = useStore((s) => s.completeLesson)
  const showToast = useStore((s) => s.showToast)
  const [open, setOpen] = useState<Lesson | null>(null)
  const [celebrate, setCelebrate] = useState<null | { title: string; first: boolean; all: boolean }>(null)

  const done = LESSONS.filter((l) => academy[l.id]).length

  function finishLesson(l: Lesson) {
    const wasDone = academy[l.id]
    const doneBefore = LESSONS.filter((x) => academy[x.id]).length
    completeLesson(l.id)
    if (!wasDone) {
      const first = doneBefore === 0
      const all = doneBefore + 1 === LESSONS.length
      setCelebrate({ title: l.title, first, all })
      showToast({
        text: first ? 'השיעור הראשון שלך! 🎓 +2 ⭐ · 🦴 חטיף לכלב!' : 'כל הכבוד! שיעור הושלם 🎉 +2 ⭐ נקודות יוקרה',
        photo: dog.photo,
      })
    }
  }

  function watchVideo(l: Lesson) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(l.videoQuery)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      {celebrate && <Confetti onDone={() => { /* keep card until tapped */ }} />}
      {celebrate && (
        <div className="fixed inset-0 z-[2100] grid place-items-center p-6" onClick={() => setCelebrate(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative card !p-6 text-center max-w-xs animate-pop">
            <div className="text-6xl mb-1">{celebrate.all ? '🏆' : celebrate.first ? '🎓' : '🎉'}</div>
            <div className="text-xl font-extrabold text-park-800">
              {celebrate.all ? 'סיימת את כל האקדמיה!' : celebrate.first ? 'השיעור הראשון שלך!' : 'כל הכבוד!'}
            </div>
            <div className="text-sm text-park-500 mt-1">{celebrate.title}</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="chip bg-park-100 text-park-700">⭐ +2 נקודות יוקרה</span>
              <span className="chip bg-amber-100 text-amber-700">🦴 חטיף לכלב</span>
            </div>
            <button className="btn-primary w-full mt-4" onClick={() => setCelebrate(null)}>אחלה, ממשיכים!</button>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">🎓 אקדמיה לכלב</h1>
        <p className="text-sm text-park-500">שיעורים קצרים עם וידאו — כל שיעור שמסיימים מעלה אתכם ברמות</p>
      </div>

      <div className="card !py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold text-park-700 mb-1">
            <span>ההתקדמות שלך</span>
            <span>{done}/{LESSONS.length}</span>
          </div>
          <div className="h-2.5 rounded-full bg-park-100 overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${(done / LESSONS.length) * 100}%`, background: 'linear-gradient(90deg,#8fd455,#2d9c3a)' }} />
          </div>
        </div>
        <span className="text-2xl">{done === LESSONS.length ? '🏆' : '📚'}</span>
      </div>

      <div className="space-y-3">
        {LESSONS.map((l) => {
          const completed = academy[l.id]
          return (
            <button key={l.id} onClick={() => setOpen(l)} className="card w-full text-start flex items-center gap-3 active:scale-[0.99] transition">
              <div className="h-12 w-12 rounded-2xl bg-park-100 grid place-items-center text-2xl shrink-0">{l.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-park-800 flex items-center gap-2">
                  {l.title}
                  {completed && <span className="text-park-500 text-sm">✓</span>}
                </div>
                <div className="text-xs text-park-500 line-clamp-1">{l.summary}</div>
                <div className="text-[11px] text-park-400 mt-0.5">⏱ {l.minutes} דק' · ▶️ וידאו</div>
              </div>
              <span className="text-park-300 text-xl">‹</span>
            </button>
          )
        })}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-park-500">
              <span className="text-2xl">{open.emoji}</span>
              <span>⏱ {open.minutes} דקות</span>
              {academy[open.id] && <span className="chip bg-park-100 text-park-700 text-[11px]">הושלם ✓</span>}
            </div>
            <p className="text-park-700">{open.summary}</p>

            {/* Video lesson */}
            <button onClick={() => watchVideo(open)} className="w-full rounded-2xl p-3 flex items-center gap-3 text-white active:scale-[0.99] transition" style={{ background: 'linear-gradient(135deg,#ff4d4d,#c81e1e)' }}>
              <span className="text-2xl">▶️</span>
              <div className="flex-1 text-start">
                <div className="font-bold">צפו בשיעור וידאו</div>
                <div className="text-xs opacity-90">נפתח ביוטיוב · "{open.videoQuery}"</div>
              </div>
              <span className="opacity-80">↗</span>
            </button>

            <div className="space-y-3">
              {open.steps.map((s, i) => (
                <div key={i} className="rounded-2xl bg-park-50 border border-park-100 p-3">
                  <div className="font-bold text-park-800 mb-1">{s.heading}</div>
                  <div className="text-sm text-park-700 leading-relaxed">{s.body}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
              <div className="text-xs font-bold text-amber-700 mb-0.5">💡 העיקר לזכור</div>
              <div className="text-sm text-amber-900 leading-relaxed">{open.takeaway}</div>
            </div>

            <button
              className={academy[open.id] ? 'btn-soft w-full' : 'btn-primary w-full'}
              onClick={() => { finishLesson(open); setOpen(null) }}
            >
              {academy[open.id] ? '✓ הושלם — סגור' : 'סיימתי את השיעור 🎉'}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
