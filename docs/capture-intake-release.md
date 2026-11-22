# Capture intake workflow — 22 November 2026

This release supplies the missing development workflow between private recordings and the existing bilingual gameplay models. It does not claim that the first real case, route or progression interval is complete.

## Delivered commands

| Command | Behavior |
| --- | --- |
| `capture:new -- <case\|route\|interval> <stable-id>` | Create private recording notes, manifest, bilingual draft skeleton, CSV, originals/assets directories and interval cost worksheet; refuse an existing folder |
| `capture:status -- [--json]` | Summarize the private capture queue, including package-specific read errors |
| `capture:check -- <package> [--json]` | Read-only checks; exit 1 when incomplete; list paths and problems without printing hint bodies |
| `capture:prepare -- <package>` | After successful checks, prepare private `review/data/` and reviewed candidate images; preserve draft status and refuse an existing review |

The checker reuses the existing case, route, character, material and evidence schemas and publication/reference validators. It checks declared server/build/date against gameplay sources, localized naming sources, EN/JA IDs and revisions, reproduction/editorial dates, safe preview boundaries, image dimensions/format/hash, CSV metadata and removal of EXIF/XMP/IPTC. Files must remain within the project and their capture subdirectories, including symlinked parent directories. Existing content and evidence IDs/paths cannot be replaced by a first-capture package.

An interval must cover a single bilingual character/interval pair. Its continuous step records, independently calculated totals and preset quantities must agree for every material/currency, including verified zero quantities. Unknown values remain null and block preparation.

Prepared output excludes original recordings, manifest, recording notes and CSV. The entire capture tree remains Git-ignored. Preparation does not write public assets, modify `src/data/` or publish routes. Editors must watch the actual recording, reproduce behavior, inspect anonymization and review both languages before merging by ID and explicitly publishing.

## Evidence available now

The three existing `*-intake-01` packages contain blank legacy manifests and recording sheets. They do not contain gameplay metadata, recorded solutions or complete costs. The checker reports them as incomplete without upgrading or changing their contents. A private queue report records the individual missing fields.

The official news list and [Curious Deductions article](https://silverpalace.elementagames.com/en-us/newsDetail?id=99) were reviewed again on 22 November. The article supports the Resurrection Mystery premise, branching endings and Evidence Board restart behavior. It does not provide a complete case solution, reproducible exploration route or progression quantities. It therefore does not unblock the real-content milestones.

## Acceptance

- Astro check: 68 files, zero errors, warnings or hints.
- 37 tests pass, including 11 capture cases: no overwrite, unchanged legacy packages, draft-only review output, source scope, bilingual IDs, spoiler boundaries, real image hashes/dimensions/metadata, directory and file symlink confinement, complete cost reconciliation, unknown/incorrect costs and RFC 4180 CSV quoting.
- Production build passes: 44 HTML pages and 40 Pagefind pages. CSP, assets, internal links, canonical/hreflang, sitemap, private draft isolation and terminology checks pass.
- Executed `capture:status` and JSON `capture:check` against all three existing private packages. Each correctly reports 13 issues and exits 1 for the check; all original file hashes remain unchanged. Individual reports are kept in ignored `artifacts/private/capture-intake-review/`.
- No public content or layout changes; UI screenshots are unnecessary for this CLI-only release. Production deployment uses the existing native GitHub integration and the existing 37-response verification command after Pages reports success.

The next content sequence remains: one reproduced real case with three hint levels, one reproducible exploration route, then one independently verified complete material interval. Use [the content workflow](content-workflow.md) for the recording package, editorial review and publication steps.
