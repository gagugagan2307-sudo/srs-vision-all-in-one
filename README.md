# SRS Vision — Full Website + Graphic Design + Realtime Database

This package contains the SRS Vision website, Graphic Design workspace, SRS Vision branding/logo, no-login Anonymous Auth, and a hardened Supabase realtime sync layer.

## Files
- `index.html` — main dashboard and all website sections
- `portal.html` — SRS Vision portal
- `auth.js` — credential-free Supabase Anonymous Auth bridge
- `live-db.js` — realtime shared-state sync with diagnostics/reconnects
- `database.sql` — complete Supabase table, RLS, RPC, trigger, grants, and Realtime publication setup
- `supabase-config.js` — browser-safe Supabase project configuration
- `srs-vision-logo.png` — SRS Vision logo
- `srs-vision-dashboard-concept.png` / `srs-vision-dashboard-hero.jpg` — dashboard graphics

## Important
Run the complete `database.sql` in the Supabase project and enable Anonymous Sign-Ins + Realtime before expecting cross-device sync.

The website currently has no username/password gate. Because anonymous sessions are intentionally used, anyone who can reach the dashboard can write data allowed by the anonymous RLS policies.
