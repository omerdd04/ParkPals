import { useStore } from '../store'
import type { Friend, QuickMsgType } from '../types'
import Sheet from '../ui/Sheet'
import DogAvatar from '../ui/DogAvatar'

export const MSG_LABEL: Record<QuickMsgType, string> = {
  invite_walk: '🐾 בא/ה לסיבוב בפארק?',
  on_my_way: '🚶 אני בדרך לפארק',
  yes_coming: '✅ כן, מגיע/ה!',
  not_this_time: '🙅 לא הפעם',
  next_time: '🔁 פעם הבאה',
  missed_today: '😅 פספסנו אחד את השני היום',
  share_phone: '📞 שיתוף מספר טלפון',
}

// The only messages a user can send — pure tap, no typing.
const SEND_OPTIONS: QuickMsgType[] = [
  'invite_walk',
  'on_my_way',
  'yes_coming',
  'not_this_time',
  'next_time',
  'missed_today',
]

interface Props {
  friend: Friend | null
  parkName?: string
  onClose: () => void
}

export default function QuickChat({ friend, parkName, onClose }: Props) {
  const chats = useStore((s) => s.chats)
  const sendMessage = useStore((s) => s.sendMessage)
  const myPhone = useStore((s) => s.owner.phone ?? '')

  if (!friend) return null
  const thread = chats.filter((c) => c.friendId === friend.id).sort((a, b) => a.at - b.at)

  return (
    <Sheet open={!!friend} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <DogAvatar photo={friend.dogPhoto} size={48} ring={friend.favorite ? 'favorite' : 'none'} />
        <div>
          <div className="font-bold text-park-800">{friend.dogName}</div>
          <div className="text-sm text-park-500">של {friend.ownerName} · {friend.city}</div>
        </div>
      </div>

      <div className="bg-park-50 rounded-2xl p-3 max-h-52 overflow-y-auto no-scrollbar mb-4 min-h-[64px] flex flex-col gap-2">
        {thread.length === 0 && (
          <p className="text-center text-sm text-park-400 py-4">שלחו הודעה מהירה כדי לתאם סיבוב 🐕</p>
        )}
        {thread.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm font-medium ${
                m.fromMe ? 'bg-park-500 text-white' : 'bg-white border border-park-200 text-park-800'
              }`}
            >
              {m.type === 'share_phone' ? (
                <>
                  📞 {m.fromMe ? 'שיתפת מספר טלפון' : 'קיבלת מספר טלפון'}
                  {m.parkName && (
                    <a href={`tel:${m.parkName}`} dir="ltr" className="block mt-0.5 font-mono underline underline-offset-2">
                      {m.parkName}
                    </a>
                  )}
                </>
              ) : (
                <>
                  {MSG_LABEL[m.type]}
                  {m.parkName && <div className="text-[11px] opacity-80 mt-0.5">📍 {m.parkName}</div>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold text-park-500 mb-2">בחרו הודעה — בלי הקלדה:</div>
      <div className="grid grid-cols-2 gap-2">
        {SEND_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => sendMessage(friend.id, t, parkName)}
            className="btn-soft text-sm !py-2.5 text-start"
          >
            {MSG_LABEL[t]}
          </button>
        ))}
      </div>

      {myPhone ? (
        <button
          onClick={() => sendMessage(friend.id, 'share_phone', myPhone)}
          className="mt-2 w-full btn-soft text-sm !py-2.5 font-semibold"
        >
          📞 שתפו את המספר שלי ({myPhone})
        </button>
      ) : (
        <p className="mt-2 text-center text-[11px] text-park-400">
          רוצים לשתף מספר טלפון? הוסיפו אותו ב"עוד ← עריכת פרופיל" 📞
        </p>
      )}
    </Sheet>
  )
}
