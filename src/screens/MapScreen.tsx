import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { PARKS, parkById } from '../data/parks'
import { presenceActive, presenceRemainingMs, useStore } from '../store'
import type { Friend, Park } from '../types'
import { useNow, formatCountdown } from '../ui/useNow'
import DogAvatar from '../ui/DogAvatar'
import Sheet from '../ui/Sheet'
import QuickChat from './QuickChat'
import NotificationsButton from './NotificationsButton'

const ISRAEL_CENTER: [number, number] = [31.9, 34.9]

// Build a leaflet divIcon showing a park pin with the live dog count.
function parkIcon(count: number, mine: boolean): L.DivIcon {
  const badge =
    count > 0
      ? `<span style="position:absolute;top:-6px;right:-6px;background:#e0357a;color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 4px;border:2px solid #fff">${count}</span>`
      : ''
  const ring = mine ? 'box-shadow:0 0 0 3px #3ea033;' : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative"><div style="width:38px;height:38px;border-radius:50% 50% 50% 0;background:#fff;transform:rotate(-45deg);border:2px solid #3ea033;${ring}display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.25)"><span style="transform:rotate(45deg);font-size:18px">🌳</span></div>${badge}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  })
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.8 })
  }, [map, target])
  return null
}

// Keep Leaflet in sync with its container. Late layout shifts (a web font
// finishing/failing to load, device rotation, sheet transitions) resize the
// container after init; a ResizeObserver re-measures the moment that happens so
// the projection never goes stale and markers stay put.
function KeepSized() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const sync = () => map.invalidateSize({ animate: false })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.addEventListener('resize', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
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
  const clearPresence = useStore((s) => s.clearPresence)

  const [openPark, setOpenPark] = useState<Park | null>(null)
  const [statusSheet, setStatusSheet] = useState(false)
  const [chatFriend, setChatFriend] = useState<Friend | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  // Only mount Leaflet once the layout has settled — after web fonts resolve
  // (they change the header height) and one animation frame — so it reads the
  // correct container size at init instead of caching a stale one.
  const [mapReady, setMapReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    const go = () => requestAnimationFrame(() => !cancelled && setMapReady(true))
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts?.ready) {
      fonts.ready.then(go)
      // Fallback in case fonts never resolve (e.g. blocked network).
      window.setTimeout(go, 600)
    } else {
      go()
    }
    return () => { cancelled = true }
  }, [])

  // Which friends are actively present, grouped by park.
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

  const myPark = myPresence && presenceActive(myPresence, now) ? parkById(myPresence.parkId) : null
  // include myself in count for my park
  function countAt(parkId: string): number {
    let c = presenceByPark.get(parkId)?.length ?? 0
    if (myPark?.id === parkId && myPresence?.kind === 'at_park') c += 1
    return c
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 bg-park-50 z-[500]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-park-500">שלום {owner.name} {dog.photo}</div>
            <h1 className="text-lg font-extrabold text-park-800">פארקים לידך</h1>
          </div>
          <NotificationsButton />
        </div>

        {/* Floating dog circles — who's live right now */}
        {liveDogs.length > 0 && (
          <div className="mt-2 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {liveDogs.map((f) => {
              const heading = f.presence!.kind === 'heading'
              return (
                <button
                  key={f.id}
                  onClick={() => setChatFriend(f)}
                  className="shrink-0 flex flex-col items-center gap-1 animate-floaty"
                  style={{ animationDelay: `${(f.id.charCodeAt(0) % 5) * 0.3}s` }}
                >
                  <DogAvatar photo={f.dogPhoto} size={52} ring={heading ? 'heading' : 'live'} />
                  <span className="text-[10px] font-semibold text-park-700 max-w-[54px] truncate">
                    {f.dogName}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        {mapReady && (
          <MapContainer center={ISRAEL_CENTER} zoom={8} className="absolute inset-0" zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <KeepSized />
            <FlyTo target={flyTarget} />
            {PARKS.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={parkIcon(countAt(p.id), myPark?.id === p.id)}
                eventHandlers={{ click: () => setOpenPark(p) }}
              />
            ))}
          </MapContainer>
        )}

        {/* My presence banner */}
        {myPark && myPresence && (
          <div className="absolute top-3 inset-x-3 z-[500] card !p-3 flex items-center gap-3 animate-pop">
            <span className="text-2xl">{myPresence.kind === 'heading' ? '🚶' : '🟢'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-park-800 truncate">
                {myPresence.kind === 'heading' ? 'בדרך ל' : 'נמצא ב'}{myPark.name}
              </div>
              <div className="text-xs text-park-500">
                נעלם בעוד {formatCountdown(presenceRemainingMs(myPresence, now))}
                {myPresence.sharesLocation ? ' · משתף מיקום 📍' : ''}
              </div>
            </div>
            <button className="btn-ghost !py-2 !px-3 text-sm" onClick={clearPresence}>
              כבה
            </button>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setStatusSheet(true)}
          className="absolute bottom-4 left-4 z-[500] btn-primary !rounded-full !px-5 shadow-lg flex items-center gap-2"
        >
          <span className="text-lg">🐾</span> אני יוצא לפארק
        </button>
      </div>

      {/* Park detail sheet */}
      <Sheet open={!!openPark} onClose={() => setOpenPark(null)} title={openPark?.name}>
        {openPark && (
          <ParkDetail
            park={openPark}
            present={presenceByPark.get(openPark.id) ?? []}
            mineHere={myPark?.id === openPark.id}
            onSetStatus={(kind, shares) => {
              setPresence(openPark.id, kind, shares)
              setOpenPark(null)
              setFlyTarget([openPark.lat, openPark.lng])
            }}
            onChat={(f) => {
              setOpenPark(null)
              setChatFriend(f)
            }}
          />
        )}
      </Sheet>

      {/* Status chooser (from FAB) */}
      <Sheet open={statusSheet} onClose={() => setStatusSheet(false)} title="לאיזה פארק?">
        <StatusChooser
          onPick={(parkId, kind, shares) => {
            setPresence(parkId, kind, shares)
            setStatusSheet(false)
            const p = parkById(parkId)
            if (p) setFlyTarget([p.lat, p.lng])
          }}
          homeCity={owner.city}
        />
      </Sheet>

      <QuickChat friend={chatFriend} parkName={myPark?.name} onClose={() => setChatFriend(null)} />
    </div>
  )
}

function ParkDetail({
  park, present, mineHere, onSetStatus, onChat,
}: {
  park: Park
  present: Friend[]
  mineHere: boolean
  onSetStatus: (kind: 'at_park' | 'heading', shares: boolean) => void
  onChat: (f: Friend) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="chip bg-park-100 text-park-700">{park.city}</span>
        {park.fenced && <span className="chip bg-park-100 text-park-700">🚧 מגודר</span>}
        {park.hasWater && <span className="chip bg-park-100 text-park-700">💧 ברזייה</span>}
        <span className="chip bg-park-100 text-park-700">
          {park.size === 'large' ? 'גדול' : park.size === 'medium' ? 'בינוני' : 'קטן'}
        </span>
      </div>

      <div>
        <div className="text-sm font-semibold text-park-700 mb-2">
          {present.length > 0 ? `${present.length} כלבים בפארק עכשיו` : 'אף אחד לא סימן שהוא בפארק כרגע'}
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
        <button className="btn-primary w-full" onClick={() => onSetStatus('at_park', false)}>
          🟢 אני בפארק עכשיו (נעלם אחרי שעה)
        </button>
        <button className="btn-soft w-full" onClick={() => onSetStatus('at_park', true)}>
          📍 אני בפארק + שתף מיקום חי
        </button>
        <button className="btn-ghost w-full" onClick={() => onSetStatus('heading', false)}>
          🚶 יוצא לכאן ב-15 הדקות הקרובות
        </button>
        {mineHere && <p className="text-center text-xs text-park-500">אתה כבר מסומן כאן ✓</p>}
      </div>
    </div>
  )
}

function StatusChooser({
  onPick, homeCity,
}: {
  onPick: (parkId: string, kind: 'at_park' | 'heading', shares: boolean) => void
  homeCity: string
}) {
  const [city, setCity] = useState(homeCity || 'תל אביב')
  const [parkId, setParkId] = useState('')
  const cityParks = PARKS.filter((p) => p.city === city)
  const cities = Array.from(new Set(PARKS.map((p) => p.city)))

  return (
    <div className="space-y-3">
      <select className="w-full rounded-2xl border border-park-200 p-3" value={city} onChange={(e) => { setCity(e.target.value); setParkId('') }}>
        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
        {cityParks.map((p) => (
          <button
            key={p.id}
            onClick={() => setParkId(p.id)}
            className={`w-full text-start rounded-2xl border p-3 text-sm ${parkId === p.id ? 'border-park-500 bg-park-50' : 'border-park-200 bg-white'}`}
          >
            <div className="font-semibold text-park-800">{p.name}</div>
            <div className="text-xs text-park-500">{p.fenced ? '🚧 מגודר · ' : ''}{p.hasWater ? '💧 ברזייה' : ''}</div>
          </button>
        ))}
      </div>
      <div className="space-y-2 pt-1">
        <button className="btn-primary w-full" disabled={!parkId} onClick={() => onPick(parkId, 'at_park', false)}>
          🟢 אני בפארק עכשיו
        </button>
        <button className="btn-soft w-full" disabled={!parkId} onClick={() => onPick(parkId, 'at_park', true)}>
          📍 בפארק + שתף מיקום
        </button>
        <button className="btn-ghost w-full" disabled={!parkId} onClick={() => onPick(parkId, 'heading', false)}>
          🚶 יוצא לכיוון ב-15 דק'
        </button>
      </div>
    </div>
  )
}
