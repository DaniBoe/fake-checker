# Labubus Checker (fake-checker)

Image-first web app that classifies uploaded “labubus” photos as Likely Authentic, Suspicious, or Fake. Freemium: 3 free checks/day; paid unlimited.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- Framer Motion
- Supabase (DB/Storage)
- Stripe (subscriptions)
- Clerk (auth)
- pnpm

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` based on `.env.example` and fill values. To enable OpenAI-based classification, set `OPENAI_API_KEY` (and optionally `OPENAI_VISION_MODEL`, defaults to `gpt-4o-mini`). If not set, a heuristic mock is used.

3. Run dev server:

```bash
pnpm dev
```

Open http://localhost:3000

## Features
- Drag & drop or click to upload with client preview
- Server-side validation: mime type and 8MB max
- OpenAI wrapper classifier (vision). Falls back to mock if no key
- Freemium guard: 3 checks/day for unauthenticated users
- Pricing and dashboard pages scaffold
- Stripe webhook scaffold

## API

POST `/api/check`
- Accepts multipart form with `file` and optional metadata fields
- Returns `{ label, reason, confidence }`

POST `/api/upload-url`
- Stub for signed uploads (Supabase/UploadThing)

POST `/api/stripe-webhook`
- Stripe webhook (test mode)

## Replace/Customize the Classifier
Edit `lib/classifier.ts`. If `OPENAI_API_KEY` is present, the app calls OpenAI with the image URL and metadata. Otherwise it uses the mock heuristic.

## Tests
Run

```bash
pnpm test
```

## Migrations
Provide DB schema/migrations in `supabase_migrations/` and run with

```bash
pnpm migrate
```

## Security Notes
- Validate uploads server-side: type and size checks
- Use signed upload URLs to avoid handling raw uploads on server
- Sanitize metadata before DB writes (see Zod usage)
- Rate-limit endpoints (add your provider or middleware)
- Keep secrets in env files only
