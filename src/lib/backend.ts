// Backend data-access layer. Every function here talks to Supabase and maps
// database rows <-> the app's domain types. All functions no-op / return empty
// when Supabase isn't configured, so callers can stay simple.
import { supabase } from './supabase'
import type {
  DogProfile,
  Friend,
  OwnerProfile,
  Presence,
  PresenceKind,
  QuickMsgType,
} from '../types'

// ---- Row shapes (snake_case, as stored) ------------------------------------
interface ProfileRow {
  id: string
  owner_name: string
  city: string
  neighborhood: string
  personal_code: string | null
  dog_name: string
  breed: string
  age_years: number
  size: string
  energy: string
  gender: string
  neutered: boolean
  photo: string
  tricks: string[]
  treats: string[]
  toys: string[]
  favorites: string[]
  traits: string[]
  score: number
}

interface PresenceRow {
  user_id: string
  park_id: string
  kind: string
  shares_location: boolean
  started_at: string
}

// ---- Mappers ----------------------------------------------------------------
function rowToOwner(r: ProfileRow): OwnerProfile {
  return {
    name: r.owner_name,
    city: r.city,
    neighborhood: r.neighborhood,
    personalCode: r.personal_code ?? '',
  }
}

function rowToDog(r: ProfileRow): DogProfile {
  return {
    name: r.dog_name,
    breed: r.breed,
    ageYears: Number(r.age_years) || 1,
    size: (r.size as DogProfile['size']) || 'medium',
    energy: (r.energy as DogProfile['energy']) || 'balanced',
    gender: (r.gender as DogProfile['gender']) || 'male',
    neutered: !!r.neutered,
    photo: r.photo || '🐕',
    tricks: r.tricks ?? [],
    treats: r.treats ?? [],
    toys: r.toys ?? [],
    favorites: r.favorites ?? [],
    traits: r.traits ?? [],
  }
}

function rowToPresence(r: PresenceRow): Presence {
  return {
    parkId: r.park_id,
    kind: (r.kind as PresenceKind) || 'at_park',
    sharesLocation: !!r.shares_location,
    startedAt: new Date(r.started_at).getTime(),
  }
}

// ---- Auth -------------------------------------------------------------------
function redirectUrl(): string {
  // Return to wherever the app is served from (handles the GitHub Pages subpath).
  return window.location.origin + import.meta.env.BASE_URL
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'השרת לא מחובר' }
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectUrl() },
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'שלחנו קישור כניסה לאימייל שלך 📧' }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

// ---- Profile ----------------------------------------------------------------
export async function loadMyProfile(): Promise<{ owner: OwnerProfile; dog: DogProfile; onboarded: boolean } | null> {
  if (!supabase) return null
  const uid = await currentUserId()
  if (!uid) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
  if (error || !data) return null
  const r = data as ProfileRow
  // "onboarded" = the owner has filled in at least a name.
  const onboarded = !!r.owner_name && !!r.dog_name
  return { owner: rowToOwner(r), dog: rowToDog(r), onboarded }
}

export async function saveMyProfile(
  owner: OwnerProfile,
  dog: DogProfile,
  score?: number,
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false }
  const uid = await currentUserId()
  if (!uid) return { ok: false, message: 'לא מחובר' }
  const patch: Record<string, unknown> = {
    id: uid,
    owner_name: owner.name,
    city: owner.city,
    neighborhood: owner.neighborhood,
    personal_code: owner.personalCode || null,
    dog_name: dog.name,
    breed: dog.breed,
    age_years: dog.ageYears,
    size: dog.size,
    energy: dog.energy,
    gender: dog.gender,
    neutered: dog.neutered,
    photo: dog.photo,
    tricks: dog.tricks,
    treats: dog.treats,
    toys: dog.toys,
    favorites: dog.favorites,
    traits: dog.traits,
    updated_at: new Date().toISOString(),
  }
  if (typeof score === 'number') patch.score = score
  const { error } = await supabase.from('profiles').upsert(patch)
  if (error) {
    // A duplicate personal_code is the one collision worth surfacing.
    if (error.code === '23505') return { ok: false, message: 'הקוד האישי תפוס, ננסה קוד אחר' }
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

// ---- Friends ----------------------------------------------------------------
// Load my friends: join friend_links -> their profile -> their live presence.
export async function loadFriends(): Promise<Friend[]> {
  if (!supabase) return []
  const uid = await currentUserId()
  if (!uid) return []

  const { data: links } = await supabase
    .from('friend_links')
    .select('friend_id, favorite')
    .eq('user_id', uid)
  if (!links || links.length === 0) return []

  const ids = links.map((l) => l.friend_id as string)
  const favById = new Map(links.map((l) => [l.friend_id as string, !!l.favorite]))

  const { data: profs } = await supabase.from('profiles').select('*').in('id', ids)
  const { data: pres } = await supabase.from('presence').select('*').in('user_id', ids)
  const presById = new Map((pres ?? []).map((p) => [p.user_id as string, rowToPresence(p as PresenceRow)]))

  return (profs ?? []).map((p) => {
    const r = p as ProfileRow
    return {
      id: r.id,
      ownerName: r.owner_name,
      dogName: r.dog_name,
      dogPhoto: r.photo || '🐕',
      city: r.city,
      personalCode: r.personal_code ?? '',
      favorite: favById.get(r.id) ?? false,
      score: r.score,
      presence: presById.get(r.id),
    }
  })
}

export async function addFriendByCode(rawCode: string): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'השרת לא מחובר' }
  const uid = await currentUserId()
  if (!uid) return { ok: false, message: 'לא מחובר' }
  const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length !== 4) return { ok: false, message: 'הקוד הוא 4 תווים (למשל 4KD2)' }

  const { data: match } = await supabase
    .from('profiles')
    .select('id, owner_name, dog_name')
    .eq('personal_code', clean)
    .maybeSingle()
  if (!match) return { ok: false, message: 'לא נמצא חבר עם הקוד הזה' }
  if (match.id === uid) return { ok: false, message: 'זה הקוד שלך 🙂' }

  const { error } = await supabase
    .from('friend_links')
    .upsert({ user_id: uid, friend_id: match.id }, { onConflict: 'user_id,friend_id', ignoreDuplicates: true })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: `${match.dog_name} של ${match.owner_name} נוסף לחברים!` }
}

export async function setFavorite(friendId: string, favorite: boolean): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('friend_links').update({ favorite }).eq('user_id', uid).eq('friend_id', friendId)
}

// ---- Presence ---------------------------------------------------------------
export async function setPresence(parkId: string, kind: PresenceKind, sharesLocation: boolean): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('presence').upsert({
    user_id: uid,
    park_id: parkId,
    kind,
    shares_location: sharesLocation,
    started_at: new Date().toISOString(),
  })
}

export async function clearPresence(): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('presence').delete().eq('user_id', uid)
}

// ---- Chat -------------------------------------------------------------------
export async function sendChat(toId: string, type: QuickMsgType, parkName?: string): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('messages').insert({ from_id: uid, to_id: toId, type, park_name: parkName ?? null })
}

// ---- Complaints -------------------------------------------------------------
export async function addComplaint(c: { parkName: string; city: string; category: string; text: string }): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('complaints').insert({
    user_id: uid,
    park_name: c.parkName,
    city: c.city,
    category: c.category,
    text: c.text,
  })
}
