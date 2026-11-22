# Beginner orientation and guide navigation — 22 November 2026

This release completes CON-02 as a pre-launch orientation in English and Japanese. It organizes the existing official sources into practical questions, linking to deeper references and tools. It does not claim to be a tested first-hour walkthrough or complete any of the three gameplay-record milestones.

## Public delivery

- `/en/guides/beginner-guide/` and `/ja/guides/beginner-guide/`: preparation and event choices, two separate combat openings, switching, investigation notes, revisiting a location, recording all upgrade costs and bilingual terminology.
- Every guide has a native collapsible section directory, generated from Markdown headings. It appears beside the article on desktop and before it on mobile, supports fragment URLs and requires no additional client script.
- Every guide ends with three other published guides in the same language, prioritizing the current category. Navigation is excluded from Pagefind to avoid repeating recommendation text in search excerpts.
- The homepage primary action and reading list, featured guide-directory entry and tool-directory link lead newcomers to the orientation.
- The old hard-coded prohibition on the beginner slug is replaced with checks derived from actual draft metadata. Public guide builds also verify unique heading IDs, every directory target/order, three distinct related links, bilingual sitemap membership and indexing policy.

## Sources and boundaries

The source set remains the registered launch announcement and bilingual event, combat, deduction, region and character introductions. It is linked from each new guide. The official news list was checked again on 22 November and still displays the previously reviewed recruitment notices and test articles.

The reading order and note-taking suggestions are editorial advice. July combat/deduction mechanisms retain their beta scope. No opening hour, complete solution, route, numerical cost, ranking or account-transfer rule is inferred. Japanese terms follow the existing verified glossary, including チャージ攻撃, チャージスキル and 共振値.

## Local acceptance

- Astro check: 69 files, no errors, warnings or hints.
- Existing 37 tests pass. No new numerical gameplay model or save format was introduced.
- Production and `PREVIEW_NOINDEX=1` builds pass: 46 HTML pages and 42 Pagefind pages, with content, assets, links, CSP, canonical/language, sitemap, preview noindex and private-draft checks passing. The final local build is the production configuration.
- Keyboard activation of a directory link updates the fragment; the Japanese upgrade section lands near the top of the viewport. Enter collapses and reopens the mobile directory.
- EN/JA beginner article, guide directory, homepage and existing combat article checked at 320px and 390px: 16 combinations, document client/scroll widths of 305/305 and 375/375, without horizontal overflow. Mobile directories precede the article.
- Browser review caught and corrected two Japanese emphasis delimiters before publication. Existing local material, field-note and event data are unaffected.
- Local search finds the orientation first for `beginner` in English (3 results) and `初心者` in Japanese (4 results). The guide-directory screenshot is saved as `artifacts/screenshots/beginner-guides-en.jpg`; detailed responsive results stay in ignored `artifacts/private/beginner-reading/`.

The release uses the native GitHub → Cloudflare Pages pipeline. The deployment checker now covers 39 route/redirect responses, including both beginner pages and live guide directory targets. Run it after the Pages check succeeds, then confirm the public orientation and search in the browser.

## Next evidence-dependent work

Continue with a recorded and independently reproduced real case, then an exploration route, then one complete progression interval. Use the existing capture validation and review workflow; do not convert an orientation or a beta mechanism summary into a verified gameplay walkthrough.
