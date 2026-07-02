// One-off script (see docs/pr-docs/9-product-catalogue-upload-jul2026.md):
// parses the product batch out of a dropped-in .docx and writes a review
// report. Does NOT touch data/products.json or public/images/ - merging is
// a separate, human-reviewed step (Tier 3) once collisions/categories are
// resolved.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findDuplicateCatalogNumbers, parseProductRows, parseRelsMap, partitionByCollision } from "../src/lib/docx-product-parser.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docxPath = process.argv[2] || join(root, "260702-products-to-be-uploaded.docx");
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
const { collisions, fresh } = partitionByCollision(dedupedRows, products);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "docx-parsed-fresh.json"), JSON.stringify(fresh, null, 2));
writeFileSync(join(outDir, "docx-parsed-collisions.json"), JSON.stringify(collisions, null, 2));
writeFileSync(join(outDir, "docx-parsed-duplicates.json"), JSON.stringify(duplicates, null, 2));

console.log(`Parsed ${rows.length} product rows from ${docxPath}`);
console.log(`  ${fresh.length} new (not in data/products.json)`);
console.log(`  ${collisions.length} collide with existing catalog numbers: ${collisions.map((c) => c.catalog_number).join(", ")}`);
if (duplicates.length) {
  console.log(`  ${duplicates.length} catalog number(s) reused within the batch itself (excluded from fresh/collisions above, needs a human decision):`);
  for (const group of duplicates) {
    console.log(`    ${group[0].catalog_number}: ${group.map((r) => `mf="${r.molecular_formula}" image=${r.image_media_file}`).join(" vs. ")}`);
  }
}
console.log(`Wrote scripts/out/docx-parsed-{fresh,collisions,duplicates}.json for review.`);

const missingFields = fresh.filter((p) => !p.cas || !p.molecular_weight || !p.molecular_formula);
if (missingFields.length) {
  console.log(`\n${missingFields.length} products have a blank cas/molecular_weight/molecular_formula field:`);
  for (const p of missingFields) {
    console.log(`  ${p.catalog_number} ${p.name}: cas="${p.cas}" mw="${p.molecular_weight}" mf="${p.molecular_formula}"`);
  }
}

const missingImages = fresh.filter((p) => !p.image_media_file);
if (missingImages.length) {
  console.log(`\n${missingImages.length} products have no resolved structure image:`);
  for (const p of missingImages) {
    console.log(`  ${p.catalog_number} ${p.name}`);
  }
}
