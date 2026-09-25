# SRS Vision Supabase setup

1. Open the Supabase project used by `supabase-config.js`.
2. Enable Authentication → Sign In / Providers → Anonymous Sign-Ins.
3. Open SQL Editor and run `database.sql` completely.
4. Confirm `public.srs_vision_state` appears in the `supabase_realtime` publication.
5. Upload all files in this folder to the root of your GitHub Pages repository.
6. Open the website and use the **Database** dashboard → **Check Connection**.

The site uses an anonymous authenticated session, not a password login. Supabase anonymous users use the `authenticated` Postgres role and can be separated in RLS with the `is_anonymous` JWT claim.

Security note: because this version intentionally has no sign-in gate and one shared anonymous state row, anyone who can reach the public site can potentially write the shared workspace unless you later add real user authentication and member-specific RLS.
