# PR: Fix Cut Product Formulas and Add an Analytics Consent Notice

Status: in-scope work complete

Branch: `bugfix/cut-product-formulas`

## Goal

Show the full formula for 12 products and the full name for 2 products. Ask a visitor before Google Analytics runs. A visitor can ignore the notice: the site works, and no tracking starts.

## Context

- CHEM-IS-TRY answered the 27 October 2026 decision list. This PR covers item 1 (formulas and names) and item 3 (consent notice). Item 2 (staff emails on the Contact page) is out of scope.
- The stored formula of 12 products ended before the first subscript digit, for example `(CH`. Cause: the old import cut the text at the first small digit.
- Google Analytics loaded on every page before any notice (`src/layouts/Layout.astro`).
- EU and UK rules need a click before non-essential tracking. This PR does not give legal advice.

## Implementation Checklist

Ordered least to most consequential.

### Tier 1 - Product data

- [x] Test first: no formula has an unbalanced bracket (`tests/product-data.test.mjs`). It failed on the 12 products.
- [x] Test first: M107 and T079 have a full name. It failed on both.
- [x] Set the formula of A116, D150, D154, D155, D157, D158, G010, I028, M107, S023, T079 and T081 in `data/products.json`. Use plain digits: `formulaToHtml` makes the subscripts.
- [x] Set the full name of M107 and T079.
- [x] Check each new formula against the stored molecular weight. All 12 match within 0.02.

### Tier 2 - Consent notice

- [x] Add the notice copy to `data/metadata.json` and validate it in `src/lib/schemas.js`. Test: `tests/site.test.mjs`.
- [x] Add `src/lib/consent.js`: read and write the choice. Blocked storage means no choice. Test: `tests/consent.test.mjs`.
- [x] Add `src/lib/analytics.js`: load Google Analytics once. Test: `tests/analytics.test.mjs`.
- [x] Add `src/lib/consent-banner.js` and `src/components/ConsentBanner.astro`: a slim bar with Decline and Accept at equal weight. Test: `tests/consent-banner.test.mjs`.
- [x] Withdrawal: Decline after Accept clears the Google cookies and reloads the page. A visitor with no consent keeps no Google cookies. Tests: `tests/analytics.test.mjs`, `tests/consent-banner.test.mjs`.
- [x] Remove the Google tag from `src/layouts/Layout.astro`.
- [x] Add a "Privacy choices" button to the footer. It reopens the notice, so a visitor can change the choice.
- [x] Add a build check: no built page holds a Google tag script. Test: `tests/dist-check.test.mjs`. Command: `npm run check:dist`.
- [x] Add the design rule and the data source to `docs/design.md` and `README.md`.

## Smoke Tests

The agent ran these with Playwright in Chromium at the tailnet dev link on 2026-10-27. Shaun did not run them.

- [x] Open the home page as a new visitor. The notice shows. A request log shows no call to Google.
- [x] Ignore the notice and open a second page. The notice shows. No call to Google.
- [x] Press Decline. The notice hides. After a reload it stays hidden. No call to Google.
- [x] Press "Privacy choices" in the footer, then Accept. One Google tag request starts.
- [x] Open another page from a link. The tag loads once. The notice stays hidden.
- [x] Accept, then Decline from the footer. The page reloads. No `_ga` cookie stays. No Google request follows two page swaps and a scroll.
- [x] Reload after Decline. No Google request, no cookie, no notice.
- [x] Open the 12 product pages. Each shows the new formula and name.
- [ ] Walk the Netlify deploy preview: the notice, Decline, Accept and one product page.
- [ ] Phone check on a real phone. Only a screenshot at 390 px was reviewed.

## Verification

Run on the head commit. Node 26 on the dev machine.

| Check | Method | Result |
|---|---|---|
| `npm run lint` | ESLint over the repo | pass |
| `npm test` | `node --test` | 143 pass |
| `npm run build` | Astro build | 1081 pages |
| `npm run check:dist` | Reads `dist/` | pass, no Google tag in any page |
| `npm run check:layout` | Chromium, 11 pages, 5 widths, notice visible | pass |

## Product Decisions

- Ignoring the notice means no tracking. Consent needs a click; silence is not consent.
- Accept and Decline have the same look. A louder Accept pushes the visitor.
- A loaded Google tag cannot be stopped in place. Browser test, Chromium, 2026-10-27: with Google's `ga-disable` flag set, or with consent mode set to denied, one `page_view` still went out after a page swap. So Decline after Accept clears the cookies and reloads the page. A reload loses an unsent form on that page. The case is rare: it needs Accept and Decline in one visit.
- Google Analytics loads from the script that the notice runs, never from a page tag. `check:dist` fails if a page holds the tag.
- Left unchanged: the Privacy Policy still says a visitor may opt out with a browser add-on. That is legal text. It needs Shaun's yes to change.
- Left unchanged: RS015 stores `NaNO₂` with a Unicode subscript, not a plain digit. It is not cut, so it is out of scope. Scan method: a regex for characters from U+2080 to U+2089 over `data/products.json`.
- Do not merge without Shaun's yes. This PR changes product data and a consent notice.
