/** Tests for the product data file and the company metadata. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
const metadata = JSON.parse(readFileSync(new URL("../data/metadata.json", import.meta.url), "utf8"));

function assertLegacyUrl(product) {
  assert.match(product.url, /^https:\/\/chem-is-try\.com\/product\/[^/]+\/$/, `${product.catalog_number} should retain its legacy product URL`);
}

function assertRequiredFields(product) {
  assert.match(product.catalog_number, /^[A-Z]+[0-9]+$/, `${product.name} should have a catalog number`);
  assert.equal(typeof product.name, "string", `${product.catalog_number} should have a name`);
  assert.ok(product.name.trim(), `${product.catalog_number} should not have a blank name`);
  assert.match(product.category, /^(organic|inorganic|reagent-usp|representative|bulk)$/, `${product.catalog_number} should have a known category`);
}

test("catalog data contains the expected required fields for every product", () => {
  assert.equal(products.length, 1066);
  products.forEach(assertRequiredFields);
  // Products added directly (not migrated from the old WordPress site)
  // have no legacy `url` - that's expected, not missing data.
  products.filter((product) => product.url).forEach(assertLegacyUrl);
});

test("catalog numbers and legacy URLs are unique", () => {
  const catalogNumbers = products.map((product) => product.catalog_number);
  const legacyUrls = products.map((product) => product.url).filter(Boolean);

  assert.equal(new Set(catalogNumbers).size, products.length);
  assert.equal(new Set(legacyUrls).size, legacyUrls.length);
});

function assertImageExists(product) {
  const imagePath = new URL(`../public/images/${product.image_file}`, import.meta.url);
  assert.equal(existsSync(imagePath), true, `${product.catalog_number} image is missing: ${product.image_file}`);
}

test("referenced product structure images exist in public assets", () => {
  products.filter((product) => product.image_file).forEach(assertImageExists);
});

test("company metadata keeps production SEO/contact anchors valid", () => {
  assert.equal(metadata.company.siteUrl, "https://chem-is-try.com");
  assert.match(metadata.company.email, /^[^@\s]+@chem-is-try\.com$/);
  assert.ok(metadata.team.length >= 1);
});

test("the logo and the default social image exist in public assets", () => {
  for (const path of [metadata.company.logo, metadata.company.defaultOgImage]) {
    assert.equal(existsSync(new URL(`../public${path}`, import.meta.url)), true, `${path} is missing`);
  }
});
