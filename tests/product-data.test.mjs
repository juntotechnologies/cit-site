import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
const metadata = JSON.parse(readFileSync(new URL("../data/metadata.json", import.meta.url), "utf8"));

test("catalog data contains the expected required fields for every product", () => {
  assert.equal(products.length, 1066);

  for (const product of products) {
    assert.match(product.catalog_number, /^[A-Z]+[0-9]+$/, `${product.name} should have a catalog number`);
    assert.equal(typeof product.name, "string", `${product.catalog_number} should have a name`);
    assert.ok(product.name.trim(), `${product.catalog_number} should not have a blank name`);
    // Products added directly (not migrated from the old WordPress site)
    // have no legacy `url` - that's expected, not missing data.
    if (product.url) {
      assert.match(product.url, /^https:\/\/chem-is-try\.com\/product\/[^/]+\/$/, `${product.catalog_number} should retain its legacy product URL`);
    }
    assert.match(product.category, /^(organic|inorganic|reagent-usp|representative|bulk)$/, `${product.catalog_number} should have a known category`);
  }
});

test("catalog numbers and legacy URLs are unique", () => {
  const catalogNumbers = products.map((product) => product.catalog_number);
  const legacyUrls = products.map((product) => product.url).filter(Boolean);

  assert.equal(new Set(catalogNumbers).size, products.length);
  assert.equal(new Set(legacyUrls).size, legacyUrls.length);
});

test("referenced product structure images exist in public assets", () => {
  for (const product of products) {
    if (!product.image_file) continue;
    const imagePath = new URL(`../public/images/${product.image_file}`, import.meta.url);
    assert.equal(existsSync(imagePath), true, `${product.catalog_number} image is missing: ${product.image_file}`);
  }
});

test("company metadata keeps production SEO/contact anchors valid", () => {
  assert.equal(metadata.company.siteUrl, "https://chem-is-try.com");
  assert.match(metadata.company.email, /^[^@\s]+@chem-is-try\.com$/);
  assert.match(metadata.company.logo, /^https:\/\/chem-is-try\.com\/assets\/logo\.png$/);
  assert.ok(metadata.team.length >= 1);
});
