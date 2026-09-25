# SRS Vision — Supabase Realtime Fix

1. Open the Supabase project used by `supabase-config.js`.
2. Authentication → Sign In / Providers → enable Anonymous Sign-Ins.
3. Open SQL Editor and run the entire `database.sql` file.
4. In Database → Replication/Realtime, confirm `public.threefs_state` is enabled for Realtime.
5. Reload the SRS Vision site.
6. Click the **Database** button in the SRS Vision sidebar and use **Check Connection**.

Expected status:
- Connection: LIVE
- Realtime: ON
- Database: reachable

Do not add a service-role/secret key to the browser.
