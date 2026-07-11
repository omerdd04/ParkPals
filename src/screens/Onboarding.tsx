import { useRef, useState } from 'react'
import { useStore, genPersonalCode } from '../store'
import { DEFAULT_LOCATION } from '../data/parks'
import { TRICKS, TRICK_TIERS } from '../data/tricks'
import { TREAT_GROUPS, TOY_GROUPS, FAVORITE_GROUPS, TRAIT_GROUPS } from '../data/profileOptions'
import type { DogEnergy, DogSize } from '../types'
import ChipPicker from '../ui/ChipPicker'
import BreedPicker from '../ui/BreedPicker'
import DogAvatar from '../ui/DogAvatar'
import Sheet from '../ui/Sheet'

const DOG_AVATARS = ['🐕', '🐩', '🐕‍🦺', '🦮', '🐶']

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const setUserLoc = useStore((s) => s.setUserLoc)
  const setShareLocation = useStore((s) => s.setShareLocation)
  const [step, setStep] = useState(0)
  const [locSheet, setLocSheet] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // owner
  const [ownerName, setOwnerName] = useState('')
  const [city, setCity] = useState('אשדוד')
  const [neighborhood, setNeighborhood] = useState('')

  // dog
  const [dogName, setDogName] = useState('')
  const [photo, setPhoto] = useState('🐕')
  const [breed, setBreed] = useState('')
  const [ageYears, setAgeYears] = useState(2)
  const [size, setSize] = useState<DogSize>('medium')
  const [energy, setEnergy] = useState<DogEnergy>('balanced')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [neutered, setNeutered] = useState(false)
  const [tricks, setTricks] = useState<string[]>([])
  const [treats, setTreats] = useState<string[]>([])
  const [toys, setToys] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [traits, setTraits] = useState<string[]>([])

  const totalSteps = 6
  const canNext = () => {
    if (step === 1) return !!ownerName.trim()
    if (step === 2) return !!dogName.trim() && !!breed
    return true
  }

  function toggle(list: string[], set: (v: string[]) => void, v: string, max?: number) {
    if (list.includes(v)) set(list.filter((x) => x !== v))
    else if (!max || list.length < max) set([...list, v])
  }

  const hasRealPhoto = photo.startsWith('data:')

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    // Downscale to a small square before storing: keeps localStorage tiny, strips
    // the original file, and normalizes to a clean JPEG data-URI.
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const S = 320
        const canvas = document.createElement('canvas')
        canvas.width = S
        canvas.height = S
        const ctx = canvas.getContext('2d')
        if (!ctx) { setPhoto(String(reader.result)); return }
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, S, S)
        setPhoto(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => {}
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function requestLocation(share: boolean) {
    const finish = (loc: { lat: number; lng: number }) => {
      setUserLoc(loc)
      setShareLocation(share)
      setLocSheet(false)
      setStep(3)
    }
    if (share && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => finish({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }),
        { timeout: 6000 },
      )
    } else {
      finish({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng })
    }
  }

  function next() {
    // After the dog basics step, ask for location before continuing.
    if (step === 2) { setLocSheet(true); return }
    setStep((s) => s + 1)
  }

  function finish() {
    completeOnboarding(
      { name: ownerName.trim(), city, neighborhood: neighborhood.trim(), personalCode: genPersonalCode() },
      {
        name: dogName.trim(), breed: breed || 'מעורב', ageYears, size, energy, gender, neutered,
        photo, tricks, treats, toys, favorites, traits,
      },
    )
  }

  return (
    <div className="mx-auto max-w-md h-full flex flex-col bg-gradient-to-b from-park-100 to-park-50">
      <div className="px-6 pt-8 pb-3">
        <div className="flex items-center gap-2 text-park-700">
          <span className="text-3xl">🐾</span>
          <span className="text-2xl font-extrabold">Dog parks</span>
        </div>
        {step > 0 && (
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-park-500' : 'bg-park-200'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-4">
        {step === 0 && (
          <div className="h-full flex flex-col justify-center text-center gap-4">
            <div className="text-6xl">🗺️🐕</div>
            <h1 className="text-2xl font-extrabold text-park-800">ברוכים הבאים ל-Dog parks</h1>
            <p className="text-park-700 leading-relaxed">
              מוצאים פארקי כלבים לידכם, רואים איזה חברים בפארק עכשיו, מתאמים סיבובים
              בלחיצה אחת, ולומדים איך לגרום לכלב שלכם לחיות טוב יותר.
            </p>
            <p className="text-sm text-park-500">שאלון קצר ונכנסים 🐾</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">קצת עליך</h2>
            <Field label="איך קוראים לך?">
              <input className="inp" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="השם שלך" />
            </Field>
            <Field label="עיר">
              <input className="inp" value={city} onChange={(e) => setCity(e.target.value)} placeholder="למשל: אשדוד" />
            </Field>
            <Field label="שכונה (לא חובה)">
              <input className="inp" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="למשל: רובע ד'" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">הכירו לנו את הכלב</h2>

            {/* Photo — push a real gallery photo */}
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="relative" aria-label="העלאת תמונת הכלב">
                {hasRealPhoto ? (
                  <DogAvatar photo={photo} size={104} ringColor="#2d9c3a" />
                ) : (
                  <div className="w-[104px] h-[104px] rounded-full grid place-items-center border-2 border-dashed border-park-300 bg-park-50">
                    <div className="text-center">
                      <div className="text-3xl">📷</div>
                      <div className="text-[10px] font-semibold text-park-600 mt-0.5">הוסף תמונה</div>
                    </div>
                  </div>
                )}
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-full grid place-items-center text-white text-sm shadow-md" style={{ background: 'linear-gradient(135deg,#4fb84a,#2d9c3a)' }}>＋</span>
              </button>
              <button className="btn-primary !py-2 !px-4 text-sm" onClick={() => fileRef.current?.click()}>
                {hasRealPhoto ? '📷 החלף תמונה' : '📷 העלה תמונה אמיתית מהגלריה'}
              </button>
              <p className="text-xs text-park-500 text-center max-w-[15rem]">כלב עם תמונה אמיתית מזוהה מהר יותר בפארק ומקבל יותר חברים 🐾</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-park-400">או אווטאר זמני:</span>
                {DOG_AVATARS.map((a) => (
                  <button key={a} onClick={() => setPhoto(a)} className={`h-9 w-9 rounded-full grid place-items-center text-lg border-2 ${photo === a ? 'border-park-500 bg-park-100' : 'border-park-200 bg-white'}`}>{a}</button>
                ))}
              </div>
            </div>

            <Field label="שם הכלב *">
              <input className="inp" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="למשל: לונה" />
            </Field>
            <Field label="גזע *">
              <BreedPicker value={breed} onChange={setBreed} />
            </Field>
            <Field label={`גיל: ${ageYears} שנים`}>
              <input type="range" min={0} max={18} value={ageYears} onChange={(e) => setAgeYears(+e.target.value)} className="w-full accent-park-500" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="מין">
                <Segmented value={gender} onChange={(v) => setGender(v as 'male' | 'female')} options={[{ v: 'male', l: 'זכר' }, { v: 'female', l: 'נקבה' }]} />
              </Field>
              <Field label="עיקור/סירוס">
                <Segmented value={neutered ? 'yes' : 'no'} onChange={(v) => setNeutered(v === 'yes')} options={[{ v: 'yes', l: 'כן' }, { v: 'no', l: 'לא' }]} />
              </Field>
            </div>
            <Field label="גודל">
              <Segmented value={size} onChange={(v) => setSize(v as DogSize)} options={[{ v: 'small', l: 'קטן' }, { v: 'medium', l: 'בינוני' }, { v: 'large', l: 'גדול' }]} />
            </Field>
            <Field label="רמת אנרגיה">
              <Segmented value={energy} onChange={(v) => setEnergy(v as DogEnergy)} options={[{ v: 'calm', l: 'רגוע' }, { v: 'balanced', l: 'מאוזן' }, { v: 'energetic', l: 'אנרגטי' }]} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">אילו תרגילים {dogName || 'הכלב'} יודע?</h2>
            <p className="text-sm text-park-600">כל תרגיל שמים ⭐ ומעלה אתכם ברמות. אפשר לדלג ולהוסיף בהמשך.</p>
            {TRICK_TIERS.map((tier) => (
              <div key={tier.tier}>
                <div className="text-sm font-bold text-park-800 mb-2">{tier.emoji} {tier.title} <span className="text-park-400 font-normal">(+{tier.points} לכל תרגיל)</span></div>
                <div className="flex flex-wrap gap-2">
                  {TRICKS.filter((t) => t.tier === tier.tier).map((t) => {
                    const on = tricks.includes(t.id)
                    return (
                      <button key={t.id} onClick={() => toggle(tricks, setTricks, t.id)} className={`chip border ${on ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}>
                        {on && '✓ '}{t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-park-800">מה {dogName || 'הכלב'} הכי אוהב?</h2>
            <div>
              <div className="text-base font-bold text-park-800 mb-2">🥩 חטיפים</div>
              <ChipPicker groups={TREAT_GROUPS} selected={treats} onToggle={(v) => toggle(treats, setTreats, v)} allowCustom customPlaceholder="חטיף אחר…" />
            </div>
            <div>
              <div className="text-base font-bold text-park-800 mb-2">🧸 צעצועים</div>
              <ChipPicker groups={TOY_GROUPS} selected={toys} onToggle={(v) => toggle(toys, setToys, v)} allowCustom customPlaceholder="צעצוע אחר…" />
            </div>
            <div>
              <div className="text-base font-bold text-park-800 mb-2">💚 דברים אהובים</div>
              <ChipPicker groups={FAVORITE_GROUPS} selected={favorites} onToggle={(v) => toggle(favorites, setFavorites, v)} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">איך תתאר/י את {dogName || 'הכלב'}?</h2>
            <p className="text-sm text-park-600">בחרו את התכונות שמתאימות (עד 10).</p>
            <ChipPicker groups={TRAIT_GROUPS} selected={traits} onToggle={(v) => toggle(traits, setTraits, v, 10)} max={10} />
          </div>
        )}
      </div>

      <div className="px-6 py-4 flex gap-3 safe-bottom">
        {step > 0 && <button className="btn-ghost flex-1" onClick={() => setStep((s) => s - 1)}>חזרה</button>}
        {step >= 3 && step < totalSteps - 1 && (
          <button className="btn-ghost flex-1" onClick={() => setStep((s) => s + 1)}>דלג</button>
        )}
        {step < totalSteps - 1 ? (
          <button className="btn-primary flex-[2]" disabled={!canNext()} onClick={next}>
            {step === 0 ? 'מתחילים 🐾' : 'הבא'}
          </button>
        ) : (
          <button className="btn-primary flex-[2]" onClick={finish}>סיום · יאללה למפה 🗺️</button>
        )}
      </div>

      {/* Location permission */}
      <Sheet open={locSheet} onClose={() => requestLocation(false)} title="למצוא פארקים לידך 📍">
        <p className="text-park-700 leading-relaxed mb-4">
          Dog parks רוצה להשתמש במיקום כדי להראות לך את הפארק הכי קרוב ואיזה חברים נמצאים בו.
          תמיד אתה בשליטה — שיתוף המיקום נדלק רק כשתבחר.
        </p>
        <div className="space-y-2">
          <button className="btn-primary w-full" onClick={() => requestLocation(true)}>אפשר מיקום</button>
          <button className="btn-ghost w-full" onClick={() => requestLocation(false)}>אולי אחר כך</button>
        </div>
      </Sheet>

      <style>{`
        .inp { width:100%; border-radius:1rem; border:1px solid #bce6b6; background:#fff; padding:.7rem .9rem; font-size:1rem; outline:none; }
        .inp:focus { border-color:#3ea033; box-shadow:0 0 0 3px #dcf2d9; }
        .lbl { font-size:.8rem; font-weight:600; color:#256620; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="flex rounded-2xl bg-park-100 p-1 gap-1">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${value === o.v ? 'bg-white text-park-700 shadow-sm' : 'text-park-500'}`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}
