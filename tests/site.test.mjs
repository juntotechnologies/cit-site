/** Tests for the site loader: schemas reject bad data, and derived facts come out right. */
import assert from "node:assert/strict";
import test from "node:test";
import { addressLine, fillText, loadSite, mapEmbedUrl, roundedCount, telHref, textValues, yearsInBusiness } from "../src/lib/site.js";
import { site, total } from "./helpers/site.mjs";

function rawSite() {
  return { metadata: structuredClone({ company: site.company, analytics: site.analytics, team: site.team }), pages: { pages: site.pages, categories: site.categories }, discovery: site.discovery };
}

test("the data files load into a typed site object", () => {
  assert.equal(site.company.name, "CHEM-IS-TRY, Inc.");
  assert.ok(site.pages.length > 0);
});

test("an unknown key in a data file fails at load time", () => {
  const raw = rawSite();
  raw.metadata.company.surprise = "x";
  assert.throws(() => loadSite(raw), /Unrecognized key/);
});

test("a site path must start and end with a slash", () => {
  const raw = rawSite();
  raw.pages.pages[0].path = "about";
  assert.throws(() => loadSite(raw));
});

test("the address line and the map address come from the address fields", () => {
  assert.equal(addressLine(site.company.address), "160-4 & 160-5 A Liberty Street, Liberty Corporate Park, Metuchen, NJ 08840, USA");
  assert.equal(mapEmbedUrl(site.company.address), "https://maps.google.com/maps?q=160-4+%26+160-5+A+Liberty+Street+Liberty+Corporate+Park+Metuchen+NJ+08840&output=embed");
});

test("telHref keeps the digits and the plus sign", () => {
  assert.equal(telHref("+1-877-243-6123"), "tel:+18772436123");
});

test("roundedCount rounds the catalogue down to the hundred", () => {
  assert.equal(roundedCount(1066), "1,000+");
  assert.equal(roundedCount(974), "900+");
});

test("fillText fills known keys and leaves an unknown key visible", () => {
  assert.equal(fillText("{name} since {since} {oops}", textValues(site.company, total)), "CHEM-IS-TRY, Inc. since 1999 {oops}");
});

test("fillText makes one period where a name ends in a period and the text adds another", () => {
  assert.equal(fillText("Terms for {name}.", textValues(site.company, total)), "Terms for CHEM-IS-TRY, Inc.");
});

test("yearsInBusiness rounds down to five years", () => {
  assert.equal(yearsInBusiness(site.company, 2026), 25);
  assert.equal(yearsInBusiness(site.company, 2029), 30);
});

test("the consent notice copy is required and checked at load time", () => {
  const raw = rawSite();
  delete raw.metadata.analytics.consent.message;
  assert.throws(() => loadSite(raw));
});
