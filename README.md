# PMD Investment Academy: pmdinvestment.co.za

Website and staff CRM for **PMD Investment Academy**, a Johannesburg financial-markets and
conferencing training institute. This replaces the old WordPress site and the AppGini PHP CRM
(`/app`) with two apps:

| Folder | Stack | Hosts |
| --- | --- | --- |
| [`client/`](client) | Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4 | Vercel |
| [`server/`](server) | Node.js, Express 5, MongoDB (Mongoose 9), Google (sign-in, Gmail, reCAPTCHA), Cloudinary | Vercel (serverless) or any Node host |

```
Browser ──► Next.js (client) ──/api/* rewrite──► Express API (server) ──► MongoDB Atlas
                 │                                     ├──► Cloudinary (images, PDFs)
                 └── server components fetch API ──────┤──► Gmail (notifications)
                                                       └──► Google (ID-token + reCAPTCHA verify)
```

## What's where

**Public site** (`client/src/app/(site)`)
- Home (hero slider, services, industries, testimonials, partners, map)
- CMS pages migrated from WordPress: Forex, Share Market, Trading Account, Cryptocurrency,
  Education, Conferencing, About, Disclaimer, Market Concepts, Stock Market FAQs
- `/blog`, `/events`, `/contact` (form + Google Map), `/enrol` (online enrolment form),
  `/downloads` (PDF forms)
- Old WordPress URLs (`/about-us-2`, `/enrolment`, `/app`, `/download/…`, `/wp-content/uploads/…`)
  redirect to their new equivalents.

**Admin** (`/admin`, Google sign-in restricted to `ADMIN_EMAILS`)
- CRM: **Clients**, **Appointments**, **Employees** (rebuilt from the old AppGini app)
- Submissions: **Enrolments** (with "Convert to client"), contact **Messages**
- Content: Pages, Articles, Events, Testimonials, Site settings, plus Cloudinary uploads

**Security notes**
- SA ID numbers and bank account numbers are encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY`)
  with HMAC blind indexes for exact search. Lists show them masked. Emails never include them.
- Public forms: zod validation, reCAPTCHA v3, honeypot, rate limiting.
- Admin session: httpOnly cookie issued after verifying a Google ID token. It's first-party
  because the browser reaches the API through the Next.js `/api` rewrite.

## Local development

Requires Node.js 20+.

```bash
# 1. API: in-memory MongoDB, seeded with the migrated content (no Mongo install needed)
cd server
npm install
npm run dev:memory          # http://localhost:4000

# 2. Website
cd ../client
npm install
cp .env.example .env.local  # API_URL=http://localhost:4000
npm run dev                 # http://localhost:3000
```

To use a real database instead, copy `server/.env.example` to `server/.env`, fill it in, then run
`npm run seed` once and `npm run dev`.

Tests: `cd server && npm test` (integration tests against an in-memory MongoDB).

## Deployment

1. **MongoDB Atlas**: create a cluster and set `MONGODB_URI`.
2. **Cloudinary**: set `CLOUDINARY_URL`. Then `npm run seed` uploads the 68 legacy images from
   `server/seed/media` and rewrites content to Cloudinary URLs. Until then they are served from
   the API's `/media`.
3. **Google Cloud console**
   - OAuth 2.0 *Web* client: authorised JavaScript origin = the site URL. The client ID goes in
     `GOOGLE_CLIENT_ID` (server) and `GOOGLE_CLIENT_ID` (client).
   - reCAPTCHA v3 keys: `RECAPTCHA_SECRET` (server), `RECAPTCHA_SITE_KEY` (client).
   - Maps Embed API key (optional): `GOOGLE_MAPS_API_KEY` (client).
   - Gmail: `GMAIL_USER` plus OAuth2 refresh token (or an app password).
4. **Deploy `server/`** to Vercel (root directory `server`; Vercel's Express preset serves the default export of `src/app.js`).
   Set every variable from `server/.env.example`; `CLIENT_ORIGINS` = the site URL.
5. **Deploy `client/`** to Vercel (root directory `client`). Set `API_URL` to the server URL, `SITE_URL` to the site URL, and
   the other variables from `client/.env.example`. The API must be reachable at build time; pages are prerendered
   from it.
6. Point `pmdinvestment.co.za` at the client project.

## Migration notes

The source was a BackupBuddy backup from 2019-11-22 (WordPress + Consulting theme + Visual
Composer). Real content was extracted into [`server/seed/content.json`](server/seed/content.json),
with shortcodes converted to clean HTML. Theme demo content (lorem-ipsum posts, demo products,
staff, case studies, demo orders) was dropped. Data from the old CRM was not part of the backup;
its schema was rebuilt as the Clients / Appointments / Employees collections.

A separate 2020 backup in this folder belonged to **Dube Sons Construction**
(dubeconstruction.co.za). It was moved to its own repository at `../dubeconstruction`.
