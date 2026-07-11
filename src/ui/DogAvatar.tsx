interface Props {
  photo: string
  size?: number
  ring?: 'none' | 'live' | 'heading' | 'favorite'
  ringColor?: string // overrides the preset ring with a solid color (e.g. score frame)
  className?: string
}

const RING: Record<string, string> = {
  none: 'ring-2 ring-park-100',
  live: 'ring-[3px] ring-park-500',
  heading: 'ring-[3px] ring-amber-400',
  favorite: 'ring-[3px] ring-pink-400',
}

export default function DogAvatar({ photo, size = 44, ring = 'none', ringColor, className = '' }: Props) {
  // Treat it as an image only if it's clearly a URL/data-URI; otherwise it's an
  // emoji avatar (including compound emoji like 🐕‍🦺 that exceed 4 UTF-16 units).
  const isImage = /^(data:|https?:|\/)/.test(photo)
  const style: React.CSSProperties = { width: size, height: size, fontSize: size * 0.55 }
  if (ringColor) {
    style.boxShadow = `0 0 0 3px ${ringColor}`
  }
  return (
    <div
      className={`grid place-items-center rounded-full bg-park-50 overflow-hidden ${ringColor ? '' : RING[ring]} ${className}`}
      style={style}
    >
      {isImage ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span>{photo}</span>}
    </div>
  )
}
