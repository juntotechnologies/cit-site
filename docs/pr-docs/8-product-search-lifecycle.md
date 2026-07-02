# PR 8: Fix Product Search Breaking After First Use

Status: underway

Branch: `bugfix/product-search-lifecycle`

## Goal

Fix product search on `/products` so it keeps working across repeated
searches and client-side navigations, not just on the very first page load.
Along the way, extract the page-lifecycle-binding pattern so this class of
bug can't silently recur on future pages.

## Context

`src/pages/products/index.astro` binds its search input, category filter,
and pagination click handlers in a top-level `<script>` block that only runs
once, on initial page load. Every other interactive page in the site
(`index.astro`, `about.astro`, `faq.astro`, `contact.astro`, `rfq.astro`)
wraps its script body in `document.addEventListener("astro:page-load", ...)`
to defend against Astro's View Transitions (`ClientRouter`, enabled in
`src/layouts/Layout.astro`) swapping in fresh DOM nodes without re-executing
module scripts. `products/index.astro` is the only page missing that
wrapper, so its closures end up pointing at detached DOM elements after any
client-side navigation away and back — the second (or later) search does
nothing.

## Implementation Checklist

### Tier 1 - Quick wins (low risk, contained)

- [ ] Add a DOM/browser test harness (lightweight `happy-dom` + `node:test`)
  since none exists yet — needed before any of the following can be
  TDD'd.
- [ ] Write a failing test: mounting `products/index.astro`'s script logic,
  firing `astro:page-load` twice, typing a search term after the second
  fire, asserting results render. (Fails today because the script only
  binds once.)
- [ ] Fix the `cas` field match to `.toLowerCase()` before comparing, for
  consistency with `name`/`molecular_formula`/`catalog_number`. Add a test:
  searching an uppercase CAS-adjacent string matches a lowercase-stored
  entry.

### Tier 2 - Lifecycle fix + DRY extraction

- [ ] Extract a shared `onPageLoad(fn)` helper (e.g.
  `src/lib/page-lifecycle.js`) that wraps `astro:page-load` binding, used by
  all six pages instead of each copy-pasting the wrapper. Test: calling it
  twice with different callbacks doesn't cross-wire them.
- [ ] Rebind idempotently: guard search/category/pagination binding so
  repeated `astro:page-load` fires don't stack duplicate listeners (e.g. a
  `data-bound` flag, or explicit teardown on `astro:before-swap`). Test:
  firing `astro:page-load` three times and typing once only triggers one
  render, not three.
- [ ] Move the debounce `timer` out of module scope into the per-bind
  closure so repeated binds can't race each other's timers. Test: two binds
  each debounce independently without cross-clearing.
- [ ] Apply `onPageLoad` to `products/index.astro`'s search, category
  filter, and pagination logic. Test: the original failing test from Tier 1
  now passes.

### Tier 3 - Related search UX gap

- [ ] Sync search term and category to `location.search` via
  `history.replaceState` on change, so Back/Forward restores prior search
  state and results are shareable/bookmarkable. Test: setting a search term,
  then simulating Forward/Back, restores the same filtered view.

## Smoke Tests

- [ ] On `/products`, search for a product, confirm results show.
- [ ] Click into a product detail page, then click Back (or use in-page nav
  back to `/products`), search again — confirm results show the second time
  too (this is the bug being fixed).
- [ ] Repeat the above 3-4 times in a row to confirm it doesn't regress
  after multiple navigations.
- [ ] Use pagination, navigate away and back, click a different page number
  — confirm it still works.
- [ ] Search using a CAS number in a different case than stored — confirm
  it matches.

## Product Decisions

- Chose to add a lightweight DOM test harness (`happy-dom`) rather than a
  full Playwright/browser-automation setup, since the bug is a pure
  script-lifecycle issue reproducible without a real browser.

## Scope

- Fixes: product search stops working after the first search / after any
  client-side navigation away from `/products` and back.
- Fixes: case-sensitive CAS number matching.
- Adds: URL-synced search state (Tier 3), since it's directly related and
  touches the same code path.

## Non-Goals

- Not building a real search index (Fuse.js/Pagefind) — current
  brute-force filtering over `products.json` stays as-is; this PR only
  fixes lifecycle/binding correctness.
- Not adding Playwright/full E2E browser testing infrastructure.

## Related Docs

- None yet.
