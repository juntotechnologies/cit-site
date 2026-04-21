import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getLegacyProductPath, getProductPath } from "../src/lib/product-url.js";

const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
const redirectsText = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");

function catalogPath(product) {
  return `/products/${product.catalog_number.toLowerCase()}/`;
}

function parseRedirects(text) {
  return new Map(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const [from, to, status] = line.split(/\s+/);
        assert.equal(status, "301", `${from} should be a permanent redirect`);
        return [from, to];
      }),
  );
}

test("generated redirects file matches product canonical URL decisions", () => {
  const expected = new Map();

  for (const product of products) {
    const canonical = getProductPath(product, products);
    const legacy = getLegacyProductPath(product);
    if (legacy && legacy !== canonical) expected.set(legacy, canonical);

    const catalog = catalogPath(product);
    if (catalog !== canonical) expected.set(catalog, canonical);
  }

  const actual = parseRedirects(redirectsText);
  assert.deepEqual(actual, new Map([...expected.entries()].sort(([a], [b]) => a.localeCompare(b))));
});

test("redirects never point a product URL at itself", () => {
  const redirects = parseRedirects(redirectsText);
  for (const [from, to] of redirects) {
    assert.notEqual(from, to);
    assert.match(from, /^\/(product|products)\//);
    assert.match(to, /^\/products\/[^/]+\/$/);
  }
});
