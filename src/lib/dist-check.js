/** Pure steps of the build check: read the tags of a built page and the addresses of a sitemap. */

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

function tagValue(html, pattern) {
  return pattern.exec(html)?.[1];
}

export function canonicalOf(html) {
  return tagValue(html, /<link rel="canonical" href="([^"]*)"/);
}

export function titleOf(html) {
  return tagValue(html, /<title>([^<]*)<\/title>/);
}

export function descriptionOf(html) {
  return tagValue(html, /<meta name="description" content="([^"]*)"/);
}

export function ogImageOf(html) {
  return tagValue(html, /<meta property="og:image" content="([^"]*)"/);
}

export function isNoindex(html) {
  return /<meta name="robots" content="noindex"/.test(html);
}

export function headingCount(html) {
  return (html.match(/<h1[\s>]/g) ?? []).length;
}

/** The JSON-LD records of a page, parsed. A script that is not valid JSON throws, which fails the check. */
export function jsonLdOf(html) {
  const bodies = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(parseBody);
  return bodies.flatMap(recordsOf);
}

function parseBody(match) {
  return JSON.parse(match[1].replace(/\\u003c/g, "<"));
}

function recordsOf(body) {
  return body["@graph"] ?? [body];
}

/** The addresses in a sitemap file. */
export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(locOf);
}

function locOf(match) {
  return match[1];
}

/** True when a text holds something that looks like an email address. */
export function holdsEmail(text) {
  return EMAIL.test(text);
}

/** The path of a built page file, for example about/index.html gives /about/. */
export function pathOfFile(relative) {
  return `/${relative.replace(/index\.html$/, "")}`;
}

/** True when a page loads the Google tag from a script tag. Analytics must load only after consent, from the script that the notice runs. */
export function hasStaticAnalyticsTag(html) {
  return /<script[^>]*\ssrc="https:\/\/www\.googletagmanager\.com\//.test(html);
}
