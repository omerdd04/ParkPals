// App-wide configuration. Change these in one place.

export const APP_NAME = 'ParkPals'

// Where user feedback / partnership requests are sent (opens the user's mail app).
export const CONTACT_EMAIL = 'omerdd04@gmail.com'

// Accounts that see the in-app admin tools (add parks etc.). Must match the
// is_admin() list in supabase/schema.sql — the server enforces, this only shows/hides UI.
export const ADMIN_EMAILS = ['omerdd04@gmail.com']
