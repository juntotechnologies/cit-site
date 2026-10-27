/** Tests that each text color the site uses on a background meets WCAG AA (4.5:1) in the palette file. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contrastRatio, readTokens, resolveToken } from "../src/lib/contrast.js";

const PAIRS = [
  ["text", "page"], ["text-muted", "page"], ["text-muted", "surface-subtle"], ["text-muted", "surface-brand"],
  ["link", "page"], ["link", "surface-brand"], ["heading", "page"], ["heading", "surface-brand"],
  ["text-on-dark", "header"], ["on-dark-88", "header"], ["on-dark-70", "neutral-900"], ["brand-accent", "neutral-900"],
  ["text-on-accent", "brand-accent"], ["text-on-accent", "brand-accent-hover"], ["text-on-dark", "brand-primary-hover"],
  ["neutral-300", "footer"], ["footer-label", "footer"], ["footer-muted", "footer"], ["success-text", "success-surface"], ["error-text", "error-surface"],
];
const AA = 4.5;
const tokens = readTokens(readFileSync(new URL("../src/styles/palette.css", import.meta.url), "utf8"));

function colorOf(name) {
  return resolveToken(tokens, `color-${name}`);
}

test("every listed text and background pair meets AA contrast", () => {
  for (const [text, background] of PAIRS) {
    const ratio = contrastRatio(colorOf(text), colorOf(background));
    assert.ok(ratio >= AA, `${text} on ${background} is ${ratio.toFixed(2)}:1, under ${AA}:1`);
  }
});

test("contrastRatio is 21 for black on white and 1 for the same color", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  assert.equal(contrastRatio("#336699", "#336699"), 1);
});

test("a token that points at another token is followed to its color", () => {
  assert.equal(resolveToken({ a: "var(--b)", b: "#112233" }, "a"), "#112233");
});
