# SkinGuard

Skincare ingredient analyzer — paste, photo, or scan a product label to get a full breakdown of every ingredient.

## Features

- Ingredient analysis with safety ratings, comedogenicity, fragrance/allergen flags
- OCR label scanning + barcode lookup via Open Beauty Facts
- 24,000+ ingredients from EU CosIng database
- User accounts with saved items
- Mobile app (iOS/Android) with live camera scanning

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · SQLite (Turso in prod) · Expo (mobile)

## Run locally

```bash
npm install
npm run db:seed
npm run db:migrate
npm run dev
```

## Deploy

Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel environment variables, then:

```bash
vercel
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate
```

## Mobile

```bash
cd mobile
# Update config.ts with your API URL
npx expo start
```
