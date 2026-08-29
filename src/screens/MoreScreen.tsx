import { useState } from 'react'
import { formatCode, useStore } from '../store'
import type { TextScale } from '../store'
import { PARKS, CITIES } from '../data/parks'
import { APP_NAME, CONTACT_EMAIL } from '../config'
import Sheet from '../ui/Sheet'
import DogAvatar from '../ui/DogAvatar'
import { isSupabaseConfigured } from '../lib/supabase'
import { signOut } from '../lib/backend'

const CATEGORIES = ['ניקיון וזבל', 'גדר / שער שבור', 'חוסר במים / ברזייה', 'תאורה', 'ציוד פגום', 'בטיחות', 'אחר']
const CONTACT_KINDS = [
  { key: 'bug', label: '🐞 תקלה / באג', subject: 'דיווח תקלה' },
  { key: 'idea', label: '💡 הצעה לשיפור', subject: 'הצעה לשיפור' },
  { key: 'partner', label: '🤝 שיתוף פעולה', subject: 'הצעת שיתוף פעולה' },
  { key: 'other', label: '💬 כללי', subject: 'פנייה כללית' },
]

export default function MoreScreen() {
  const owner = useStore((s) => s.owner)
  const dog = useStore((s) => s.dog)
  const complaints = useStore((s) => s.complaints)
  const addComplaint = useStore((s) => s.addComplaint)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const resetAll = useStore((s) => s.resetAll)

  const [showComplaint, setShowComplaint] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  // complaint form
  const [city, setCity] = useState(owner.city || CITIES[0])
  const [parkName, setParkName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const cityParks = PARKS.filter((p) => p.city === city)

  // contact form
  const [contactKind, setContactKind] = useState(CONTACT_KINDS[0].key)
  const [contactText, setContactText] = useState('')

  function submitComplaint() {
    if (!parkName || !text.trim()) return
    addComplaint({ parkName, city, category, text: text.trim() })
    setSent(true)
    setText('')
    window.setTimeout(() => { setSent(false); setShowComplaint(false) }, 1400)
  }

  function sendContact() {
    const kind = CONTACT_KINDS.find((k) => k.key === contactKind)!
    const subject = `[${APP_NAME}] ${kind.subject}`
    const body = `${contactText}\n\n— נשלח מ-${APP_NAME}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">עוד</h1>

      <div className="card flex items-center gap-3">
        <DogAvatar photo={dog.photo} size={52} />
        <div className="flex-1">
          <div className="font-bold text-park-800">{owner.name}</div>
          <div className="text-sm text-park-500">{dog.name} · {owner.city}{owner.neighborhood ? ` · ${owner.neighborhood}` : ''}</div>
          <div className="font-mono text-sm text-park-600 mt-0.5">{formatCode(owner.personalCode)}</div>
        </div>
      </div>

      {/* Contact — prominent, first */}
      <button onClick={() => setShowContact(true)} className="card w-full text-start flex items-center gap-3 active:scale-[0.99] transition"
        style={{ background: 'linear-gradient(135deg,#eafaf0,#ffffff)' }}>
        <div className="h-12 w-12 rounded-2xl grid place-items-center text-2xl shrink-0" style={{ background: 'linear-gradient(135deg,#8fd455,#2d9c3a)' }}>💬</div>
        <div className="flex-1">
          <div className="font-bold text-park-800">צור קשר · הצעות ושיתופי פעולה</div>
          <div className="text-xs text-park-500">יש בעיה, רעיון או הצעת שיתוף פעולה? נשמח לשמוע</div>
        </div>
        <span className="text-park-300 text-xl">‹</span>
      </button>

      <div className="space-y-2">
        <MenuItem emoji="📮" title="תיבת תלונות פארקים ארצית" subtitle="דווחו על בעיה — נעביר לעירייה" onClick={() => setShowComplaint(true)} />
        <MenuItem emoji="📋" title={`התלונות שלי (${complaints.length})`} subtitle="מעקב אחרי הדיווחים ששלחת" onClick={() => setShowHistory(true)} />
        <MenuItem emoji="⚙️" title="הגדרות ונגישות" subtitle="גודל טקסט, ניגודיות, הפחתת תנועה ועוד" onClick={() => setShowSettings(true)} />
      </div>

      <p className="text-center text-xs text-park-400 pt-2">{APP_NAME} · פארק כלבים חברתי · גרסה 0.1</p>

      {/* Contact sheet */}
      <Sheet open={showContact} onClose={() => setShowContact(false)} title="צור קשר">
        <div className="space-y-3">
          <p className="text-sm text-park-600">בחרו נושא וכתבו לנו — זה ייפתח באפליקציית המייל שלכם ויישלח ל-{APP_NAME}.</p>
          <div className="flex flex-wrap gap-2">
            {CONTACT_KINDS.map((k) => (
              <button key={k.key} onClick={() => setContactKind(k.key)} className={`chip border ${contactKind === k.key ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>{k.label}</button>
            ))}
          </div>
          <textarea className="w-full rounded-2xl border border-park-200 p-3 h-28 resize-none" value={contactText} onChange={(e) => setContactText(e.target.value)} placeholder="ספרו לנו…" />
          <button className="btn-primary w-full" disabled={!contactText.trim()} onClick={sendContact}>שליחה במייל</button>
          <div className="text-center text-xs text-park-400">או כתבו לנו ישירות: <span className="font-mono">{CONTACT_EMAIL}</span></div>
        </div>
      </Sheet>

      {/* Complaint sheet */}
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
                  <button key={c} onClick={() => setCategory(c)} className={`chip border text-xs ${category === c ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-park-700">פירוט</label>
              <textarea className="w-full mt-1 rounded-2xl border border-park-200 p-3 h-24 resize-none" value={text} onChange={(e) => setText(e.target.value)} placeholder="ספרו לנו מה קרה…" />
            </div>
            <button className="btn-primary w-full" disabled={!parkName || !text.trim()} onClick={submitComplaint}>שליחת דיווח</button>
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

      {/* Settings + accessibility (account deletion tucked at the very bottom) */}
      <Sheet open={showSettings} onClose={() => setShowSettings(false)} title="הגדרות ונגישות">
        <div className="space-y-5">
          <div>
            <div className="text-sm font-bold text-park-800 mb-2">♿ נגישות</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-park-600 mb-1">גודל טקסט</div>
                <div className="flex rounded-2xl bg-park-100 p-1 gap-1">
                  {([['normal', 'רגיל'], ['large', 'גדול'], ['xlarge', 'גדול מאוד']] as [TextScale, string][]).map(([v, l]) => (
                    <button key={v} onClick={() => setSettings({ textScale: v })} className={`flex-1 rounded-xl py-2 text-sm font-semibold ${settings.textScale === v ? 'bg-white text-park-700 shadow-sm' : 'text-park-500'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <ToggleRow label="ניגודיות גבוהה" desc="צבעים חזקים וקווים ברורים" on={settings.highContrast} onChange={(v) => setSettings({ highContrast: v })} />
              <ToggleRow label="הפחתת תנועה" desc="ביטול אנימציות ותנועות" on={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
            </div>
          </div>

          <div className="border-t border-park-100 pt-4">
            <div className="text-sm font-bold text-park-800 mb-1">© זכויות יוצרים ומפה</div>
            <p className="text-xs text-park-500 leading-relaxed">
              נתוני המפה: © מתנדבי OpenStreetMap, ברישיון ODbL (openstreetmap.org/copyright).
              רקע המפה המעוצב והאיורים — נוצרו על ידי {APP_NAME}. אימוג'ים באדיבות ספקי המערכת.
            </p>
          </div>

          <div className="border-t border-park-100 pt-4">
            <div className="text-xs font-semibold text-park-500 mb-2">אזור אישי</div>
            {isSupabaseConfigured && (
              <button onClick={() => { void signOut() }} className="block mb-3 text-sm text-park-600 underline underline-offset-2">
                התנתקות מהחשבון
              </button>
            )}
            <button onClick={() => { setShowSettings(false); setConfirmReset(true) }} className="text-sm text-pink-600 underline underline-offset-2">
              מחיקת חשבון ואיפוס
            </button>
          </div>
        </div>
      </Sheet>

      {/* Reset confirm */}
      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="למחוק את החשבון?">
        <p className="text-sm text-park-600 mb-4">כל הפרופיל, החברים והנתונים יימחקו מהמכשיר. אי אפשר לבטל.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => setConfirmReset(false)}>ביטול</button>
          <button className="btn bg-pink-500 text-white" onClick={() => { resetAll(); setConfirmReset(false) }}>מחיקה</button>
        </div>
      </Sheet>
    </div>
  )
}

function MenuItem({ emoji, title, subtitle, onClick }: { emoji: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card w-full text-start flex items-center gap-3 active:scale-[0.99] transition">
      <div className="h-11 w-11 rounded-2xl bg-park-100 grid place-items-center text-xl shrink-0">{emoji}</div>
      <div className="flex-1">
        <div className="font-semibold text-park-800">{title}</div>
        <div className="text-xs text-park-500">{subtitle}</div>
      </div>
      <span className="text-park-300 text-xl">‹</span>
    </button>
  )
}

function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="w-full flex items-center gap-3 text-start">
      <div className="flex-1">
        <div className="text-sm font-semibold text-park-800">{label}</div>
        <div className="text-xs text-park-500">{desc}</div>
      </div>
      <div className={`w-12 h-7 rounded-full p-1 transition-colors ${on ? 'bg-park-500' : 'bg-park-200'}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${on ? '-translate-x-5' : ''}`} />
      </div>
    </button>
  )
}
