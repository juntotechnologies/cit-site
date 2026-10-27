/** Builds the address of a product page from its CAS number or catalogue number, and the old address it replaces. */
const CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;

function catalogSlug(product) {
  return (
    product.catalog_number?.toLowerCase() ??
    product.name
      ?.toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") ??
    "unknown"
  );
}

function weighted(total, digit, index) {
  return total + Number(digit) * (index + 1);
}

function checksumIsValid(cas) {
  const digits = cas.replace(/-/g, "");
  const checkDigit = Number(digits.at(-1));
  const body = digits.slice(0, -1).split("").reverse();
  return body.reduce(weighted, 0) % 10 === checkDigit;
}

export function normalizeCas(cas) {
  if (!cas) return undefined;

  const value = cas.trim().replace(/\./g, "-");
  if (!CAS_PATTERN.test(value)) return undefined;
  if (!checksumIsValid(value)) return undefined;

  return value;
}

function hasCas(cas, candidate) {
  return normalizeCas(candidate.cas) === cas;
}

export function getProductSlug(product, products) {
  const cas = normalizeCas(product.cas);
  if (!cas) return catalogSlug(product);

  const casMatches = products.filter(hasCas.bind(null, cas));
  return casMatches.length === 1 ? cas : catalogSlug(product);
}

export function getProductPath(product, products) {
  return `/products/${getProductSlug(product, products)}/`;
}

export function getLegacyProductPath(product) {
  if (!product.url) return undefined;

  try {
    const { pathname } = new URL(product.url);
    return pathname.endsWith("/") ? pathname : `${pathname}/`;
  } catch {
    return undefined;
  }
}
