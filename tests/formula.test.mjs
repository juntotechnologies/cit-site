import assert from "node:assert/strict";
import test from "node:test";
import { formulaToHtml } from "../src/lib/formula.js";

test("formulaToHtml renders element counts as subscripts", () => {
  assert.equal(
    formulaToHtml("C13H10O2"),
    "C<sub>13</sub>H<sub>10</sub>O<sub>2</sub>",
  );
});

test("formulaToHtml renders counts after grouped formulas", () => {
  assert.equal(
    formulaToHtml("(CH3)2NCH2CH2OH"),
    "(CH<sub>3</sub>)<sub>2</sub>NCH<sub>2</sub>CH<sub>2</sub>OH",
  );
});

test("formulaToHtml leaves charges, punctuation, and text without counts alone", () => {
  assert.equal(formulaToHtml("Na+"), "Na+");
  assert.equal(formulaToHtml("C6H5COONa"), "C<sub>6</sub>H<sub>5</sub>COONa");
  assert.equal(formulaToHtml(""), "");
});
