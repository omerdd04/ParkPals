// ---- Core domain types for the Onyx dog-park social app ----

export type DogSize = 'small' | 'medium' | 'large'
export type DogEnergy = 'calm' | 'balanced' | 'energetic'

export interface DogProfile {
  name: string
  breed: string
  ageYears: number
  size: DogSize
  energy: DogEnergy
  gender: 'male' | 'female'
  neutered: boolean
  photo: string // emoji or data-url (real uploaded photo)
  tricks: string[] // trick ids from the catalog
  treats: string[]
  toys: string[]
  favorites: string[]
  traits: string[]
}

export interface OwnerProfile {
  name: string
  city: string
  neighborhood: string
  personalCode: string // shareable friend code e.g. "ONX-4KD2"
}

export interface Park {
  id: string
  name: string
  city: string
  area?: string // e.g. "רובע ד'" for neighborhood-level parks
  lat: number
  lng: number
  fenced: boolean
  hasWater: boolean
  size: 'small' | 'medium' | 'large'
  source: 'municipal' | 'osm'
  dailyVisitors: number // approx dogs that pass through on an average day (drives busy estimate)
}

export type PresenceKind = 'at_park' | 'heading' // at park now, or heading in 15 min
export interface Presence {
  parkId: string
  kind: PresenceKind
  sharesLocation: boolean
  startedAt: number // epoch ms
  // at_park w/o location expires after 1h; heading expires after 15m
}

// A friend is another dog+owner in the network
export interface Friend {
  id: string
  ownerName: string
  dogName: string
  dogPhoto: string
  city: string
  personalCode: string // raw 4-char code; display via formatCode()
  favorite: boolean
  score?: number // average happiness, drives the photo frame color
  presence?: Presence // simulated live presence for demo
}

export type QuickMsgType =
  | 'invite_walk' // "בא/ה לסיבוב בפארק?"
  | 'yes_coming'
  | 'not_this_time'
  | 'next_time'
  | 'missed_today'
  | 'on_my_way'

export interface ChatMessage {
  id: string
  friendId: string
  fromMe: boolean
  type: QuickMsgType
  parkName?: string
  at: number
}

export interface HappinessLog {
  id: string
  action: CareAction
  at: number
}

export type CareAction =
  | 'walk'
  | 'water'
  | 'food'
  | 'treat'
  | 'pee'
  | 'poop'
  | 'play'
  | 'training'

export interface AcademyProgress {
  [lessonId: string]: boolean // completed
}

export interface Complaint {
  id: string
  parkName: string
  city: string
  category: string
  text: string
  at: number
}

export interface AppState {
  onboarded: boolean
  owner: OwnerProfile
  dog: DogProfile
  myPresence: Presence | null
  friends: Friend[]
  chats: ChatMessage[]
  happinessLog: HappinessLog[]
  academy: AcademyProgress
  complaints: Complaint[]
  notifications: AppNotification[]
}

export interface AppNotification {
  id: string
  text: string
  at: number
  read: boolean
  kind: 'friend_heading' | 'friend_at_park' | 'invite' | 'reply' | 'system'
}
