// One-off script (see docs/pr-docs/9-product-catalogue-upload-jul2026.md):
// parses the product batch out of a dropped-in .docx and writes a review
// report. Does NOT touch data/products.json or public/images/ - merging is
// a separate, human-reviewed step (Tier 3) once collisions/categories are
// resolved.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReviewReport, findDuplicateCatalogNumbers, parseProductRows, parseRelsMap, partitionByCollision } from "../src/lib/docx-product-parser.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docxPath = process.argv[2] || join(root, "docs", "vendor-reviews", "2026-07-products-to-be-uploaded.docx");
const outDir = join(root, "scripts", "out");

function extractFromZip(zipPath, entryPath) {
  return execFileSync("unzip", ["-p", zipPath, entryPath], { encoding: "utf8" });
}

const documentXml = extractFromZip(docxPath, "word/document.xml");
const relsXml = extractFromZip(docxPath, "word/_rels/document.xml.rels");
const relsMap = parseRelsMap(relsXml);

const rows = parseProductRows(documentXml).map((row) => ({
  ...row,
  image_media_file: row.image_rid ? relsMap[row.image_rid] || null : null,
}));

const duplicates = findDuplicateCatalogNumbers(rows);
const duplicateCatalogNumbers = new Set(duplicates.map((group) => group[0].catalog_number));
const dedupedRows = rows.filter((row) => !duplicateCatalogNumbers.has(row.catalog_number));

const products = JSON.parse(readFileSync(join(root, "data", "products.json"), "utf8"));
const { identicalCollisions, conflictingCollisions, fresh } = partitionByCollision(dedupedRows, products);
const { clean, needsReview } = buildReviewReport({ fresh, duplicates, conflictingCollisions });

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "docx-parsed-clean.json"), JSON.stringify(clean, null, 2));
writeFileSync(join(outDir, "docx-parsed-needs-review.json"), JSON.stringify(needsReview, null, 2));

console.log(`Parsed ${rows.length} product rows from ${docxPath}`);
console.log(`  ${identicalCollisions.length} already in the catalogue with identical data, nothing to do: ${identicalCollisions.map((c) => c.catalog_number).join(", ") || "none"}`);
console.log(`  ${clean.length} clean and ready to merge -> scripts/out/docx-parsed-clean.json`);
console.log(`  ${needsReview.length} need a human decision before merge -> scripts/out/docx-parsed-needs-review.json`);
for (const issue of needsReview) {
  console.log(`    [${issue.reason}] ${issue.catalog_number}`);
}

const missingFields = clean.filter((p) => !p.cas || !p.molecular_weight || !p.molecular_formula);
if (missingFields.length) {
  console.log(`\n${missingFields.length} clean products still have a blank cas/molecular_weight/molecular_formula field (OK to merge blank per PR doc Non-Goals):`);
  for (const p of missingFields) {
    console.log(`  ${p.catalog_number} ${p.name}: cas="${p.cas}" mw="${p.molecular_weight}" mf="${p.molecular_formula}"`);
  }
}
