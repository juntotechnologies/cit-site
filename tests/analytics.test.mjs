/** Tests for the Google Analytics loader: it adds one script and one command queue, once, and only when called. It also clears the Google cookies. */
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

function setup() {
  const window = new Window({ url: "https://www.example.test/", settings: { disableJavaScriptFileLoading: true, disableJavaScriptEvaluation: true } });
  globalThis.window = window;
  globalThis.document = window.document;
  return window;
}

function commandNames(window) {
  return window.dataLayer.map((command) => Array.from(command)[0]);
}

test("nothing loads until loadAnalytics is called", () => {
  const window = setup();
  assert.equal(window.document.querySelector("script"), null);
  assert.equal(window.dataLayer, undefined);
});

test("loadAnalytics adds the Google tag script for the measurement id", async () => {
  const window = setup();
  const { loadAnalytics } = await import("../src/lib/analytics.js");
  loadAnalytics("G-TEST123");
  const script = window.document.querySelector("script");
  assert.equal(script.src, "https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  assert.equal(script.async, true);
});

test("a call after the script element was removed does not load the tag again", async () => {
  const window = setup();
  const { loadAnalytics } = await import("../src/lib/analytics.js");
  loadAnalytics("G-TEST123");
  window.document.querySelector("script").remove();
  loadAnalytics("G-TEST123");
  assert.equal(window.document.querySelectorAll("script").length, 0);
  assert.deepEqual(commandNames(window), ["js", "config"]);
});

test("loadAnalytics queues the js and config commands", async () => {
  const window = setup();
  const { loadAnalytics } = await import("../src/lib/analytics.js");
  loadAnalytics("G-TEST123");
  assert.deepEqual(commandNames(window), ["js", "config"]);
  assert.equal(Array.from(window.dataLayer[1])[1], "G-TEST123");
});

test("a second call does not add a second script or repeat the commands", async () => {
  const window = setup();
  const { loadAnalytics } = await import("../src/lib/analytics.js");
  loadAnalytics("G-TEST123");
  loadAnalytics("G-TEST123");
  assert.equal(window.document.querySelectorAll("script").length, 1);
  assert.deepEqual(commandNames(window), ["js", "config"]);
});

test("isAnalyticsLoaded is false until the tag is loaded", async () => {
  setup();
  const { isAnalyticsLoaded, loadAnalytics } = await import("../src/lib/analytics.js");
  assert.equal(isAnalyticsLoaded(), false);
  loadAnalytics("G-TEST123");
  assert.equal(isAnalyticsLoaded(), true);
});

test("analyticsCookieNames picks the Google cookies and nothing else", async () => {
  const { analyticsCookieNames } = await import("../src/lib/analytics.js");
  assert.deepEqual(analyticsCookieNames("a=1; _ga=GA1.1.2; _ga_TEND1BVVWX=x; _gat=1; theme=dark"), ["_ga", "_ga_TEND1BVVWX"]);
  assert.deepEqual(analyticsCookieNames(""), []);
});

test("cookieDomains lists the host and each parent domain, so a cookie set on any of them is reached", async () => {
  const { cookieDomains } = await import("../src/lib/analytics.js");
  assert.deepEqual(cookieDomains("citmini.taila4fc43.ts.net"), ["citmini.taila4fc43.ts.net", ".citmini.taila4fc43.ts.net", ".taila4fc43.ts.net", ".ts.net"]);
  assert.deepEqual(cookieDomains("localhost"), []);
});

test("clearAnalyticsCookies removes the Google cookies and keeps the others", async () => {
  const window = setup();
  const { clearAnalyticsCookies } = await import("../src/lib/analytics.js");
  window.document.cookie = "_ga=GA1.1.2; path=/";
  window.document.cookie = "_ga_TEST123=x; path=/";
  window.document.cookie = "theme=dark; path=/";
  clearAnalyticsCookies();
  assert.equal(window.document.cookie, "theme=dark");
});
