/** Tests for the generated redirect file. */
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

function redirectPairs(product) {
  const canonical = getProductPath(product, products);
  const legacy = getLegacyProductPath(product);
  const sources = [legacy, catalogPath(product)];
  return sources.filter((source) => source && source !== canonical).map((source) => [source, canonical]);
}

test("generated redirects file matches product canonical URL decisions", () => {
  const expected = new Map(products.flatMap(redirectPairs));
  const actual = parseRedirects(redirectsText);
  assert.deepEqual(actual, new Map([...expected.entries()].sort(([a], [b]) => a.localeCompare(b))));
});

function assertRedirect([from, to]) {
  assert.notEqual(from, to);
  assert.match(from, /^\/(product|products)\//);
  assert.match(to, /^\/products\/[^/]+\/$/);
}

test("redirects never point a product URL at itself", () => {
  [...parseRedirects(redirectsText)].forEach(assertRedirect);
});
