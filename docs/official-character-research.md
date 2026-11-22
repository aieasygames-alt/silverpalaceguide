# Official character expansion — 22 November 2026

Source scope: Elementa's live EN/JA character introductions, not beta footage or community tier lists.

- EN: https://silverpalace.elementagames.com/en-us/roles
- JA: https://silverpalace.elementagames.com/ja-jp/roles
- Existing official launch announcement supplies the qualitative gameplay overview on the tools index.

The Japanese page initially exposed the Detective text but kept its loading overlay visible. Direct HTTP retrieval of the same first-party page and its referenced localization/role modules supplied the localized introductions. The role module's ordered character list was cross-checked against localization indices and avatar references: 21 nonempty entries plus one empty placeholder. The first two entries share the Detective biography. They are grouped as one dossier with two official epithets and two portraits; no relationship such as selectable gender, rarity, class or skill difference is inferred.

Published coverage:

- 20 bilingual dossiers, with 21 corresponding small official portraits.
- 14 dossiers with summarized biographies; six have only localized names, epithets and introductory lines in the checked EN/JA text, so they are explicitly labeled brief introductions. Chinese fallback biographies were not silently added as localized official EN/JA descriptions.
- Six dossiers contain qualitative equipment/combat notes: Alf, Argos, Cynthia II, Firtho, Lorin and Gratia. Medical occupation is not translated into a healing kit; shield use is not translated into a tank role. Metaphorical prose about magma or lightning is not converted into elemental skill data.
- Distinct EN/JA localized names are retained (for example Alf / フウ, Bentham / ベリンダ and Skink / ブルータング). Punctuation around some Japanese names is normalized; names and epithets are otherwise retained.
- Independent concise summaries avoid later developments in the original biographies. Official links may reveal additional background.

Models remain separate: `character-profiles.json` holds official descriptive content; `characters.json` holds verified numerical progression intervals. The strict profile schema accepts no interval/cost/verification fields. The existing gameplay publication gate remains in force for actual presets, routes and case answers. Unknown equipment/combat notes use null, never an invented number.

Tools:

- Three-profile comparison, deduplicated selectors, stable URL IDs, share-link copy with manual address-bar fallback, EN/JA selection preservation.
- Unknown/duplicate URL selections are dropped. Names are rendered as text by Astro; URL input is matched against the known IDs.
- Optional character reference in material planner updates the dossier link only. Existing local plan key, schema version, quantities, export/import behavior and inventory matching are unchanged.
- Tool overview explains the official investigation, exploration and real-time switching descriptions, with source links.
- Character directories now contain substantive material and join the sitemap and Pagefind index. Comparison pages index their usage guidance; inert profile templates are excluded from duplicate search content.

Asset provenance: see `official-character-portraits.json` for original first-party URLs, local paths and SHA-256 hashes. Astro emits dimensioned, lazy-loaded 76×76 WebP derivatives. No generic owner-supplied image is relabeled as an identified character.

Validation before publication: Astro check (58 files, zero diagnostics), 20 tests, production and noindex-preview builds (32 HTML pages / 28 indexed pages each), browser flow and responsive checks. Comparison link copying succeeded without console errors. Responsive pages were inspected in 320/390px iframes because the IAB viewport override does not change the actual page width on this host. English roster at client width 305 and Japanese comparison at 375 had matching scroll widths. Japanese comparison → planner preserved an existing 120 required / 35 owned worksheet (shortage 85) across character-reference changes.
