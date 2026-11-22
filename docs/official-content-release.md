# Official content expansion — 22 November 2026

This release implements the approved order: Mystery Unveiled event and reward worksheet, combat basics, Curious Deductions, then the English–Japanese reference and Morgue Street.

## Public routes

Each suffix is available under both `/en/` and `/ja/`:

| Suffix | Delivered behavior |
| --- | --- |
| `guides/mystery-unveiled/` | Independent summary of the official tasks, currency limits, ten pool entries, selection and one-time manual claim rules |
| `tools/event-rewards/` | Record drawn entries, prepare at most six, aggregate duplicate quantities, save locally, import/export, convert deadlines and download calendars |
| `guides/combat-basics/` | Official July beta mechanisms and original two-track diagram, with launch-version limits |
| `guides/curious-deductions/` | Branching endings and Evidence Board restart explanation, without a case solution |
| `tools/glossary/` | 50 bilingual official references, name/description search, category filters and source links |
| `guides/morgue-street/` | Official region hierarchy, landmark functions and background, without coordinates or routes |

Calendar downloads use `/en/events/mystery-unveiled.ics` and `/ja/events/mystery-unveiled.ics`. They contain only the official draw and claim deadlines, represented in UTC. Static Pages responses explicitly use `text/calendar` and an attachment filename.

## Local acceptance

- Astro check: 65 files, no errors, warnings or hints.
- 26 tests pass. Reward cases cover distinct same-name entries, quantity aggregation, drawn-before-selected, six-slot limits, immutable updates, invalid backups and unrelated save formats, deadline phases and RFC 5545 UTF-8 folding.
- Production and `PREVIEW_NOINDEX=1` builds pass. Output: 44 HTML pages; Pagefind: 40 English/Japanese pages. Build checks cover CSP, local links, canonical URLs, draft isolation, language metadata and sitemap contents.
- Browser worksheet: two Ounce entries total 40,000; two Volume I entries total 20; four selections use four slots. After six selections the seventh is disabled. Removing a selected drawn entry reduces the count and re-enables another eligible selection.
- Browser persistence: refresh and English/Japanese switching retain the worksheet. JSON backup download contains the selected stable IDs and independent event type/version.
- UTC display: draw deadline `2026-12-13 15:59`, claim deadline `2026-12-29 02:00`.
- Search: full-width `ＰＡＲＲＩＥＳ`, Japanese `フウ`, and straight-apostrophe `Hero's Instinct` match the corresponding entries. Contradictory category/query shows the empty state; clearing restores all 50 references.
- EN/JA rewards, glossary, combat and region layouts tested at 320px and 390px: 16 combinations, document content/scroll widths respectively 305/305 and 375/375, with no horizontal overflow. The local iframe harness is excluded from the final build.
- Final guide review corrected Japanese Markdown punctuation and separated the parry response from the stunned-enemy sequence. New tool tabs reported no browser errors or warnings during functional checks.

The original material and field-note keys and formats are retained. Reward records use only `spg:event-rewards:mystery-unveiled-2026:v1`; no account access, rewards claim or automatic item ranking occurs.

## Publication and production acceptance

Publication uses the existing `main` branch and native GitHub → Cloudflare Pages integration. No manual artifact upload or Workers migration is needed.

After the Cloudflare Pages GitHub check succeeds, run:

```sh
npm run verify:deployment -- https://silverpalaceguide.com
```

The expanded deployment checker covers 31 route responses and 6 www redirects. It checks all 12 new pages, both calendar files, accurate XML/calendar MIME types, indexability, canonical URLs, sitemap membership and real 404 responses for private fixtures. Browser verification on the production origin confirms the delivered page and client-side search.

## Content boundaries and next evidence

All event names and quantities were checked against the public English and Japanese Rules dialogs on 22 November. Combat and deduction material comes from July test articles; the region article explicitly describes work in progress. Source IDs and URLs are recorded in `src/data/sources.json` and the expansion plan.

The next substantive milestone remains the first verified case hint sequence, reproducible exploration route and complete progression interval. It requires gameplay records, stable IDs, applicable version/server, screenshots and a second check. Exact launch hours, full character kits, numerical presets, tier lists and unverified codes are not supplied by these sources.
