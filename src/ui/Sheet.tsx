import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

// A simple bottom-sheet modal used across screens.
export default function Sheet({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 animate-pop" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 animate-pop max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-park-100" />
        {title && <h2 className="text-lg font-bold text-park-800 mb-3">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
