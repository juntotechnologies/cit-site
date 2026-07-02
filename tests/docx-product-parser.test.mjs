import assert from "node:assert/strict";
import test from "node:test";
import { findDuplicateCatalogNumbers, parseProductRows, parseRelsMap, partitionByCollision } from "../src/lib/docx-product-parser.js";

function tableRow({ catalogNumber, name, casText, mwText, mfText, rid }) {
  const drawing = rid ? `<w:drawing><a:blip r:embed="${rid}"/></w:drawing>` : "";
  return `<w:tr w:rsidR="1"><w:tc><w:p><w:r><w:t>${catalogNumber}</w:t></w:r></w:p></w:tc>` +
    `<w:tc><w:p><w:r><w:t>${name}</w:t></w:r></w:p></w:tc>` +
    `<w:tc><w:p><w:r><w:t>${casText}</w:t></w:r></w:p>` +
    `<w:p><w:r><w:t>${mwText}</w:t></w:r></w:p>` +
    `<w:p><w:r><w:t>${mfText}</w:t></w:r>${drawing}</w:p></w:tc></w:tr>`;
}

function wrapTable(...rows) {
  return `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Catalog #</w:t></w:r></w:p></w:tc></w:tr>${rows.join("")}</w:tbl>`;
}

test("parseProductRows parses a well-formed row", () => {
  const xml = wrapTable(
    tableRow({
      catalogNumber: "A109",
      name: "O-ARSANILIC ACID",
      casText: "CAS#: 2045-00-3",
      mwText: " MW: 217.05",
      mfText: "MF: H2NC6H4ASO3H2",
      rid: "rId4",
    }),
  );
  const rows = parseProductRows(xml);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    catalog_number: "A109",
    name: "O-ARSANILIC ACID",
    cas: "2045-00-3",
    molecular_weight: "217.05",
    molecular_formula: "H2NC6H4ASO3H2",
    image_rid: "rId4",
  });
});

test("parseProductRows handles inconsistent CAS label spacing", () => {
  const xml = wrapTable(
    tableRow({
      catalogNumber: "A112",
      name: "4-AMINOBENZAMIDINE DIHYDROCHLORIDE",
      casText: "CAS # 2498-50-2",
      mwText: "MW: 208.09",
      mfText: "MF: H2NC6H4C(=NH)NH2",
    }),
  );
  const rows = parseProductRows(xml);
  assert.equal(rows[0].cas, "2498-50-2");
});

test("parseProductRows leaves blank MW/MF empty rather than throwing", () => {
  const xml = wrapTable(
    tableRow({ catalogNumber: "B096", name: "BENZOPHENONE", casText: "CAS#: 119-61-9", mwText: "MW: ", mfText: "MF:" }),
  );
  const rows = parseProductRows(xml);
  assert.equal(rows[0].cas, "119-61-9");
  assert.equal(rows[0].molecular_weight, "");
  assert.equal(rows[0].molecular_formula, "");
});

test("parseProductRows skips rows whose first cell isn't a catalog number", () => {
  const xml = wrapTable();
  assert.equal(parseProductRows(xml).length, 0);
});

test("parseRelsMap resolves rId to media filename", () => {
  const rels = `<Relationships><Relationship Id="rId4" Type=".../image" Target="media/image1.png"/></Relationships>`;
  assert.deepEqual(parseRelsMap(rels), { rId4: "image1.png" });
});

test("findDuplicateCatalogNumbers flags a catalog number reused within the same batch", () => {
  const rows = [
    { catalog_number: "C147", molecular_formula: "CASIO" },
    { catalog_number: "C147", molecular_formula: "CAH3SI" },
    { catalog_number: "Z001", molecular_formula: "X" },
  ];
  const dupes = findDuplicateCatalogNumbers(rows);
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].length, 2);
  assert.equal(dupes[0][0].catalog_number, "C147");
});

test("partitionByCollision separates existing catalog numbers from new ones", () => {
  const rows = [
    { catalog_number: "B091", name: "BROMETHALIN" },
    { catalog_number: "Z999", name: "NEW COMPOUND" },
  ];
  const existing = [{ catalog_number: "B091" }];
  const { collisions, fresh } = partitionByCollision(rows, existing);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].catalog_number, "B091");
  assert.equal(fresh.length, 1);
  assert.equal(fresh[0].catalog_number, "Z999");
});
