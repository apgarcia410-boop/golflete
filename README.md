# Golf Athlete App — Phase 1

Personal golf-athlete performance tracker. This is the Phase 1 (Foundation/MVP) build:
auth, dashboard, workout logging, body/nutrition/readiness tracking, and the
Brand & Appearance customization system.

## What's included in this phase

- Email/password auth (Supabase Auth), one account synced across all your devices
- Dashboard showing current weight, target weight, and last session
- **Train**: start a workout, log sets (weight/reps/RPE/notes) against the exercise
  library, finish the session — every set is saved permanently
- **Track**: quick daily entry for body stats, nutrition (calories/macros/water),
  and readiness (sleep/energy/soreness/stress)
- **Progress**: basic history view of recent body stats and workouts
- **Brand & Appearance**: theme presets (Performance/Fairway/Carbon/Classic/Minimal),
  per-color pickers, logo upload, live preview, reset to default
- Installable as a PWA on iPhone (Add to Home Screen)
- Full database schema with row-level security, so your data is only ever
  yours — see `supabase/migrations/`

## Not yet built (later phases, per the roadmap)

- The actual "6 Weeks of The Work" program content (weeks/workouts aren't seeded
  yet — see "Adding your program" below)
- Progressive overload suggestions, PRs, estimated 1RM (Phase 2)
- Trend charts, achievements (Phase 2)
- Expanded food database / barcode scanning (Phase 3)
- Golf rounds/clubs/launch monitor data (Phase 4)
- Wearable integrations (Phase 5)
- AI coach (Phase 6)

---

## 1. Set up the database

1. Open your Supabase project → **SQL Editor**.
2. Paste and run `supabase/migrations/0001_init.sql` (creates all tables + RLS).
3. Paste and run `supabase/migrations/0002_storage.sql` (creates the logo/brand
   asset storage bucket).
4. Paste and run `supabase/seed.sql` (adds exercise categories and a starter
   exercise library matching your home + station equipment).

Every table has Row-Level Security enabled — nobody, including Anthropic or
Supabase, can read your data through the app's public key except you, once
you're signed in.

## 2. Run it locally (optional but recommended before deploying)

You'll need [Node.js](https://nodejs.org) installed (LTS version).

```bash
cd golf-athlete-app
npm install
npm run dev
```

Open http://localhost:3000 — you should land on the login screen. Sign up
with your email, and you'll be dropped into the dashboard. `.env.local` is
already filled in with your Supabase project's URL and public key.

## 3. Push to GitHub

```bash
cd golf-athlete-app
git init
git add .
git commit -m "Phase 1: foundation/MVP"
```

Create a new repository on GitHub (empty, no README), then:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## 4. Deploy on Vercel

1. Go to vercel.com → **Add New Project** → import the GitHub repo you just pushed.
2. In the project's **Environment Variables** settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://prziynfzrvnrtojxhasv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your publishable key
3. Click **Deploy**.

Vercel gives you a live `https://your-app.vercel.app` URL. Open it on your
iPhone in Safari, tap the Share icon → **Add to Home Screen** — it'll install
like a native app.

## Adding your program ("6 Weeks of The Work")

The database is ready for it (`programs` → `program_versions` → `program_weeks`
→ `program_workouts` → `program_exercises`), but the actual week-by-week
content isn't loaded yet since we haven't confirmed it together. Once you
share the program (or we rebuild it from scratch), I'll write the seed data
and a simple admin view so it shows up on your dashboard.

## Testing checklist (Phase 1 success criteria)

- [ ] Open on iPhone, sign up/log in
- [ ] Start a workout, log a few sets, finish it
- [ ] Open on MacBook, log in with the same account, see that workout
- [ ] Enter weight, nutrition, readiness on Track
- [ ] Go to Brand & Appearance, switch presets, upload a logo, save
- [ ] Switch presets, confirm the whole app re-themes live
- [ ] Close the app, come back later — everything is still there
