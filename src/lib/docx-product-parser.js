// Parses the product table rows out of a .docx's word/document.xml (a Word
// table with one row per product: catalog # | name | CAS/MW/MF | structure
// image). Kept dependency-free: .docx is just a zip, so callers extract the
// XML themselves (e.g. via `unzip -p`) and pass the raw text in here.

const CATALOG_NUMBER_RE = /^[A-Z]\d{3,}$/;

export function parseRelsMap(relsXml) {
  const map = {};
  const re = /Id="(rId\d+)"[^>]*Type="[^"]*\/image"[^>]*Target="media\/([^"]+)"/g;
  let m;
  while ((m = re.exec(relsXml))) {
    map[m[1]] = m[2];
  }
  return map;
}

function extractCellTexts(rowXml) {
  const re = /<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs;
  const texts = [];
  let m;
  while ((m = re.exec(rowXml))) {
    texts.push(m[1]);
  }
  return texts;
}

function extractImageRid(rowXml) {
  const m = rowXml.match(/r:embed="(rId\d+)"/);
  return m ? m[1] : null;
}

function parseCasMwMf(text) {
  // CAS/MW require digit-shaped values, so an optional ":" can't
  // accidentally get captured as the value itself. MF values are free-form
  // formulas, so its first captured character is explicitly barred from
  // being the ":" or whitespace the optional separator would otherwise
  // backtrack into.
  const casMatch = text.match(/CAS\s*#?\s*:?\s*([\d][\d-]*\d)/i);
  const mwMatch = text.match(/MW\s*:?\s*([\d.]+)/i);
  const mfMatch = text.match(/MF\s*:?\s*([^\s:].*)?$/im);
  return {
    cas: casMatch ? casMatch[1].trim() : "",
    molecular_weight: mwMatch ? mwMatch[1].trim() : "",
    molecular_formula: mfMatch && mfMatch[1] ? mfMatch[1].trim() : "",
  };
}

// Returns one entry per product row found across every <w:tbl> in the
// document, in document order. Rows whose first cell isn't a catalog-number
// shape (e.g. header rows) are skipped.
export function parseProductRows(documentXml) {
  const tables = documentXml.match(/<w:tbl>.*?<\/w:tbl>/gs) || [];
  const rows = [];

  for (const table of tables) {
    const trs = table.match(/<w:tr .*?<\/w:tr>/gs) || [];
    for (const tr of trs) {
      const texts = extractCellTexts(tr);
      const catalog_number = (texts[0] || "").trim();
      if (!CATALOG_NUMBER_RE.test(catalog_number)) continue;

      const name = (texts[1] || "").trim();
      const rest = texts.slice(2).join("\n");
      const { cas, molecular_weight, molecular_formula } = parseCasMwMf(rest);
      const image_rid = extractImageRid(tr);

      rows.push({ catalog_number, name, cas, molecular_weight, molecular_formula, image_rid });
    }
  }

  return rows;
}

// Finds catalog numbers that appear more than once within the parsed batch
// itself (a source-document data-entry error, not a parser bug - e.g. the
// same catalog number reused for two different rows).
export function findDuplicateCatalogNumbers(rows) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row.catalog_number)) seen.set(row.catalog_number, []);
    seen.get(row.catalog_number).push(row);
  }
  return [...seen.values()].filter((group) => group.length > 1);
}

function normalizeForCompare(value) {
  return String(value || "").trim().toUpperCase();
}

function isIdenticalToExisting(row, existingProduct) {
  return (
    normalizeForCompare(row.name) === normalizeForCompare(existingProduct.name) &&
    normalizeForCompare(row.cas) === normalizeForCompare(existingProduct.cas) &&
    normalizeForCompare(row.molecular_weight) === normalizeForCompare(existingProduct.molecular_weight) &&
    normalizeForCompare(row.molecular_formula) === normalizeForCompare(existingProduct.molecular_formula)
  );
}

// Cross-checks parsed rows against existing product catalog numbers.
// A colliding catalog number splits further: if the row's data matches the
// existing product exactly, there's nothing to review - it's just an
// already-catalogued product that happened to be included in this batch
// doc. Only a colliding row whose data actually *differs* needs a human
// decision (renumber vs. intentional update).
export function partitionByCollision(rows, existingProducts) {
  const existingByCatalogNumber = new Map(existingProducts.map((p) => [p.catalog_number, p]));
  const identicalCollisions = [];
  const conflictingCollisions = [];
  const fresh = [];
  for (const row of rows) {
    const existing = existingByCatalogNumber.get(row.catalog_number);
    if (!existing) {
      fresh.push(row);
    } else if (isIdenticalToExisting(row, existing)) {
      identicalCollisions.push(row);
    } else {
      conflictingCollisions.push({ row, existing });
    }
  }
  return { identicalCollisions, conflictingCollisions, fresh };
}

// A row's name cell containing another field's label (e.g. "CAS#: MW:")
// means the table row itself is malformed in the source doc - not a real
// product name.
function hasSuspiciousName(row) {
  return /\b(CAS|MW|MF)\s*#?\s*:/i.test(row.name);
}

// Builds one flat "needs a human decision before merge" list out of every
// problem category, and returns the remaining rows that are safe to merge
// as-is (missing MW/MF is fine to merge blank - see PR doc Non-Goals - but
// a missing image, a suspicious name, an in-batch duplicate, or a
// conflicting collision all need a decision first).
export function buildReviewReport({ fresh, duplicates, conflictingCollisions }) {
  const needsReview = [];

  for (const group of duplicates) {
    needsReview.push({ reason: "duplicate_catalog_number_in_batch", catalog_number: group[0].catalog_number, rows: group });
  }
  for (const { row, existing } of conflictingCollisions) {
    needsReview.push({ reason: "conflicts_with_existing_product", catalog_number: row.catalog_number, row, existing });
  }

  const duplicateCatalogNumbers = new Set(duplicates.map((group) => group[0].catalog_number));
  const clean = [];
  for (const row of fresh) {
    if (duplicateCatalogNumbers.has(row.catalog_number)) continue; // already reported above
    if (!row.image_media_file) {
      needsReview.push({ reason: "missing_structure_image", catalog_number: row.catalog_number, row });
      continue;
    }
    if (hasSuspiciousName(row)) {
      needsReview.push({ reason: "suspicious_name_field", catalog_number: row.catalog_number, row });
      continue;
    }
    clean.push(row);
  }

  return { clean, needsReview };
}

// The source doc doesn't specify a category, and the /products page's
// category filter depends on one. Inferring it from the formula string
// isn't reliable: the source is typeset in all-caps, and a naive
// element-symbol match is ambiguous for common two-letter runs that are
// also valid element symbols (e.g. formic-acid-style "CO2H" greedily
// matches "Co" (cobalt) + "2H", silently turning a real carbon into a
// wrong metal). Given that ambiguity, this batch is categorized by name
// instead: every product defaults to "organic" (matching the existing
// catalogue's overwhelming lean - 857 of 974 entries - and true of nearly
// every product in this batch, which are small organic solvents/reagents),
// except an explicit, manually-verified list of genuinely inorganic salts.
const INORGANIC_CATALOG_NUMBERS = new Set([
  "B093", // BARIUM THIOSULFATE
  "S021", // SODIUM PHOSPHATE DIBASIC
]);

export function inferCategory(catalogNumber) {
  return INORGANIC_CATALOG_NUMBERS.has(catalogNumber) ? "inorganic" : "organic";
}
