/** ESLint config: code shape limits, no nested functions and the file docstring rule for the JavaScript of this repo. */
import js from "@eslint/js";
import globals from "globals";
import shape from "./code-shape.json" with { type: "json" };
import fileDocstring from "./tools/eslint/file-docstring.js";

const NESTED_FUNCTION = { selector: ":function :function", message: "Define functions at top level; never inside another function." };

const SHAPE_LIMITS = {
  complexity: ["error", shape.maxComplexity],
  "max-depth": ["error", shape.maxDepth],
  "max-params": ["error", shape.maxParams],
  "max-lines-per-function": ["error", { max: shape.maxFunctionLines, skipBlankLines: true, skipComments: true }],
  "no-restricted-syntax": ["error", NESTED_FUNCTION],
};

const SHAPE_OFF = Object.fromEntries(Object.keys(SHAPE_LIMITS).map((rule) => [rule, "off"]));
const CODE_FILES = ["**/*.{js,mjs}"];
const DOCSTRING = { plugins: { local: { rules: { "file-docstring": fileDocstring } } }, rules: { "local/file-docstring": "error" } };

export default [
  { ignores: ["node_modules", "dist", ".astro", "public", "scripts/out"] },
  js.configs.recommended,
  { files: CODE_FILES, languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: SHAPE_LIMITS },
  { files: CODE_FILES, ...DOCSTRING },
  { files: shape.legacyFiles, rules: SHAPE_OFF },
  { files: ["tests/**"], rules: { "max-lines-per-function": "off", "no-restricted-syntax": "off" } },
];
