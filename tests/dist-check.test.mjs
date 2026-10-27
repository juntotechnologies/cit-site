/** Tests for the build check helpers. */
import assert from "node:assert/strict";
import test from "node:test";
import { canonicalOf, descriptionOf, hasStaticAnalyticsTag, headingCount, holdsEmail, isNoindex, jsonLdOf, ogImageOf, pathOfFile, sitemapUrls, titleOf } from "../src/lib/dist-check.js";

const PAGE = `<title>About Us | X</title><meta name="description" content="Hello"><link rel="canonical" href="https://x.test/about/"><meta property="og:image" content="https://x.test/a.jpg"><meta name="robots" content="noindex"><h1 class="a">A</h1><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"A"},{"@type":"B","name":"\\u003c/script>"}]}</script>`;

test("the tags of a page are read from its html", () => {
  assert.equal(titleOf(PAGE), "About Us | X");
  assert.equal(descriptionOf(PAGE), "Hello");
  assert.equal(canonicalOf(PAGE), "https://x.test/about/");
  assert.equal(ogImageOf(PAGE), "https://x.test/a.jpg");
  assert.equal(isNoindex(PAGE), true);
  assert.equal(headingCount(PAGE), 1);
});

test("JSON-LD records come out of the graph, and an escaped less-than sign is restored", () => {
  const records = jsonLdOf(PAGE);
  assert.deepEqual(records.map((record) => record["@type"]), ["A", "B"]);
  assert.equal(records[1].name, "</script>");
});

test("a sitemap gives its addresses", () => {
  assert.deepEqual(sitemapUrls("<urlset><url><loc>https://x.test/</loc></url><url><loc>https://x.test/a/</loc></url></urlset>"), ["https://x.test/", "https://x.test/a/"]);
});

test("a built file names its page path", () => {
  assert.equal(pathOfFile("about/index.html"), "/about/");
  assert.equal(pathOfFile("index.html"), "/");
});

test("holdsEmail finds an address and ignores plain text", () => {
  assert.equal(holdsEmail("write to a@b.com"), true);
  assert.equal(holdsEmail("no address here"), false);
});

test("hasStaticAnalyticsTag finds a Google tag script and ignores other text", () => {
  assert.equal(hasStaticAnalyticsTag('<script async src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>'), true);
  assert.equal(hasStaticAnalyticsTag('<script type="module">const u = "https://www.googletagmanager.com/gtag/js";</script>'), false);
  assert.equal(hasStaticAnalyticsTag("<p>We use Google Analytics.</p>"), false);
});
