# PR 8: Fix Product Search Breaking After First Use

Status: done

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

**Additional non-obvious finding during implementation:** Astro only bundles
a `<script>` tag's `import`s if you let Astro add `type="module"` itself.
Authoring `<script type="module">` explicitly, or using `define:vars`
(which is always rendered inline), makes Astro leave the script untouched —
any `import` inside ships raw to the browser and throws
`SyntaxError: Cannot use import statement outside a module`, silently
breaking the whole script. This means the extracted `product-search.js`
module couldn't be imported directly from the `define:vars` script (which
only holds the serialized product data); it's imported from a second,
plain `<script>` tag (no explicit `type`) below it instead, which Astro
does bundle. See `src/pages/products/index.astro`.

## Implementation Checklist

### Tier 1 - Quick wins (low risk, contained)

- [x] Add a DOM/browser test harness (lightweight `happy-dom` + `node:test`)
  since none exists yet — needed before any of the following can be
  TDD'd. (`tests/product-search.test.mjs`, `happy-dom` added as a
  devDependency.)
- [x] Write a failing test: mounting `products/index.astro`'s script logic,
  firing `astro:page-load` twice, typing a search term after the second
  fire, asserting results render. (Fails today because the script only
  binds once.) — see "search keeps working after astro:page-load fires
  again" in `tests/product-search.test.mjs`; failed against the original
  inline script, passes against the new `initProductSearch`.
- [x] Fix the `cas` field match to `.toLowerCase()` before comparing, for
  consistency with `name`/`molecular_formula`/`catalog_number`. Add a test:
  searching an uppercase CAS-adjacent string matches a lowercase-stored
  entry. (`src/lib/product-search.js` `filterProducts`; test "filterProducts
  matches CAS number regardless of case".)

### Tier 2 - Lifecycle fix + DRY extraction

- [x] Extract a shared `onPageLoad(fn)` helper (`src/lib/page-lifecycle.js`)
  that wraps `astro:page-load` binding, and migrate all six pages
  (`products/index.astro`, `index.astro`, `about.astro`, `faq.astro`,
  `contact.astro`, `rfq.astro`, `Layout.astro`) to call it instead of each
  copy-pasting `document.addEventListener("astro:page-load", ...)`.
  Verified in the production build: Vite dedupes the helper into a single
  shared `page-lifecycle.*.js` chunk that every page's bundle imports (see
  `dist/assets/page-lifecycle.*.js` after `npm run build`), and all six
  routes (`/`, `/about/`, `/faq/`, `/contact/`, `/rfq/`, `/products/`)
  return 200 and load correctly via `npm run dev`.
- [x] Rebind idempotently: guard search/category/pagination binding so
  repeated `astro:page-load` fires don't stack duplicate listeners (a
  `data-bound`-style flag, via `searchEl.dataset.searchBound`). Test:
  "astro:page-load firing twice for the same DOM instance does not
  double-bind listeners" — asserts exactly one render per search.
- [x] Move the debounce `timer` out of module scope into the per-bind
  closure so repeated binds can't race each other's timers. (`timer` is now
  declared inside `initProductSearch`'s `onPageLoad` callback in
  `src/lib/product-search.js`.)
- [x] Apply `onPageLoad` to `products/index.astro`'s search, category
  filter, and pagination logic. Test: "search keeps working after
  astro:page-load fires again" passes.

### Tier 3 - Related search UX gap

- [x] Sync search term and category to `location.search` via
  `history.replaceState` on change, so Back/Forward restores prior search
  state and results are shareable/bookmarkable. Test: "search syncs the
  query into the URL".

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
- [x] `npm run build` succeeds and `dist/products/index.html` contains no
  raw/unresolved `import` statement (regression guard for the Astro
  `type="module"` bundling gotcha above). Verified via build + grep.
- [x] All six migrated pages (`/`, `/about/`, `/faq/`, `/contact/`,
  `/rfq/`, `/products/`) return 200 and their hamburger/hero/FAQ/form/RFQ
  interactions still initialize under `npm run dev` (checked via curl +
  bundle inspection; full manual click-through in a real browser is still
  recommended before merge).

## Product Decisions

- Chose to add a lightweight DOM test harness (`happy-dom`) rather than a
  full Playwright/browser-automation setup, since the bug is a pure
  script-lifecycle issue reproducible without a real browser.
- Split `products/index.astro`'s client script into a `define:vars` script
  (data only) plus a second plain `<script>` (logic, imports
  `product-search.js`), because Astro won't bundle imports inside a
  `define:vars` script — see the Context note above.
- Migrated all six pages to the shared `onPageLoad` helper rather than
  leaving the other five on their own copy-pasted wrapper, since the user
  confirmed it's worth the (mechanical, low-risk) extra diff for full DRY
  compliance in this PR rather than deferring it.

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
