import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  return `ONX-${s}`
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const DOG_AVATARS = ['🐕', '🐩', '🐕‍🦺', '🦮', '🐶']

// ---- Demo friends so the network feels alive on first launch ----
function seedFriends(): Friend[] {
  const now = Date.now()
  return [
    {
      id: 'f1', ownerName: 'דנה', dogName: 'לונה', dogPhoto: '🐕', city: 'תל אביב',
      personalCode: 'ONX-7HK4', favorite: true,
      presence: { parkId: 'tlv-hayarkon', kind: 'at_park', sharesLocation: true, startedAt: now - 12 * MIN },
    },
    {
      id: 'f2', ownerName: 'יואב', dogName: 'רקס', dogPhoto: '🦮', city: 'תל אביב',
      personalCode: 'ONX-3PQ9', favorite: true,
      presence: { parkId: 'tlv-hayarkon', kind: 'at_park', sharesLocation: false, startedAt: now - 4 * MIN },
    },
    {
      id: 'f3', ownerName: 'מאיה', dogName: "צ'אנס", dogPhoto: '🐩', city: 'תל אביב',
      personalCode: 'ONX-8ZC2', favorite: false,
      presence: { parkId: 'tlv-meir', kind: 'heading', sharesLocation: false, startedAt: now - 3 * MIN },
    },
    {
      id: 'f4', ownerName: 'אורי', dogName: 'בלה', dogPhoto: '🐶', city: 'ירושלים',
      personalCode: 'ONX-5RT6', favorite: true,
      presence: { parkId: 'jlm-sacher', kind: 'at_park', sharesLocation: true, startedAt: now - 25 * MIN },
    },
    {
      id: 'f5', ownerName: 'שירה', dogName: 'מוקה', dogPhoto: '🐕‍🦺', city: 'חיפה',
      personalCode: 'ONX-9WD1', favorite: false,
    },
    {
      id: 'f6', ownerName: 'תום', dogName: 'ג׳ק', dogPhoto: '🦮', city: 'ראשון לציון',
      personalCode: 'ONX-2MB7', favorite: false,
    },
  ]
}

interface Store {
  onboarded: boolean
  owner: OwnerProfile
  dog: DogProfile
  myPresence: Presence | null
  friends: Friend[]
  chats: ChatMessage[]
  happinessLog: { id: string; action: CareAction; at: number }[]
  academy: Record<string, boolean>
  complaints: Complaint[]
  notifications: AppNotification[]

  // actions
  completeOnboarding: (owner: OwnerProfile, dog: DogProfile) => void
  setPresence: (parkId: string, kind: PresenceKind, sharesLocation: boolean) => void
  clearPresence: () => void
  toggleFavorite: (friendId: string) => void
  addFriendByCode: (code: string) => { ok: boolean; message: string }
  sendMessage: (friendId: string, type: QuickMsgType, parkName?: string) => void
  logCare: (action: CareAction) => void
  completeLesson: (lessonId: string) => void
  addComplaint: (c: Omit<Complaint, 'id' | 'at'>) => void
  markNotificationsRead: () => void
  pushNotification: (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => void
  resetAll: () => void
}

const emptyOwner: OwnerProfile = { name: '', city: '', neighborhood: '', personalCode: '' }
const emptyDog: DogProfile = {
  name: '', breed: '', ageYears: 1, size: 'medium', energy: 'balanced',
  gender: 'male', neutered: false, photo: '🐕', favoriteToy: '', favoriteTreat: '', knownExercises: [],
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      onboarded: false,
      owner: emptyOwner,
      dog: emptyDog,
      myPresence: null,
      friends: seedFriends(),
      chats: [],
      happinessLog: [],
      academy: {},
      complaints: [],
      notifications: [
        { id: uid(), text: 'ברוכים הבאים ל-Onyx! השלימו את מד השמחה של הכלב היום 🐾', at: Date.now(), read: false, kind: 'system' },
      ],

      completeOnboarding: (owner, dog) =>
        set({
          onboarded: true,
          owner: { ...owner, personalCode: owner.personalCode || genCode() },
          dog,
        }),

      setPresence: (parkId, kind, sharesLocation) =>
        set({ myPresence: { parkId, kind, sharesLocation, startedAt: Date.now() } }),

      clearPresence: () => set({ myPresence: null }),

      toggleFavorite: (friendId) =>
        set((s) => ({
          friends: s.friends.map((f) =>
            f.id === friendId ? { ...f, favorite: !f.favorite } : f,
          ),
        })),

      addFriendByCode: (code) => {
        const clean = code.trim().toUpperCase()
        const existing = get().friends.find((f) => f.personalCode === clean)
        if (existing) return { ok: false, message: 'החבר הזה כבר שמור אצלך 🐾' }
        if (!/^ONX-[A-Z0-9]{4}$/.test(clean))
          return { ok: false, message: 'קוד לא תקין. הפורמט: ONX-XXXX' }
        // In demo mode we materialize a new friend from the code
        const names = ['נועה', 'איתי', 'רוני', 'גיל', 'ליאור', 'עדן']
        const dogs = ['שוקו', 'נלה', 'ריקו', 'זואי', 'באדי', 'פאדג׳']
        const i = Math.floor(Math.random() * names.length)
        const nf: Friend = {
          id: uid(), ownerName: names[i], dogName: dogs[i],
          dogPhoto: DOG_AVATARS[Math.floor(Math.random() * DOG_AVATARS.length)],
          city: get().owner.city || 'תל אביב', personalCode: clean, favorite: false,
        }
        set((s) => ({ friends: [...s.friends, nf] }))
        return { ok: true, message: `${nf.dogName} של ${nf.ownerName} נוסף לחברים!` }
      },

      sendMessage: (friendId, type, parkName) => {
        const msg: ChatMessage = { id: uid(), friendId, fromMe: true, type, parkName, at: Date.now() }
        set((s) => ({ chats: [...s.chats, msg] }))
        // Simulate a friendly auto-reply shortly after an invite
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
                {
                  id: uid(),
                  text: `${friend?.dogName ?? 'חבר'} ענה להזמנה שלך`,
                  at: Date.now(), read: false, kind: 'reply',
                },
                ...s.notifications,
              ],
            }))
          }, 2500)
        }
      },

      logCare: (action) =>
        set((s) => ({
          happinessLog: [...s.happinessLog, { id: uid(), action, at: Date.now() }],
        })),

      completeLesson: (lessonId) =>
        set((s) => ({ academy: { ...s.academy, [lessonId]: true } })),

      addComplaint: (c) =>
        set((s) => ({
          complaints: [{ ...c, id: uid(), at: Date.now() }, ...s.complaints],
          notifications: [
            { id: uid(), text: 'התלונה נשלחה למערך הפארקים הארצי. תודה שאכפת לך! 🙏', at: Date.now(), read: false, kind: 'system' },
            ...s.notifications,
          ],
        })),

      markNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      pushNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: uid(), at: Date.now(), read: false }, ...s.notifications],
        })),

      resetAll: () =>
        set({
          onboarded: false, owner: emptyOwner, dog: emptyDog, myPresence: null,
          friends: seedFriends(), chats: [], happinessLog: [], academy: {}, complaints: [],
          notifications: [],
        }),
    }),
    { name: 'onyx-store-v1' },
  ),
)

// ---- Derived helpers (pure functions, used across the UI) ----

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

// Daily happiness score (0-100) from today's care actions.
const CARE_WEIGHTS: Record<CareAction, number> = {
  walk: 22, play: 16, training: 14, food: 14, water: 12, treat: 8, pee: 7, poop: 7,
}
export function happinessToday(log: { action: CareAction; at: number }[], now = Date.now()): number {
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const today = log.filter((l) => l.at >= startOfDay.getTime())
  // Count each action once toward its weight, plus a small bonus for repeats.
  const seen = new Set<CareAction>()
  let score = 0
  for (const l of today) {
    if (!seen.has(l.action)) {
      score += CARE_WEIGHTS[l.action]
      seen.add(l.action)
    } else {
      score += Math.min(4, CARE_WEIGHTS[l.action] / 4)
    }
  }
  return Math.min(100, Math.round(score))
}

export function happinessLabel(score: number): { mood: string; emoji: string } {
  if (score >= 85) return { mood: 'הכלב שלך מאושר!', emoji: '🥳' }
  if (score >= 60) return { mood: 'יום טוב לכלב', emoji: '😊' }
  if (score >= 35) return { mood: 'אפשר עוד קצת פינוק', emoji: '🙂' }
  if (score > 0) return { mood: 'הכלב צריך תשומת לב', emoji: '🥺' }
  return { mood: 'בואו נתחיל את היום', emoji: '🐾' }
}
