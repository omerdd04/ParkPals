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
import { PARK_QUESTIONS } from '../data/parkQuestions'
import { submitParkFeedback, currentUserEmail, updatePark, deletePark } from '../lib/backend'
import { ADMIN_EMAILS } from '../config'
import { refreshParks } from '../lib/liveSync'

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
  const storeLoc = useStore((s) => s.userLoc)
  const locSource = useStore((s) => s.locSource)
  const setUserLoc = useStore((s) => s.setUserLoc)
  // Real GPS wins; otherwise follow the city from onboarding, so changing city
  // changes which parks are shown.
  const hasGps = locSource === 'gps' && !!storeLoc
  const userLoc = hasGps ? storeLoc! : cityCenter(owner.city)

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

  // Park condition feedback (rotating question every 3rd visit)
  const feedbackAsk = useStore((s) => s.feedbackAsk)
  const dismissFeedbackAsk = useStore((s) => s.dismissFeedbackAsk)
  const showToast = useStore((s) => s.showToast)
  const [surveyParkId, setSurveyParkId] = useState<string | null>(null)

  // Full-screen map: hides the header (greeting, search, stories) for max map.
  const [fullMap, setFullMap] = useState(false)

  // Admin: edit parks straight from the map
  const [isAdmin, setIsAdmin] = useState(false)
  const [editPark, setEditPark] = useState<Park | null>(null)
  useEffect(() => {
    currentUserEmail().then((email) => {
      if (email && ADMIN_EMAILS.includes(email.toLowerCase())) setIsAdmin(true)
    })
  }, [])
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

  // Built-in parks + parks added from the admin screen (deduped by id).
  const serverParks = useStore((s) => s.serverParks)
  const parks = useMemo(() => {
    const ids = new Set(PARKS.map((p) => p.id))
    return [...PARKS, ...serverParks.filter((p) => !ids.has(p.id))]
  }, [serverParks])

  // Filters narrow which parks show on the map; search finds a park by name/city.
  const visibleParks = useMemo(
    () => parks.filter((p) =>
      (!fFenced || p.fenced) && (!fWater || p.hasWater) && (!fLarge || p.size === 'large'),
    ),
    [parks, fFenced, fWater, fLarge],
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
      {!fullMap && <div className="px-4 pt-3 pb-2 bg-[var(--ground)] z-[500]">
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
      </div>}

      <div className="flex-1 relative min-h-0">
        {/* The map container carries a CSS street-grid background (see
            .leaflet-container in index.css). Real OSM street tiles render on top
            where the network allows; when blocked, tiles fall back to a
            transparent pixel so the CSS grid shows instead of a blank screen. */}
        {mapReady && (
          <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={14} className="absolute inset-0" zoomControl={false} attributionControl={false}>
            {showTiles && (
              /* CARTO Voyager basemap — modern, clean look (Apple/Google-like)
                 and retina-sharp ({r}) on phones, replacing the dated default
                 OSM style. Data © OpenStreetMap contributors, tiles © CARTO
                 (credited in Settings → copyright). */
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
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
            {/* "You are here" only when we actually have GPS — a city-center
                fallback pretending to be the user is worse than nothing. */}
            {hasGps && <Marker position={[userLoc.lat, userLoc.lng]} icon={meIcon(dog.photo)} zIndexOffset={1000} />}
            {visibleParks.map((p) => {
              let dogsHere = presenceByPark.get(p.id) ?? []
              // Include MY dog in the park's circle when I'm checked in here.
              if (myPark?.id === p.id && myPresence?.kind === 'at_park') {
                dogsHere = [{ id: 'me', dogPhoto: dog.photo, presence: myPresence } as Friend, ...dogsHere]
              }
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

        {/* Rotating park-condition question (every 3rd visit) */}
        {feedbackAsk && (() => {
          const park = parkById(feedbackAsk.parkId)
          const q = PARK_QUESTIONS[feedbackAsk.qIndex % PARK_QUESTIONS.length]
          if (!park) return null
          const answer = (ok: boolean) => {
            void submitParkFeedback(park.id, [{ question: q.key, ok }])
            showToast({ text: 'תודה! המשוב עוזר לכל הקהילה 🙏', photo: q.emoji })
            dismissFeedbackAsk()
          }
          return (
            <div className="absolute bottom-20 inset-x-3 z-[600] card !p-3 animate-pop">
              <div className="flex items-start gap-2">
                <span className="text-2xl">{q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-park-800">{q.text}</div>
                  <div className="text-[11px] text-park-400 truncate">{park.name}</div>
                </div>
                <button onClick={dismissFeedbackAsk} aria-label="סגירה" className="text-park-300 px-1">✕</button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => answer(true)} className="flex-1 rounded-xl bg-park-100 py-2 text-lg">👍</button>
                <button onClick={() => answer(false)} className="flex-1 rounded-xl bg-pink-50 py-2 text-lg">👎</button>
                <button
                  onClick={() => { setSurveyParkId(park.id); dismissFeedbackAsk() }}
                  className="shrink-0 text-xs font-semibold text-park-600 underline underline-offset-2 px-1"
                >
                  שאלון מלא
                </button>
              </div>
            </div>
          )
        })()}

        <button onClick={() => setStatusSheet(true)} className="absolute bottom-4 left-4 z-[500] btn-primary !rounded-full !px-5 shadow-lg flex items-center gap-2">
          <span className="text-lg">🐾</span> אני יוצא לפארק
        </button>

        {/* Toggle full-screen map (hides the header) */}
        <button
          onClick={() => setFullMap((v) => !v)}
          aria-label={fullMap ? 'יציאה ממסך מלא' : 'מפה במסך מלא'}
          className={`absolute ${myPark && myPresence ? 'top-[86px]' : 'top-3'} left-3 z-[500] h-11 w-11 rounded-full bg-white grid place-items-center text-lg border border-park-100`}
          style={{ boxShadow: '0 6px 18px rgba(20,60,30,0.18)' }}
        >
          {fullMap ? '✕' : '⛶'}
        </button>

        {/* Recenter on my location — also re-requests fresh GPS */}
        <button
          onClick={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'gps'); setRecenterN((n) => n + 1) },
                () => setRecenterN((n) => n + 1),
                { enableHighAccuracy: true, timeout: 8000 },
              )
            } else setRecenterN((n) => n + 1)
          }}
          aria-label="חזרה למיקום שלי"
          className="absolute bottom-4 right-4 z-[500] h-12 w-12 rounded-full bg-white grid place-items-center text-xl border border-park-100"
          style={{ boxShadow: '0 6px 18px rgba(20,60,30,0.18)' }}
        >
          🎯
        </button>
      </div>

      {/* Admin: edit park */}
      {isAdmin && (
        <EditParkSheet
          park={editPark}
          onClose={() => setEditPark(null)}
          onSaved={(msg) => { setEditPark(null); showToast({ text: msg, photo: '🛠️' }); void refreshParks() }}
        />
      )}

      {/* Full park-condition survey */}
      <ParkSurveySheet
        parkId={surveyParkId}
        onClose={() => setSurveyParkId(null)}
        onDone={() => { setSurveyParkId(null); showToast({ text: 'תודה על השאלון! 🙏', photo: '📝' }) }}
      />

      <Sheet open={!!openPark} onClose={() => setOpenPark(null)} title={openPark?.name}>
        {openPark && (
          <ParkDetail
            park={openPark}
            present={presenceByPark.get(openPark.id) ?? []}
            estimate={busyEstimate(openPark.dailyVisitors, now)}
            distance={distanceKm(userLoc.lat, userLoc.lng, openPark.lat, openPark.lng)}
            mineHere={myPark?.id === openPark.id}
            onAdminEdit={isAdmin ? () => { setEditPark(openPark); setOpenPark(null) } : undefined}
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
  park, present, estimate, distance, mineHere, onSetStatus, onChat, onAdminEdit,
}: {
  park: Park
  present: Friend[]
  estimate: number
  distance: number
  mineHere: boolean
  onSetStatus: (kind: 'at_park' | 'heading', shares: boolean) => void
  onChat: (f: Friend) => void
  onAdminEdit?: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="chip bg-park-100 text-park-700">{park.area ? `${park.city} · ${park.area}` : park.city}</span>
        <span className="chip bg-park-100 text-park-700">📍 {distance < 1 ? `${Math.round(distance * 1000)} מ'` : `${distance.toFixed(1)} ק"מ`}</span>
        {park.fenced && <span className="chip bg-park-100 text-park-700">🚧 מגודר</span>}
        {park.hasWater && <span className="chip bg-park-100 text-park-700">💧 ברזייה</span>}
        {park.shade && <span className="chip bg-park-100 text-park-700">🌳 צל</span>}
        {park.lighting && <span className="chip bg-park-100 text-park-700">💡 תאורה</span>}
        {park.benches && <span className="chip bg-park-100 text-park-700">🪑 ספסלים</span>}
        <span className="chip bg-park-100 text-park-700">{park.size === 'large' ? 'גדול' : park.size === 'medium' ? 'בינוני' : 'קטן'}</span>
        {park.approx && <span className="chip bg-amber-50 text-amber-700 border border-amber-200">📍 מיקום משוער</span>}
      </div>

      {park.approx && (
        <p className="text-[11px] text-park-400 -mt-2">
          הנעץ מוצב ברמת השכונה. מכירים את המיקום המדויק? ספרו לנו דרך "צור קשר" במסך עוד 🙏
        </p>
      )}

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
        {onAdminEdit && (
          <button className="w-full text-center text-xs font-semibold text-park-500 underline underline-offset-2 pt-1" onClick={onAdminEdit}>
            🛠️ עריכת פארק (מנהל)
          </button>
        )}
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

// Full survey: all rotating questions at once, answered with 👍/👎 toggles.
function ParkSurveySheet({ parkId, onClose, onDone }: { parkId: string | null; onClose: () => void; onDone: () => void }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const park = parkId ? parkById(parkId) : null
  useEffect(() => { setAnswers({}) }, [parkId])

  async function submit() {
    if (!parkId || busy) return
    const list = Object.entries(answers).map(([question, ok]) => ({ question, ok }))
    if (list.length === 0) return
    setBusy(true)
    await submitParkFeedback(parkId, list)
    setBusy(false)
    onDone()
  }

  return (
    <Sheet open={!!parkId} onClose={onClose} title={park ? `שאלון על ${park.name} 📝` : 'שאלון'}>
      <div className="space-y-2">
        <p className="text-xs text-park-500">ענו על מה שאתם יודעים — כל תשובה עוזרת לקהילה ולעירייה.</p>
        {PARK_QUESTIONS.map((q) => {
          const val = answers[q.key]
          return (
            <div key={q.key} className="flex items-center gap-2 rounded-2xl border border-park-100 p-2.5">
              <span className="text-xl">{q.emoji}</span>
              <span className="flex-1 text-sm font-medium text-park-800">{q.text}</span>
              <button
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: true }))}
                className={`h-9 w-11 rounded-xl text-lg ${val === true ? 'bg-park-500' : 'bg-park-50'}`}
              >👍</button>
              <button
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: false }))}
                className={`h-9 w-11 rounded-xl text-lg ${val === false ? 'bg-pink-400' : 'bg-park-50'}`}
              >👎</button>
            </div>
          )
        })}
        <button className="btn-primary w-full" disabled={busy || Object.keys(answers).length === 0} onClick={submit}>
          {busy ? 'שולח…' : 'שליחת השאלון'}
        </button>
      </div>
    </Sheet>
  )
}

// Admin-only: edit or delete a park in place. Works for parks stored in the
// backend; built-in seed parks (other cities) can't be edited from here.
function EditParkSheet({ park, onClose, onSaved }: { park: Park | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const isServerPark = !!park && !PARKS.some((p) => p.id === park.id)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [coords, setCoords] = useState('')
  const [fenced, setFenced] = useState(true)
  const [hasWater, setHasWater] = useState(false)
  const [shade, setShade] = useState(false)
  const [lighting, setLighting] = useState(false)
  const [benches, setBenches] = useState(false)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!park) return
    setName(park.name); setCity(park.city); setArea(park.area ?? '')
    setCoords(`${park.lat.toFixed(5)}, ${park.lng.toFixed(5)}`)
    setFenced(park.fenced); setHasWater(park.hasWater)
    setShade(!!park.shade); setLighting(!!park.lighting); setBenches(!!park.benches)
    setSize(park.size); setErr(''); setConfirmDel(false)
  }, [park])

  function parseCoords(input: string): { lat: number; lng: number } | null {
    const dms = [...input.matchAll(/(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)["″]?\s*([NSEW])?/gi)]
    if (dms.length >= 2) {
      const toDec = (m: RegExpMatchArray) => {
        const v = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600
        return /[SW]/i.test(m[4] ?? '') ? -v : v
      }
      const a = toDec(dms[0]); const b = toDec(dms[1])
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b }
    }
    const nums = (input.match(/-?\d{1,3}\.\d+/g) ?? []).map(Number)
    for (let i = 0; i + 1 < nums.length; i++) {
      const [a, b] = [nums[i], nums[i + 1]]
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180 && Math.abs(a) > 1 && Math.abs(b) > 1) return { lat: a, lng: b }
    }
    return null
  }

  async function save() {
    if (!park || busy) return
    const parsed = parseCoords(coords)
    if (!parsed) { setErr('המיקום לא זוהה — הדביקו למשל: 31.79812, 34.63955'); return }
    setBusy(true); setErr('')
    const res = await updatePark(park.id, {
      name: name.trim(), city: city.trim(), area: area.trim() || undefined,
      lat: parsed.lat, lng: parsed.lng, fenced, hasWater, size, shade, lighting, benches,
    })
    setBusy(false)
    if (res.ok) onSaved(res.message)
    else setErr(res.message)
  }

  async function doDelete() {
    if (!park || busy) return
    setBusy(true)
    const res = await deletePark(park.id)
    setBusy(false)
    if (res.ok) onSaved(res.message)
    else setErr(res.message)
  }

  const chip = (on: boolean) => `chip border ${on ? 'bg-park-500 text-white border-park-500' : 'bg-white text-park-700 border-park-200'}`

  return (
    <Sheet open={!!park} onClose={onClose} title={`עריכת פארק 🛠️`}>
      {!isServerPark ? (
        <p className="text-sm text-park-600 py-4">
          הפארק הזה הוא חלק מהמאגר המובנה של האפליקציה ולא ניתן לעריכה מכאן.
          אפשר להוסיף גרסה מתוקנת דרך "הוספת פארק" ולבקש מקלוד להסיר את הישן.
        </p>
      ) : (
        <div className="space-y-3">
          <input className="w-full rounded-2xl border border-park-200 p-3" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-2xl border border-park-200 p-3" value={city} onChange={(e) => setCity(e.target.value)} placeholder="עיר" />
            <input className="rounded-2xl border border-park-200 p-3" value={area} onChange={(e) => setArea(e.target.value)} placeholder="שכונה" />
          </div>
          <div>
            <div className="flex gap-2">
              <input dir="ltr" className="flex-1 rounded-2xl border border-park-200 p-3 font-mono text-sm" value={coords} onChange={(e) => setCoords(e.target.value)} />
              <button
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => setCoords(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
                    () => setErr('לא הצלחנו לקבל מיקום'),
                    { enableHighAccuracy: true, timeout: 8000 },
                  )
                }}
                className="rounded-2xl bg-park-100 px-3 text-sm font-semibold text-park-700"
              >📍 אני כאן</button>
            </div>
            <p className="mt-1 text-[11px] text-park-400">להזזת הפארק — הדביקו מיקום חדש (כל פורמט) או עמדו בפארק ולחצו "אני כאן".</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFenced(!fenced)} className={chip(fenced)}>🚧 מגודר</button>
            <button onClick={() => setHasWater(!hasWater)} className={chip(hasWater)}>💧 ברזייה</button>
            <button onClick={() => setShade(!shade)} className={chip(shade)}>🌳 צל</button>
            <button onClick={() => setLighting(!lighting)} className={chip(lighting)}>💡 תאורה</button>
            <button onClick={() => setBenches(!benches)} className={chip(benches)}>🪑 ספסלים</button>
            {(['small', 'medium', 'large'] as const).map((s) => (
              <button key={s} onClick={() => setSize(s)} className={chip(size === s)}>
                {s === 'small' ? 'קטן' : s === 'medium' ? 'בינוני' : 'גדול'}
              </button>
            ))}
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button className="btn-primary w-full" disabled={busy} onClick={save}>{busy ? 'שומר…' : 'שמירת שינויים'}</button>
          {confirmDel ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => setConfirmDel(false)}>ביטול</button>
              <button className="btn bg-pink-500 text-white" disabled={busy} onClick={doDelete}>כן, למחוק</button>
            </div>
          ) : (
            <button className="w-full text-center text-xs text-pink-600 underline underline-offset-2" onClick={() => setConfirmDel(true)}>
              מחיקת הפארק מהמפה
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
