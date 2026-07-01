# SkinGuard

Skincare ingredient analyzer. Paste, photo, or scan a product label to get a full breakdown of every ingredient — what it does, safety rating, and flags for your skin type.

## What it does

- **Ingredient analysis** — paste an INCI list and get per-ingredient ratings, comedogenicity scores, fragrance/allergen flags, pregnancy safety, and skin-type-specific alerts
- **OCR scanning** — photograph a product label; text is extracted and analyzed automatically
- **Barcode scanning** — scan a product barcode to look up its ingredient list via Open Beauty Facts
- **24,000+ ingredients** — sourced from the EU CosIng database with a curated overlay for common actives
- **Accounts** — sign up, log in, save ingredients and products
- **Mobile app** — Expo app (iOS/Android) with live camera scanning

## Stack

- **Frontend + Backend** — Next.js 16 App Router (React 19, TypeScript, Tailwind CSS v4)
- **Database** — SQLite via `@libsql/client`; Turso in production
- **Auth** — `scrypt` password hashing, opaque session tokens, `httpOnly` cookies
- **OCR** — Tesseract.js (client-side WASM on web, server-side on mobile API)
- **Barcode** — `@zxing/browser` on web; `expo-camera` on mobile
- **Mobile** — Expo (React Native)

## Project structure

```
src/
  app/                  Next.js pages and API routes
    api/
      analyze/          INCI analysis endpoint
      auth/             login, signup, logout
      ocr/              base64 image → extracted text (for mobile)
      saved/            save/unsave items
      health/           uptime check
  lib/
    analyzer.ts         core INCI parsing + matching engine
    auth.ts             password hashing, sessions, rate limiting
    db.ts               database client (local file or Turso)
    logger.ts           structured JSON logger
    api-handler.ts      withLogger HOF wrapping all API routes
scripts/
  migrate.ts            migration runner
  backup-db.ts          database backup (VACUUM INTO / Turso dump)
  migrations/           numbered SQL migration files
mobile/
  App.tsx               home screen
  screens/
    ScanScreen.tsx      camera (OCR + barcode)
    ResultsScreen.tsx   analysis results
  config.ts             API base URL
```

## Local development

```bash
# Install dependencies
npm install

# Seed the database (creates data/app.db from the CosIng dataset)
npm run db:seed

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile

```bash
cd mobile
npx expo start
# Scan the QR code with Expo Go on your phone
```

Update `mobile/config.ts` with your local IP:
```ts
export const API_BASE = "http://192.168.x.x:3000";
```

## Database scripts

```bash
npm run db:seed      # rebuild ingredient/product data from source files
npm run db:migrate   # apply pending SQL migrations
npm run db:backup    # create a timestamped backup (keeps last 7)
```

## Deployment

### Web (Vercel)

```bash
vercel
```

Set these environment variables in Vercel dashboard:

| Variable | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | your Turso token |

After setting env vars, run migrations against Turso once:

```bash
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate
```

### Mobile (EAS Build)

```bash
# Update mobile/config.ts with your Vercel URL first
npm install -g eas-cli
eas login
cd mobile
eas build:configure
eas build --platform android --profile preview
```

## Environment variables

See `.env.example` for all variables. Copy it to `.env.local` for local development.
