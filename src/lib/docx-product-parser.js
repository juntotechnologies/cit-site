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

// Cross-checks parsed rows against existing product catalog numbers,
// separating out ones that collide (need a human decision - see PR doc)
// from genuinely new ones.
export function partitionByCollision(rows, existingProducts) {
  const existingCatalogNumbers = new Set(existingProducts.map((p) => p.catalog_number));
  const collisions = [];
  const fresh = [];
  for (const row of rows) {
    if (existingCatalogNumbers.has(row.catalog_number)) {
      collisions.push(row);
    } else {
      fresh.push(row);
    }
  }
  return { collisions, fresh };
}
