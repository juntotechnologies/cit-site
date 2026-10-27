/** Check (no browser): the built site in dist/ has its discovery files, one canonical address and one h1 per page, no Google Analytics tag before consent, a sitemap that matches the pages, and no email address in a generated file. Run `npm run build` first. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalOf, descriptionOf, hasStaticAnalyticsTag, headingCount, holdsEmail, isNoindex, jsonLdOf, ogImageOf, pathOfFile, sitemapUrls, titleOf } from "../src/lib/dist-check.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const siteUrl = JSON.parse(readFileSync(join(root, "data", "metadata.json"), "utf8")).company.siteUrl;
const REQUIRED = ["robots.txt", "llms.txt", "llms-full.txt", "agents.txt", ".well-known/agents.json", "sitemap-index.xml", "sitemap-0.xml", "404.html"];
const GENERATED = ["robots.txt", "llms.txt", "llms-full.txt", "agents.txt", ".well-known/agents.json"];

function readDist(name) {
  return readFileSync(join(dist, name), "utf8");
}

function entryFiles(folder, name) {
  const full = join(folder, name);
  if (statSync(full).isDirectory()) return pageFiles(full);
  return name === "index.html" ? [relative(dist, full)] : [];
}

function pageFiles(folder) {
  return readdirSync(folder).flatMap(entryFiles.bind(null, folder));
}

function notAsset(file) {
  return !file.startsWith("assets");
}

function builtFiles() {
  return [...pageFiles(dist).filter(notAsset), "404.html"];
}

function isMissing(name) {
  return !existsSync(join(dist, name));
}

function missingMessage(name) {
  return `missing file: ${name}`;
}

function missingFiles() {
  return REQUIRED.filter(isMissing).map(missingMessage);
}

function tagFaults(path, html) {
  const faults = [];
  if (!titleOf(html)) faults.push(`${path}: no title`);
  if ((descriptionOf(html) ?? "").length < 20) faults.push(`${path}: no description`);
  if (headingCount(html) !== 1) faults.push(`${path}: ${headingCount(html)} h1 elements; need 1`);
  return faults;
}

function canonicalFaults(path, html) {
  if (isNoindex(html)) return [];
  return canonicalOf(html) === siteUrl + path ? [] : [`${path}: canonical is ${canonicalOf(html)}; need ${siteUrl + path}`];
}

function imageFaults(path, html) {
  const image = ogImageOf(html) ?? "";
  const local = image.replace(siteUrl, "");
  return image.startsWith(siteUrl) && existsSync(join(dist, local)) ? [] : [`${path}: og:image ${image} is not a file of this site`];
}

function jsonLdFaults(path, html) {
  try {
    return holdsEmail(JSON.stringify(jsonLdOf(html))) ? [`${path}: JSON-LD holds an email address`] : [];
  } catch (error) {
    return [`${path}: JSON-LD is not valid: ${error.message}`];
  }
}

function analyticsFaults(path, html) {
  return hasStaticAnalyticsTag(html) ? [`${path}: loads Google Analytics before consent`] : [];
}

function pageFaults(file) {
  const path = pathOfFile(file);
  const html = readDist(file);
  return [...tagFaults(path, html), ...canonicalFaults(path, html), ...imageFaults(path, html), ...jsonLdFaults(path, html), ...analyticsFaults(path, html)];
}

function isIndexable(file) {
  return !isNoindex(readDist(file));
}

function urlOfFile(file) {
  return siteUrl + pathOfFile(file);
}

function lacks(listed, url) {
  return !listed.has(url);
}

function absentMessage(url) {
  return `sitemap lacks ${url}`;
}

function extraMessage(url) {
  return `sitemap lists ${url}, which is not an indexable page`;
}

function sitemapFaults(files) {
  const listed = new Set(sitemapUrls(readDist("sitemap-0.xml")));
  const wanted = new Set(files.filter(isIndexable).map(urlOfFile));
  return [...[...wanted].filter(lacks.bind(null, listed)).map(absentMessage), ...[...listed].filter(lacks.bind(null, wanted)).map(extraMessage)];
}

function holdsEmailFile(name) {
  return holdsEmail(readDist(name));
}

function emailMessage(name) {
  return `${name} holds an email address`;
}

function emailFaults() {
  return GENERATED.filter(holdsEmailFile).map(emailMessage);
}

function linkTarget(url) {
  const path = url.replace(siteUrl, "").split("?")[0];
  return path.endsWith("/") ? join(dist, path, "index.html") : join(dist, path);
}

function isBrokenLink(url) {
  return url.startsWith(siteUrl) && !existsSync(linkTarget(url));
}

function linkOf(match) {
  return match[1];
}

function brokenMessage(url) {
  return `llms.txt links ${url}, which is not built`;
}

function llmsLinkFaults() {
  const links = [...readDist("llms.txt").matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(linkOf);
  return links.filter(isBrokenLink).map(brokenMessage);
}

function allFaults(files) {
  return [...files.flatMap(pageFaults), ...sitemapFaults(files), ...emailFaults(), ...llmsLinkFaults()];
}

function main() {
  const missing = missingFiles();
  const files = missing.length ? [] : builtFiles();
  const faults = missing.length ? missing : allFaults(files);
  console.log(faults.length ? faults.slice(0, 40).join("\n") : `dist ok: ${files.length} pages, ${GENERATED.length} generated files`);
  process.exit(faults.length ? 1 : 0);
}

main();
