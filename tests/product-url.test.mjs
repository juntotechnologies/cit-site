import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getLegacyProductPath,
  getProductPath,
  normalizeCas,
} from "../src/lib/product-url.js";

const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));

function productByCatalog(catalogNumber) {
  const product = products.find((candidate) => candidate.catalog_number === catalogNumber);
  assert.ok(product, `Expected product ${catalogNumber} to exist`);
  return product;
}

function productByLegacySlug(slug) {
  const product = products.find((candidate) => getLegacyProductPath(candidate) === `/product/${slug}/`);
  assert.ok(product, `Expected legacy product slug ${slug} to exist`);
  return product;
}

test("reported legacy product URLs resolve to canonical product paths", () => {
  assert.equal(getProductPath(productByLegacySlug("2-methylbenzylamine"), products), "/products/89-93-0/");
  assert.equal(getProductPath(productByLegacySlug("sodium-benzoate"), products), "/products/532-32-1/");
  assert.equal(getProductPath(productByLegacySlug("poloxamer-407"), products), "/products/p048/");
  assert.equal(getProductPath(productByLegacySlug("4-hydroxybenzophenone"), products), "/products/1137-42-4/");
});

test("unique checksum-valid CAS numbers become canonical product URLs", () => {
  assert.equal(getProductPath(productByCatalog("M016"), products), "/products/89-93-0/");
  assert.equal(getProductPath(productByCatalog("RS027"), products), "/products/532-32-1/");
  assert.equal(getProductPath(productByCatalog("H002"), products), "/products/1137-42-4/");
});

test("duplicate or invalid CAS data falls back to catalog-number product URLs", () => {
  assert.equal(getProductPath(productByCatalog("P048"), products), "/products/p048/");
  assert.equal(getProductPath(productByCatalog("P049"), products), "/products/p049/");
  assert.equal(getProductPath(productByCatalog("M052"), products), "/products/m052/");
  assert.equal(getProductPath(productByCatalog("P019"), products), "/products/p019/");
});

test("dot-separated CAS values are normalized only when checksum-valid", () => {
  assert.equal(normalizeCas("2051.07-2"), "2051-07-2");
  assert.equal(normalizeCas("2459.09.8"), "2459-09-8");
  assert.equal(normalizeCas("3179.09-7"), "3179-09-7");
  assert.equal(normalizeCas("181.145"), undefined);
});

test("every legacy product URL has a corresponding canonical destination", () => {
  for (const product of products) {
    const legacy = getLegacyProductPath(product);
    assert.match(legacy, /^\/product\/[^/]+\/$/);
    assert.match(getProductPath(product, products), /^\/products\/[^/]+\/$/);
  }
});
