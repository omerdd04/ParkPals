import { useState } from 'react'
import { ALL_BREEDS, POPULAR_BREEDS } from '../data/profileOptions'

// Searchable breed picker (popular first, then all), like the reference screen.
export default function BreedPicker({ value, onChange }: { value: string; onChange: (b: string) => void }) {
  const [q, setQ] = useState('')
  const query = q.trim()
  const list = query
    ? ALL_BREEDS.filter((b) => b.includes(query))
    : null

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-2xl border border-park-200 p-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 חיפוש גזע…"
      />
      <div className="text-xs text-park-500">
        {value ? <>נבחר: <span className="font-semibold text-park-700">{value}</span></> : 'לא נבחר גזע'}
      </div>

      {list ? (
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto no-scrollbar">
          {list.map((b) => (
            <BreedChip key={b} b={b} on={value === b} onClick={() => onChange(b)} />
          ))}
          {/* Never get stuck: let people add their exact breed as free text. */}
          {!list.includes(query) && (
            <button
              onClick={() => onChange(query)}
              className={`chip border ${value === query ? 'bg-park-500 text-white border-park-500' : 'bg-park-50 text-park-700 border-dashed border-park-300'}`}
            >
              ➕ הוסף "{query}"
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm font-bold text-park-800">פופולריים</div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_BREEDS.map((b) => (
              <BreedChip key={b} b={b} on={value === b} onClick={() => onChange(b)} />
            ))}
          </div>
          <div className="text-xs text-park-400">מחפשים גזע אחר? הקלידו בחיפוש למעלה.</div>
        </>
      )}
    </div>
  )
}

function BreedChip({ b, on, onClick }: { b: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`chip border ${on ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`}
    >
      {on && '✓ '}{b}
    </button>
  )
}
