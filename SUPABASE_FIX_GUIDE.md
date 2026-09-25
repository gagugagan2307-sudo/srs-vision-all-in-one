# SRS Vision — Realtime Fix Guide

The website now uses one Supabase client per page, waits for the anonymous session created by `auth.js`, debounces writes, retries failed writes, reapplies the current JWT to Realtime, and shows a clickable connection status in the header.

## Supabase project setup

1. Run `database.sql` completely in the SQL Editor of the project referenced by `supabase-config.js`.
2. In Supabase Auth, enable Anonymous Sign-Ins.
3. In Database / Publications, make sure `public.threefs_state` is in `supabase_realtime`.
4. Keep only the browser-safe publishable key in `supabase-config.js`; never put a service-role/secret key in the website.
5. Reload the website and click the `● Local` / `● Live` status in the header to run a health check.

The site will work locally even while Supabase is unavailable, but cross-device synchronization requires the Supabase project and Realtime setup above.
