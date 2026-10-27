/** The catalogue as the pages and the discovery files see it: each product with its page path. */
import { getProductPath } from "./product-url.js";

function entryOf(products, product) {
  return { product, path: getProductPath(product, products) };
}

/** Each product with its page path, as [{ product, path }]. */
export function productEntries(products) {
  return products.map(entryOf.bind(null, products));
}
