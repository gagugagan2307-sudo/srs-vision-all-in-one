# SRS Vision — Internal Team Workspace

This is a standalone browser workspace for the SRS Vision team.

## Included
- Dashboard
- Team CRUD
- Projects CRUD
- Clients internal records
- Service work queue
- Graphic Design / Logo Design / UI/UX / Web Development / Video Editing / Social Media task creation
- AI workspace launchers
- Reports
- Revenue / Expense / P&L
- Work Music: online links + offline user-owned/licensed audio
- Local persistence
- Optional Supabase anonymous-auth + realtime shared state
- JSON backup export

## Run
Open `index.html` in a browser. For best results use a small local static server (VS Code Live Server is fine).

## Access code
Default: `SRS@vision`
Change it in `config.js`.

## Supabase
1. Create/open your Supabase project.
2. Run `database.sql` in SQL Editor.
3. If using the current anonymous-auth approach, enable Anonymous Sign-Ins in Supabase Auth.
4. Put the project URL and publishable/anon key in `config.js`.
5. Reload the workspace.

The app also works in local mode when Supabase is not configured.

## Important music note
Offline files should be audio the team owns or is licensed to use. Online entries should point to legitimate streams/providers. This project does not bundle or download copyrighted commercial music catalogs.
