import { useState } from 'react'
import { useStore } from '../store'
import Sheet from '../ui/Sheet'

const KIND_EMOJI: Record<string, string> = {
  friend_heading: '🚶',
  friend_at_park: '🟢',
  invite: '🐾',
  reply: '💬',
  system: '🔔',
}

function timeAgo(at: number): string {
  const diff = Date.now() - at
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'עכשיו'
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שעות`
  return `לפני ${Math.floor(h / 24)} ימים`
}

export default function NotificationsButton() {
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markNotificationsRead)
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-10 w-10 grid place-items-center rounded-full bg-white border border-park-100 text-xl"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-pink-500 text-white text-[11px] font-bold border-2 border-white">
            {unread}
          </span>
        )}
      </button>

      <Sheet
        open={open}
        onClose={() => { markRead(); setOpen(false) }}
        title="התראות"
      >
        {notifications.length === 0 && (
          <p className="text-center text-park-400 py-6 text-sm">אין התראות עדיין 🐾</p>
        )}
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 rounded-2xl p-3 ${n.read ? 'bg-white border border-park-100' : 'bg-park-50 border border-park-200'}`}
            >
              <span className="text-xl">{KIND_EMOJI[n.kind] ?? '🔔'}</span>
              <div className="flex-1">
                <div className="text-sm text-park-800">{n.text}</div>
                <div className="text-[11px] text-park-400 mt-0.5">{timeAgo(n.at)}</div>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </>
  )
}
