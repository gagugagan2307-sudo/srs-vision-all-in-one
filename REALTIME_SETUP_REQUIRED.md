# SRS Vision — Realtime setup

The website uses Supabase Anonymous Sign-Ins plus Postgres Changes. The supplied `database.sql` is the database setup for this no-login version.

## Do these steps once

1. Open the Supabase project configured in `supabase-config.js`.
2. Enable **Anonymous Sign-Ins** in Supabase Authentication.
3. Open **SQL Editor** and run the complete `database.sql` from this package.
4. In Supabase Realtime settings, make sure the Realtime service is enabled.
5. Confirm `public.threefs_state` is in the `supabase_realtime` publication. The SQL file attempts to add it automatically.
6. Deploy the website again after replacing all files.

The website should then show `● Live · Live database connected · realtime ON` at the top. If something is wrong, the status now reports the failure reason instead of silently falling back to local storage.

The browser only uses the Supabase publishable key. Never put a service-role or secret key into the website.
