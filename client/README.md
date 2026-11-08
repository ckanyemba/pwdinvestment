# PMD Investment Academy: client

Next.js 16 website and staff admin for pmdinvestment.co.za. See the [root README](../README.md)
for architecture and deployment.

```bash
npm install
cp .env.example .env.local
npm run dev     # needs the API running (cd ../server && npm run dev:memory)
npm run build   # prerenders pages from the API at API_URL
npm run lint
```

## Layout

- `src/app/(site)/`: public pages (home, CMS `[slug]` pages, blog, events, contact, enrol, downloads)
- `src/app/admin/`: client-rendered staff area; resources are declared in
  `src/components/admin/resources.ts` and rendered by the generic `ResourceList` / `ResourceForm`
- `src/app/api/revalidate`: purges the `content` cache tag after admin edits (session-checked)
- `src/lib/api.ts`: cached (`'use cache'`, `cacheTag('content')`) server-side API access
- `next.config.ts`: `/api/*` → Express rewrite, legacy WordPress redirects, image hosts

This project uses **Cache Components**. Read `node_modules/next/dist/docs/` before changing
data fetching (see `AGENTS.md`).
