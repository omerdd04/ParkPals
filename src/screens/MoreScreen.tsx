import { useEffect, useState } from 'react'
import { formatCode, useStore } from '../store'
import type { TextScale } from '../store'
import { allParks, CITIES } from '../data/parks'
import { APP_NAME, CONTACT_EMAIL, ADMIN_EMAILS } from '../config'
import Sheet from '../ui/Sheet'
import DogAvatar from '../ui/DogAvatar'
import { isSupabaseConfigured } from '../lib/supabase'
import { signOut, currentUserEmail, addPark } from '../lib/backend'
import { refreshParks } from '../lib/liveSync'

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
  const autoCheckin = useStore((s) => s.autoCheckin)
  const setAutoCheckin = useStore((s) => s.setAutoCheckin)
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
  const cityParks = allParks().filter((p) => p.city === city)

  // contact form
  const [contactKind, setContactKind] = useState(CONTACT_KINDS[0].key)
  const [contactText, setContactText] = useState('')

  // admin: add park
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddPark, setShowAddPark] = useState(false)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    currentUserEmail().then((email) => {
      if (email && ADMIN_EMAILS.includes(email.toLowerCase())) setIsAdmin(true)
    })
  }, [])

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
        {isAdmin && (
          <MenuItem emoji="🛠️" title="הוספת פארק (מנהל)" subtitle="הוספת פארק חדש למפה הארצית" onClick={() => setShowAddPark(true)} />
        )}
      </div>

      {isAdmin && <AddParkSheet open={showAddPark} onClose={() => setShowAddPark(false)} />}

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
              <ToggleRow label="צ'ק-אין אוטומטי בפארק 📍" desc="כשמגיעים לפארק — סימון 'אני בפארק' לשעה, בלי לחיצה" on={autoCheckin} onChange={setAutoCheckin} />
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

// ---- Admin: add a park to the national map ----
function AddParkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const showToast = useStore((s) => s.showToast)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [coords, setCoords] = useState('') // "31.7905, 34.6455" — paste from Google Maps
  const [fenced, setFenced] = useState(true)
  const [hasWater, setHasWater] = useState(false)
  const [shade, setShade] = useState(false)
  const [lighting, setLighting] = useState(false)
  const [benches, setBenches] = useState(false)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Lenient coordinate parsing. Accepts, in order of priority:
  //   1. DMS as copied from Google Maps: 31°48'33.4"N 34°38'25.7"E
  //   2. Decimal: "31.79, 34.64" / "31.79812° N, 34.63955° E" / a maps link
  function parseCoords(input: string): { lat: number; lng: number } | null {
    const dms = [...input.matchAll(/(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([NSEW])?/gi)]
    if (dms.length >= 2) {
      const toDec = (m: RegExpMatchArray) => {
        const v = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600
        return /[SW]/i.test(m[4] ?? '') ? -v : v
      }
      const a = toDec(dms[0])
      const b = toDec(dms[1])
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b }
    }
    const nums = (input.match(/-?\d{1,3}\.\d+/g) ?? []).map(Number)
    for (let i = 0; i + 1 < nums.length; i++) {
      const [a, b] = [nums[i], nums[i + 1]]
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180 && Math.abs(a) > 1 && Math.abs(b) > 1) return { lat: a, lng: b }
    }
    return null
  }
  const parsed = parseCoords(coords)
  const lat = parsed?.lat ?? null
  const lng = parsed?.lng ?? null
  const nameOk = name.trim().length >= 2
  const cityOk = city.trim().length >= 2
  const valid = nameOk && cityOk && lat !== null && lng !== null
  const missing = !nameOk ? 'חסר שם פארק' : !cityOk ? 'חסרה עיר' : lat === null ? 'המיקום לא זוהה — הדביקו למשל: 31.79812, 34.63955' : ''

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setErr('אין גישה למיקום במכשיר הזה'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setErr('לא הצלחנו לקבל מיקום — אפשר להדביק ידנית מגוגל מפות'),
      { timeout: 8000 },
    )
  }

  async function submit() {
    if (!valid || busy) return
    setBusy(true)
    setErr('')
    const res = await addPark({
      name: name.trim(), city: city.trim(), area: area.trim() || undefined,
      lat: lat!, lng: lng!, fenced, hasWater, size, shade, lighting, benches,
    })
    setBusy(false)
    if (res.ok) {
      showToast({ text: res.message, photo: '🎉' })
      setName(''); setArea(''); setCoords('')
      void refreshParks()
      onClose()
    } else {
      setErr(res.message)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="הוספת פארק למפה 🛠️">
      <div className="space-y-3">
        <input className="w-full rounded-2xl border border-park-200 p-3" placeholder="שם הפארק (למשל: גינת כלבים הדקל)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input className="rounded-2xl border border-park-200 p-3" placeholder="עיר" value={city} onChange={(e) => setCity(e.target.value)} />
          <input className="rounded-2xl border border-park-200 p-3" placeholder="שכונה (לא חובה)" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div>
          <div className="flex gap-2">
            <input dir="ltr" className="flex-1 rounded-2xl border border-park-200 p-3 font-mono text-sm" placeholder="31.7905, 34.6455" value={coords} onChange={(e) => setCoords(e.target.value)} />
            <button onClick={useMyLocation} className="rounded-2xl bg-park-100 px-3 text-sm font-semibold text-park-700">📍 אני כאן</button>
          </div>
          <p className="mt-1 text-[11px] text-park-400">
            טיפ: בגוגל מפות לחיצה ארוכה על הפארק ← ולחיצה על המספרים מעתיקה אותם. הדביקו כאן.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFenced(!fenced)} className={`chip border ${fenced ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>🚧 מגודר</button>
          <button onClick={() => setHasWater(!hasWater)} className={`chip border ${hasWater ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>💧 ברזייה</button>
          <button onClick={() => setShade(!shade)} className={`chip border ${shade ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>🌳 צל</button>
          <button onClick={() => setLighting(!lighting)} className={`chip border ${lighting ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>💡 תאורה</button>
          <button onClick={() => setBenches(!benches)} className={`chip border ${benches ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>🪑 ספסלים</button>
          {(['small', 'medium', 'large'] as const).map((s) => (
            <button key={s} onClick={() => setSize(s)} className={`chip border ${size === s ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>
              {s === 'small' ? 'קטן' : s === 'medium' ? 'בינוני' : 'גדול'}
            </button>
          ))}
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        {!valid && !err && coords.trim().length + name.trim().length > 0 && (
          <p className="text-xs text-amber-600">{missing}</p>
        )}
        <button className="btn-primary w-full" disabled={!valid || busy} onClick={submit}>
          {busy ? 'מוסיף…' : 'הוספה למפה הארצית'}
        </button>
      </div>
    </Sheet>
  )
}
