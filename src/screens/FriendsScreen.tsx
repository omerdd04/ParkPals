import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { formatCode, presenceActive, scoreFrameColor, useStore } from '../store'
import { parkById } from '../data/parks'
import type { Friend } from '../types'
import { useNow } from '../ui/useNow'
import DogAvatar from '../ui/DogAvatar'
import Sheet from '../ui/Sheet'
import QuickChat from './QuickChat'

export default function FriendsScreen() {
  const now = useNow(1000)
  const owner = useStore((s) => s.owner)
  const dog = useStore((s) => s.dog)
  const friends = useStore((s) => s.friends)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const addFriendByCode = useStore((s) => s.addFriendByCode)

  const [myQr, setMyQr] = useState('')
  const [showMyCode, setShowMyCode] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [addMsg, setAddMsg] = useState<{ ok: boolean; message: string } | null>(null)
  const [chatFriend, setChatFriend] = useState<Friend | null>(null)

  const myFullCode = formatCode(owner.personalCode)

  useEffect(() => {
    if (owner.personalCode) {
      QRCode.toDataURL(`onyx://friend/${owner.personalCode}`, {
        width: 240, margin: 1, color: { dark: '#21521e', light: '#ffffff' },
      }).then(setMyQr)
    }
  }, [owner.personalCode])

  const favorites = friends.filter((f) => f.favorite)
  const others = friends.filter((f) => !f.favorite)

  const liveMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of friends) {
      if (f.presence && presenceActive(f.presence, now)) {
        const park = parkById(f.presence.parkId)
        m.set(f.id, f.presence.kind === 'heading' ? `בדרך ל${park?.name ?? 'פארק'}` : `בפארק ${park?.name ?? ''}`)
      }
    }
    return m
  }, [friends, now])

  function handleAdd() {
    const res = addFriendByCode(codeInput)
    setAddMsg(res)
    if (res.ok) setCodeInput('')
  }

  function FriendRow({ f }: { f: Friend }) {
    const live = liveMap.get(f.id)
    const frame = scoreFrameColor(f.score)
    return (
      <div className="card !p-3 flex items-center gap-3">
        <button onClick={() => setChatFriend(f)} className="relative">
          <DogAvatar photo={f.dogPhoto} size={48} ringColor={frame} />
          {live && <span className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-white" style={{ background: f.presence?.kind === 'heading' ? '#f59e0b' : '#3ea033' }} />}
        </button>
        <div className="flex-1 min-w-0" onClick={() => setChatFriend(f)}>
          <div className="font-bold text-park-800">{f.dogName}</div>
          <div className="text-xs text-park-500 truncate">
            {f.ownerName} · {f.city}
            {live && <span className="text-park-600 font-semibold"> · {live}</span>}
          </div>
        </div>
        <button onClick={() => toggleFavorite(f.id)} className={`h-9 w-9 grid place-items-center rounded-full text-lg ${f.favorite ? 'bg-pink-100' : 'bg-park-50'}`} title="חבר מועדף">
          {f.favorite ? '⭐' : '☆'}
        </button>
        <button onClick={() => setChatFriend(f)} className="h-9 w-9 grid place-items-center rounded-full bg-park-100 text-lg">💬</button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-3 pb-6 space-y-4">
      <h1 className="text-lg font-extrabold text-park-800">חברים לכלב</h1>

      <div className="card bg-gradient-to-br from-park-500 to-park-600 !border-0 text-white">
        <div className="flex items-center gap-3">
          <DogAvatar photo={dog.photo} size={52} ring="none" className="!bg-white/20" />
          <div className="flex-1">
            <div className="font-bold text-lg">{dog.name || 'הכלב שלי'}</div>
            <div className="text-white/80 text-sm">הקוד האישי שלך</div>
            <div className="font-mono text-xl tracking-wider mt-0.5">{myFullCode}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="bg-white text-park-700 btn !py-2.5 font-semibold" onClick={() => setShowMyCode(true)}>📷 הצג QR</button>
          <button className="bg-white/15 text-white btn !py-2.5 font-semibold" onClick={() => setShowAdd(true)}>➕ הוסף חבר</button>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-park-800">⭐ מועדפים</h2>
          <span className="text-xs text-park-500">מקבלים התראה כשהם יוצאים לפארק</span>
        </div>
        {favorites.length === 0 ? (
          <p className="text-sm text-park-400">אין עדיין חברים מועדפים. הוסיפו ⭐ לחברים כדי לקבל מהם התראות אוטומטיות.</p>
        ) : (
          <div className="space-y-2">{favorites.map((f) => <FriendRow key={f.id} f={f} />)}</div>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="font-bold text-park-800 mb-2">כל החברים</h2>
          <div className="rounded-2xl bg-park-50 border border-park-100 p-3 text-xs text-park-600 mb-2 leading-relaxed">
            🔔 חברים שאינם מועדפים לא ישלחו לך התראה לטלפון — הם פשוט יופיעו כאן וגם על המפה כשהם בפארק,
            כדי שלא תתפספסו אבל גם לא תוצפו. רוצים לקבל מהם התראות? הוסיפו ⭐.
          </div>
          <div className="space-y-2">{others.map((f) => <FriendRow key={f.id} f={f} />)}</div>
        </section>
      )}

      <Sheet open={showMyCode} onClose={() => setShowMyCode(false)} title="שמרו אותי כחבר">
        <div className="flex flex-col items-center gap-3 py-2">
          {myQr && <img src={myQr} alt="QR" className="w-56 h-56 rounded-2xl border border-park-100" />}
          <div className="font-mono text-2xl tracking-widest text-park-700">{myFullCode}</div>
          <p className="text-sm text-park-500 text-center">תנו לחבר לסרוק את הקוד — או להקליד את הקוד האישי — כדי לשמור אתכם.</p>
        </div>
      </Sheet>

      <Sheet open={showAdd} onClose={() => { setShowAdd(false); setAddMsg(null) }} title="הוספת חבר">
        <div className="space-y-3">
          <p className="text-sm text-park-600">הקלידו את 4 התווים של הקוד האישי — הקידומת <span className="font-mono">ONX-</span> נוספת לבד.</p>
          <div className="flex items-center gap-2 rounded-2xl border border-park-200 p-2 pr-4">
            <span className="font-mono text-lg text-park-400">ONX-</span>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder="XXXX"
              maxLength={4}
              className="flex-1 bg-transparent font-mono text-2xl tracking-[0.3em] text-center outline-none"
            />
          </div>
          {addMsg && (
            <div className={`text-sm rounded-xl p-2.5 ${addMsg.ok ? 'bg-park-100 text-park-700' : 'bg-pink-50 text-pink-700'}`}>{addMsg.message}</div>
          )}
          <button className="btn-primary w-full" disabled={codeInput.length !== 4} onClick={handleAdd}>שמור חבר</button>
        </div>
      </Sheet>

      <QuickChat friend={chatFriend} onClose={() => setChatFriend(null)} />
    </div>
  )
}
