---
name: www redirect must skip API and non-GET requests
description: Why the non-www→www canonical redirect breaks credentialed API writes and how to scope it
---

The non-www→www 301 canonical redirect in `server/index.ts` must apply ONLY to page/document requests: `(GET|HEAD) && !path.startsWith('/api')`.

**Why:** A 301 on a credentialed `PUT/PATCH/DELETE` (or `POST`) causes the browser to re-issue the request to the www origin. That turns a same-origin write into a cross-origin credentialed request, which the browser silently drops — GETs keep working, writes fail with an empty-body 403 that never reaches Express (no entry in Express request logs). This produced "Failed to update upgrade" 403s in admin even though server-side auth/routes were fine and other PUTs succeeded.

**How to apply:** Never let host-canonicalization (or any host/HTTPS redirect) touch `/api/*` or non-GET/HEAD methods. API calls must stay on whatever host the SPA was loaded from. If a production write 403s with an empty body but isn't logged by Express, suspect an edge/redirect hop, not the route's auth.
