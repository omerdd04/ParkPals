import { useEffect, useRef } from 'react'
import { useStore } from '../store'

const COLORS = ['#2d9c3a', '#8fd455', '#ff5a86', '#ffb347', '#2563eb', '#7c3aed', '#f5d774', '#4fd1c5']

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vrot: number
  color: string
  shape: 'rect' | 'circle' | 'ribbon'
  flutter: number
  flutterSpeed: number
  wobble: number
}

// Physics-based canvas confetti: an upward burst that falls under gravity with
// air drag, per-piece rotation, and a sideways flutter — reads as real confetti,
// not flat CSS squares. Self-contained, no dependencies.
export default function Confetti({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useStore((s) => s.settings.reduceMotion)

  useEffect(() => {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || prefersReduce) {
      const t = window.setTimeout(() => onDone?.(), 300)
      return () => window.clearTimeout(t)
    }

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    // Two launch points (bottom corners) firing up and inward, plus a top sprinkle.
    const pieces: Piece[] = []
    const launch = (ox: number, dir: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const angle = (-Math.PI / 2) + dir * (Math.random() * 0.5) // mostly up
        const speed = 9 + Math.random() * 9
        pieces.push(makePiece(ox, H + 10, Math.cos(angle) * speed, Math.sin(angle) * speed))
      }
    }
    launch(W * 0.12, 1, 70)
    launch(W * 0.88, -1, 70)
    for (let i = 0; i < 40; i++) pieces.push(makePiece(Math.random() * W, -10, (Math.random() - 0.5) * 3, 2 + Math.random() * 2))

    const gravity = 0.22
    const drag = 0.992
    let raf = 0
    const start = performance.now()

    const frame = (t: number) => {
      const elapsed = t - start
      ctx.clearRect(0, 0, W, H)
      let alive = 0
      for (const p of pieces) {
        p.vy += gravity
        p.vx *= drag
        p.vy *= drag
        p.wobble += p.flutterSpeed
        p.x += p.vx + Math.sin(p.wobble) * p.flutter
        p.y += p.vy
        p.rot += p.vrot
        if (p.y < H + 30) alive++

        const fade = elapsed > 2200 ? Math.max(0, 1 - (elapsed - 2200) / 1000) : 1
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = fade
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'ribbon') {
          // thin fluttering ribbon; scaleY by cos(rot) fakes a 3D twist
          ctx.scale(1, Math.max(0.25, Math.cos(p.rot)))
          ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2)
        } else {
          ctx.scale(1, Math.max(0.3, Math.cos(p.rot * 0.8)))
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7)
        }
        ctx.restore()
      }
      if (alive > 0 && elapsed < 3600) {
        raf = requestAnimationFrame(frame)
      } else {
        onDone?.()
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [reduceMotion, onDone])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[2000]" style={{ width: '100%', height: '100%' }} />
}

function makePiece(x: number, y: number, vx: number, vy: number): Piece {
  const shapes: Piece['shape'][] = ['rect', 'rect', 'circle', 'ribbon']
  return {
    x, y, vx, vy,
    size: 6 + Math.random() * 8,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.4,
    color: COLORS[(Math.random() * COLORS.length) | 0],
    shape: shapes[(Math.random() * shapes.length) | 0],
    flutter: 0.4 + Math.random() * 1.2,
    flutterSpeed: 0.05 + Math.random() * 0.1,
    wobble: Math.random() * Math.PI * 2,
  }
}
