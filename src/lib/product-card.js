/** One product card as HTML. The server pages and the catalogue search both call it, so the two draw the same card. */
import { formulaToHtml } from "./formula.js";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeChar(char) {
  return ESCAPES[char];
}

/** The text with the five HTML characters escaped, safe inside an element or a quoted attribute. */
export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, escapeChar);
}

function imageHtml(product) {
  if (!product.image_file) return '<span class="no-img">No structure image</span>';
  return `<img src="/images/${escapeHtml(product.image_file)}" alt="Structure of ${escapeHtml(product.name)}" width="100" height="100" loading="lazy" decoding="async" />`;
}

function badgeHtml(product, showCategory) {
  return showCategory && product.category ? `<span class="product-cat-badge">${escapeHtml(product.category.replace("-", " "))}</span>` : "";
}

function metaHtml(label, value) {
  return value ? `<p class="product-meta">${label} ${escapeHtml(value)}</p>` : "";
}

function formulaHtml(product) {
  return product.molecular_formula ? `<p class="product-formula">${formulaToHtml(escapeHtml(product.molecular_formula))}</p>` : "";
}

/** The card for one product. `label` is the catalogue number label, for example "CIT #:". */
export function productCardHtml({ product, path, label, showCategory = false }) {
  const body = [
    badgeHtml(product, showCategory),
    `<h3><a href="${escapeHtml(path)}">${escapeHtml(product.name || "Unknown")}</a></h3>`,
    metaHtml(label, product.catalog_number),
    metaHtml("CAS", product.cas),
    formulaHtml(product),
  ].join("");
  return `<div class="product-card"><div class="product-image">${imageHtml(product)}</div><div class="product-body">${body}</div></div>`;
}
