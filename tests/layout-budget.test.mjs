/** Tests for the pure steps of the layout check. */
import assert from "node:assert/strict";
import test from "node:test";
import { describeMargins, linesOf, marginsOf, overflowBy, tooManyLines, tooSmallTargets, unevenMargins } from "../src/lib/layout-budget.js";

test("a heading's lines are its height over its line height", () => {
  assert.equal(linesOf({ height: 72, lineHeight: 36 }), 2);
});

test("only headings over the limit are listed", () => {
  const rows = [{ text: "a", height: 36, lineHeight: 36 }, { text: "b", height: 108, lineHeight: 36 }];
  assert.deepEqual(tooManyLines(rows, 2).map((row) => row.text), ["b"]);
});

test("margins are the gaps to the left and right screen edges", () => {
  assert.deepEqual(marginsOf({ left: 20, right: 370 }, 390), { left: 20, right: 20 });
});

test("a block with gaps that differ by more than the tolerance is uneven", () => {
  const frames = [{ selector: ".a", left: 20, right: 370 }, { selector: ".b", left: 20, right: 350 }];
  assert.deepEqual(unevenMargins(frames, 390, 1).map((frame) => frame.selector), [".b"]);
});

test("sideways scroll is the page width over the screen width, never negative", () => {
  assert.equal(overflowBy({ scroll: 400, client: 390 }), 10);
  assert.equal(overflowBy({ scroll: 390, client: 390 }), 0);
});

test("a visible control under the limit is listed and a hidden one is not", () => {
  const rows = [{ text: "ok", height: 44 }, { text: "small", height: 30 }, { text: "hidden", height: 0 }];
  assert.deepEqual(tooSmallTargets(rows, 44).map((row) => row.text), ["small"]);
});

test("a margin fault names the block and both gaps", () => {
  assert.equal(describeMargins("390 px /", 390, { selector: ".b", left: 20, right: 350 }), "390 px /: .b has a left gap of 20 px and a right gap of 40 px");
});
