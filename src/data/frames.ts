// Prestige photo-frames — a collectible ladder that friends can see around your
// dog's photo. Climbing it is part of the game: teach tricks, finish lessons,
// and keep the happiness meter high.

export interface Frame {
  id: string
  name: string
  emoji: string
  min: number // prestige points needed
  css: string // ring background (supports gradients)
  metallic?: boolean // adds a shimmer animation
}

export const FRAMES: Frame[] = [
  { id: 'gray', name: 'אפור', emoji: '⚪', min: 0, css: '#9ca3af' },
  { id: 'blue', name: 'כחול', emoji: '🔵', min: 6, css: '#3b82f6' },
  { id: 'green', name: 'ירוק', emoji: '🟢', min: 14, css: '#22c55e' },
  { id: 'red', name: 'אדום', emoji: '🔴', min: 24, css: '#ef4444' },
  { id: 'platinum', name: 'פלטינה', emoji: '🩶', min: 36, css: 'linear-gradient(135deg,#e9eaec,#b6bdc6,#ffffff,#aeb6bf,#dfe3e7)', metallic: true },
  { id: 'silver', name: 'כסף', emoji: '🥈', min: 48, css: 'linear-gradient(135deg,#c9ced4,#8b9299,#f2f4f6,#a9b0b8,#c9ced4)', metallic: true },
  { id: 'gold', name: 'זהב', emoji: '🥇', min: 62, css: 'linear-gradient(135deg,#f6d365,#d99e17,#fff3bf,#e6b422,#f6d365)', metallic: true },
  { id: 'diamond', name: 'יהלום', emoji: '💎', min: 80, css: 'linear-gradient(135deg,#b7f5ff,#5ec8e0,#ffffff,#8fe3ff,#b7f5ff)', metallic: true },
]

export function frameByIndex(i: number): Frame {
  return FRAMES[Math.max(0, Math.min(FRAMES.length - 1, i))]
}

export function frameIndexForPoints(points: number): number {
  let idx = 0
  for (let i = 0; i < FRAMES.length; i++) if (points >= FRAMES[i].min) idx = i
  return idx
}

export function frameForPoints(points: number): Frame {
  return FRAMES[frameIndexForPoints(points)]
}

export function nextFrame(points: number): Frame | null {
  const idx = frameIndexForPoints(points)
  return FRAMES[idx + 1] ?? null
}

// Your prestige: tricks (already weighted) + lessons + sustained happiness.
export function prestigePoints(trickPts: number, lessonsDone: number, avgHappiness: number): number {
  return trickPts + lessonsDone * 3 + Math.floor(avgHappiness / 5)
}

// Friends only expose an overall score (0–100); map that to a frame so the
// network shows a satisfying spread of tiers to aspire to.
export function frameForScore(score: number | undefined): Frame {
  if (score == null) return FRAMES[0]
  const thresholds = [0, 35, 50, 62, 72, 80, 88, 94] // aligns to the 8 tiers
  let idx = 0
  for (let i = 0; i < thresholds.length; i++) if (score >= thresholds[i]) idx = i
  return FRAMES[idx]
}
