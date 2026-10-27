# PR: Larger Structure Images on Product Cards

Status: in-scope work complete

Branch: `bugfix/larger-structure-images`

## Goal

Draw the chemical structure on each product card at the size of the card, not at a third of it. A buyer then reads the structure at a glance.

## Context

- Shaun, 2026-10-27: on the A003 card, the structure is too small next to the rest of the card.
- Cause: `src/lib/product-card.js` wrote `width="100" height="100"` on every structure image. The browser drew each 800 by 320 file only 100 px wide inside a box about 238 px wide (a measurement at 1440 px).
- Data (method: `uv run --with pillow`, bounding box of every pixel that differs from white by more than 24, over 1,063 files in `public/images`): 962 of 1,066 files are 800 by 320. The drawing fills a median 37% of the canvas width. The 90th percentile is 87%, and the widest is 100%.
- So the files carry wide blank margins, and a few drawings touch the edge. Cropping the margin in CSS would cut those few drawings, so this PR does not crop.

## Implementation Checklist

Ordered least to most consequential.

### Tier 1 - Guard and fix

- [x] Test first: `smallStructures` lists a structure image narrower than 90% of its box. Tests: `tests/layout-budget.test.mjs`.
- [x] Add the rule to `scripts/layout-rules.json` and to `npm run check:layout`. Run it before the fix: it failed with "100 px wide in a 238 px box".
- [x] Test first: the card image carries the size of the files (800 by 320), not a square. Test: `tests/product-card.test.mjs`.
- [x] Make the image fill the width of its box (`src/styles/global.css`). Keep `object-fit: contain`, so no drawing is cut.
- [x] On a phone, widen the image box from 88 px to 112 px. The card keeps its row layout (`docs/design.md`).
- [x] Add the rule to `docs/design.md`.

## Smoke Tests

The agent ran these with Playwright in Chromium at the tailnet dev link on 2026-10-27. Shaun did not run them.

- [x] Open the product list at 1440 px. The A003 structure draws about 155 px wide. Before, it drew about 65 px.
- [x] Open the product list at 390 px. The A003 card keeps the image on the left and the text on the right. The structure draws about 73 px wide. Before, about 52 px.
- [ ] Walk the Netlify deploy preview: the home page and the product list.
- [ ] Look at the cards on a real phone.

## Verification

Run on the head commit. Node 26 on the dev machine.

| Check | Method | Result |
|---|---|---|
| `npm run lint` | ESLint over the repo | pass |
| `npm test` | `node --test` | 146 pass |
| `npm run build` | Astro build | 1081 pages |
| `npm run check:dist` | Reads `dist/` | pass |
| `npm run check:layout` | Chromium, 11 pages, 5 widths, includes the new image rule | pass; it failed before the fix |

## Product Decisions

- Fill the box width and keep `contain`. Do not crop the blank margin: the drawings that fill the canvas would be cut.
- Open choice for Shaun: trim the blank margin from the image files, so each drawing fills the box. This changes about 1,060 files. It would make drawings about 2 times larger again. It is its own PR.
- A phone card stays a row (image left). A stacked card would draw the structure larger, but the page gets longer and `docs/design.md` chose the row on purpose.

## Non-Goals

- No change to the image files.
- No change to the product page, which has its own image size.
