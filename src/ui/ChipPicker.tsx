import { useState } from 'react'
import type { OptionGroup } from '../data/profileOptions'

interface Props {
  groups: OptionGroup[]
  selected: string[]
  onToggle: (value: string) => void
  max?: number
  allowCustom?: boolean
  customPlaceholder?: string
}

// Categorized, tappable chip picker (matches the onboarding reference designs).
// Selected chips are highlighted; an optional free-text field adds custom values.
export default function ChipPicker({ groups, selected, onToggle, max, allowCustom, customPlaceholder }: Props) {
  const [custom, setCustom] = useState('')
  const atMax = max != null && selected.length >= max

  const addCustom = () => {
    const v = custom.trim()
    if (v && !selected.includes(v) && !atMax) onToggle(v)
    setCustom('')
  }

  // custom values the user typed that aren't in any group
  const known = new Set(groups.flatMap((g) => g.options))
  const customSelected = selected.filter((s) => !known.has(s))

  return (
    <div className="space-y-4">
      {allowCustom && (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-park-200 p-3"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder={customPlaceholder ?? 'הוסיפו משלכם…'}
          />
          <button className="h-12 w-12 shrink-0 rounded-2xl bg-park-100 text-park-700 text-2xl grid place-items-center disabled:opacity-40" onClick={addCustom} disabled={!custom.trim() || atMax}>
            +
          </button>
        </div>
      )}

      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSelected.map((v) => (
            <button key={v} onClick={() => onToggle(v)} className="chip bg-park-500 text-white border border-park-500">
              {v} <span className="opacity-80">✕</span>
            </button>
          ))}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.key}>
          <div className="text-sm font-bold text-park-800 mb-2">{g.emoji} {g.title}</div>
          <div className="flex flex-wrap gap-2">
            {g.options.map((opt) => {
              const on = selected.includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  disabled={!on && atMax}
                  className={`chip border transition ${
                    on
                      ? 'bg-park-500 text-white border-park-500'
                      : atMax
                        ? 'bg-white text-park-300 border-park-100'
                        : 'bg-white text-park-700 border-park-200'
                  }`}
                >
                  {on && <span className="opacity-80">✓ </span>}{opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {max != null && (
        <div className="text-xs text-park-400">נבחרו {selected.length}{max ? `/${max}` : ''}</div>
      )}
    </div>
  )
}
