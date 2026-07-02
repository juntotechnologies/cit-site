// One-off script (see docs/pr-docs/9-product-catalogue-upload-jul2026.md):
// merges scripts/out/docx-parsed-clean.json into data/products.json and
// copies each product's structure image into public/images/. Only run
// after `node scripts/parse-product-docx.mjs` has produced a fresh
// docx-parsed-clean.json. Items in docx-parsed-needs-review.json are
// intentionally left out until resolved.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inferCategory } from "../src/lib/docx-product-parser.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docxPath = process.argv[2] || join(root, "docs", "vendor-reviews", "2026-07-products-to-be-uploaded.docx");
const cleanPath = join(root, "scripts", "out", "docx-parsed-clean.json");
const productsPath = join(root, "data", "products.json");
const imagesDir = join(root, "public", "images");

const clean = JSON.parse(readFileSync(cleanPath, "utf8"));
const products = JSON.parse(readFileSync(productsPath, "utf8"));
const existingCatalogNumbers = new Set(products.map((p) => p.catalog_number));

function extractImage(mediaFile, destPath) {
  const buf = execFileSync("unzip", ["-p", docxPath, `word/media/${mediaFile}`]);
  writeFileSync(destPath, buf);
}

let added = 0;
for (const row of clean) {
  if (existingCatalogNumbers.has(row.catalog_number)) {
    console.log(`Skipping ${row.catalog_number}: already in data/products.json (re-run parse-product-docx.mjs?)`);
    continue;
  }

  const ext = row.image_media_file.split(".").pop().replace("jpeg", "jpg");
  const imageFile = `CIT_${row.catalog_number}.${ext}`;
  extractImage(row.image_media_file, join(imagesDir, imageFile));

  products.push({
    catalog_number: row.catalog_number,
    name: row.name,
    cas: row.cas || undefined,
    molecular_weight: row.molecular_weight || undefined,
    molecular_formula: row.molecular_formula || undefined,
    image_file: imageFile,
    category: inferCategory(row.catalog_number),
  });
  added++;
}

products.sort((a, b) => a.catalog_number.localeCompare(b.catalog_number));
writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`);

console.log(`Added ${added} products to data/products.json and copied their images to public/images/.`);
