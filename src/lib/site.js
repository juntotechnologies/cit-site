/** Builds the one typed site object from the three data files, and derives each fact that is not stored. */
import { DiscoverySchema, MetadataSchema, PagesSchema } from "./schemas.js";

/** The address on one line, in the form used on the pages. */
export function addressLine(address) {
  return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
}

/** The Google Maps embed address for the company address. */
export function mapEmbedUrl(address) {
  const query = addressLine(address).replace(/, USA$/, "").replaceAll(",", "");
  return `https://maps.google.com/maps?q=${encodeURIComponent(query).replace(/%20/g, "+")}&output=embed`;
}

/** The `tel:` link for a phone number. It keeps the digits and a leading plus. */
export function telHref(number) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

/** The catalogue size as a round figure, for example 1,066 products give "1,000+". */
export function roundedCount(total) {
  return `${(Math.floor(total / 100) * 100).toLocaleString("en-US")}+`;
}

/** Years in business as a round figure, for example 27 years give 25. It does not grow between builds in a way a visitor would notice. */
export function yearsInBusiness(company, currentYear) {
  return Math.floor((currentYear - Number(company.foundingYear)) / 5) * 5;
}

/** The values that page and discovery text may use as {name}, {since}, {city}, {state} and {count}. */
export function textValues(company, total) {
  return { name: company.name, since: company.foundingYear, city: company.address.city, state: company.address.state, count: roundedCount(total) };
}

function valueOrKey(values, match, key) {
  return values[key] ?? match;
}

/** Fills each {key} in a text with its value. A key with no value stays, so a typo is easy to see. A name that ends in a period and a period after it make one period. */
export function fillText(text, values) {
  return text.replace(/\{(\w+)\}/g, valueOrKey.bind(null, values)).replace(/(?<!\.)\.\.(?!\.)/g, ".");
}

/** Parses the data files once, at the edge, into the typed site object. */
export function loadSite(raw) {
  const metadata = MetadataSchema.parse(raw.metadata);
  const pages = PagesSchema.parse(raw.pages);
  return { company: metadata.company, analytics: metadata.analytics, team: metadata.team, pages: pages.pages, categories: pages.categories, discovery: DiscoverySchema.parse(raw.discovery) };
}
