import type { Park } from '../types'

// A seed set of dog parks across Israel with approximate coordinates.
// In production this would be sourced from municipal open-data + OpenStreetMap.
// `dailyVisitors` is an approximate baseline used for the busy-hours estimate.
export const PARKS: Park[] = [
  // ---- Ashdod — the 12 official municipal dog parks (one per quarter), from
  // the municipality's "גינות כלבים בעיר" page. Coordinates are quarter-level
  // estimates (approx: true) until pinned exactly by the admin/community;
  // Gan Meir Yaari (rova dalet, the pilot area) keeps the verified pin.
  { id: 'ash-rovad-1', name: 'גן מאיר יערי – גינת כלבים', city: 'אשדוד', area: "רובע ד'", lat: 31.7905, lng: 34.6455, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 50 },
  { id: 'ash-elisheva', name: 'גן אלישבע – גינת כלבים', city: 'אשדוד', area: "רובע א'", lat: 31.8075, lng: 34.6385, fenced: true, hasWater: false, size: 'large', source: 'municipal', dailyVisitors: 30, approx: true },
  { id: 'ash-lohamim', name: 'גן הלוחמים – גינת כלבים', city: 'אשדוד', area: "רובע ב'", lat: 31.8050, lng: 34.6490, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 24, approx: true },
  { id: 'ash-avraham', name: 'גן אברהם – גינת כלבים', city: 'אשדוד', area: "רובע ה'", lat: 31.7950, lng: 34.6550, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 24, approx: true },
  { id: 'ash-labiov', name: 'גן לביוב – גינת כלבים', city: 'אשדוד', area: "רובע ו'", lat: 31.7875, lng: 34.6575, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 24, approx: true },
  { id: 'ash-sayfan', name: 'גן סייפן – גינת כלבים', city: 'אשדוד', area: "רובע ח'", lat: 31.7790, lng: 34.6400, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 26, approx: true },
  { id: 'ash-morim', name: 'גן הסתדרות המורים – גינת כלבים', city: 'אשדוד', area: "רובע ט'", lat: 31.7830, lng: 34.6510, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 22, approx: true },
  { id: 'ash-atikot', name: 'גן עתיקות – גינת כלבים', city: 'אשדוד', area: "רובע י'", lat: 31.7740, lng: 34.6460, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 22, approx: true },
  { id: 'ash-golda', name: 'גן גולדה – גינת כלבים', city: 'אשדוד', area: 'רובע י"א', lat: 31.7770, lng: 34.6350, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 32, approx: true },
  { id: 'ash-safra', name: 'גן ספרא – גינת כלבים', city: 'אשדוד', area: 'רובע י"ב', lat: 31.7690, lng: 34.6480, fenced: true, hasWater: false, size: 'large', source: 'municipal', dailyVisitors: 28, approx: true },
  { id: 'ash-grin', name: 'גן אבנר גרין – גינת כלבים', city: 'אשדוד', area: 'רובע י"ג', lat: 31.7625, lng: 34.6530, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 20, approx: true },
  { id: 'ash-merkazi', name: 'גן מרכזי – גינת כלבים', city: 'אשדוד', area: 'רובע ט"ו', lat: 31.7580, lng: 34.6595, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 20, approx: true },

  // ---- Tel Aviv ----
  { id: 'tlv-hayarkon', name: 'גינת כלבים פארק הירקון', city: 'תל אביב', lat: 32.0997, lng: 34.8003, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 65 },
  { id: 'tlv-meir', name: 'גן מאיר – גינת כלבים', city: 'תל אביב', lat: 32.0745, lng: 34.7748, fenced: true, hasWater: true, size: 'medium', source: 'municipal', dailyVisitors: 38 },
  { id: 'tlv-dubnov', name: 'גינת כלבים דובנוב', city: 'תל אביב', lat: 32.0778, lng: 34.7838, fenced: true, hasWater: false, size: 'small', source: 'municipal', dailyVisitors: 20 },
  { id: 'tlv-charles', name: "גינת כלבים צ'ארלס קלור", city: 'תל אביב', lat: 32.0631, lng: 34.7597, fenced: false, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 30 },

  // ---- Jerusalem ----
  { id: 'jlm-sacher', name: 'גן סאקר – גינת כלבים', city: 'ירושלים', lat: 31.7817, lng: 35.2035, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 48 },
  { id: 'jlm-baka', name: 'גינת כלבים בקעה', city: 'ירושלים', lat: 31.7554, lng: 35.2211, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 26 },
  { id: 'jlm-german', name: 'גינת כלבים המושבה הגרמנית', city: 'ירושלים', lat: 31.7639, lng: 35.2189, fenced: true, hasWater: true, size: 'small', source: 'osm', dailyVisitors: 18 },

  // ---- Haifa ----
  { id: 'hfa-carmel', name: 'גינת כלבים הכרמל', city: 'חיפה', lat: 32.7940, lng: 34.9896, fenced: true, hasWater: true, size: 'medium', source: 'municipal', dailyVisitors: 30 },
  { id: 'hfa-hadar', name: 'גינת כלבים הדר', city: 'חיפה', lat: 32.8095, lng: 34.9946, fenced: false, hasWater: false, size: 'small', source: 'osm', dailyVisitors: 15 },

  // ---- Rishon LeZion ----
  { id: 'rsn-superland', name: 'פארק כלבים סופרלנד', city: 'ראשון לציון', lat: 31.9730, lng: 34.7925, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 44 },
  { id: 'rsn-nachlat', name: 'גינת כלבים נחלת יהודה', city: 'ראשון לציון', lat: 31.9585, lng: 34.8107, fenced: true, hasWater: false, size: 'medium', source: 'municipal', dailyVisitors: 24 },

  // ---- Be'er Sheva ----
  { id: 'bsv-nahal', name: 'פארק נחל באר שבע – גינת כלבים', city: 'באר שבע', lat: 31.2451, lng: 34.7995, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 36 },

  // ---- Netanya ----
  { id: 'nty-utopia', name: 'גינת כלבים אזורים', city: 'נתניה', lat: 32.3215, lng: 34.8570, fenced: true, hasWater: true, size: 'medium', source: 'municipal', dailyVisitors: 28 },

  // ---- Herzliya ----
  { id: 'hrz-park', name: 'פארק הרצליה – גינת כלבים', city: 'הרצליה', lat: 32.1663, lng: 34.8436, fenced: true, hasWater: true, size: 'medium', source: 'municipal', dailyVisitors: 26 },

  // ---- Ramat Gan ----
  { id: 'rg-national', name: 'גינת כלבים הפארק הלאומי', city: 'רמת גן', lat: 32.0523, lng: 34.8248, fenced: true, hasWater: true, size: 'large', source: 'municipal', dailyVisitors: 42 },

  // ---- Petah Tikva ----
  { id: 'pt-yarkon', name: 'גינת כלבים כפר גנים', city: 'פתח תקווה', lat: 32.0790, lng: 34.8780, fenced: true, hasWater: false, size: 'medium', source: 'osm', dailyVisitors: 22 },

  // ---- Eilat ----
  { id: 'eil-park', name: 'גינת כלבים שחמון', city: 'אילת', lat: 29.5560, lng: 34.9520, fenced: true, hasWater: true, size: 'small', source: 'osm', dailyVisitors: 12 },
]

export const CITIES = Array.from(new Set(PARKS.map((p) => p.city))).sort((a, b) =>
  a.localeCompare(b, 'he'),
)

// Parks added through the backend (admin screen) get merged with the built-in
// list. liveSync registers them here so non-React helpers (parkById) see them.
let SERVER_PARKS: Park[] = []
export function registerServerParks(list: Park[]): void {
  SERVER_PARKS = list
}
export function allParks(): Park[] {
  const ids = new Set(PARKS.map((p) => p.id))
  return [...PARKS, ...SERVER_PARKS.filter((p) => !ids.has(p.id))]
}

export function parkById(id: string): Park | undefined {
  return allParks().find((p) => p.id === id)
}

// Rough distance in km between two lat/lng points (haversine).
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Default location for the demo: Ashdod, Rova Dalet — so "nearest park" is meaningful
// even before the user grants real GPS access.
export const DEFAULT_LOCATION = { lat: 31.7905, lng: 34.6455, label: "אשדוד · רובע ד'" }

// When we don't have GPS, fall back to the center of the city the user typed in
// onboarding, so someone in Tel Aviv sees Tel Aviv parks — not Ashdod.
export function cityCenter(city: string | undefined): { lat: number; lng: number } {
  if (!city) return { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }
  const inCity = PARKS.filter((p) => p.city === city.trim())
  if (inCity.length === 0) return { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng }
  const lat = inCity.reduce((s, p) => s + p.lat, 0) / inCity.length
  const lng = inCity.reduce((s, p) => s + p.lng, 0) / inCity.length
  return { lat, lng }
}
