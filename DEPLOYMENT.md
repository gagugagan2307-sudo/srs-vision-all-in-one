# SRS Vision — Deploy and test

## GitHub Pages
Upload every file in this folder to the root of the repository `srs-vision-all-in-one`, then enable GitHub Pages from Settings → Pages → Deploy from branch → main → /(root).

## Supabase
Open the project from `supabase-config.js`, enable Authentication → Sign In / Providers → Anonymous Sign-Ins, and run `database.sql` in SQL Editor.

Then open the website and select **Database** from the sidebar. Press **Check Connection**. A working setup should show **LIVE** and then **Realtime ON** after the Realtime channel subscribes.

## No-login behavior
There is intentionally no password/admin login in this build. Because all browsers share the same anonymous state row, this mode is suitable for a shared internal workspace only if the public URL is access-controlled elsewhere. For real member-level security, add real authentication and member-specific RLS before exposing banking or confidential business data publicly.
