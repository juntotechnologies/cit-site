/** Loads Google Analytics and clears its cookies. No page calls the loader before the visitor accepts. */
const GTAG_URL = "https://www.googletagmanager.com/gtag/js";
const ANALYTICS_COOKIE = /^_ga(_|$)/;
const EXPIRED = "Thu, 01 Jan 1970 00:00:00 GMT";

/** Google's tag reads the arguments object from the queue; an array would be ignored. */
function gtag() {
  window.dataLayer.push(arguments);
}

function addScript(measurementId) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `${GTAG_URL}?id=${measurementId}`;
  document.head.append(script);
}

export function isAnalyticsLoaded() {
  return Boolean(window.gtag);
}

/** Adds the tag once. A client-side page swap removes the script element, but the loaded tag keeps running, and a later call does nothing because `window.gtag` is set. */
export function loadAnalytics(measurementId) {
  if (isAnalyticsLoaded()) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId);
  addScript(measurementId);
}

function cookieName(pair) {
  return pair.split("=")[0].trim();
}

function isAnalyticsCookie(name) {
  return ANALYTICS_COOKIE.test(name);
}

/** The names of the Google cookies in a `document.cookie` text. */
export function analyticsCookieNames(cookieText) {
  return cookieText.split(";").map(cookieName).filter(isAnalyticsCookie);
}

function suffixFrom(labels, _label, start) {
  return `.${labels.slice(start).join(".")}`;
}

/** The host and each parent domain of it, for example a.b.c gives a.b.c, .a.b.c and .b.c. Google sets its cookies on one of them, and no fixed rule says which. */
export function cookieDomains(hostname) {
  const labels = hostname.split(".");
  if (labels.length < 2) return [];
  return [hostname, ...labels.slice(0, -1).map(suffixFrom.bind(null, labels))];
}

function domainAttribute(domain) {
  return domain ? `; domain=${domain}` : "";
}

function expireOn(name, domain) {
  document.cookie = `${name}=; expires=${EXPIRED}; path=/${domainAttribute(domain)}`;
}

function expireEverywhere(domains, name) {
  domains.forEach(expireOn.bind(null, name));
}

/** Removes each Google cookie. A cookie set without a domain, and one set on the host or on a parent domain, are all reached. */
export function clearAnalyticsCookies() {
  const domains = ["", ...cookieDomains(window.location.hostname)];
  analyticsCookieNames(document.cookie).forEach(expireEverywhere.bind(null, domains));
}
