# SRS Vision — Functional + Performance Fixes

- Fixed the main navigation recursion that caused ordinary sections such as Projects, Calendar, Reports and Bank Accounts to hang or fail.
- Removed duplicate capture/pointer navigation handlers that caused repeated route renders.
- Removed the extra 15-second UI heartbeat; live-db.js now owns the Supabase heartbeat.
- Persisting data now updates the UI immediately; Supabase writes are debounced and retried in the background so forms/buttons do not wait for the network.
- Live database startup waits for the anonymous Supabase session created by auth.js so the page does not create competing clients/sessions.
- Realtime reapplies the current JWT and reconnects when the channel is closed or the tab becomes visible again.
- The header Live/Local indicator is clickable and runs a database health check.
- Money-transfer approval slots now use the 12 actual SRS VISION member names when the single shared team contains all 12 members.

## Supabase

Run `database.sql` in the project referenced by `supabase-config.js`, enable Anonymous Sign-Ins, and ensure `public.threefs_state` is included in the `supabase_realtime` publication.
