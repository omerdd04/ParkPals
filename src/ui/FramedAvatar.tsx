import type { Frame } from '../data/frames'
import DogAvatar from './DogAvatar'

// A dog photo wrapped in a prestige frame (solid or shimmering metallic).
export default function FramedAvatar({
  photo, frame, size = 48, pad = 3,
}: {
  photo: string
  frame: Frame
  size?: number
  pad?: number
}) {
  return (
    <div
      className={`rounded-full ${frame.metallic ? 'frame-metallic' : ''}`}
      style={{ padding: pad, background: frame.css }}
    >
      <div className="rounded-full bg-white" style={{ padding: 2 }}>
        <DogAvatar photo={photo} size={size} ring="none" />
      </div>
    </div>
  )
}
