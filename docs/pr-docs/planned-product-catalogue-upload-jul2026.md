# PR planned: Add July 2026 Product Batch to Catalogue

Status: planned

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

## Implementation Checklist

### Tier 1 - Quick wins (low risk, contained)

- [ ] Write a script (`scripts/parse-product-docx.mjs` or similar) that
  extracts `word/document.xml` from the docx and parses each `<w:tbl>` row
  into `{ catalog_number, name, cas, molecular_weight, molecular_formula }`,
  normalizing the inconsistent `CAS#:`/`CAS #` formatting. Test: parses a
  known sample row correctly, including a row with blank MW/MF.
- [ ] Cross-check parsed catalog numbers against `data/products.json`,
  flagging collisions (`B091`, `P075` expected) instead of silently
  overwriting. Test: a collision is detected and reported, not applied.

### Tier 2 - Image extraction and correlation

- [ ] Extend the parser to also pull each row's embedded image `r:embed`
  reference and resolve it to the corresponding file in `word/media/` via
  `word/_rels/document.xml.rels`, producing a
  `{ catalog_number: mediaFilename }` mapping. Test: a known product row's
  image reference resolves to the expected media file.
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

- [ ] Resolve the `B091`/`P075` collisions with Shaun (renumber vs.
  intentional update) before merging any data.
- [ ] Decide and document the `category` value for each new product
  (manual mapping, since the source doc doesn't have this field).
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

- [ ] On `/products`, search for a handful of the newly added compounds by
  name and by CAS number — confirm they appear with the correct structure
  image.
- [ ] Visit a few new products' individual detail pages directly and
  confirm the structure image, CAS, MW, and MF render correctly.
- [ ] Confirm the two collision products (`B091`, `P075`) show whichever
  data was decided as correct, not a silently-overwritten duplicate.
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

- Adds ~100 new products (102 parsed minus 2 pending collision resolution)
  to `data/products.json` and their structure images to `public/images/`.

## Non-Goals

- Not building a general-purpose "upload a docx to add products" admin
  tool — this is a one-off script for this batch, run locally, with its
  output reviewed and committed like any other data change.
- Not re-deriving missing MW/MF values that are blank in the source doc.

## Related Docs

- None yet.
