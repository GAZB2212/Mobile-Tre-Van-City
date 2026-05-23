# Max AI Assistant

An AI-powered conversational configurator ("Max") that guides customers through building a van specification via natural language, then maps the conversation directly to the product catalogue.

## Customer Experience
- **AIChatWidget** — floating chat button (bottom-right on all public pages); persists via `localStorage` (`ai-chat:v1`) and `navigator.sendBeacon` on page exit
- Pre-chat lead capture (Name + Phone) secures contact data before any conversation begins
- A "Summary Card" appears near the end showing the proposed van, kit, extras, and payment preference
- "View your configuration" syncs Max's choices into the standard configurator for review, then the customer submits via the normal quote flow

## The 9-Question Conversation Flow
| Step | Question |
|---|---|
| Q0 | Name (if not already captured) |
| Q1 | Purpose — starting out, expanding, or replacing |
| Q2 / Q2b | Daily workload and vehicle types (car vs. commercial) |
| Q3 / Q3a | Van supply and year (determines Euro 6 status) |
| Q4 | Van size — MWB or LWB |
| Q5 | Tyre machine preference — semi-auto or fully-auto |
| Q6 / Q6b | Package recommendation and van branding (Graphic Pack / Half Wrap / Full Wrap) |
| Q7 | 48V Lithium Silent Compressor pitch |
| Q8 / Q9 | Finance preference and callback number |

**Q6b branding mapping** — wrap prices and upgrade IDs differ by van size (MWB vs LWB). The system prompt contains a hard-coded UUID table per van size so Max always outputs the correct variant ID, preventing the wrong SKU entering a quote.

## System Prompt
Built dynamically in `server/routes.ts` and injected with live database data on every message:
- Available kits (with Euro 6 and machine type flags)
- Published upgrades and finance plans
- **Popularity intelligence** — live stats on what other customers are choosing (e.g. "80% of recent customers add the 48V system") to inform Max's recommendations

## Admin AI Conversations Page (`/admin/ai-conversations`)
- Live-updating feed of all AI sessions with full transcript viewer
- Conversion tracking: lead captured, 48V system pitched, customer response
- "Open in Configurator" — pre-loads the AI's chosen configuration into the admin build tool for staff to finalise
- Mark as contacted with private follow-up notes
- Auto-creates Draft quotes from conversations where `config_completed = TRUE` but no quote was formally submitted

## `aiConfiguratorMapping.ts`
Translates the AI's `AIConfig` output object into the `configurator:v6` state format used by the main site — the single source of truth for AI-to-quote conversion.
