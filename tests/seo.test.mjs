/** Tests for page metadata and structured data builders. */
import assert from "node:assert/strict";
import test from "node:test";
import { absoluteUrl, breadcrumbSchema, findPage, jsonLd, organizationSchema, pageMeta, pageRecords, productDescription, productHeading, productSchema, trailFor, websiteSchema } from "../src/lib/seo.js";
import { site, total } from "./helpers/site.mjs";

const product = { catalog_number: "A092", name: "AMMONIUM IODIDE", cas: "12027-06-4", molecular_formula: "NH4I", molecular_weight: "144.94", image_file: "A092.png" };
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

test("pageMeta fills the stored description and builds the canonical address", () => {
  const meta = pageMeta(site, total, findPage(site, "/about/"));
  assert.equal(meta.title, "About Us | CHEM-IS-TRY, Inc.");
  assert.equal(meta.description, "CHEM-IS-TRY, Inc. – specialty chemical company founded in 1999 in Metuchen, NJ.");
  assert.equal(meta.canonical, "https://chem-is-try.com/about/");
});

test("the default social image is an absolute address on the site", () => {
  assert.equal(pageMeta(site, total, findPage(site, "/")).ogImage, "https://chem-is-try.com/assets/og-image.jpg");
});

test("the home description states the rounded catalogue size", () => {
  assert.match(pageMeta(site, 1066, findPage(site, "/")).description, /offering 1,000\+ compounds/);
});

test("absoluteUrl keeps the query string", () => {
  assert.equal(absoluteUrl(site.company, "/products/?cat=bulk"), "https://chem-is-try.com/products/?cat=bulk");
});

test("the Organization record names the phone and the contact page, and holds no email", () => {
  const record = organizationSchema(site);
  assert.equal(record.contactPoint.url, "https://chem-is-try.com/contact/");
  assert.equal(record.contactPoint.telephone, "+1-732-372-7311");
  assert.doesNotMatch(JSON.stringify(record), EMAIL);
});

test("the WebSite record points its search action at the catalogue search", () => {
  const action = websiteSchema(site).potentialAction;
  assert.equal(action.target.urlTemplate, "https://chem-is-try.com/products/?q={search_term_string}");
});

test("a breadcrumb numbers its steps from one and gives each an address", () => {
  const list = breadcrumbSchema(site, trailFor({ name: "About Us", path: "/about/" })).itemListElement;
  assert.deepEqual(list.map((item) => [item.position, item.name, item.item]), [[1, "Home", "https://chem-is-try.com/"], [2, "About Us", "https://chem-is-try.com/about/"]]);
});

test("Home carries the company and the site, other pages carry a breadcrumb", () => {
  assert.deepEqual(pageRecords(site, findPage(site, "/")).map((r) => r["@type"]), ["Organization", "WebSite"]);
  assert.deepEqual(pageRecords(site, findPage(site, "/faq/")).map((r) => r["@type"]), ["BreadcrumbList"]);
});

test("the product description uses only the facts that exist", () => {
  assert.equal(productDescription(site.company, product), "AMMONIUM IODIDE. CAS 12027-06-4, formula NH4I, molecular weight 144.94 g/mol. Chemical catalogue product. Request a quotation from CHEM-IS-TRY, Inc.");
  assert.equal(productDescription(site.company, { name: "X" }), "X. Chemical catalogue product. Request a quotation from CHEM-IS-TRY, Inc.");
});

test("the product heading adds the CAS number when it is known", () => {
  assert.equal(productHeading(product), "AMMONIUM IODIDE (CAS 12027-06-4)");
  assert.equal(productHeading({ name: "X" }), "X");
});

test("the Product record states no price and no offer", () => {
  const record = productSchema(site, product, "/products/12027-06-4/");
  assert.equal(record.sku, "A092");
  assert.equal(record.image, "https://chem-is-try.com/images/A092.png");
  assert.equal("offers" in record, false);
});

test("jsonLd escapes a less-than sign so no text can close the script tag", () => {
  assert.doesNotMatch(jsonLd([{ name: "</script><b>" }]), /<\/script>/);
});
