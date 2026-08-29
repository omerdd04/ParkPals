# Security review — ParkPals

_Scope: the current app (a client-side React SPA, no backend, data in
`localStorage`). This review covers what an attacker could try today and what
must be built before real users and a server are added._

Severity legend: 🔴 high · 🟠 medium · 🟡 low · ✅ mitigated in code · 📋 for the backend phase

---

## Summary

The app currently runs entirely in the browser with no server, no accounts, and
no other users' real data — so today's blast radius is small: an attacker with
access to a device can only affect **their own** local copy. The important work
is making sure nothing user-typed can inject code, and writing down the rules the
future backend must enforce (because a client can never be trusted).

Production dependency audit: **0 known vulnerabilities** (`npm audit --omit=dev`).
The two advisories `npm audit` shows are in the **dev-only** toolchain
(Vite/esbuild dev server) and are never shipped to users.

---

## Findings

### 1. ✅ HTML injection through map markers (was 🟠, now fixed)
Leaflet map pins are built from raw HTML strings (`L.divIcon({ html })`), not
React JSX, so React's automatic escaping does **not** apply there. A crafted
profile "photo" or name flowing into that HTML could inject markup/script.
**Fixed:** `safeAvatarHTML()` now accepts only validated `data:image/...` URIs
and HTML-escapes everything else. All other user text is rendered through React,
which escapes by default.

### 2. ✅ Unbounded / unvalidated image upload (was 🟡, now fixed)
The dog-photo picker read any chosen file straight into storage. A large file
could blow the ~5 MB `localStorage` quota (breaking persistence) or store a
non-image blob. **Fixed:** uploads are type-checked, downscaled to a 320px
square on a canvas, and re-encoded as a compact JPEG data-URI before storing.

### 3. ✅ `mailto:` header injection (was 🟡, safe)
The "Contact us" flow builds a `mailto:` link from user text. Subject and body
are passed through `encodeURIComponent`, which neutralizes newline/header
injection. No action needed.

### 4. 🟡 Client-side state is not trustworthy (by design, today)
Happiness score, level, presence, and friends live in `localStorage` and can be
edited by anyone with device access. Today this only changes the local user's
own view — no impact on others. 📋 **Backend rule:** never trust client-reported
scores/level/presence; compute and authorize them server-side.

### 5. 🟠 Contact email is embedded in the client bundle
`CONTACT_EMAIL` ships in the built JS, visible to anyone → harvesting/spam risk.
It is the owner's own address by request. 📋 **Recommended for production:** route
feedback through a form endpoint or a dedicated inbox with spam filtering rather
than a personal address in client code.

### 6. 🟠 Friend codes are short and enumerable
Codes are 4 chars over a 32-symbol alphabet (~1M combinations). With a server
that resolves codes to profiles, they'd be brute-forceable to discover strangers.
📋 **Backend rules:** longer codes, server-side rate limiting on lookups, and
**mutual consent** before any profile/location is revealed.

### 7. 🔴 Location privacy (the highest-stakes area for this product)
Live location sharing is the core feature and the biggest risk in a real,
multi-user product (stalking/harassment). Already in place: sharing is
**opt-in**, presence **auto-expires** (1h / 15m), and there is no easy "leave it
on forever" switch. 📋 **Backend rules:** never expose another user's exact
coordinates (snap to the park, not the person); offer block & report; allow a
coarse-location mode; rate-limit presence updates; and make favorites-only
visibility the default.

### 8. 📋 No authentication / authorization
Anyone can open the app and assume any local identity. Fine for a device-local
demo; a real product needs real auth (phone/OTP), server-issued identity, and an
authorization check on every action (you can only edit your own dog, only see
what you're allowed to).

### 9. 🟡 Third-party map tiles see user IP + viewport
OSM tile requests reveal the user's IP and approximate area to the tile host.
📋 Consider a privacy-respecting or self-hosted tile provider and disclose this
in a privacy policy.

### 10. 🟡 Missing hardening headers (for self-hosting)
As a static site you should serve a strict **Content-Security-Policy**,
`X-Frame-Options: DENY` / `frame-ancestors 'none'` (anti-clickjacking),
`Referrer-Policy: strict-origin-when-cross-origin`, and HSTS. (The hosted
Artifact preview already runs under a strict CSP.)

---

## Privacy note (GDPR / Israeli Privacy Protection Law)
The app collects location, a real photo, and personal details. Before launch:
a clear consent flow, a privacy policy, data-minimization (store only what's
needed), the ability to export and delete data (account deletion already exists),
and special care because some users may be minors.

## Pre-launch checklist
- [ ] Real auth + server-side authorization on every request
- [ ] Never trust client scores/level/presence — validate server-side
- [ ] Location: snap-to-park, block/report, coarse mode, favorites-default
- [ ] Longer friend codes + rate-limited lookups + mutual consent
- [ ] Move feedback off a personal email to a filtered endpoint
- [ ] Security headers (CSP, frame-ancestors, Referrer-Policy, HSTS)
- [ ] Privacy policy + consent + data export/delete
- [ ] Keep `npm audit` clean in CI
