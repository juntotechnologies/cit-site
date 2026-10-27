# PR 12: SEO and Agent Files From One Source, Calm Phone-First Polish

Status: underway

Branch: `feature/seo-agents-and-polish`

## Goal

Generate every SEO and agent file from one JSON source. Make the site calm and fast on a phone. Add checks that stop both from drifting. A visitor sees the same content, with a flatter look, larger tap targets and no sideways scroll. Search engines and AI agents read correct, generated discovery files.

## Context

- Facts were in several places: `src/config/company.ts`, page front matter, `public/robots.txt` and inline `style=` text.
- The default social image path returned 404.
- The look used a gradient hero, stat tiles, emoji icons and justified text.
- There was no lint, no layout check and no check of the built pages.
- Out of scope: Netlify settings, DNS, Formspree addresses, product data, prices and company facts.

## Implementation Checklist

Ordered least to most consequential.

### Tier 1 - Quick wins

- [x] Add a skip link, `<main id="main">`, visible focus rings and a real 404 page with `noindex`.
- [x] Give each image `width`, `height` and `alt`. Load images below the fold lazily. Give decorative images `alt=""`.
- [x] Set dark text on gold buttons (white on gold is 2.19:1). Darken the muted grey. Test: `tests/contrast.test.mjs` checks every text pair of the palette against AA.
- [x] Remove dead CSS rules and unused color tokens. Remove each inline `style=`.

### Tier 2 - Calm look

- [x] Flatten the page hero. Remove glow and shimmer. Keep hover and press effects small, inside `(hover: hover) and (pointer: fine)`.
- [x] Replace the stat tiles with a facts list. Remove emoji icons. Left-align text.
- [x] Make button rows equal width (`.actions`). Stack them full width at 540 px and below.
- [x] Show each product card on a phone with the image left and the text right. Use 44 px tap targets and 16 px form inputs.
- [x] Replace the script FAQ with native `<details>`.
- [x] Use one shared slider with a pause button. It stays still for reduced motion. Test: `tests/slider.test.mjs`.
- [x] Fix the mobile menu: search field, Escape key, `aria` state. Test: `tests/mobile-menu.test.mjs`.
- [x] Show an error note when a form send fails. Test: `tests/forms.test.mjs`.

### Tier 3 - Shared code

- [x] Draw a product card with one function for the server pages and the client search. Escape all text. Test: `tests/product-card.test.mjs`.
- [x] Split `src/lib/product-search.js` into small named functions. Tests: `tests/product-search.test.mjs`.

### Tier 4 - One source of truth

- [x] Extend `data/metadata.json`. Add `data/pages.json` and `data/discovery.json`. Validate them with the schemas in `src/lib/schemas.js`. Derive the address line, phone links, map address, product count and years in business. Test: `tests/site.test.mjs`.
- [x] Build the page head (title, description, canonical, Open Graph, Twitter, theme color) from the data. Add JSON-LD for the organization, the website, breadcrumbs and each product. Test: `tests/seo.test.mjs`.
- [x] Generate `robots.txt`, `llms.txt`, `llms-full.txt`, `agents.txt` and `/.well-known/agents.json` at build. The sitemap comes from `@astrojs/sitemap`. Test: `tests/discovery.test.mjs`.
- [x] Render a real social image with `npm run og`. The old default image path returned 404.

### Tier 5 - Checks and tooling

- [x] Add ESLint with code shape limits and a file docstring rule. `code-shape.json` holds the limits and the legacy list. Test: `tests/code-shape.test.mjs`.
- [x] Add `npm run check:dist`. It checks the built pages and discovery files. Test: `tests/dist-check.test.mjs`.
- [x] Add `npm run check:layout`. It checks sideways scroll, heading lines, side margins and tap targets in Chromium at 360, 390, 430, 820 and 1440 px. Test: `tests/layout-budget.test.mjs`.
- [x] Make `npm run dev` print only the tailnet link. Allow the tailnet host in the dev server.
- [x] Run lint and `check:dist` in CI. Update the PR template.
- [x] Write `docs/design.md`. Point to it from `AGENTS.md`. Update `README.md`.

## Smoke Tests

Shaun confirms these in the deploy preview, on a phone.

- [ ] Open the home page. The photo, the headline and the facts list show. The slider pause button works.
- [ ] Open the menu. Search works. Escape closes the menu.
- [ ] Search the catalogue for `acetone`. Cards show. Open a product. Press Request a Quote. The form has the product name.
- [ ] Open the FAQ. Each question opens and closes.
- [ ] Open a missing address. The 404 page shows with links.
- [ ] Open `/robots.txt`, `/llms.txt`, `/agents.txt` and `/sitemap-index.xml`. Each loads. None shows an email address.

## Verification

Run on the head commit, on Node 26 on the dev machine.

| Check | Method | Result |
|---|---|---|
| `npm run lint` | ESLint over the repo | pass |
| `npm test` | `node --test` | 113 pass |
| `npm run build` | Astro build | 1081 pages |
| `npm run check:dist` | Reads `dist/` | 1081 pages, 5 generated files |
| `npm run check:layout` | Chromium over a built copy at five widths | 11 pages pass |
| Phone walk | 900 px tile screenshots at 360, 390, 430, 820 and 1440 px, at the tailnet link of `npm run dev`. Pages: home, about, products, a search, a product, services, a service, FAQ, contact, RFQ and a missing address | Tiles taken for all 11 pages. Read at 390 px for all of them, and at the other widths for home, a product, RFQ and the service page |
| Interactions | Playwright: menu, Escape, slider pause, reduced motion, RFQ prefill, failed send | pass |

CI runs Node 20. The first CI run is the first run on Node 20.

## Product Decisions

- No generated file and no JSON-LD holds an email address. The contact path is `/contact/`. Company emails stay on the existing pages.
- The product JSON-LD has no `offers` block. The site shows no price, and an offer without a price is not valid.
- Gold buttons use dark text for contrast.
- The home hero is at most 560 px high, so the headline shows on a wide screen.
- The home page shows four cards per category. The grid uses two or four columns, so no card stands alone. `tests/home.test.mjs` checks the count.
- Four legacy files are exempt from the shape limits: `src/lib/docx-product-parser.js`, `scripts/generate_redirects.mjs`, `scripts/merge-clean-products.mjs` and `scripts/parse-product-docx.mjs`. They are not part of this change.
- Unchanged: Netlify settings, DNS, Formspree addresses, `data/products.json`, `public/images`, the analytics tag.

## Follow-ups

- Refactor the four legacy files, then remove `legacyFiles` from `code-shape.json`.
- Eleven products have a formula that stops inside a bracket (for example D150 `(CH`). The data owner must correct them.
- The contact page lists staff email addresses. Decide if they stay.
