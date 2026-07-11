import { useState } from 'react'
import { formatCode, useStore } from '../store'
import { PARKS, CITIES } from '../data/parks'
import Sheet from '../ui/Sheet'

const CATEGORIES = ['ניקיון וזבל', 'גדר / שער שבור', 'חוסר במים / ברזייה', 'תאורה', 'ציוד פגום', 'בטיחות', 'אחר']

export default function MoreScreen() {
  const owner = useStore((s) => s.owner)
  const dog = useStore((s) => s.dog)
  const complaints = useStore((s) => s.complaints)
  const addComplaint = useStore((s) => s.addComplaint)
  const resetAll = useStore((s) => s.resetAll)

  const [showComplaint, setShowComplaint] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const [city, setCity] = useState(owner.city || CITIES[0])
  const [parkName, setParkName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const cityParks = PARKS.filter((p) => p.city === city)

  function submit() {
    if (!parkName || !text.trim()) return
    addComplaint({ parkName, city, category, text: text.trim() })
    setSent(true)
    setText('')
    window.setTimeout(() => { setSent(false); setShowComplaint(false) }, 1400)
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      <h1 className="text-lg font-extrabold text-park-800">עוד</h1>

      {/* Profile */}
      <div className="card flex items-center gap-3">
        <div className="text-4xl">{dog.photo}</div>
        <div className="flex-1">
          <div className="font-bold text-park-800">{owner.name}</div>
          <div className="text-sm text-park-500">{dog.name} · {owner.city}{owner.neighborhood ? ` · ${owner.neighborhood}` : ''}</div>
          <div className="font-mono text-sm text-park-600 mt-0.5">{formatCode(owner.personalCode)}</div>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        <MenuItem emoji="📮" title="תיבת תלונות פארקים ארצית" subtitle="דווחו על בעיה — נעביר לעירייה" onClick={() => setShowComplaint(true)} />
        <MenuItem emoji="📋" title={`התלונות שלי (${complaints.length})`} subtitle="מעקב אחרי הדיווחים ששלחת" onClick={() => setShowHistory(true)} />
        <MenuItem emoji="🤝" title="שיתופי פעולה" subtitle="עיריות וחנויות — בקרוב" onClick={() => {}} muted />
        <MenuItem emoji="↺" title="איפוס האפליקציה" subtitle="מחיקת הפרופיל והתחלה מחדש" onClick={() => setConfirmReset(true)} />
      </div>

      <p className="text-center text-xs text-park-400 pt-2">Onyx · פארק כלבים חברתי · גרסה 0.1</p>

      {/* Complaint form */}
      <Sheet open={showComplaint} onClose={() => setShowComplaint(false)} title="תיבת תלונות פארקים">
        {sent ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-5xl">✅</div>
            <div className="font-bold text-park-800">התלונה נשלחה</div>
            <p className="text-sm text-park-500">נעשה כמיטב יכולתנו לעזור לפארק הזה להשתפר 🙏</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-park-600">הדיווח נאסף ומועבר לרשות המקומית ולמאגר הארצי לשיפור הפארקים.</p>
            <div>
              <label className="text-xs font-semibold text-park-700">עיר</label>
              <select className="w-full mt-1 rounded-2xl border border-park-200 p-3" value={city} onChange={(e) => { setCity(e.target.value); setParkName('') }}>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-park-700">פארק</label>
              <select className="w-full mt-1 rounded-2xl border border-park-200 p-3" value={parkName} onChange={(e) => setParkName(e.target.value)}>
                <option value="">בחרו פארק…</option>
                {cityParks.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-park-700">סוג הבעיה</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`chip border text-xs ${category === c ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-park-700">פירוט</label>
              <textarea
                className="w-full mt-1 rounded-2xl border border-park-200 p-3 h-24 resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ספרו לנו מה קרה…"
              />
            </div>
            <button className="btn-primary w-full" disabled={!parkName || !text.trim()} onClick={submit}>
              שליחת דיווח
            </button>
          </div>
        )}
      </Sheet>

      {/* History */}
      <Sheet open={showHistory} onClose={() => setShowHistory(false)} title="התלונות שלי">
        {complaints.length === 0 ? (
          <p className="text-center text-park-400 py-6 text-sm">עוד לא שלחת תלונות 🐾</p>
        ) : (
          <div className="space-y-2">
            {complaints.map((c) => (
              <div key={c.id} className="rounded-2xl border border-park-100 p-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-park-800 text-sm">{c.parkName}</div>
                  <span className="chip bg-park-100 text-park-700 text-[11px]">{c.category}</span>
                </div>
                <div className="text-xs text-park-500">{c.city}</div>
                <div className="text-sm text-park-700 mt-1">{c.text}</div>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      {/* Reset confirm */}
      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="לאפס את האפליקציה?">
        <p className="text-sm text-park-600 mb-4">כל הפרופיל, החברים והנתונים יימחקו מהמכשיר. אי אפשר לבטל.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => setConfirmReset(false)}>ביטול</button>
          <button className="btn bg-pink-500 text-white" onClick={() => { resetAll(); setConfirmReset(false) }}>איפוס</button>
        </div>
      </Sheet>
    </div>
  )
}

function MenuItem({
  emoji, title, subtitle, onClick, muted,
}: {
  emoji: string; title: string; subtitle: string; onClick: () => void; muted?: boolean
}) {
  return (
    <button onClick={onClick} className={`card w-full text-start flex items-center gap-3 active:scale-[0.99] transition ${muted ? 'opacity-60' : ''}`}>
      <div className="h-11 w-11 rounded-2xl bg-park-100 grid place-items-center text-xl shrink-0">{emoji}</div>
      <div className="flex-1">
        <div className="font-semibold text-park-800">{title}</div>
        <div className="text-xs text-park-500">{subtitle}</div>
      </div>
      <span className="text-park-300 text-xl">‹</span>
    </button>
  )
}
