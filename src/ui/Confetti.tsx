import { useEffect, useState } from 'react'

const COLORS = ['#3ea033', '#f59e0b', '#e0357a', '#2563eb', '#7c3aed', '#5ebb52']

// Lightweight CSS confetti burst — no dependencies. Renders `count` pieces that
// fall and fade, then unmounts itself via onDone.
export default function Confetti({ count = 60, onDone }: { count?: number; onDone?: () => void }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: (i * 37) % 100,
      delay: (i % 10) * 60,
      duration: 1600 + ((i * 53) % 900),
      color: COLORS[i % COLORS.length],
      size: 6 + (i % 4) * 2,
      rotate: (i * 47) % 360,
    })),
  )

  useEffect(() => {
    const t = window.setTimeout(() => onDone?.(), 2600)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <div className="pointer-events-none fixed inset-0 z-[2000] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-12px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}ms ${p.delay}ms ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
