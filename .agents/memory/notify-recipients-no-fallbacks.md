---
name: Notification recipients — no hardcoded fallbacks
description: Internal notification emails must never fall back to hardcoded addresses
---
Rule: internal notification emails (lead/quote/depot/finance channels) must only go to addresses configured in Admin → Settings → Notification Recipients. When nothing is configured, skip the send with a console warning — never fall back to hardcoded addresses.

**Why:** The codebase originally defaulted to the previous business owner's addresses (geg.co, wirralvans.co.uk, gfukgroup.co.uk) and a finance broker, leaking new customers' data to third parties — including a startup block that force-reset the broker email if changed. Removed July 2026 as part of a security hardening pass (which also gated GET /api/leads behind admin auth, removed an Ahrefs key, a committed DB dump, and a plaintext ADMIN_PASSWORD in .replit).

**How to apply:** Any new notification path should resolve recipients via getInternalNotifyEmails() and rely on the empty-list skip in sendEmail(); never add literal email fallbacks. Note: the old DB dump, password, and analytics key still exist in git history — treat all credentials from before July 2026 as compromised.
