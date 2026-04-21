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

function checksumIsValid(cas) {
  const digits = cas.replace(/-/g, "");
  const checkDigit = Number(digits.at(-1));
  const body = digits.slice(0, -1).split("").reverse();
  const sum = body.reduce((total, digit, index) => total + Number(digit) * (index + 1), 0);
  return sum % 10 === checkDigit;
}

export function normalizeCas(cas) {
  if (!cas) return undefined;

  const value = cas.trim().replace(/\./g, "-");
  if (!CAS_PATTERN.test(value)) return undefined;
  if (!checksumIsValid(value)) return undefined;

  return value;
}

export function getProductSlug(product, products) {
  const cas = normalizeCas(product.cas);
  if (!cas) return catalogSlug(product);

  const casMatches = products.filter((candidate) => normalizeCas(candidate.cas) === cas);
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
