// Live sync: keeps the local store mirrored to the backend while signed in.
// - friends + their live presence (initial load, realtime updates, 60s poll fallback)
// - chat history + incoming messages in realtime (with notification + toast)
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { loadFriends } from './backend'
import { useStore } from '../store'
import type { ChatMessage, QuickMsgType } from '../types'

let channel: RealtimeChannel | null = null
let pollTimer: number | null = null

export async function refreshFriends(): Promise<void> {
  const friends = await loadFriends()
  useStore.getState().setFriends(friends)
}

async function loadRecentChats(userId: string): Promise<void> {
  if (!supabase) return
  const { data } = await supabase
    .from('messages')
    .select('id, from_id, to_id, type, park_name, created_at')
    .or(`from_id.eq.${userId},to_id.eq.${userId}`)
    .order('created_at', { ascending: true })
    .limit(300)
  if (!data) return
  const chats: ChatMessage[] = data.map((m) => ({
    id: m.id as string,
    friendId: (m.from_id === userId ? m.to_id : m.from_id) as string,
    fromMe: m.from_id === userId,
    type: m.type as QuickMsgType,
    parkName: (m.park_name as string | null) ?? undefined,
    at: new Date(m.created_at as string).getTime(),
  }))
  useStore.getState().setChats(chats)
}

const MSG_SHORT: Record<string, string> = {
  invite_walk: 'מזמין/ה אותך לסיבוב 🐾',
  on_my_way: 'בדרך אליך!',
  yes_coming: 'כן, מגיע/ה! ✅',
  not_this_time: 'לא הפעם 🙅',
  next_time: 'פעם הבאה 🔁',
  missed_today: 'פספסנו 😅',
}

function onIncomingMessage(row: Record<string, unknown>): void {
  const s = useStore.getState()
  const friend = s.friends.find((f) => f.id === row.from_id)
  const msg: ChatMessage = {
    id: row.id as string,
    friendId: row.from_id as string,
    fromMe: false,
    type: row.type as QuickMsgType,
    parkName: (row.park_name as string | null) ?? undefined,
    at: new Date(row.created_at as string).getTime(),
  }
  s.appendChat(msg)
  const who = friend?.dogName ?? 'חבר'
  s.pushNotification({ text: `${who}: ${MSG_SHORT[msg.type] ?? 'הודעה חדשה'}`, kind: 'reply' })
  s.showToast({ text: `${who}: ${MSG_SHORT[msg.type] ?? 'הודעה חדשה'}`, photo: friend?.dogPhoto })
}

export async function startLiveSync(userId: string): Promise<void> {
  if (!supabase) return
  stopLiveSync()

  await refreshFriends()
  await loadRecentChats(userId)

  channel = supabase
    .channel('parkpals-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'presence' },
      () => { void refreshFriends() },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `to_id=eq.${userId}` },
      (payload) => onIncomingMessage(payload.new as Record<string, unknown>),
    )
    .subscribe()

  // Poll fallback in case a realtime event is missed (e.g. phone slept).
  pollTimer = window.setInterval(() => { void refreshFriends() }, 60_000)
}

export function stopLiveSync(): void {
  if (channel) { void supabase?.removeChannel(channel); channel = null }
  if (pollTimer !== null) { window.clearInterval(pollTimer); pollTimer = null }
}
