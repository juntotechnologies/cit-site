/** Builds the text of robots.txt, llms.txt, llms-full.txt, agents.txt and agents.json from the site object. */
import { addressLine, fillText, textValues } from "./site.js";
import { absoluteUrl } from "./seo.js";

export const SITEMAP_PATH = "/sitemap-index.xml";
export const LLMS_PATH = "/llms.txt";
export const LLMS_FULL_PATH = "/llms-full.txt";

function values(site, total) {
  return textValues(site.company, total);
}

function summaryOf(site, total) {
  return fillText(site.discovery.summary, values(site, total));
}

/** robots.txt: every crawler may read every page. It names the sitemap. */
export function robotsTxt(site) {
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${absoluteUrl(site.company, SITEMAP_PATH)}`, ""].join("\n");
}

function linkLine(company, label, path, note) {
  return `- [${label}](${absoluteUrl(company, path)})${note ? `: ${note}` : ""}`;
}

function pageLine(site, total, page) {
  return linkLine(site.company, page.title, page.path, fillText(page.description, values(site, total)));
}

function categoryLine(company, category) {
  return linkLine(company, category.label, `/products/?cat=${category.value}`);
}

const CONTACT_LABELS = { "/contact/": "Contact page", "/rfq/": "Request for quotation" };

function contactPageLine(company, path) {
  return linkLine(company, CONTACT_LABELS[path] ?? path, path);
}

function contactLines(site) {
  const { company, discovery } = site;
  const pages = discovery.contactPaths.map(contactPageLine.bind(null, company));
  return [...pages, linkLine(company, "Book a call", company.bookingUrl), `- Phone: ${company.phone}`, `- Address: ${addressLine(company.address)}`];
}

/** llms.txt: a short Markdown summary for language models. It holds no email address. */
export function llmsTxt(site, total) {
  const { company, discovery } = site;
  const head = [`# ${company.name}`, "", `> ${company.tagline} since ${company.foundingYear}.`, "", summaryOf(site, total), "", discovery.llmsNote, ""];
  const pages = ["## Pages", "", ...site.pages.map(pageLine.bind(null, site, total)), ""];
  const catalogue = ["## Catalogue", "", ...site.categories.map(categoryLine.bind(null, company)), linkLine(company, "Full catalogue list", LLMS_FULL_PATH, "every product with its catalogue number and CAS number"), ""];
  return [...head, ...pages, ...catalogue, "## Contact", "", ...contactLines(site), ""].join("\n");
}

function isFact(fact) {
  return Boolean(fact);
}

function productLine(company, entry) {
  const { product } = entry;
  const facts = [product.catalog_number && `CIT # ${product.catalog_number}`, product.cas && `CAS ${product.cas}`, product.molecular_formula].filter(isFact);
  return linkLine(company, product.name, entry.path, facts.join(", "));
}

/** llms-full.txt: every product, one line each. `entries` is a list of { product, path }. */
export function llmsFullTxt(site, entries) {
  const head = [`# ${site.company.name}: catalogue`, "", `> ${entries.length.toLocaleString("en-US")} products. Each line gives the name, the catalogue number, the CAS number and the formula.`, ""];
  return [...head, ...entries.map(productLine.bind(null, site.company)), ""].join("\n");
}

function ruleLine(prefix, rule) {
  return `${prefix}: ${rule}`;
}

function ruleLines(prefix, rules) {
  return rules.map(ruleLine.bind(null, prefix));
}

/** agents.txt: what an agent may and may not do here. */
export function agentsTxt(site, total) {
  const { company, discovery } = site;
  const contact = absoluteUrl(company, discovery.contactPaths[0]);
  const lines = [`Name: ${company.name}`, `Site: ${absoluteUrl(company, "/")}`, `Summary: ${summaryOf(site, total)}`];
  const rules = [...ruleLines("Allow", discovery.mayDo), ...ruleLines("Disallow", discovery.mayNotDo)];
  const links = [`Contact: ${contact}`, `Sitemap: ${absoluteUrl(company, SITEMAP_PATH)}`, `LLMs: ${absoluteUrl(company, LLMS_PATH)}`];
  return [...lines, ...rules, ...links, ""].join("\n");
}

/** The same rules as an object, for .well-known/agents.json. */
export function agentsJson(site, total) {
  const { company, discovery } = site;
  return {
    name: company.name,
    url: absoluteUrl(company, "/"),
    summary: summaryOf(site, total),
    mayDo: discovery.mayDo,
    mayNotDo: discovery.mayNotDo,
    contact: absoluteUrl(company, discovery.contactPaths[0]),
    sitemap: absoluteUrl(company, SITEMAP_PATH),
    llms: absoluteUrl(company, LLMS_PATH),
  };
}
