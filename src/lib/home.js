/** What the home page shows that is derived from data: the four facts and the featured products of each category. */
import { roundedCount, yearsInBusiness } from "./site.js";

/** Cards per category on the home page. The grid columns in global.css (.cat-section) must divide it evenly. */
export const FEATURED = 4;

/** The four facts of the intro, as { value, label }. Counts and years come from the data, so they stay true. */
export function introFacts(company, total, currentYear) {
  return [
    { value: roundedCount(total), label: "Catalogue products" },
    { value: `${yearsInBusiness(company, currentYear)}+`, label: "Years in business" },
    { value: "mg to kg", label: "Synthesis scale" },
    { value: "GC · HPLC · IR", label: "QC instruments" },
  ];
}

function hasProducts(section) {
  return section.products.length > 0;
}

function inCategory(category, product) {
  return product.category === category.value;
}

function sectionOf(products, category) {
  return { category, products: products.filter(inCategory.bind(null, category)).slice(0, FEATURED) };
}

function hasHomeLink(category) {
  return Boolean(category.homeLink);
}

/** The categories that have a "view all" link and at least one product, each with its first featured products. */
export function featuredSections(categories, products) {
  return categories.filter(hasHomeLink).map(sectionOf.bind(null, products)).filter(hasProducts);
}
