import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { filterProducts, buildPaginationHtml } from "../src/lib/product-search.js";
import { initProductSearch } from "../src/lib/product-search.js";

const PRODUCTS = [
  { name: "Acetone", cas: "67-64-1", molecular_formula: "C3H6O", catalog_number: "A001", category: "organic", product_path: "/products/67-64-1/" },
  { name: "Benzene", cas: "71-43-2", molecular_formula: "C6H6", catalog_number: "B001", category: "organic", product_path: "/products/71-43-2/" },
  { name: "Sodium Chloride", cas: "7647-14-5", molecular_formula: "NaCl", catalog_number: "S001", category: "inorganic", product_path: "/products/7647-14-5/" },
];

test("filterProducts matches by name case-insensitively", () => {
  const result = filterProducts(PRODUCTS, { q: "acetone" });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Acetone");
});

test("filterProducts matches CAS number regardless of case", () => {
  // CAS numbers are numeric/dash strings today, but the match must not rely
  // on case sensitivity — this guards the fix for the inconsistency where
  // `cas` skipped .toLowerCase() while name/formula/catalog_number did not.
  const result = filterProducts(PRODUCTS, { q: "67-64-1" });
  assert.equal(result.length, 1);
  assert.equal(result[0].cas, "67-64-1");
});

test("filterProducts matches category", () => {
  const result = filterProducts(PRODUCTS, { cat: "inorganic" });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Sodium Chloride");
});

test("filterProducts returns all products for an empty query", () => {
  assert.equal(filterProducts(PRODUCTS, {}).length, PRODUCTS.length);
});

test("buildPaginationHtml renders nothing for a single page", () => {
  assert.equal(buildPaginationHtml(1, 1), "");
});

test("buildPaginationHtml renders prev/next around the current page", () => {
  const html = buildPaginationHtml(2, 5);
  assert.match(html, /data-page="1"/);
  assert.match(html, /data-page="3"/);
  assert.match(html, /class="current">2</);
});

function setupDom() {
  const window = new Window({ url: "https://example.test/products" });
  const document = window.document;
  document.body.innerHTML = `
    <input type="search" id="product-search" />
    <select id="cat-filter"><option value="">All</option><option value="organic">Organic</option></select>
    <p id="search-count"></p>
    <div id="product-grid"></div>
    <div id="pagination"></div>
  `;
  globalThis.document = document;
  globalThis.window = window;
  globalThis.location = window.location;
  globalThis.history = window.history;
  globalThis.URLSearchParams = window.URLSearchParams;
  return { window, document };
}

function fireSearch(document, value) {
  const input = document.getElementById("product-search");
  input.value = value;
  input.dispatchEvent(new document.defaultView.Event("input"));
}

test("search keeps working after astro:page-load fires again (simulated client-side navigation)", async () => {
  const { document } = setupDom();

  // First astro:page-load: simulates the real initial page load.
  initProductSearch(PRODUCTS, "CIT #:");
  document.dispatchEvent(new document.defaultView.Event("astro:page-load"));

  fireSearch(document, "acetone");
  await new Promise((r) => setTimeout(r, 250));
  assert.match(document.getElementById("product-grid").innerHTML, /Acetone/);
  assert.doesNotMatch(document.getElementById("product-grid").innerHTML, /Benzene/);

  // Simulate Astro's View Transitions swapping in fresh DOM nodes for the
  // same elements (a real client-side nav away and back), then firing
  // astro:page-load again. Before the fix, the closures from the first
  // bind kept pointing at the now-detached original nodes and the second
  // search silently did nothing.
  document.body.innerHTML = `
    <input type="search" id="product-search" />
    <select id="cat-filter"><option value="">All</option><option value="organic">Organic</option></select>
    <p id="search-count"></p>
    <div id="product-grid"></div>
    <div id="pagination"></div>
  `;
  document.dispatchEvent(new document.defaultView.Event("astro:page-load"));

  fireSearch(document, "benzene");
  await new Promise((r) => setTimeout(r, 250));
  assert.match(
    document.getElementById("product-grid").innerHTML,
    /Benzene/,
    "second search after a simulated navigation must still render results",
  );
});

test("astro:page-load firing twice for the same DOM instance does not double-bind listeners", async () => {
  const { document } = setupDom();

  initProductSearch(PRODUCTS, "CIT #:");
  // Fire twice without replacing the DOM in between, simulating a case
  // where no swap actually occurred.
  document.dispatchEvent(new document.defaultView.Event("astro:page-load"));
  document.dispatchEvent(new document.defaultView.Event("astro:page-load"));

  let renderCount = 0;
  const grid = document.getElementById("product-grid");
  let proto = Object.getPrototypeOf(grid);
  let descriptor;
  while (proto && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(proto, "innerHTML");
    proto = Object.getPrototypeOf(proto);
  }
  Object.defineProperty(grid, "innerHTML", {
    configurable: true,
    get() {
      return descriptor.get.call(this);
    },
    set(value) {
      renderCount++;
      descriptor.set.call(this, value);
    },
  });

  fireSearch(document, "acetone");
  await new Promise((r) => setTimeout(r, 250));

  assert.equal(renderCount, 1, "expected exactly one render from a single search, not one per duplicate binding");
});

test("search syncs the query into the URL", async () => {
  const { document, window } = setupDom();

  initProductSearch(PRODUCTS, "CIT #:");
  document.dispatchEvent(new document.defaultView.Event("astro:page-load"));

  fireSearch(document, "acetone");
  await new Promise((r) => setTimeout(r, 250));

  assert.equal(new window.URLSearchParams(window.location.search).get("q"), "acetone");
});
