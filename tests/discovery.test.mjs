/** Tests for the generated discovery files: content, links and the rule that no email address appears. */
import assert from "node:assert/strict";
import test from "node:test";
import { agentsJson, agentsTxt, llmsFullTxt, llmsTxt, robotsTxt } from "../src/lib/discovery.js";
import { getProductPath } from "../src/lib/product-url.js";
import { products, site, total } from "./helpers/site.mjs";

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const entries = products.slice(0, 3).map((product) => ({ product, path: getProductPath(product, products) }));

function everyFile() {
  return [robotsTxt(site), llmsTxt(site, total), llmsFullTxt(site, entries), agentsTxt(site, total), JSON.stringify(agentsJson(site, total))];
}

test("robots.txt allows every crawler and names the sitemap", () => {
  assert.equal(robotsTxt(site), "User-agent: *\nAllow: /\n\nSitemap: https://chem-is-try.com/sitemap-index.xml\n");
});

test("llms.txt lists every stored page and every category", () => {
  const text = llmsTxt(site, total);
  for (const page of site.pages) assert.ok(text.includes(`https://chem-is-try.com${page.path})`), page.path);
  for (const category of site.categories) assert.ok(text.includes(`?cat=${category.value})`), category.value);
});

test("llms.txt states the catalogue size from the product count", () => {
  assert.match(llmsTxt(site, 1066), /It lists 1,000\+ chemical products/);
});

test("llms-full.txt has one line for each product, with its address", () => {
  const lines = llmsFullTxt(site, entries).split("\n").filter((line) => line.startsWith("- ["));
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^- \[.+\]\(https:\/\/chem-is-try\.com\/products\/.+\/\): /);
});

test("agents.txt and agents.json carry the same rules", () => {
  const text = agentsTxt(site, total);
  const json = agentsJson(site, total);
  for (const rule of json.mayDo) assert.ok(text.includes(`Allow: ${rule}`));
  for (const rule of json.mayNotDo) assert.ok(text.includes(`Disallow: ${rule}`));
  assert.equal(json.contact, "https://chem-is-try.com/contact/");
});

test("no generated discovery file holds an email address", () => {
  for (const text of everyFile()) assert.doesNotMatch(text, EMAIL);
});

test("each path named in the agent rules is a page or a generated file", () => {
  const known = [...site.pages.map((page) => page.path), "/llms-full.txt", "/llms.txt"];
  const named = site.discovery.mayDo.flatMap((rule) => rule.match(/\/[\w./-]*[\w/]/g) ?? []);
  for (const path of named) assert.ok(known.includes(path), `${path} is not a page`);
});
