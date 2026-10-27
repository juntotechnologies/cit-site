/** Tests for the navigation helpers. */
import assert from "node:assert/strict";
import test from "node:test";
import { footerItems, isActive, menuItems, menuView } from "../src/lib/nav.js";
import { normalizePath } from "../src/lib/seo.js";
import { site } from "./helpers/site.mjs";

test("Home is current only on the home page", () => {
  assert.equal(isActive("/", "/"), true);
  assert.equal(isActive("/about/", "/"), false);
});

test("a section is current on its own page and below it", () => {
  assert.equal(isActive("/products/12027-06-4/", "/products/"), true);
  assert.equal(isActive("/services/", "/products/"), false);
});

test("the header menu lists the stored menu pages in order", () => {
  assert.deepEqual(menuItems(site).map((item) => item.label), ["Home", "About Us", "Products", "Services", "FAQs", "Contact Us"]);
});

test("the footer lists the stored footer pages in order", () => {
  assert.deepEqual(footerItems(site).map((item) => item.path), ["/about/", "/products/", "/services/", "/contact/", "/rfq/", "/privacy-policy/", "/terms/"]);
});

test("normalizePath adds one trailing slash", () => {
  assert.equal(normalizePath("/about"), "/about/");
  assert.equal(normalizePath("/about/"), "/about/");
});

test("the menu view marks the current entry and puts the services under Services", () => {
  const view = menuView(site, [{ slug: "contract-rd", title: "Contract R & D" }], "/services/contract-rd/");
  const services = view.find((entry) => entry.path === "/services/");
  assert.equal(services.active, true);
  assert.deepEqual(services.children, [{ label: "Contract R & D", path: "/services/contract-rd/" }]);
  assert.equal(view.find((entry) => entry.path === "/").active, false);
  assert.deepEqual(view.find((entry) => entry.path === "/about/").children, []);
});
