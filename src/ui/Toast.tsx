import { useEffect } from 'react'
import { useStore } from '../store'
import DogAvatar from './DogAvatar'

// A banner that slides in from the top when something arrives while you're in
// the app. Chat toasts are LOUD on purpose: dark card that stands out from the
// light UI, big text, and tapping it opens the chat with that friend.
export default function Toast() {
  const toast = useStore((s) => s.toast)
  const clearToast = useStore((s) => s.clearToast)
  const requestOpenChat = useStore((s) => s.requestOpenChat)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(clearToast, toast.friendId ? 7000 : 4000)
    return () => window.clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null
  const isChat = !!toast.friendId

  return (
    <div className="absolute top-2 inset-x-3 z-[1500]">
      <button
        onClick={() => {
          if (toast.friendId) requestOpenChat(toast.friendId)
          else clearToast()
        }}
        className="w-full text-start mx-auto max-w-md flex items-center gap-3 rounded-2xl px-4 py-3.5 animate-pop"
        style={isChat
          ? { background: 'linear-gradient(135deg,#14231a,#1d3a26)', boxShadow: '0 10px 34px rgba(0,0,0,0.45), 0 0 0 3px #4fb84a' }
          : { background: '#ffffff', boxShadow: '0 8px 24px rgba(20,60,30,0.18)', border: '1px solid #dcefd8' }}
      >
        {toast.photo && <DogAvatar photo={toast.photo} size={44} ring="live" />}
        <div className="flex-1 min-w-0">
          <div className={`text-base font-bold leading-snug ${isChat ? 'text-white' : 'text-park-800'}`}>
            {isChat ? '💬 ' : ''}{toast.text}
          </div>
          {isChat && <div className="text-xs font-semibold text-park-300 mt-0.5">לחצו כדי לענות ←</div>}
        </div>
        {!isChat && <span className="text-park-300 text-xs shrink-0">סגור</span>}
      </button>
    </div>
  )
}
