# PR 9: Add July 2026 Product Batch to Catalogue

Status: underway

Branch: `feature/product-catalogue-upload-jul2026`

## Goal

Add the ~102 new products from `260702-products-to-be-uploaded.docx` (dropped
in the repo root) to `data/products.json`, with their structure images copied
into `public/images/`, so they show up correctly in `/products` search and
get their own canonical product pages.

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
  before either can be merged. The parser excludes both from the
  fresh/collision output until resolved (see `scripts/out/docx-parsed-duplicates.json`).
- **Additional finding:** `B107` has no real name — its "name" cell actually
  contains stray label text (`"CAS#: MW:"`), suggesting it's a blank
  template/placeholder row that still has a structure image attached. Needs
  manual inspection of the source doc to determine if that image belongs to
  a real, unlabeled product or should be dropped entirely.

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
- [ ] Manually spot-check a sample of the resolved image mappings (e.g. 10
  products) against the source doc by eye, since a silent
  wrong-structure-to-wrong-compound mismatch is a real correctness risk for
  a chemical catalogue, not just cosmetic. Document the spot-check in this
  PR doc before merging.
- [ ] Convert/copy matched images into `public/images/` following the
  existing `CIT_<catalog_number>.<ext>` naming convention. Test: every new
  product's `image_file` points at a file that actually exists in
  `public/images/`.

### Tier 3 - Data merge (most consequential)

- [x] Resolve the `B091`/`P075` collisions — confirmed identical to
  existing data, so both are skipped (see Tier 1 above). No Shaun decision
  needed after all; this was resolvable from the data itself.
- [ ] Resolve the `C147` in-batch duplicate (two different formulas/images
  under the same catalog number) and the `B107` blank-looking row with Shaun
  before merging either.
- [ ] Decide and document the `category` value for each new product
  (manual mapping, since the source doc doesn't have this field).
- [ ] Decide how to handle the 6 products with no structure image at all
  (source new images, or merge without one similar to existing placeholder
  entries like `P075`).
- [ ] Merge the parsed + validated entries into `data/products.json`,
  reusing `getProductPath`/CAS-checksum logic from `src/lib/product-url.js`
  for canonical URLs — no new URL-generation logic. Test: existing
  `tests/product-data.test.mjs` / `tests/product-url.test.mjs` suites pass
  unchanged against the merged data (required fields present, unique
  catalog numbers, unique canonical URLs, images exist).
- [ ] Remove `260702-products-to-be-uploaded.docx` from the repo root once
  its data has been merged (keep the repo root clean; the source doc isn't
  meant to live there long-term).

## Smoke Tests

Manual, one-by-one checks Shaun runs in the browser after the data merge
(Tier 3) lands — search for each by name, then again by CAS number, and
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

- Adds ~99 new products (103 rows parsed, minus 2 confirmed-identical
  collisions with existing entries, minus 1 in-batch duplicate pending
  resolution) to `data/products.json` and their structure images to
  `public/images/`.

## Non-Goals

- Not building a general-purpose "upload a docx to add products" admin
  tool — this is a one-off script for this batch, run locally, with its
  output reviewed and committed like any other data change.
- Not re-deriving missing MW/MF values that are blank in the source doc.

## Related Docs

- None yet.
