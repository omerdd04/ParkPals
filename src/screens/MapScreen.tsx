import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { PARKS, parkById, distanceKm, cityCenter } from '../data/parks'
import { busyEstimate, presenceActive, presenceRemainingMs, useStore } from '../store'
import type { Friend, Park } from '../types'
import { useNow, formatCountdown } from '../ui/useNow'
import DogAvatar from '../ui/DogAvatar'
import Sheet from '../ui/Sheet'
import QuickChat from './QuickChat'
import NotificationsButton from './NotificationsButton'

// Empty park: a simple tree pin.
function parkIcon(mine: boolean): L.DivIcon {
  const ring = mine ? 'box-shadow:0 0 0 3px #2d9c3a;' : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative"><div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#fff;transform:rotate(-45deg);border:2px solid #2d9c3a;${ring}display:grid;place-items:center;box-shadow:0 3px 8px rgba(0,0,0,.22)"><span style="transform:rotate(45deg);font-size:17px">🌳</span></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })
}

// Leaflet divIcons take raw HTML strings (not JSX), so anything user-controlled
// that flows in here must be sanitized — a crafted "photo" string could otherwise
// inject markup. We only accept validated image data-URIs; everything else is
// treated as text and HTML-escaped.
function safeAvatarHTML(photo: string): string {
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(photo)) {
    return `<img src="${photo}" alt=""/>`
  }
  const esc = photo.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  )
  return `<span>${esc}</span>`
}

// Park with live dogs: floating, overlapping profile circles (Instagram-style),
// with a heart and an optional "+N". This is what shows over a busy park.
function dogsIcon(dogs: Friend[], estimate: number): L.DivIcon {
  const shown = dogs.slice(0, 3)
  const circles = shown
    .map((d, i) => {
      const heading = d.presence?.kind === 'heading'
      return `<div class="map-dog__ring${heading ? ' map-dog__ring--heading' : ''}" style="margin-inline-start:${i === 0 ? 0 : -16}px;position:relative;z-index:${9 - i}"><div class="map-dog__inner">${safeAvatarHTML(d.dogPhoto)}</div></div>`
    })
    .join('')
  const totalExtra = dogs.length - shown.length + estimate
  const extra = totalExtra > 0
    ? `<div style="margin-inline-start:-12px;z-index:1;width:34px;height:34px;border-radius:50%;background:#14231a;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)">+${totalExtra}</div>`
    : ''
  const width = 46 + (shown.length - 1) * 30 + (totalExtra > 0 ? 26 : 0)
  return L.divIcon({
    className: '',
    html: `<div class="map-dog" style="display:flex;align-items:center;position:relative">${circles}${extra}<span class="map-dog__heart">💚</span></div>`,
    iconSize: [width, 52],
    iconAnchor: [width / 2, 46],
  })
}

function meIcon(photo: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="map-dog__inner" style="width:40px;height:40px;border:3px solid #2563eb;box-shadow:0 2px 8px rgba(0,0,0,.3)">${safeAvatarHTML(photo)}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => { if (target) map.flyTo(target, 15, { duration: 0.8 }) }, [map, target])
  return null
}

// Recenter the map on the user's location when the button is tapped (trigger++).
function Recenter({ loc, trigger }: { loc: { lat: number; lng: number }; trigger: number }) {
  const map = useMap()
  useEffect(() => {
    if (trigger > 0) map.flyTo([loc.lat, loc.lng], 15, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])
  return null
}

function KeepSized() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const sync = () => map.invalidateSize({ animate: false })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.addEventListener('resize', sync)
    return () => { ro.disconnect(); window.removeEventListener('resize', sync) }
  }, [map])
  return null
}


export default function MapScreen() {
  const now = useNow(1000)
  const dog = useStore((s) => s.dog)
  const owner = useStore((s) => s.owner)
  const friends = useStore((s) => s.friends)
  const myPresence = useStore((s) => s.myPresence)
  const setPresence = useStore((s) => s.setPresence)
  const shareLocation = useStore((s) => s.shareLocation)
  const storeLoc = useStore((s) => s.userLoc)
  // If the user shares real GPS, use it; otherwise always follow the city they
  // entered in onboarding, so changing city changes which parks are shown.
  const userLoc = shareLocation && storeLoc ? storeLoc : cityCenter(owner.city)

  const [openPark, setOpenPark] = useState<Park | null>(null)
  const [statusSheet, setStatusSheet] = useState(false)
  const [chatFriend, setChatFriend] = useState<Friend | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [recenterN, setRecenterN] = useState(0)
  // Park search + filters
  const [query, setQuery] = useState('')
  const [fFenced, setFFenced] = useState(false)
  const [fWater, setFWater] = useState(false)
  const [fLarge, setFLarge] = useState(false)
  // Show real OSM street tiles; if they fail to load (blocked network / sandbox),
  // remove the layer so the CSS street-grid basemap shows cleanly instead of the
  // browser painting the failed tiles black.
  const [showTiles, setShowTiles] = useState(true)
  const tileStats = useRef({ loaded: 0, errors: 0 })

  const [mapReady, setMapReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    const go = () => requestAnimationFrame(() => !cancelled && setMapReady(true))
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts?.ready) { fonts.ready.then(go); window.setTimeout(go, 600) } else go()
    return () => { cancelled = true }
  }, [])

  const presenceByPark = useMemo(() => {
    const map = new Map<string, Friend[]>()
    for (const f of friends) {
      if (f.presence && presenceActive(f.presence, now) && f.presence.kind === 'at_park') {
        const arr = map.get(f.presence.parkId) ?? []
        arr.push(f)
        map.set(f.presence.parkId, arr)
      }
    }
    return map
  }, [friends, now])

  const liveDogs = useMemo(
    () => friends.filter((f) => f.presence && presenceActive(f.presence, now)),
    [friends, now],
  )

  // Filters narrow which parks show on the map; search finds a park by name/city.
  const visibleParks = useMemo(
    () => PARKS.filter((p) =>
      (!fFenced || p.fenced) && (!fWater || p.hasWater) && (!fLarge || p.size === 'large'),
    ),
    [fFenced, fWater, fLarge],
  )

  const searchResults = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return visibleParks
      .filter((p) => p.name.includes(q) || p.city.includes(q) || (p.area ?? '').includes(q))
      .map((p) => ({ p, d: distanceKm(userLoc.lat, userLoc.lng, p.lat, p.lng) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
  }, [query, visibleParks, userLoc.lat, userLoc.lng])

  function pickResult(p: Park) {
    setQuery('')
    setFlyTarget([p.lat, p.lng])
    setOpenPark(p)
  }

  const myPark = myPresence && presenceActive(myPresence, now) ? parkById(myPresence.parkId) : null
  function realCount(parkId: string): number {
    let c = presenceByPark.get(parkId)?.length ?? 0
    if (myPark?.id === parkId && myPresence?.kind === 'at_park') c += 1
    return c
  }
  function totalCount(park: Park): number {
    return realCount(park.id) + busyEstimate(park.dailyVisitors, now)
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="px-4 pt-3 pb-2 bg-[var(--ground)] z-[500]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted)]">שלום {owner.name} {dog.photo.startsWith('data:') ? '🐾' : dog.photo}</div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">פארקים לידך</h1>
          </div>
          <NotificationsButton />
        </div>

        {/* Search + filter chips */}
        <div className="mt-2 relative">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-2xl bg-white border border-[var(--line)] px-3 py-2">
              <span className="text-sm">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש פארק או עיר…"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-park-300"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-park-300 text-sm" aria-label="נקה חיפוש">✕</button>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { on: fFenced, set: setFFenced, label: '🚧 מגודר' },
              { on: fWater, set: setFWater, label: '💧 ברזייה' },
              { on: fLarge, set: setFLarge, label: '🐕 גדול' },
            ].map((c) => (
              <button
                key={c.label}
                onClick={() => c.set(!c.on)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  c.on ? 'text-white border-transparent' : 'bg-white text-park-600 border-[var(--line)]'
                }`}
                style={c.on ? { background: 'linear-gradient(135deg,#4fb84a,#2d9c3a)' } : undefined}
              >
                {c.label}
              </button>
            ))}
            {(fFenced || fWater || fLarge) && (
              <span className="shrink-0 self-center text-[11px] text-park-400">{visibleParks.length} פארקים</span>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full inset-x-0 mt-1 z-[700] rounded-2xl bg-white border border-[var(--line)] overflow-hidden"
              style={{ boxShadow: '0 10px 30px rgba(20,60,30,0.15)' }}>
              {searchResults.map(({ p, d }) => (
                <button key={p.id} onClick={() => pickResult(p)} className="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-park-50 border-b border-park-50 last:border-0">
                  <span>{p.fenced ? '🚧' : '🌳'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-park-800 truncate">{p.name}</span>
                    <span className="block text-[11px] text-park-400">{p.city}{p.area ? ` · ${p.area}` : ''} · {d.toFixed(1)} ק"מ</span>
                  </span>
                  {p.hasWater && <span className="text-xs">💧</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {liveDogs.length > 0 && (
          <div className="mt-2 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {liveDogs.map((f) => {
              const heading = f.presence!.kind === 'heading'
              return (
                <button key={f.id} onClick={() => setChatFriend(f)} className="shrink-0 flex flex-col items-center gap-1 animate-floaty relative" style={{ animationDelay: `${(f.id.charCodeAt(0) % 5) * 0.3}s` }}>
                  <div className="relative">
                    <div className={`story-ring ${heading ? 'story-ring--heading' : ''}`}>
                      <div><DogAvatar photo={f.dogPhoto} size={48} ring="none" /></div>
                    </div>
                    <span className="absolute -bottom-1 -left-1 text-sm drop-shadow">{heading ? '🚶' : '💚'}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-park-700 max-w-[54px] truncate">{f.dogName}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-0">
        {/* The map container carries a CSS street-grid background (see
            .leaflet-container in index.css). Real OSM street tiles render on top
            where the network allows; when blocked, tiles fall back to a
            transparent pixel so the CSS grid shows instead of a blank screen. */}
        {mapReady && (
          <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={14} className="absolute inset-0" zoomControl={false} attributionControl={false}>
            {showTiles && (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=""
                eventHandlers={{
                  tileload: () => { tileStats.current.loaded++ },
                  tileerror: () => {
                    tileStats.current.errors++
                    if (tileStats.current.loaded === 0 && tileStats.current.errors >= 3) setShowTiles(false)
                  },
                }}
              />
            )}
            <KeepSized />
            <FlyTo target={flyTarget} />
            <Recenter loc={userLoc} trigger={recenterN} />
            <Marker position={[userLoc.lat, userLoc.lng]} icon={meIcon(dog.photo)} zIndexOffset={1000} />
            {visibleParks.map((p) => {
              const dogsHere = presenceByPark.get(p.id) ?? []
              const est = busyEstimate(p.dailyVisitors, now)
              const icon = dogsHere.length > 0 ? dogsIcon(dogsHere, est) : parkIcon(myPark?.id === p.id)
              return (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  icon={icon}
                  zIndexOffset={dogsHere.length > 0 ? 500 : 0}
                  eventHandlers={{ click: () => setOpenPark(p) }}
                />
              )
            })}
          </MapContainer>
        )}

        {myPark && myPresence && (
          <div className="absolute top-3 inset-x-3 z-[500] card !p-3 flex items-center gap-3 animate-pop">
            <span className="text-2xl">{myPresence.kind === 'heading' ? '🚶' : '🟢'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-park-800 truncate">{myPresence.kind === 'heading' ? 'בדרך ל' : 'נמצא ב'}{myPark.name}</div>
              <div className="text-xs text-park-500">
                נעלם אוטומטית בעוד {formatCountdown(presenceRemainingMs(myPresence, now))}
                {myPresence.sharesLocation ? ' · משתף מיקום 📍' : ''}
              </div>
            </div>
          </div>
        )}

        <button onClick={() => setStatusSheet(true)} className="absolute bottom-4 left-4 z-[500] btn-primary !rounded-full !px-5 shadow-lg flex items-center gap-2">
          <span className="text-lg">🐾</span> אני יוצא לפארק
        </button>

        {/* Recenter on my location */}
        <button
          onClick={() => setRecenterN((n) => n + 1)}
          aria-label="חזרה למיקום שלי"
          className="absolute bottom-4 right-4 z-[500] h-12 w-12 rounded-full bg-white grid place-items-center text-xl border border-park-100"
          style={{ boxShadow: '0 6px 18px rgba(20,60,30,0.18)' }}
        >
          🎯
        </button>
      </div>

      <Sheet open={!!openPark} onClose={() => setOpenPark(null)} title={openPark?.name}>
        {openPark && (
          <ParkDetail
            park={openPark}
            present={presenceByPark.get(openPark.id) ?? []}
            estimate={busyEstimate(openPark.dailyVisitors, now)}
            distance={distanceKm(userLoc.lat, userLoc.lng, openPark.lat, openPark.lng)}
            mineHere={myPark?.id === openPark.id}
            onSetStatus={(kind, shares) => {
              setPresence(openPark.id, kind, shares)
              setOpenPark(null)
              setFlyTarget([openPark.lat, openPark.lng])
            }}
            onChat={(f) => { setOpenPark(null); setChatFriend(f) }}
          />
        )}
      </Sheet>

      <Sheet open={statusSheet} onClose={() => setStatusSheet(false)} title="לאיזה פארק?">
        <StatusChooser
          userLoc={userLoc}
          countOf={totalCount}
          onPick={(parkId, kind, shares) => {
            setPresence(parkId, kind, shares)
            setStatusSheet(false)
            const p = parkById(parkId)
            if (p) setFlyTarget([p.lat, p.lng])
          }}
        />
      </Sheet>

      <QuickChat friend={chatFriend} parkName={myPark?.name} onClose={() => setChatFriend(null)} />
    </div>
  )
}

function ParkDetail({
  park, present, estimate, distance, mineHere, onSetStatus, onChat,
}: {
  park: Park
  present: Friend[]
  estimate: number
  distance: number
  mineHere: boolean
  onSetStatus: (kind: 'at_park' | 'heading', shares: boolean) => void
  onChat: (f: Friend) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="chip bg-park-100 text-park-700">{park.area ? `${park.city} · ${park.area}` : park.city}</span>
        <span className="chip bg-park-100 text-park-700">📍 {distance < 1 ? `${Math.round(distance * 1000)} מ'` : `${distance.toFixed(1)} ק"מ`}</span>
        {park.fenced && <span className="chip bg-park-100 text-park-700">🚧 מגודר</span>}
        {park.hasWater && <span className="chip bg-park-100 text-park-700">💧 ברזייה</span>}
        <span className="chip bg-park-100 text-park-700">{park.size === 'large' ? 'גדול' : park.size === 'medium' ? 'בינוני' : 'קטן'}</span>
      </div>

      {estimate > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          🔥 שעת שיא — צפי עומס: ~{estimate} כלבים בשעה הקרובה
        </div>
      )}

      <div>
        <div className="text-sm font-semibold text-park-700 mb-2">
          {present.length > 0 ? `${present.length} חברים בפארק עכשיו` : 'אף חבר לא סימן שהוא בפארק כרגע'}
        </div>
        <div className="flex flex-wrap gap-3">
          {present.map((f) => (
            <button key={f.id} onClick={() => onChat(f)} className="flex flex-col items-center gap-1">
              <DogAvatar photo={f.dogPhoto} size={48} ring={f.favorite ? 'favorite' : 'live'} />
              <span className="text-[11px] font-medium text-park-700">{f.dogName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-park-100 pt-3 space-y-2">
        <button className="btn-primary w-full" onClick={() => onSetStatus('at_park', false)}>🟢 אני בפארק עכשיו (נעלם אחרי שעה)</button>
        <button className="btn-soft w-full" onClick={() => onSetStatus('at_park', true)}>📍 אני בפארק + שתף מיקום חי</button>
        <button className="btn-ghost w-full" onClick={() => onSetStatus('heading', false)}>🚶 יוצא לכאן ב-15 הדקות הקרובות</button>
        {mineHere && <p className="text-center text-xs text-park-500">אתה כבר מסומן כאן ✓</p>}
      </div>
    </div>
  )
}

function StatusChooser({
  userLoc, countOf, onPick,
}: {
  userLoc: { lat: number; lng: number }
  countOf: (p: Park) => number
  onPick: (parkId: string, kind: 'at_park' | 'heading', shares: boolean) => void
}) {
  const [parkId, setParkId] = useState('')

  // Nearest park first, then by how many dogs are there now.
  const ranked = useMemo(() => {
    return PARKS.map((p) => ({
      park: p,
      dist: distanceKm(userLoc.lat, userLoc.lng, p.lat, p.lng),
      count: countOf(p),
    }))
      .sort((a, b) => {
        // closest wins first; within similar distance, more dogs wins
        if (Math.abs(a.dist - b.dist) > 0.4) return a.dist - b.dist
        return b.count - a.count
      })
      .slice(0, 8)
  }, [userLoc, countOf])

  return (
    <div className="space-y-3">
      <p className="text-sm text-park-600">הפארקים הכי קרובים אליך, לפי מרחק וכמה כלבים שם עכשיו:</p>
      <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
        {ranked.map(({ park, dist, count }, i) => (
          <button
            key={park.id}
            onClick={() => setParkId(park.id)}
            className={`w-full text-start rounded-2xl border p-3 flex items-center gap-3 ${parkId === park.id ? 'border-park-500 bg-park-50' : 'border-park-200 bg-white'}`}
          >
            {i === 0 && <span className="chip bg-park-500 text-white text-[10px] shrink-0">הכי קרוב</span>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-park-800 truncate">{park.name}</div>
              <div className="text-xs text-park-500">
                📍 {dist < 1 ? `${Math.round(dist * 1000)} מ'` : `${dist.toFixed(1)} ק"מ`}
                {park.fenced ? " · 🚧" : ''}{park.hasWater ? ' · 💧' : ''}
              </div>
            </div>
            {count > 0 && <span className="chip bg-pink-100 text-pink-700 text-xs shrink-0">🐾 {count}</span>}
          </button>
        ))}
      </div>
      <div className="space-y-2 pt-1">
        <button className="btn-primary w-full" disabled={!parkId} onClick={() => onPick(parkId, 'at_park', false)}>🟢 אני בפארק עכשיו</button>
        <button className="btn-soft w-full" disabled={!parkId} onClick={() => onPick(parkId, 'at_park', true)}>📍 בפארק + שתף מיקום</button>
        <button className="btn-ghost w-full" disabled={!parkId} onClick={() => onPick(parkId, 'heading', false)}>🚶 יוצא לכיוון ב-15 דק'</button>
      </div>
    </div>
  )
}
