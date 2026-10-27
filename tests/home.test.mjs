/** Tests for the home page data: the facts and the featured sections. */
import assert from "node:assert/strict";
import test from "node:test";
import { FEATURED, featuredSections, introFacts } from "../src/lib/home.js";
import { products, site, total } from "./helpers/site.mjs";

test("the intro facts take the count and the years from the data", () => {
  const facts = introFacts(site.company, 1066, 2026);
  assert.deepEqual(facts.slice(0, 2), [{ value: "1,000+", label: "Catalogue products" }, { value: "25+", label: "Years in business" }]);
  assert.equal(facts.length, 4);
});

test("a featured section holds at most four products of its own category", () => {
  const sections = featuredSections(site.categories, products);
  for (const section of sections) {
    assert.ok(section.products.length <= 4);
    assert.ok(section.products.every((product) => product.category === section.category.value));
  }
});

test("only categories with a view-all link are featured", () => {
  const values = featuredSections(site.categories, products).map((section) => section.category.value);
  assert.equal(values.includes("representative"), false);
  assert.ok(values.includes("organic"));
  assert.ok(total > 0);
});

const GRID_COLUMNS = [2, 4];

test("the featured count fills every row of the home grid", () => {
  assert.deepEqual(GRID_COLUMNS.filter((columns) => FEATURED % columns !== 0), []);
});
