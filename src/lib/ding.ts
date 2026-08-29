// Tiny notification sound + vibration, no audio files needed.
// iOS only lets audio start after a user gesture, so App calls unlockAudio()
// on the first touch; after that playDing() works anytime the app is open.
let ctx: AudioContext | null = null

export function unlockAudio(): void {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { /* no audio support — fine */ }
}

export function playDing(): void {
  try {
    if (!ctx || ctx.state !== 'running') return
    const t = ctx.currentTime
    // Two quick soft notes — friendly "dog collar" chime.
    for (const [freq, start] of [[880, 0], [1318.5, 0.09]] as const) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t + start)
      gain.gain.exponentialRampToValueAtTime(0.18, t + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + start)
      osc.stop(t + start + 0.4)
    }
  } catch { /* ignore */ }
  try { navigator.vibrate?.([80, 40, 80]) } catch { /* iOS has no vibrate API */ }
}
