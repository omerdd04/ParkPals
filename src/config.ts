// App-wide configuration. Change these in one place.

export const APP_NAME = 'ParkPals'

// Where user feedback / partnership requests are sent (opens the user's mail app).
export const CONTACT_EMAIL = 'omerdd04@gmail.com'

// Accounts that see the in-app admin tools (add parks etc.). Must match the
// is_admin() list in supabase/schema.sql — the server enforces, this only shows/hides UI.
export const ADMIN_EMAILS = ['omerdd04@gmail.com']

// Auto check-in: when the app opens (or returns to foreground) with GPS inside
// this radius of a park, the user is automatically marked "at the park" for an
// hour — no tap needed. Kept tight (~inside the park itself) so walking PAST
// a park, or living 300m from one, never triggers a false check-in.
export const AUTO_CHECKIN_RADIUS_M = 100

// Academy is gated for launch: locked tab that teases what's coming.
export const ACADEMY_LOCKED = true

// MapTiler API key (publishable, client-side). When set, the map uses
// MapTiler's modern "streets-v2" raster style (fresh OSM data, retina).
// Create a free account at maptiler.com → API keys, and paste the key here.
export const MAPTILER_KEY = ''
