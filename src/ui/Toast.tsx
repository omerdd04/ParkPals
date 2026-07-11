import { useEffect } from 'react'
import { useStore } from '../store'
import DogAvatar from './DogAvatar'

// A transient banner that slides in from the top when something arrives while
// you're using the app (e.g. a friend replies in the mini-chat).
export default function Toast() {
  const toast = useStore((s) => s.toast)
  const clearToast = useStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(clearToast, 4000)
    return () => window.clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null
  return (
    <div className="absolute top-2 inset-x-3 z-[1500]" onClick={clearToast}>
      <div className="mx-auto max-w-md flex items-center gap-3 rounded-2xl bg-white shadow-lg border border-park-100 px-3 py-2.5 animate-pop">
        {toast.photo && <DogAvatar photo={toast.photo} size={36} ring="live" />}
        <div className="flex-1 text-sm font-medium text-park-800">💬 {toast.text}</div>
        <span className="text-park-300 text-xs">סגור</span>
      </div>
    </div>
  )
}
