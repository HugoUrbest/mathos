# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # dev server on http://localhost:3000 (Turbopack)
npm run build    # production build — must pass before committing
npm run lint     # ESLint check
```

No test suite exists yet. Validate changes with `npm run build` (zero errors required).

## Architecture

**Mathos** is a math evaluation app (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).

### Two quiz modes

| Mode | Questions | Timer | Storage |
|------|-----------|-------|---------|
| Grand Test (`/quiz`) | 30 static JSON questions, no `primaire` level | 30 min | localStorage |
| Entraînement (`/entrainement`) | 10 questions: 50% static + 50% procedural | none | localStorage |
| Test Officiel (`/test-officiel`) | Same as Grand Test, `strictMode=true` | 30 min | Supabase |

### Data flow

1. **Profile** — stored in `localStorage` as three keys: `mathos_pending_level`, `mathos_pending_class_rating`, `mathos_pending_school_rating`. Read everywhere via `lib/quiz.ts → getStoredProfile()`.
2. **Quiz results** — stored in `localStorage` as `mathos_results` (array of `QuizResult`). Last result also at `mathos_last_result` for `/resultats`.
3. **Official results** — POSTed to `/api/official-result` → validated token → saved in Supabase `official_results` table with SHA-256 hash → PDF generated in Supabase Storage.

### Scoring

`+3` correct · `-1` wrong · `0` skipped. `maxScore = questions.length × 3`.  
Display percentage normalises the range `[-(maxScore/3), maxScore]` → `[0, 100]` via `getScorePercent()`.

### Key lib files

- `lib/types.ts` — all shared types and label maps (`Theme`, `Level`, `StudyLevel`, `SelfRating`, `QuizResult`, …)
- `lib/quiz.ts` — question selection, score computation, localStorage helpers, radar/scatter data builders
- `lib/procedural.ts` — 29 parametric generators (one per theme×level combination); IDs start at 90000 to avoid collisions with static questions
- `lib/questions.json` — ~311 static validated questions (IDs 1–89999)

### Components

- `QuizEngine.tsx` — the single quiz UI used by `/quiz`, `/entrainement`, `/test-officiel`. Props: `questions`, `modeLabel`, `totalSeconds` (0 = no timer), `strictMode` (no reveal, click = immediate advance), `banner`, `onFinish(answers)`. Exports `levelLabel(level)` helper.
- `RadarChart.tsx` — Recharts `RadarChart`, dynamic import only (`ssr: false`). Accepts `showTop` prop (`"top10" | "top20" | "top50"[]`) to overlay benchmark lines.
- `ScoreBadge.tsx`, `ThemeBreakdown.tsx` — shared display components used across results/verify/recruteur pages.

### Roles & Supabase

Three roles: `candidate` (default), `recruiter`, `admin`. Set manually in DB for first admin.  
API routes use `SUPABASE_SERVICE_ROLE_KEY` (server-side only). Client pages use `@supabase/ssr` via `lib/supabase/client.ts` and `lib/supabase/server.ts`.

Tokens are 8-char alphanumeric, single-use, 90-day expiry. Revocation = set `expires_at` to epoch 0.

### Pages requiring Supabase

`/test-officiel`, `/admin`, `/recruteur`, `/verify`, all `/api/*` routes.  
All other pages work fully offline with localStorage only.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY          # transactional email via Resend
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
```

Schema to execute once in Supabase SQL editor: `supabase/schema.sql`.  
Storage bucket needed: `mathos-certificates` (public).

### Adding questions

- **Static** — append to `lib/questions.json`. IDs must be unique integers < 90000.
- **Procedural** — add a generator object to the array in `lib/procedural.ts`. Each generator needs `theme`, `level`, `weight`, and `generate()` returning `Omit<Question, "id"|"type">`. Use `buildChoices(correct, wrongs)` to randomise answer position.
- **Bulk generation** — `scripts/generate-questions.ts` calls the Anthropic API; needs `ANTHROPIC_API_KEY` in env.
