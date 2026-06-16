# ArkOne — IPFS Media Upload & Retrieval

A minimal Next.js app for uploading images, video, and audio to IPFS via Pinata, with an API-key-protected endpoint for signed playback URLs.

## Prerequisites

1. [Pinata](https://pinata.cloud) account
2. API JWT (Pinata → API Keys)
3. Dedicated gateway subdomain (e.g. `yourname.mypinata.cloud`)

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
PINATA_JWT=your_jwt
PINATA_GATEWAY=yourname.mypinata.cloud
API_SECRET_KEY=your_long_random_secret
LOG_LEVEL=info
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your `API_SECRET_KEY` when prompted.

## API

API docs: [http://localhost:3000/docs](http://localhost:3000/docs)

All routes require:

```http
Authorization: Bearer <API_SECRET_KEY>
```

### Upload (small files)

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer your_secret" \
  -F "file=@photo.jpg"
```

### Presigned upload URL (large / video files)

```bash
curl http://localhost:3000/api/upload/url \
  -H "Authorization: Bearer your_secret"
```

Upload directly to the returned URL, then register the CID:

```bash
curl -X POST http://localhost:3000/api/media/register \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json" \
  -d '{"cid":"bafy...","name":"clip.mp4","mimeType":"video/mp4"}'
```

### List assets

```bash
curl http://localhost:3000/api/media \
  -H "Authorization: Bearer your_secret"
```

### Get signed playback URL

```bash
curl http://localhost:3000/api/media/bafybeig... \
  -H "Authorization: Bearer your_secret"
```

Response:

```json
{
  "cid": "bafy...",
  "name": "clip.mp4",
  "mimeType": "video/mp4",
  "category": "video",
  "url": "https://gateway.mypinata.cloud/files/bafy...?signature=...",
  "expiresIn": 3600
}
```

## Database

Asset metadata is stored in SQLite via [Drizzle ORM](https://orm.drizzle.team/) and [libSQL](https://github.com/tursodatabase/libsql).

### Local development

No extra setup is required. On first use the app creates `data/local.db` automatically. You can override the path with:

```env
DATABASE_URL=file:./data/local.db
```

### Production (Vercel + Turso)

For serverless deploys, use [Turso](https://turso.tech) so the database persists across requests:

1. Install the [Turso CLI](https://docs.turso.tech/cli/introduction) and sign in
2. Create a database: `turso db create arkone`
3. Create an auth token: `turso db tokens create arkone`
4. Get the database URL: `turso db show arkone --url`
5. Set these in your Vercel project environment:
   - `TURSO_DATABASE_URL` — the `libsql://...` URL
   - `TURSO_AUTH_TOKEN` — the token from step 3

Migrations run automatically during `npm run build` and on first app startup.

### Migrate existing `assets.json`

If you have assets in `data/assets.json` from before the database migration:

```bash
npm run db:import-json
```

### Manual migrations

```bash
npm run db:generate   # after schema changes
npm run db:migrate    # apply pending migrations
```

## Tests

```bash
npm test          # watch mode
npm run test:run  # single run (CI)
```

## Logging

Server logs are structured JSON via `pino`. Set `LOG_LEVEL=debug` for verbose output locally.

## Security notes

- Never commit `.env.local` or `keys.txt`
- `PINATA_JWT` stays server-side only
- Playback URLs are time-limited signed gateway links

### Windows TLS / upload 500 errors

If uploads fail with `fetch failed` or `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, Node.js cannot verify Pinata's HTTPS certificates on your machine (common on some Windows setups). For **local dev only**, set:

```env
PINATA_TLS_INSECURE=true
```

Restart the dev server after changing `.env.local`. This flag only takes effect when `NODE_ENV=development` and is ignored in production.
