// Trick catalog with difficulty tiers. Each mastered trick earns points that
// feed the owner's level (stars → diamonds).

export type TrickTier = 'basic' | 'advanced' | 'impressive'

export interface Trick {
  id: string
  label: string
  tier: TrickTier
}

export const TRICK_TIERS: { tier: TrickTier; title: string; emoji: string; points: number }[] = [
  { tier: 'basic', title: 'בסיס', emoji: '🐾', points: 1 },
  { tier: 'advanced', title: 'מתקדם', emoji: '🏆', points: 3 },
  { tier: 'impressive', title: 'מרשים', emoji: '⭐', points: 6 },
]

export const TRICKS: Trick[] = [
  // basic
  { id: 'sit', label: 'שב', tier: 'basic' },
  { id: 'stay', label: 'חכה', tier: 'basic' },
  { id: 'down', label: 'ארצה', tier: 'basic' },
  { id: 'come', label: 'בוא', tier: 'basic' },
  { id: 'leave', label: 'עזוב', tier: 'basic' },
  { id: 'drop', label: 'שחרר', tier: 'basic' },
  { id: 'wait', label: 'המתן', tier: 'basic' },
  { id: 'highfive', label: "כיף (High five)", tier: 'basic' },
  { id: 'speak', label: 'דבר (נביחה)', tier: 'basic' },
  // advanced
  { id: 'rollover', label: 'התגלגל', tier: 'advanced' },
  { id: 'spin', label: 'הסתובב', tier: 'advanced' },
  { id: 'playdead', label: 'מת', tier: 'advanced' },
  { id: 'beg', label: 'התחנן', tier: 'advanced' },
  { id: 'bow', label: 'קידה', tier: 'advanced' },
  { id: 'fetch', label: 'הבא והחזר', tier: 'advanced' },
  { id: 'crawl', label: 'זחל', tier: 'advanced' },
  { id: 'weave', label: 'שזירה בין הרגליים', tier: 'advanced' },
  { id: 'backup', label: 'לאחור', tier: 'advanced' },
  { id: 'bell', label: 'צלצל בפעמון', tier: 'advanced' },
  { id: 'gotobed', label: 'למקום / למיטה', tier: 'advanced' },
  { id: 'target', label: 'נגיעה במטרה', tier: 'advanced' },
  // impressive
  { id: 'hoop', label: 'קפיצה בחישוק', tier: 'impressive' },
  { id: 'tidy', label: 'לסדר צעצועים', tier: 'impressive' },
  { id: 'opendoor', label: 'לפתוח דלת', tier: 'impressive' },
  { id: 'skate', label: 'סקייטבורד', tier: 'impressive' },
  { id: 'balance', label: 'לאזן חטיף על האף', tier: 'impressive' },
  { id: 'wave', label: 'לנופף שלום', tier: 'impressive' },
  { id: 'hug', label: 'חיבוק', tier: 'impressive' },
  { id: 'kiss', label: 'נשיקה', tier: 'impressive' },
]

export function trickPoints(ids: string[]): number {
  const byTier = Object.fromEntries(TRICK_TIERS.map((t) => [t.tier, t.points]))
  return ids.reduce((sum, id) => {
    const t = TRICKS.find((x) => x.id === id)
    return sum + (t ? byTier[t.tier] : 0)
  }, 0)
}
