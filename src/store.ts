import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trickPoints } from './data/tricks'
import { isSupabaseConfigured } from './lib/supabase'
import * as backend from './lib/backend'
import type {
  AppNotification,
  CareAction,
  ChatMessage,
  Complaint,
  DogProfile,
  Friend,
  OwnerProfile,
  Presence,
  PresenceKind,
  QuickMsgType,
} from './types'

const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

function genCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)]
  return s // raw 4 chars; displayed as PP-XXXX
}

export function formatCode(raw: string): string {
  return `PP-${raw.toUpperCase()}`
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const DOG_AVATARS = ['🐕', '🐩', '🐕‍🦺', '🦮', '🐶']

// ---- Demo friends so the network feels alive on first launch ----
// Placed around Ashdod (Rova Dalet) so the demo user sees live activity nearby.
function seedFriends(): Friend[] {
  const now = Date.now()
  return [
    {
      id: 'f1', ownerName: 'דנה', dogName: 'לונה', dogPhoto: '🐕', city: 'אשדוד',
      personalCode: '7HK4', favorite: true, score: 88,
      presence: { parkId: 'ash-rovad-1', kind: 'at_park', sharesLocation: true, startedAt: now - 12 * MIN },
    },
    {
      id: 'f2', ownerName: 'יואב', dogName: 'רקס', dogPhoto: '🦮', city: 'אשדוד',
      personalCode: '3PQ9', favorite: true, score: 74,
      presence: { parkId: 'ash-rovad-1', kind: 'at_park', sharesLocation: false, startedAt: now - 4 * MIN },
    },
    {
      id: 'f3', ownerName: 'מאיה', dogName: "צ'אנס", dogPhoto: '🐩', city: 'אשדוד',
      personalCode: '8ZC2', favorite: false, score: 61,
      presence: { parkId: 'ash-rovad-2', kind: 'heading', sharesLocation: false, startedAt: now - 3 * MIN },
    },
    {
      id: 'f4', ownerName: 'אורי', dogName: 'בלה', dogPhoto: '🐶', city: 'אשדוד',
      personalCode: '5RT6', favorite: true, score: 93,
      presence: { parkId: 'ash-lido', kind: 'at_park', sharesLocation: true, startedAt: now - 25 * MIN },
    },
    {
      id: 'f5', ownerName: 'שירה', dogName: 'מוקה', dogPhoto: '🐕‍🦺', city: 'אשדוד',
      personalCode: '9WD1', favorite: false, score: 55,
    },
    {
      id: 'f6', ownerName: 'תום', dogName: 'ג׳ק', dogPhoto: '🦮', city: 'תל אביב',
      personalCode: '2MB7', favorite: false, score: 70,
    },
  ]
}

interface Toast {
  id: string
  text: string
  photo?: string
}

export type TextScale = 'normal' | 'large' | 'xlarge'
export interface A11ySettings {
  textScale: TextScale
  highContrast: boolean
  reduceMotion: boolean
}
const defaultSettings: A11ySettings = { textScale: 'normal', highContrast: false, reduceMotion: false }

interface Store {
  onboarded: boolean
  owner: OwnerProfile
  dog: DogProfile
  myPresence: Presence | null
  shareLocation: boolean
  userLoc: { lat: number; lng: number } | null
  friends: Friend[]
  chats: ChatMessage[]
  happinessLog: { id: string; action: CareAction; at: number }[]
  academy: Record<string, boolean>
  complaints: Complaint[]
  notifications: AppNotification[]
  toast: Toast | null
  settings: A11ySettings

  // actions
  completeOnboarding: (owner: OwnerProfile, dog: DogProfile) => void
  hydrateProfile: (owner: OwnerProfile, dog: DogProfile, onboarded: boolean) => void
  setFriends: (friends: Friend[]) => void
  setChats: (chats: ChatMessage[]) => void
  appendChat: (msg: ChatMessage) => void
  setPresence: (parkId: string, kind: PresenceKind, sharesLocation: boolean) => void
  setUserLoc: (loc: { lat: number; lng: number } | null) => void
  setShareLocation: (on: boolean) => void
  toggleFavorite: (friendId: string) => void
  addFriendByCode: (rawCode: string) => { ok: boolean; message: string }
  sendMessage: (friendId: string, type: QuickMsgType, parkName?: string) => void
  logCare: (action: CareAction) => void
  completeLesson: (lessonId: string) => void
  addComplaint: (c: Omit<Complaint, 'id' | 'at'>) => void
  markNotificationsRead: () => void
  pushNotification: (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => void
  showToast: (t: Omit<Toast, 'id'>) => void
  clearToast: () => void
  setSettings: (patch: Partial<A11ySettings>) => void
  resetAll: () => void
}

const emptyOwner: OwnerProfile = { name: '', city: '', neighborhood: '', personalCode: '' }
const emptyDog: DogProfile = {
  name: '', breed: '', ageYears: 1, size: 'medium', energy: 'balanced',
  gender: 'male', neutered: false, photo: '🐕',
  tricks: [], treats: [], toys: [], favorites: [], traits: [],
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      onboarded: false,
      owner: emptyOwner,
      dog: emptyDog,
      myPresence: null,
      shareLocation: false,
      userLoc: null,
      friends: isSupabaseConfigured ? [] : seedFriends(),
      chats: [],
      happinessLog: [],
      academy: {},
      complaints: [],
      notifications: [
        { id: uid(), text: 'ברוכים הבאים ל-ParkPals! השלימו את מד השמחה של הכלב היום 🐾', at: Date.now(), read: false, kind: 'system' },
      ],
      toast: null,
      settings: defaultSettings,

      completeOnboarding: (owner, dog) =>
        set({
          onboarded: true,
          owner: { ...owner, personalCode: owner.personalCode || genCode() },
          dog,
        }),

      // Load profile coming from the backend as the source of truth (used right
      // after sign-in). Only marks onboarded when the backend has a real name.
      hydrateProfile: (owner, dog, onboarded) => set({ owner, dog, onboarded }),

      setFriends: (friends) => set({ friends }),
      setChats: (chats) => set({ chats }),
      appendChat: (msg) => set((s) => ({ chats: [...s.chats, msg] })),

      setPresence: (parkId, kind, sharesLocation) => {
        // Single active presence: a new one replaces the previous (turn-on-only).
        set({ myPresence: { parkId, kind, sharesLocation, startedAt: Date.now() } })
        void backend.setPresence(parkId, kind, sharesLocation)
      },

      setUserLoc: (loc) => set({ userLoc: loc }),
      setShareLocation: (on) => set({ shareLocation: on }),

      toggleFavorite: (friendId) => {
        const cur = get().friends.find((f) => f.id === friendId)
        if (cur) void backend.setFavorite(friendId, !cur.favorite)
        set((s) => ({
          friends: s.friends.map((f) =>
            f.id === friendId ? { ...f, favorite: !f.favorite } : f,
          ),
        }))
      },

      addFriendByCode: (rawCode) => {
        const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (clean.length !== 4) return { ok: false, message: 'הקוד הוא 4 תווים (למשל 4KD2)' }
        if (clean === get().owner.personalCode) return { ok: false, message: 'זה הקוד שלך 🙂' }
        const existing = get().friends.find((f) => f.personalCode === clean)
        if (existing) return { ok: false, message: 'החבר הזה כבר שמור אצלך 🐾' }
        const names = ['נועה', 'איתי', 'רוני', 'גיל', 'ליאור', 'עדן']
        const dogs = ['שוקו', 'נלה', 'ריקו', 'זואי', 'באדי', 'פאדג׳']
        const i = Math.floor(Math.random() * names.length)
        const nf: Friend = {
          id: uid(), ownerName: names[i], dogName: dogs[i],
          dogPhoto: DOG_AVATARS[Math.floor(Math.random() * DOG_AVATARS.length)],
          city: get().owner.city || 'אשדוד', personalCode: clean, favorite: false,
          score: 60 + Math.floor(Math.random() * 35),
        }
        set((s) => ({ friends: [...s.friends, nf] }))
        return { ok: true, message: `${nf.dogName} של ${nf.ownerName} נוסף לחברים!` }
      },

      sendMessage: (friendId, type, parkName) => {
        const msg: ChatMessage = { id: uid(), friendId, fromMe: true, type, parkName, at: Date.now() }
        set((s) => ({ chats: [...s.chats, msg] }))
        if (isSupabaseConfigured) {
          // Live mode: deliver for real; replies arrive via realtime, no simulation.
          void backend.sendChat(friendId, type, parkName)
          return
        }
        if (type === 'invite_walk' || type === 'on_my_way') {
          const replyTypes: QuickMsgType[] = ['yes_coming', 'next_time', 'not_this_time']
          const reply = replyTypes[Math.floor(Math.random() * replyTypes.length)]
          window.setTimeout(() => {
            const friend = get().friends.find((f) => f.id === friendId)
            set((s) => ({
              chats: [
                ...s.chats,
                { id: uid(), friendId, fromMe: false, type: reply, parkName, at: Date.now() },
              ],
              notifications: [
                { id: uid(), text: `${friend?.dogName ?? 'חבר'} ענה להזמנה שלך`, at: Date.now(), read: false, kind: 'reply' },
                ...s.notifications,
              ],
              toast: { id: uid(), text: `${friend?.dogName ?? 'חבר'}: ${QUICK_REPLY_SHORT[reply]}`, photo: friend?.dogPhoto },
            }))
          }, 2500)
        }
      },

      logCare: (action) =>
        set((s) => ({ happinessLog: [...s.happinessLog, { id: uid(), action, at: Date.now() }] })),

      completeLesson: (lessonId) =>
        set((s) => ({ academy: { ...s.academy, [lessonId]: true } })),

      addComplaint: (c) => {
        void backend.addComplaint({ parkName: c.parkName, city: c.city, category: c.category, text: c.text })
        set((s) => ({
          complaints: [{ ...c, id: uid(), at: Date.now() }, ...s.complaints],
          notifications: [
            { id: uid(), text: 'התלונה נשלחה למערך הפארקים הארצי. תודה שאכפת לך! 🙏', at: Date.now(), read: false, kind: 'system' },
            ...s.notifications,
          ],
        }))
      },

      markNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      pushNotification: (n) =>
        set((s) => ({ notifications: [{ ...n, id: uid(), at: Date.now(), read: false }, ...s.notifications] })),

      showToast: (t) => set({ toast: { ...t, id: uid() } }),
      clearToast: () => set({ toast: null }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () =>
        set({
          onboarded: false, owner: emptyOwner, dog: emptyDog, myPresence: null,
          shareLocation: false, userLoc: null,
          friends: isSupabaseConfigured ? [] : seedFriends(), chats: [], happinessLog: [], academy: {}, complaints: [],
          notifications: [], toast: null, settings: defaultSettings,
        }),
    }),
    {
      // v3: live-backend era — fresh key so old demo data doesn't linger.
      name: 'parkpals-store-v3',
      partialize: (s) => {
        // Don't persist transient toast.
        const { toast: _toast, ...rest } = s
        return rest
      },
    },
  ),
)

const QUICK_REPLY_SHORT: Record<QuickMsgType, string> = {
  invite_walk: 'הזמנה לסיבוב',
  on_my_way: 'בדרך',
  yes_coming: 'כן, מגיע/ה! ✅',
  not_this_time: 'לא הפעם 🙅',
  next_time: 'פעם הבאה 🔁',
  missed_today: 'פספסנו 😅',
}

// ---- Presence helpers ----

export function presenceActive(p: Presence | null | undefined, now = Date.now()): boolean {
  if (!p) return false
  const ttl = p.kind === 'heading' ? 15 * MIN : HOUR
  return now - p.startedAt < ttl
}

export function presenceRemainingMs(p: Presence, now = Date.now()): number {
  const ttl = p.kind === 'heading' ? 15 * MIN : HOUR
  return Math.max(0, ttl - (now - p.startedAt))
}

export function genPersonalCode(): string {
  return genCode()
}

// ---- Busy-hours estimate ----
// During peak windows (07-09, 12-14, 18-20) parks show an estimated crowd on top
// of the real live users. The estimate scales with each park's daily visitors and
// grows ~10% week over week, clamped to 5–15.
const PEAK_WINDOWS: [number, number][] = [[7, 9], [12, 14], [18, 20]]

export function isPeakHour(now = Date.now()): boolean {
  const h = new Date(now).getHours()
  return PEAK_WINDOWS.some(([a, b]) => h >= a && h < b)
}

export function busyEstimate(dailyVisitors: number, now = Date.now()): number {
  if (!isPeakHour(now)) return 0
  const d = new Date(now)
  // gentle week-over-week growth (10% per week, cycles every 6 weeks so it stays sane)
  const week = Math.floor((d.getTime() / (7 * 24 * HOUR))) % 6
  const growth = 1 + 0.1 * week
  const est = Math.round(dailyVisitors * 0.1 * growth)
  return Math.max(5, Math.min(15, est))
}

// ---- Happiness / gamification ----

const CARE_WEIGHTS: Record<CareAction, number> = {
  walk: 22, play: 16, training: 14, food: 14, water: 12, treat: 8, pee: 7, poop: 7,
}

function scoreForDay(log: { action: CareAction; at: number }[], dayStart: number): number {
  const dayEnd = dayStart + 24 * HOUR
  const day = log.filter((l) => l.at >= dayStart && l.at < dayEnd)
  const seen = new Set<CareAction>()
  let score = 0
  for (const l of day) {
    if (!seen.has(l.action)) { score += CARE_WEIGHTS[l.action]; seen.add(l.action) }
    else score += Math.min(4, CARE_WEIGHTS[l.action] / 4)
  }
  return Math.min(100, Math.round(score))
}

export function happinessToday(log: { action: CareAction; at: number }[], now = Date.now()): number {
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  return scoreForDay(log, start.getTime())
}

// Average daily score over the last `days` days that had any activity.
export function happinessAverage(log: { action: CareAction; at: number }[], now = Date.now(), days = 7): number {
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const scores: number[] = []
  for (let i = 0; i < days; i++) {
    const ds = start.getTime() - i * 24 * HOUR
    const s = scoreForDay(log, ds)
    if (s > 0 || i === 0) scores.push(s)
  }
  if (!scores.length) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export function happinessLabel(score: number): { mood: string; emoji: string } {
  if (score >= 85) return { mood: 'הכלב שלך מאושר!', emoji: '🥳' }
  if (score >= 60) return { mood: 'יום טוב לכלב', emoji: '😊' }
  if (score >= 35) return { mood: 'אפשר עוד קצת פינוק', emoji: '🙂' }
  if (score > 0) return { mood: 'הכלב צריך תשומת לב', emoji: '🥺' }
  return { mood: 'בואו נתחיל את היום', emoji: '🐾' }
}

// Owner level from tricks the dog knows + academy progress.
export interface LevelInfo {
  level: number
  title: string
  color: string // used for the photo frame friends can see
  points: number
  nextAt: number | null
}
const LEVELS = [
  { min: 0, title: 'גור מתחיל', color: '#9ca3af' },
  { min: 3, title: 'חבר פארק', color: '#3ea033' },
  { min: 8, title: 'מאלף מתקדם', color: '#2563eb' },
  { min: 16, title: 'כלבולוג', color: '#7c3aed' },
  { min: 28, title: 'אלוף הפארק', color: '#f59e0b' },
]
export function levelFor(trickIds: string[], lessonsDone = 0): LevelInfo {
  const points = trickPoints(trickIds) + lessonsDone * 2
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i
  const next = LEVELS[idx + 1]
  return {
    level: idx + 1,
    title: LEVELS[idx].title,
    color: LEVELS[idx].color,
    points,
    nextAt: next ? next.min : null,
  }
}

