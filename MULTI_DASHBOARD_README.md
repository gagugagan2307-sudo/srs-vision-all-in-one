# SRS Vision — Main Dashboard + Separate Dashboards

This build keeps the existing SRS Vision data, Projects, Teams, Calendar, Reports, Files, Accounts and realtime layer, while adding a clean main dashboard that acts as a launch center.

## Dashboard structure

The main Dashboard is the first screen. Each specialist area opens in its own dedicated dashboard:

- Graphic Design
- AI Tools
- Video Tools
- Image Tools
- Document Tools
- PDF Tools
- Productivity
- Developer Tools
- Business Tools
- Education Tools
- Entertainment
- Utilities

Existing management pages remain separate too (Projects, Clients, Files, Calendar, Teams, Reports, Services, Accounts, Bank Accounts, Announcements, Meetings, Audit Trail and Settings).

## Navigation behavior

Clicking a specialist slot uses a separate in-site route (hash route) and replaces the main workspace with that tool's dedicated dashboard. "Main Dashboard" returns to the launch screen.

## Realtime setup

Use the included `database.sql`, `supabase-config.js`, `auth.js` and `live-db.js` from the package. Anonymous Sign-Ins must be enabled in the connected Supabase project, and `public.threefs_state` must be enabled for Realtime.


### Team structure
The platform uses one team named **SRS VISION** with 12 members.
