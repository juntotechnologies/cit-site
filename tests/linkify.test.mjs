/** Tests for the phrase linker. */
import assert from "node:assert/strict";
import test from "node:test";
import { linkify } from "../src/lib/linkify.js";

const LINKS = [{ phrase: "Request for Quotation", href: "/rfq/" }, { phrase: "a@b.com", href: "mailto:a@b.com" }];

test("a listed phrase becomes a link and the text around it stays", () => {
  assert.deepEqual(linkify("Use our Request for Quotation form.", LINKS), [{ text: "Use our " }, { text: "Request for Quotation", href: "/rfq/" }, { text: " form." }]);
});

test("a phrase with dots matches only itself", () => {
  assert.deepEqual(linkify("Mail a@b.com or axb.com", LINKS), [{ text: "Mail " }, { text: "a@b.com", href: "mailto:a@b.com" }, { text: " or axb.com" }]);
});

test("a paragraph with no listed phrase is one plain part", () => {
  assert.deepEqual(linkify("Nothing here.", LINKS), [{ text: "Nothing here." }]);
});
