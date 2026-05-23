# External Integrations

| Integration | Purpose |
|---|---|
| **Sage Business Cloud** | Sales invoice creation from accepted quotes |
| **AutoTradeOS** | BOM / parts list push to warehouse fulfilment system |
| **CheckCarDetails API** | UK registration lookup — auto-populates van specs |
| **OpenAI** | Powers Max AI assistant (GPT-4 class model) |
| **Resend / SendGrid** | Transactional emails — quote confirmations, spec approval, finance applications, artwork proofs |
| **Jigsaw Finance** | Finance application email routing to underwriter |
| **Google Cloud Storage** | Image and video uploads via presigned URLs with ACL management |
| **WrapGen** | 3D wrap render auto-link and approval tracking — see below |

## WrapGen Artwork Approval Workflow
WrapGen (`http://wrapgen.co.uk`) is a standalone external tool used by the design team. MTVC does **not** call the WrapGen API to create previews.

### Auto-link flow (primary)
1. Staff open the customer profile in MTVC and click **"Open in WrapGen"** in the WrapGen 3D Renders card
2. MTVC generates a 15-minute one-time token, stores it in `wrapgen_link_tokens`, and opens WrapGen at `http://wrapgen.co.uk?mtvc_token=TOKEN&mtvc_webhook=ENCODED_URL&mtvc_ref=QUOTE_REF`
3. The design team creates the artwork and generates the 3D render in WrapGen
4. WrapGen fires `POST /api/webhooks/wrapgen-link/:token` with `{ previewId, previewUrl }` — MTVC validates the token, saves `wrapgen_preview_url` and `wrapgen_preview_id` to the quote, and marks the token used
5. The customer profile updates automatically (polled every 5 s) — the render appears as linked with "Awaiting Approval" status

### Manual fallback
If the artwork was created without going through MTVC, staff can expand "Paste URL manually instead" in the WrapGen 3D Renders card and paste the preview URL directly.

### Customer approval
6. Staff share the WrapGen preview URL with the customer
7. Customer views and approves the render on WrapGen's platform
8. WrapGen fires `POST /api/webhooks/wrapgen` with `{ event: "artwork.approved", previewId, approvedByName, approvedAt }` — MTVC matches on `wrapgen_preview_id`, records approval timestamp and approver name, and appends an activity note to the quote

**Admin pages:** Customer profile → WrapGen 3D Renders card · `/admin/artwork-approvals` lists all linked previews across all quotes with approval status.

**Webhooks to configure in WrapGen:**
- Auto-link: `POST https://yourdomain.com/api/webhooks/wrapgen-link/:token` (token embedded in the URL MTVC opens)
- Approval: `POST https://yourdomain.com/api/webhooks/wrapgen` with `{ event: "artwork.approved", previewId, approvedByName, approvedAt }` (no secret header — public and idempotent)
