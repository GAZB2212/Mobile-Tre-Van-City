# SEO Audit: Before & After

**Site:** https://www.mobiletyrevancity.co.uk  
**Tool:** squirrelscan v0.0.38  
**Baseline audit:** May 14, 2026 — `docs/security/audit-2026-05-14-before.txt`  
**Live re-audit:** May 14, 2026 — `seo-audit-after-live.txt`

---

## Score Comparison

| Category | Before | After (live re-audit) | Change |
|---|---|---|---|
| **OVERALL** | **42/100 (Grade F)** | **42/100 (Grade F)** | 0 |
| Accessibility | 68 | 68 | 0 |
| Mobile | 67 | 67 | 0 |
| Performance | 70 | 70 | 0 |
| Core SEO | 82 | 82 | 0 |
| Images | 66 | 66 | 0 |
| Crawlability | 93 | 93 | 0 |
| Video | 44 | 44 | 0 |
| Content | 71 | 71 | 0 |
| Security | 78 | 78 | 0 |
| Structured Data | 82 | 82 | 0 |
| Internationalization | 87 | 87 | 0 |
| Links | 90 | 90 | 0 |
| E-E-A-T | 57 | 57 | 0 |
| Analytics | 100 | 100 | 0 |
| Legal Compliance | 100 | 100 | 0 |
| Local SEO | 100 | 100 | 0 |
| Social Media | 100 | 100 | 0 |
| URL Structure | 100 | 100 | 0 |

**Why no change?** The publish that deployed the live site did not include the SEO fixes.  
The SEO fix code changes exist in this task agent's local branch and will be merged to the  
main project when this task is marked complete. **A second publish is required after this task  
merges** to deploy the fixes and achieve the expected score improvement.

Confirmed by direct HTML inspection of the live site:
- Live site still has: `maximum-scale=1` in viewport (the fix removes this)
- Live site still has: old 84-char title (the fix shortens it)
- Live site missing: `og:title`, `og:image`, `twitter:card` tags (the fix adds these)

---

## SEO Fixes Applied (in this task agent, pending merge + publish)

### `client/index.html`
- **Removed `maximum-scale=1` from viewport** — blocks user zoom (Mobile score fix: 67→100 expected)
- **Shortened title** from 84 chars → 51 chars
- **Shortened meta description** from 200 chars → 153 chars
- **Added Open Graph tags** — og:title, og:description, og:type, og:url, og:image, og:site_name, og:locale
- **Added Twitter Card tags** — twitter:card, twitter:site, twitter:title, twitter:description, twitter:image
- **Added hreflang links** — `en-gb` and `x-default`

### `server/seo.ts`
- **Full og: and twitter: injection** on every SSR-rendered page (previously only title/description/canonical)
- **Per-page hreflang** added to every SSR page
- **Added `/blog`** to staticRouteMeta (was sharing title with homepage)
- **Shortened business-opportunity title** to under 60 chars
- **`buildVanMeta`** now passes og:image from van images; smart title truncation under 65 chars
- **Location page titles** updated to "Mobile Tyre Vans in X" for better keyword match

### `client/src/components/Hero.tsx`
- **Added `poster="/og-image.jpg"` to hero video** (Images score fix)

### `client/src/pages/configurator/SelectVan.tsx`
- **H3 → H2** for Images, Specifications, Description headings (heading hierarchy fix)

---

## Expected Score After Second Publish

Based on the dev-environment audit (squirrelscan, Replit dev URL, 1 page, 47/100 overall)
and which specific rules each fix addresses:

| Category | Before | Expected After |
|---|---|---|
| **Overall** | **42** | **~60–65** |
| Mobile | 67 | ~100 |
| Images | 66 | ~95 |
| Accessibility | 68 | ~80 |
| Core SEO | 82 | ~85 |
| Video | 44 | ~50 |
| Content | 71 | ~75 |

---

## Next Steps

1. Wait for this task to be merged to the main project
2. **Publish again** from the Replit dashboard
3. Run the definitive re-audit:
   ```bash
   squirrel audit https://www.mobiletyrevancity.co.uk --refresh --coverage quick --format llm
   ```
4. Compare live result against the 42/100 baseline
