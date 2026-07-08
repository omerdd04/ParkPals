import type { Park } from '../types'

// A seed set of dog parks across Israel with approximate coordinates.
// In production this would be sourced from municipal open-data + OpenStreetMap.
export const PARKS: Park[] = [
  // ---- Tel Aviv ----
  { id: 'tlv-hayarkon', name: 'גינת כלבים פארק הירקון', city: 'תל אביב', lat: 32.0997, lng: 34.8003, fenced: true, hasWater: true, size: 'large', source: 'municipal' },
  { id: 'tlv-meir', name: 'גן מאיר – גינת כלבים', city: 'תל אביב', lat: 32.0745, lng: 34.7748, fenced: true, hasWater: true, size: 'medium', source: 'municipal' },
  { id: 'tlv-dubnov', name: 'גינת כלבים דובנוב', city: 'תל אביב', lat: 32.0778, lng: 34.7838, fenced: true, hasWater: false, size: 'small', source: 'municipal' },
  { id: 'tlv-charles', name: "גינת כלבים צ'ארלס קלור", city: 'תל אביב', lat: 32.0631, lng: 34.7597, fenced: false, hasWater: true, size: 'large', source: 'municipal' },

  // ---- Jerusalem ----
  { id: 'jlm-sacher', name: 'גן סאקר – גינת כלבים', city: 'ירושלים', lat: 31.7817, lng: 35.2035, fenced: true, hasWater: true, size: 'large', source: 'municipal' },
  { id: 'jlm-baka', name: 'גינת כלבים בקעה', city: 'ירושלים', lat: 31.7554, lng: 35.2211, fenced: true, hasWater: false, size: 'medium', source: 'municipal' },
  { id: 'jlm-german', name: 'גינת כלבים המושבה הגרמנית', city: 'ירושלים', lat: 31.7639, lng: 35.2189, fenced: true, hasWater: true, size: 'small', source: 'osm' },

  // ---- Haifa ----
  { id: 'hfa-carmel', name: 'גינת כלבים הכרמל', city: 'חיפה', lat: 32.7940, lng: 34.9896, fenced: true, hasWater: true, size: 'medium', source: 'municipal' },
  { id: 'hfa-hadar', name: 'גינת כלבים הדר', city: 'חיפה', lat: 32.8095, lng: 34.9946, fenced: false, hasWater: false, size: 'small', source: 'osm' },

  // ---- Rishon LeZion ----
  { id: 'rsn-superland', name: 'פארק כלבים סופרלנד', city: 'ראשון לציון', lat: 31.9730, lng: 34.7925, fenced: true, hasWater: true, size: 'large', source: 'municipal' },
  { id: 'rsn-nachlat', name: 'גינת כלבים נחלת יהודה', city: 'ראשון לציון', lat: 31.9585, lng: 34.8107, fenced: true, hasWater: false, size: 'medium', source: 'municipal' },

  // ---- Be'er Sheva ----
  { id: 'bsv-nahal', name: 'פארק נחל באר שבע – גינת כלבים', city: 'באר שבע', lat: 31.2451, lng: 34.7995, fenced: true, hasWater: true, size: 'large', source: 'municipal' },

  // ---- Netanya ----
  { id: 'nty-utopia', name: 'גינת כלבים אזורים', city: 'נתניה', lat: 32.3215, lng: 34.8570, fenced: true, hasWater: true, size: 'medium', source: 'municipal' },

  // ---- Herzliya ----
  { id: 'hrz-park', name: 'פארק הרצליה – גינת כלבים', city: 'הרצליה', lat: 32.1663, lng: 34.8436, fenced: true, hasWater: true, size: 'medium', source: 'municipal' },

  // ---- Ramat Gan ----
  { id: 'rg-national', name: 'גינת כלבים הפארק הלאומי', city: 'רמת גן', lat: 32.0523, lng: 34.8248, fenced: true, hasWater: true, size: 'large', source: 'municipal' },

  // ---- Petah Tikva ----
  { id: 'pt-yarkon', name: 'גינת כלבים כפר גנים', city: 'פתח תקווה', lat: 32.0790, lng: 34.8780, fenced: true, hasWater: false, size: 'medium', source: 'osm' },

  // ---- Ashdod ----
  { id: 'ash-lido', name: 'גינת כלבים לידו', city: 'אשדוד', lat: 31.7940, lng: 34.6410, fenced: true, hasWater: true, size: 'medium', source: 'municipal' },

  // ---- Eilat ----
  { id: 'eil-park', name: 'גינת כלבים שחמון', city: 'אילת', lat: 29.5560, lng: 34.9520, fenced: true, hasWater: true, size: 'small', source: 'osm' },
]

export const CITIES = Array.from(new Set(PARKS.map((p) => p.city))).sort((a, b) =>
  a.localeCompare(b, 'he'),
)

export function parkById(id: string): Park | undefined {
  return PARKS.find((p) => p.id === id)
}
