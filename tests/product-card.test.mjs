/** Tests for the shared product card: markup, escaping and the optional category badge. */
import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml, productCardHtml } from "../src/lib/product-card.js";

const product = { catalog_number: "A092", name: "AMMONIUM IODIDE", cas: "12027-06-4", molecular_formula: "NH4I", image_file: "A092.png", category: "inorganic" };

test("the card shows the name as a link, the labels and the formula with subscripts", () => {
  const html = productCardHtml({ product, path: "/products/12027-06-4/", label: "CIT #:" });
  assert.match(html, /<h3><a href="\/products\/12027-06-4\/">AMMONIUM IODIDE<\/a><\/h3>/);
  assert.match(html, /CIT #: A092/);
  assert.match(html, /CAS 12027-06-4/);
  assert.match(html, /NH<sub>4<\/sub>I/);
});

test("the image has a descriptive alt text and the size of the structure files, not a square", () => {
  assert.match(productCardHtml({ product, path: "/p/", label: "CIT #:" }), /alt="Structure of AMMONIUM IODIDE" width="800" height="320" loading="lazy"/);
});

test("a product with no image shows a text note, not an emoji", () => {
  assert.match(productCardHtml({ product: { name: "X" }, path: "/p/", label: "CIT #:" }), /No structure image/);
});

test("the category badge shows only when asked", () => {
  assert.doesNotMatch(productCardHtml({ product, path: "/p/", label: "CIT #:" }), /product-cat-badge/);
  assert.match(productCardHtml({ product, path: "/p/", label: "CIT #:", showCategory: true }), /product-cat-badge">inorganic</);
});

test("a name with a quote or a tag cannot break the markup", () => {
  const html = productCardHtml({ product: { name: '"><img src=x>' }, path: "/p/", label: "CIT #:" });
  assert.doesNotMatch(html, /<img src=x>/);
  assert.equal(escapeHtml("a&b"), "a&amp;b");
});
