/** Builds page metadata and structured data from the site object. Pure functions, so the pages and the tests agree. */
import { fillText, textValues } from "./site.js";

const SCHEMA_CONTEXT = "https://schema.org";
const HOME = { name: "Home", path: "/" };

/** The full address of a path on this site. */
export function absoluteUrl(company, path) {
  return new URL(path, company.siteUrl).href;
}

/** The title shown on the tab and in search results. */
export function pageTitle(company, title) {
  return `${title} | ${company.name}`;
}

/** The page as the Layout needs it: the stored title and description, text filled, plus the canonical address and social image. */
export function pageMeta(site, total, input) {
  const { company } = site;
  return {
    title: pageTitle(company, input.title),
    description: fillText(input.description, textValues(company, total)),
    canonical: absoluteUrl(company, input.path),
    ogImage: absoluteUrl(company, input.ogImage ?? company.defaultOgImage),
    ogType: input.ogType ?? "website",
    noindex: input.noindex ?? false,
  };
}

/** A request path with a trailing slash, so the dev server and the build name a page alike. */
export function normalizePath(pathname) {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function hasPath(path, page) {
  return page.path === path;
}

/** The stored page for a path, or undefined when the path is not a listed page. */
export function findPage(site, path) {
  return site.pages.find(hasPath.bind(null, path));
}

function postalAddress(address) {
  return { "@type": "PostalAddress", streetAddress: address.street, addressLocality: address.city, addressRegion: address.state, postalCode: address.zip, addressCountry: address.countryCode };
}

/** The Organization record. It holds the phone and the contact page, and no email address. */
export function organizationSchema(site) {
  const { company } = site;
  return {
    "@type": "Organization",
    "@id": absoluteUrl(company, "/#organization"),
    name: company.name,
    url: absoluteUrl(company, "/"),
    logo: absoluteUrl(company, company.logo),
    foundingDate: company.foundingYear,
    description: `${company.tagline} since ${company.foundingYear}.`,
    address: postalAddress(company.address),
    faxNumber: company.fax,
    contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: company.phone, url: absoluteUrl(company, "/contact/") },
  };
}

/** The WebSite record, with the catalogue search as its search action. */
export function websiteSchema(site) {
  const { company } = site;
  const target = `${absoluteUrl(company, "/products/")}?q={search_term_string}`;
  return {
    "@type": "WebSite",
    "@id": absoluteUrl(company, "/#website"),
    url: absoluteUrl(company, "/"),
    name: company.name,
    publisher: { "@id": absoluteUrl(company, "/#organization") },
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: target }, "query-input": "required name=search_term_string" },
  };
}

function listItem(company, crumb, index) {
  return { "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(company, crumb.path) };
}

/** The BreadcrumbList for a trail of { name, path } steps. */
export function breadcrumbSchema(site, trail) {
  return { "@type": "BreadcrumbList", itemListElement: trail.map(listItem.bind(null, site.company)) };
}

/** The trail for a page one level below Home, or for a page below a section. */
export function trailFor(page, section) {
  return section ? [HOME, section, page] : [HOME, page];
}

function property(name, value) {
  return value ? [{ "@type": "PropertyValue", name, value }] : [];
}

function endSentence(text) {
  return text.endsWith(".") ? text : `${text}.`;
}

/** The sentence facts of a product, for the description. Only facts the company holds. */
function productFacts(product) {
  const weight = product.molecular_weight ? `molecular weight ${product.molecular_weight} g/mol` : "";
  return [product.cas && `CAS ${product.cas}`, product.molecular_formula && `formula ${product.molecular_formula}`, weight].filter(Boolean);
}

/** The meta description of a product page, built from the facts that exist. */
export function productDescription(company, product) {
  const facts = productFacts(product);
  const detail = facts.length ? ` ${facts.join(", ")}.` : "";
  return `${product.name}.${detail} Chemical catalogue product. Request a quotation from ${endSentence(company.name)}`;
}

/** The page title of a product: its name and, when known, its CAS number. */
export function productHeading(product) {
  return product.cas ? `${product.name} (CAS ${product.cas})` : product.name;
}

function productProperties(product) {
  const weight = product.molecular_weight && `${product.molecular_weight} g/mol`;
  return [...property("CAS Number", product.cas), ...property("Molecular Formula", product.molecular_formula), ...property("Molecular Weight", weight), ...property("Purity", product.purity)];
}

function productImage(company, product) {
  return absoluteUrl(company, product.image_file ? `/images/${product.image_file}` : company.defaultOgImage);
}

/** The Product record. It states no price and no offer, because the site shows none. */
export function productSchema(site, product, path) {
  const { company } = site;
  return {
    "@type": "Product",
    name: product.name,
    url: absoluteUrl(company, path),
    description: product.description || productDescription(company, product),
    image: productImage(company, product),
    brand: { "@type": "Brand", name: company.name },
    ...(product.catalog_number && { sku: product.catalog_number }),
    additionalProperty: productProperties(product),
  };
}

/** One script body for a list of records. It escapes "<", so no text can close the script tag. */
export function jsonLd(records) {
  return JSON.stringify({ "@context": SCHEMA_CONTEXT, "@graph": records }).replace(/</g, "\\u003c");
}

/** The records every page of a kind carries: Home has the company and the site, the rest a breadcrumb. */
export function pageRecords(site, page) {
  if (page.path === "/") return [organizationSchema(site), websiteSchema(site)];
  return [breadcrumbSchema(site, trailFor({ name: page.title, path: page.path }))];
}
