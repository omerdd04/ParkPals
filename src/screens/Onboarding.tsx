import { useState } from 'react'
import { useStore, genPersonalCode } from '../store'
import { CITIES } from '../data/parks'
import type { DogEnergy, DogSize } from '../types'

const DOG_AVATARS = ['🐕', '🐩', '🐕‍🦺', '🦮', '🐶']
const EXERCISES = ['שב', 'ארצה', 'חכה', 'בוא', 'ליד', 'תן כפה', 'התגלגל']

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)

  // owner
  const [ownerName, setOwnerName] = useState('')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')

  // dog
  const [dogName, setDogName] = useState('')
  const [photo, setPhoto] = useState('🐕')
  const [breed, setBreed] = useState('')
  const [ageYears, setAgeYears] = useState(1)
  const [size, setSize] = useState<DogSize>('medium')
  const [energy, setEnergy] = useState<DogEnergy>('balanced')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [neutered, setNeutered] = useState(false)
  const [favoriteToy, setFavoriteToy] = useState('')
  const [favoriteTreat, setFavoriteTreat] = useState('')
  const [knownExercises, setKnownExercises] = useState<string[]>([])

  const totalSteps = 4
  const canNext = () => {
    if (step === 1) return ownerName.trim() && city
    if (step === 2) return dogName.trim()
    return true
  }

  function finish() {
    completeOnboarding(
      { name: ownerName.trim(), city, neighborhood: neighborhood.trim(), personalCode: genPersonalCode() },
      {
        name: dogName.trim(), breed: breed.trim() || 'מעורב', ageYears, size, energy, gender,
        neutered, photo, favoriteToy: favoriteToy.trim(), favoriteTreat: favoriteTreat.trim(), knownExercises,
      },
    )
  }

  function toggleExercise(ex: string) {
    setKnownExercises((prev) => (prev.includes(ex) ? prev.filter((e) => e !== ex) : [...prev, ex]))
  }

  return (
    <div className="mx-auto max-w-md h-full flex flex-col bg-gradient-to-b from-park-100 to-park-50">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 text-park-700">
          <span className="text-3xl">🐾</span>
          <span className="text-2xl font-extrabold">Onyx</span>
        </div>
        {step > 0 && (
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-park-500' : 'bg-park-200'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-4">
        {step === 0 && (
          <div className="h-full flex flex-col justify-center text-center gap-4">
            <div className="text-6xl">🗺️🐕</div>
            <h1 className="text-2xl font-extrabold text-park-800">ברוכים הבאים ל-Onyx</h1>
            <p className="text-park-700 leading-relaxed">
              מוצאים פארקי כלבים בכל הארץ, רואים איזה חברים נמצאים עכשיו בפארק,
              מתאמים סיבובים בלחיצה אחת, ולומדים איך לגרום לכלב שלכם לחיות טוב יותר.
            </p>
            <p className="text-sm text-park-500">2 דקות של שאלון קצר ואנחנו בפנים 🐾</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">קצת עליך</h2>
            <Field label="איך קוראים לך?">
              <input className="inp" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="השם שלך" />
            </Field>
            <Field label="עיר">
              <select className="inp" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">בחרו עיר…</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="שכונה (לא חובה)">
              <input className="inp" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="למשל: פלורנטין" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">הכירו לנו את הכלב</h2>
            <div>
              <label className="lbl">בחרו אווטאר</label>
              <div className="flex gap-2 mt-1">
                {DOG_AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setPhoto(a)}
                    className={`h-12 w-12 rounded-full grid place-items-center text-2xl border-2 ${
                      photo === a ? 'border-park-500 bg-park-100' : 'border-park-200 bg-white'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <Field label="שם הכלב">
              <input className="inp" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="למשל: לונה" />
            </Field>
            <Field label="גזע">
              <input className="inp" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="למשל: לברדור / מעורב" />
            </Field>
            <Field label={`גיל: ${ageYears} שנים`}>
              <input type="range" min={0} max={18} value={ageYears} onChange={(e) => setAgeYears(+e.target.value)} className="w-full accent-park-500" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="מין">
                <Segmented
                  value={gender}
                  onChange={(v) => setGender(v as 'male' | 'female')}
                  options={[{ v: 'male', l: 'זכר' }, { v: 'female', l: 'נקבה' }]}
                />
              </Field>
              <Field label="עיקור/סירוס">
                <Segmented
                  value={neutered ? 'yes' : 'no'}
                  onChange={(v) => setNeutered(v === 'yes')}
                  options={[{ v: 'yes', l: 'כן' }, { v: 'no', l: 'לא' }]}
                />
              </Field>
            </div>
            <Field label="גודל">
              <Segmented
                value={size}
                onChange={(v) => setSize(v as DogSize)}
                options={[{ v: 'small', l: 'קטן' }, { v: 'medium', l: 'בינוני' }, { v: 'large', l: 'גדול' }]}
              />
            </Field>
            <Field label="רמת אנרגיה">
              <Segmented
                value={energy}
                onChange={(v) => setEnergy(v as DogEnergy)}
                options={[{ v: 'calm', l: 'רגוע' }, { v: 'balanced', l: 'מאוזן' }, { v: 'energetic', l: 'אנרגטי' }]}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-park-800">העדפות ואילוף</h2>
            <p className="text-sm text-park-600">זה עוזר לנו להתאים לכם תוכן ושיתופי פעולה עם חנויות ועיריות.</p>
            <Field label="צעצוע אהוב">
              <input className="inp" value={favoriteToy} onChange={(e) => setFavoriteToy(e.target.value)} placeholder="למשל: כדור טניס" />
            </Field>
            <Field label="חטיף אהוב">
              <input className="inp" value={favoriteTreat} onChange={(e) => setFavoriteTreat(e.target.value)} placeholder="למשל: נקניקיה / גזר" />
            </Field>
            <div>
              <label className="lbl">אילו תרגילים הכלב כבר יודע?</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EXERCISES.map((ex) => {
                  const on = knownExercises.includes(ex)
                  return (
                    <button
                      key={ex}
                      onClick={() => toggleExercise(ex)}
                      className={`chip border ${on ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}
                    >
                      {on ? '✓ ' : ''}{ex}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 flex gap-3 safe-bottom">
        {step > 0 && (
          <button className="btn-ghost flex-1" onClick={() => setStep((s) => s - 1)}>
            חזרה
          </button>
        )}
        {step < totalSteps - 1 ? (
          <button className="btn-primary flex-[2]" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            {step === 0 ? 'מתחילים 🐾' : 'הבא'}
          </button>
        ) : (
          <button className="btn-primary flex-[2]" onClick={finish}>
            סיום · יאללה למפה 🗺️
          </button>
        )}
      </div>

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

function Segmented({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div className="flex rounded-2xl bg-park-100 p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
            value === o.v ? 'bg-white text-park-700 shadow-sm' : 'text-park-500'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}
