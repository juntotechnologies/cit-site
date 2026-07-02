---
name: Add Product Batch
description: Parse a vendor-supplied .docx of new chemical products (name/CAS/MW/MF + structure image per row) and merge the clean ones into data/products.json and public/images/, leaving problem rows for vendor confirmation. Use when Shaun says a new product batch/docx has been dropped into the repo, or asks to "add these products", "upload the new catalogue batch", or similar. This skill is cit-site-specific (repo layout, docx table structure, vendor doc format) and intentionally lives only here, not in agent-skills.
---

## Overview

This captures the pipeline built in PR #9
(`docs/pr-docs/archive/9-product-catalogue-upload-jul2026.md` once
archived, or the live doc if still underway) for turning a vendor's Word
doc of new products into live catalogue entries, plus everything that went
wrong the first time so it doesn't need re-discovering.

**Source shape (as of PR #9):** the vendor's `.docx` is a zip; the actual
data lives in `word/document.xml` as one or more `<w:tbl>` tables, one row
per product, laid out as: catalog number cell, name cell, a combined
CAS/MW/MF text cell (three `<w:p>` paragraphs), then a structure-image cell
whose `<w:drawing>` references an `r:embed="rIdN"` resolved via
`word/_rels/document.xml.rels` to `word/media/imageNN.<ext>`. Extract both
XML files with `unzip -p <docx> <path>` (no new dependency needed - the
project already only depends on `astro`/`zod`).

## Reusable code already in the repo

- `src/lib/docx-product-parser.js` — `parseProductRows`, `parseRelsMap`,
  `findDuplicateCatalogNumbers`, `partitionByCollision`,
  `buildReviewReport`, `inferCategory`. All pure/unit-tested in
  `tests/docx-product-parser.test.mjs` — reuse these, don't re-derive them.
- `scripts/parse-product-docx.mjs` — run this first. Writes
  `scripts/out/docx-parsed-clean.json` (safe to merge) and
  `scripts/out/docx-parsed-needs-review.json` (one consolidated file for
  every problem category — do NOT split this back into multiple files per
  category; Shaun explicitly asked for one file so review is a single
  pass). `scripts/out/` is gitignored - review output, not source data.
- `scripts/merge-clean-products.mjs` — run this second, only after the
  clean list has been eyeballed. Copies each clean row's structure image
  into `public/images/CIT_<catalog_number>.<ext>`, appends to
  `data/products.json`, re-sorts by catalog number. Then run
  `node scripts/generate_redirects.mjs` (canonical CAS-based URLs can
  differ from the catalog-number path for new entries, so `public/_redirects`
  needs regenerating - `npm run build` also does this as its first step).

## Steps

1. **Locate the dropped-in `.docx`** (repo root, unless Shaun says
   otherwise).
2. **Run `node scripts/parse-product-docx.mjs <path-to-docx>`** (defaults to
   the last-used filename if omitted - check the script). Read its console
   summary: how many clean, how many need review, and why.
3. **Don't guess on categorization.** `inferCategory` defaults every product
   to `organic` (matches the catalogue's overwhelming historical lean and
   is true of nearly everything in past batches) except an explicit,
   hardcoded list of manually-verified inorganic catalog numbers in
   `docx-product-parser.js`. If this batch has more than a couple of
   inorganic-looking products (metal salts, not just metal-named organic
   compounds like "sodium cocoyl sarcosinate"), extend that list by eye
   first - don't try to infer organic/inorganic from the formula string
   itself. A naive element-symbol regex is genuinely ambiguous (e.g. `CO2H`
   greedily reads as `Co` (cobalt) + `2H` instead of carbon + oxygen) and
   was already tried and reverted once for producing a wrong chemical
   symbol, not just an imprecise one.
4. **Run `node scripts/merge-clean-products.mjs`** once the clean list looks
   right. Then `node scripts/generate_redirects.mjs`. Then `npm test` and
   `npm run build` to confirm nothing broke.
5. **For `docx-parsed-needs-review.json`**, write a plain-text (`.txt`, not
   `.md`/`.json`) confirmation doc Shaun can forward to whoever supplied the
   batch — no markdown syntax, no code blocks, just clear section headers
   and a direct question per item, plus simple tables using spaces/dashes
   (Word-friendly). Put it in the scratchpad directory, not the repo -
   it's a one-off communication artifact, not project source.
6. **Update the PR doc's checklist and Status line** to reflect exactly
   what's live vs. still pending (e.g. "92 of ~100 products live; 8 items
   pending vendor confirmation") - don't leave it saying "underway" with no
   indication of what that means concretely.
7. Once the vendor responds and remaining items are resolved, merge them
   too (re-run the merge script against an updated clean list, or hand-edit
   `data/products.json` directly for the small remainder), then remove the
   source `.docx` from the repo root and update the PR doc/Non-Goals note
   about not keeping it there long-term.

## Known test-contract updates this may trigger again

Adding products directly (not migrated from the old WordPress site) means
they have no legacy `url` field. Two existing tests assumed *every* product
has one - if a future batch trips this again, the fix is the same as PR #9:
skip the legacy-URL assertion when `product.url` is falsy, don't require it
unconditionally. Check `tests/product-data.test.mjs` and
`tests/product-url.test.mjs` for this pattern before assuming a real
regression.
