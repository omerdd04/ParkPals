import { useState } from 'react'
import { LESSONS, type Lesson } from '../data/academy'
import { useStore } from '../store'
import Sheet from '../ui/Sheet'

export default function AcademyScreen() {
  const academy = useStore((s) => s.academy)
  const completeLesson = useStore((s) => s.completeLesson)
  const [open, setOpen] = useState<Lesson | null>(null)

  const done = LESSONS.filter((l) => academy[l.id]).length

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      <div>
        <h1 className="text-lg font-extrabold text-park-800">🎓 אקדמיה לכלב</h1>
        <p className="text-sm text-park-500">5 שיעורים קצרים שיהפכו אתכם לבעלים טובים יותר</p>
      </div>

      {/* Progress */}
      <div className="card !py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold text-park-700 mb-1">
            <span>ההתקדמות שלך</span>
            <span>{done}/{LESSONS.length}</span>
          </div>
          <div className="h-2.5 rounded-full bg-park-100 overflow-hidden">
            <div className="h-full bg-park-500 transition-all" style={{ width: `${(done / LESSONS.length) * 100}%` }} />
          </div>
        </div>
        <span className="text-2xl">{done === LESSONS.length ? '🏆' : '📚'}</span>
      </div>

      <div className="space-y-3">
        {LESSONS.map((l) => {
          const completed = academy[l.id]
          return (
            <button
              key={l.id}
              onClick={() => setOpen(l)}
              className="card w-full text-start flex items-center gap-3 active:scale-[0.99] transition"
            >
              <div className="h-12 w-12 rounded-2xl bg-park-100 grid place-items-center text-2xl shrink-0">
                {l.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-park-800 flex items-center gap-2">
                  {l.title}
                  {completed && <span className="text-park-500 text-sm">✓</span>}
                </div>
                <div className="text-xs text-park-500 line-clamp-1">{l.summary}</div>
                <div className="text-[11px] text-park-400 mt-0.5">⏱ {l.minutes} דקות</div>
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
            </div>
            <p className="text-park-700">{open.summary}</p>
            <div className="space-y-3">
              {open.steps.map((s, i) => (
                <div key={i} className="rounded-2xl bg-park-50 border border-park-100 p-3">
                  <div className="font-bold text-park-800 mb-1">{s.heading}</div>
                  <div className="text-sm text-park-700 leading-relaxed">{s.body}</div>
                </div>
              ))}
            </div>
            <button
              className={academy[open.id] ? 'btn-soft w-full' : 'btn-primary w-full'}
              onClick={() => { completeLesson(open.id); setOpen(null) }}
            >
              {academy[open.id] ? '✓ הושלם — סגור' : 'סיימתי את השיעור'}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
