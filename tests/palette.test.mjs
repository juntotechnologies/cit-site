/** Tests for the palette reader. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { brandColor } from "../src/lib/palette.js";

test("brandColor reads the brand token from the real palette file", () => {
  assert.match(brandColor(readFileSync(new URL("../src/styles/palette.css", import.meta.url), "utf8")), /^#[0-9a-f]{6}$/i);
});

test("brandColor reads a token from a small sample", () => {
  assert.equal(brandColor(":root { --color-brand-primary: #123456; }"), "#123456");
});
