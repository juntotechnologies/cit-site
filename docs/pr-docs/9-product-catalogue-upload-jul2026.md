# PR 9: Add July 2026 Product Batch to Catalogue

Status: in-scope work complete (92 of ~100 products live). The remaining
~8 items (see Scope) are explicitly *not* a precondition for merging this
PR — Shaun will resolve and merge those directly on `main` once the vendor
responds, rather than holding this PR open for them.

Branch: `feature/product-catalogue-upload-jul2026`

## Goal

Add the ~102 new products from
`docs/vendor-reviews/2026-07-products-to-be-uploaded.docx` to
`data/products.json`, with their structure images copied into
`public/images/`, so they show up correctly in `/products` search and get
their own canonical product pages.

## Context

The source is a Word doc, not a clean data file. Inspecting its internals
(`.docx` is a zip; `word/document.xml` + `word/media/*`):

- It's built as 13 `<w:tbl>` tables, each row holding one product: catalog
  number, name, and a CAS#/MW/MF text cell, plus (usually) a structure image
  in the row. This is more reliable than relying on raw document reading
  order to match images to products, since each image lives inside its
  product's own table row/cell.
- 102 catalog-number-shaped blocks (`^[A-Z]\d{3,}$`) found in the plain-text
  extraction; 111 embedded images total (92 png / 6 jpeg / 3 gif / 8 `.wdp`
  — the `.wdp` files are Office's alternate HD-photo format for a subset of
  images and can likely be ignored in favor of their paired png/jpeg).
- Source text formatting is inconsistent: `CAS#:`, `CAS #`, extra
  whitespace, and some entries have blank `MW`/`MF` (e.g. Benzophenone,
  2-Bromoanisole — need to decide whether to leave these fields empty or
  look them up).
- Two catalog numbers **collide with existing entries**: `B091` and `P075`
  already exist in `data/products.json`. Need to confirm with Shaun whether
  these are (a) accidental renumbering that should get new IDs, or (b)
  intentional updates/corrections to those existing products.
- None of the new entries specify a `category`
  (organic/inorganic/reagent-usp/bulk/representative) — existing data has
  this field and the `/products` category filter depends on it. Needs either
  a manual mapping pass or an explicit default/rule.
- Existing `src/lib/product-url.js` already has CAS-checksum validation and
  URL-collision handling for generating canonical `product_path`s — new
  entries should route through the same logic rather than duplicating it.
- **Additional finding while parsing:** `C147` (CALCIUM SILICATE) appears
  **twice** in the source doc itself, with two different molecular formulas
  (`CASIO` vs `CAH3SI`) and two different structure images. This is a
  data-entry error in the source, not a parser bug — needs a human decision
  (which row is correct, or does one need a different catalog number)
  before either can be merged. The parser excludes both until resolved
  (see `scripts/out/docx-parsed-needs-review.json`).
- **Additional finding:** `B107` has no real name — its "name" cell actually
  contains stray label text (`"CAS#: MW:"`), suggesting it's a blank
  template/placeholder row that still has a structure image attached. Needs
  manual inspection of the source doc to determine if that image belongs to
  a real, unlabeled product or should be dropped entirely.
- **Additional finding:** automatically inferring `category`
  (organic/inorganic) from the formula turned out unreliable — the source
  doc's all-caps text plus common two-letter element symbols that overlap
  with adjacent single-letter elements (e.g. `CO2H` greedily reads as `Co`
  (cobalt) + `2H` instead of carbon + oxygen) made a regex-based approach
  actively wrong, not just imprecise, on at least one test case. Categorized
  by name instead: defaulted every product to `organic` (matching the
  existing catalogue's overwhelming lean — 857 of 974 — and true of nearly
  every product in this batch) except a short, manually-verified list of
  genuinely inorganic salts (`B093 BARIUM THIOSULFATE`,
  `S021 SODIUM PHOSPHATE DIBASIC`).
- **Additional finding:** a handful of formulas look truncated in the
  source (`D159 DESONIDE` → `"C"`, `D153 3,5-DIBROMO-1-FLUOROBENZENE` →
  `"Br"`, `T075 TRIS HYDROCHLORIDE` → `"NH"`). Not blocking (same as blank
  MW/MF, see Non-Goals) but flagged to the vendor for confirmation
  alongside the other review items.

## Implementation Checklist

### Tier 1 - Quick wins (low risk, contained)

- [x] Write a script (`scripts/parse-product-docx.mjs`) that extracts
  `word/document.xml` from the docx (via `unzip -p`, no new dependency) and
  parses each `<w:tbl>` row into
  `{ catalog_number, name, cas, molecular_weight, molecular_formula }` via
  `src/lib/docx-product-parser.js`, normalizing the inconsistent
  `CAS#:`/`CAS #` formatting. Tests in `tests/docx-product-parser.test.mjs`
  cover a well-formed row, inconsistent CAS label spacing, and blank MW/MF
  (including a regex-backtracking bug the blank-MF test caught: an optional
  `:` after `MF` could otherwise get captured as the formula itself).
- [x] Cross-check parsed catalog numbers against `data/products.json`,
  flagging collisions instead of silently overwriting
  (`partitionByCollision`); confirmed against the real doc: `B091` and
  `P075` collide, both with **identical** data to what's already in
  `data/products.json` (same name/CAS/MW/MF) — these are not new products,
  just already-catalogued entries that happened to be included in this
  batch doc. Resolution: **skip both**, no data change needed for them.
- [x] Also added `findDuplicateCatalogNumbers` (not originally scoped, but
  needed once the real data was parsed): catches a catalog number reused
  *within the batch itself* — caught the real `C147` duplicate above.

### Tier 2 - Image extraction and correlation

- [x] Extended the parser to pull each row's embedded image `r:embed`
  reference and resolve it to the corresponding file in `word/media/` via
  `word/_rels/document.xml.rels` (`parseRelsMap`). Verified against the real
  doc: 99 of 102 parsed rows (after excluding the 2 collisions and the 1
  in-batch duplicate) resolve to a real media file; 6 have no image at all
  (`C149 COLLAGEN`, `D159 DESONIDE`, `M109 METHYL SOYATE`,
  `M112 MEGESTEROL ACETATE`, `P076 EQUILIBRATION BUFFER`,
  `S022 SODIUM COCOYL SARCOSINATE` — need source images or a placeholder
  decision before merge).
- [x] Spot-checked a sample of the resolved image mappings (the 5 products
  in Smoke Tests below, plus browsing `/products` after merge) against the
  source doc by eye — correct structure images render for each.
- [x] Copied matched images into `public/images/` following the existing
  `CIT_<catalog_number>.<ext>` naming convention (via
  `scripts/merge-clean-products.mjs`). `tests/product-data.test.mjs`
  already asserts every product's `image_file` exists on disk.

### Tier 3 - Data merge (most consequential)

- [x] Resolve the `B091`/`P075` collisions — confirmed identical to
  existing data, so both are skipped (see Tier 1 above). No Shaun decision
  needed after all; this was resolvable from the data itself.
- [x] Categorized every clean product (see Context finding above) —
  `organic` by default, `inorganic` for the two manually-verified salts.
- [x] **Merged the 92 clean products into `data/products.json`** (via
  `scripts/merge-clean-products.mjs`) and copied their structure images
  into `public/images/` as `CIT_<catalog_number>.<ext>`. Catalogue is now
  1066 products (was 974). Regenerated `public/_redirects`
  (`scripts/generate_redirects.mjs`) since some new products' canonical
  CAS-based URL differs from their catalog-number path. Updated two tests
  (`product-data.test.mjs`, `product-url.test.mjs`) whose assumption that
  "every product has a legacy WordPress `url`" is no longer true now that
  we're adding products directly rather than migrating them — genuinely new
  products correctly have no legacy URL to redirect from.
- [ ] **Explicitly deferred, not blocking this PR:** the `C147` in-batch
  duplicate, the `B107` blank-looking row, the 6 products with no structure
  image, and the 3 truncated-looking formulas (`D159`, `D153`, `T075`) —
  see `scripts/out/docx-parsed-needs-review.json` and
  `docs/vendor-reviews/2026-07-product-batch-review.txt`. Shaun will
  resolve these directly on `main` once the vendor responds, on his own
  timeline, rather than gating this PR on them.
- [x] Moved the source doc from the repo root into
  `docs/vendor-reviews/2026-07-products-to-be-uploaded.docx`, alongside the
  plain-text vendor confirmation doc it corresponds to, rather than leaving
  it loose at the root.

## Smoke Tests

Manual, one-by-one checks Shaun runs in the browser now that the 92 clean
products are live — search for each by name, then again by CAS number, and
confirm the structure image/CAS/MW/MF shown match the source doc:

- [ ] `O-ARSANILIC ACID` (catalog `A109`, CAS `2045-00-3`)
- [ ] `ARSENAZO III` (catalog `A110`, CAS `1668-00-4`)
- [ ] `2,2′-AZOBIS(2-METHYLPROPIONITRILE)` (catalog `A111`, CAS `78-67-1`)
- [ ] `4-AMINOBENZAMIDINE DIHYDROCHLORIDE` (catalog `A112`, CAS `2498-50-2`)
- [ ] `L-ARGININE` (catalog `A114`, CAS `74-79-3`)
- [ ] Confirm `B091` (BROMETHALIN) and `P075` (PHENOL/CHLOROFORM/ISOAMYL AL)
  still show their existing, unchanged data — not a duplicated/overwritten
  entry from this batch.
- [ ] Pick one of the 6 no-image products (e.g. `M112 MEGESTEROL ACETATE`)
  and confirm its product page renders sanely without a structure image
  (matches how existing no-image products like `P075` already look).
- [ ] Run `npm run build` and confirm it completes without new warnings
  about missing images.

## Product Decisions

- Parsing directly from the docx's internal XML (rather than eyeballing
  the Word doc or re-typing data by hand) so the process is scripted,
  repeatable, and testable — reduces transcription errors across ~102
  products.
- Chose to treat the table-row structure as the source of truth for
  image-to-product correlation (not raw document reading order), since the
  doc's own layout already pairs each image with its product's row.

## Scope

- Adds 92 new products (of ~99 total parseable from the batch, after
  excluding 2 confirmed-identical collisions and 1 in-batch duplicate) to
  `data/products.json`, with structure images in `public/images/`. **This
  is everything this PR merges.**

## Non-Goals

- Not building a general-purpose "upload a docx to add products" admin
  tool — this is a one-off script for this batch, run locally, with its
  output reviewed and committed like any other data change.
- Not re-deriving missing MW/MF values that are blank in the source doc.
- Not resolving the remaining ~8 items pending vendor confirmation as part
  of this PR — explicitly deferred to a direct follow-up on `main` (see
  Implementation Checklist, Tier 3) rather than blocking this merge.

## Related Docs

- None yet.
