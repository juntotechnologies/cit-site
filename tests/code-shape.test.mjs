/** Tests that the code shape limits are set and that every legacy exemption names a file that still exists. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import shape from "../code-shape.json" with { type: "json" };

function exists(path) {
  return existsSync(new URL(`../${path}`, import.meta.url));
}

test("every legacy file in code-shape.json exists", () => {
  assert.deepEqual(shape.legacyFiles.filter((path) => !exists(path)), []);
});

test("the shape limits are positive numbers", () => {
  const limits = [shape.maxFunctionLines, shape.maxComplexity, shape.maxDepth, shape.maxParams];
  assert.ok(limits.every((limit) => Number.isInteger(limit) && limit > 0));
});
