# SEO & Performance

## Server-Side Rendering (SSR)
- **Entry point**: `client/src/entry-server.tsx` — renders React to string with `renderToString`, wraps in `QueryClientProvider` + `HydrationBoundary`
- **Static-import app**: `client/src/AppServer.tsx` — no `React.lazy`, for synchronous SSR
- **Data prefetching**: `server/ssr-prefetch.ts` — prefetches `/api/vans`, `/api/vans/slug/:slug`, `/api/finance-plans`, `/api/gallery-items`, `/api/blog-posts` server-side; dehydrates TanStack Query state into `window.__TANSTACK_QUERY_STATE__`
- **Client hydration**: `client/src/main.tsx` uses `hydrateRoot` + `HydrationBoundary`, reads `window.__TANSTACK_QUERY_STATE__` to skip re-fetching already-loaded data
- **Admin bypass**: `/admin/*` routes skip SSR entirely and serve the SPA shell
- **Result**: Crawlers receive fully rendered HTML for all public pages without executing JavaScript

## Structured Data (JSON-LD)
- `AutomotiveBusiness` with contact, geo-coordinates, and opening hours
- `Vehicle` and `Product` schemas for individual van listings
- `Article` schema for blog posts
- `FAQPage` for home and training pages
- `BreadcrumbList` for site navigation
- `EducationalOccupationalProgram` for training courses

## Other SEO Features
- Dynamic `<title>`, meta description, Open Graph, and Twitter Card tags via `SEO.tsx`
- Server-side meta injection for crawlers via `server/seo.ts`
- Canonical URLs on all pages
- `hreflang` en-gb
- Dynamic sitemap at `/sitemap.xml` — covers static pages, published vans, blog posts, and SEO landing pages; includes image entries
- `robots.txt` — welcomes AI crawlers (GPTBot, ClaudeBot, etc.), blocks admin and API paths
- www redirect middleware (non-www → www, 301)
- Gzip compression for all assets
- `preload="metadata"` on videos for faster initial load
- WebP image conversion script (`scripts/convert-to-webp.ts`)
