/** Tests for the analytics notice: it shows until the visitor chooses, loads analytics only after an accept, and can be reopened. */
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const MARKUP = '<div id="consent" tabindex="-1" data-ga-id="G-TEST123" hidden><button data-consent="denied">No</button><button data-consent="granted">Yes</button></div><button data-consent-open>Privacy choices</button>';

function setup(stored) {
  const window = new Window({ url: "https://example.test/", settings: { disableJavaScriptFileLoading: true, disableJavaScriptEvaluation: true } });
  window.document.body.innerHTML = MARKUP;
  if (stored) window.localStorage.setItem("cit-analytics-consent", stored);
  globalThis.window = window;
  globalThis.document = window.document;
  return window;
}

async function banner(stored) {
  const window = setup(stored);
  const { bind } = await import("../src/lib/consent-banner.js");
  bind();
  return { window, document: window.document, notice: window.document.getElementById("consent") };
}

function analyticsScripts(document) {
  return document.querySelectorAll("script");
}

function press(document, selector) {
  document.querySelector(selector).click();
}

test("a new visitor sees the notice and analytics does not load", async () => {
  const { document, notice } = await banner();
  assert.equal(notice.hidden, false);
  assert.equal(analyticsScripts(document).length, 0);
});

test("Accept stores the choice, hides the notice and loads analytics", async () => {
  const { window, document, notice } = await banner();
  press(document, '[data-consent="granted"]');
  assert.equal(window.localStorage.getItem("cit-analytics-consent"), "granted");
  assert.equal(notice.hidden, true);
  assert.match(analyticsScripts(document)[0].src, /gtag\/js\?id=G-TEST123$/);
});

test("Decline stores the choice, hides the notice and never loads analytics", async () => {
  const { window, document, notice } = await banner();
  press(document, '[data-consent="denied"]');
  assert.equal(window.localStorage.getItem("cit-analytics-consent"), "denied");
  assert.equal(notice.hidden, true);
  assert.equal(analyticsScripts(document).length, 0);
});

test("a visitor who accepted before gets analytics and no notice", async () => {
  const { document, notice } = await banner("granted");
  assert.equal(notice.hidden, true);
  assert.equal(analyticsScripts(document).length, 1);
});

test("a visitor who declined before gets no analytics and no notice", async () => {
  const { document, notice } = await banner("denied");
  assert.equal(notice.hidden, true);
  assert.equal(analyticsScripts(document).length, 0);
});

test("the footer button reopens the notice and moves focus to it", async () => {
  const { document, notice } = await banner("denied");
  press(document, "[data-consent-open]");
  assert.equal(notice.hidden, false);
  assert.equal(document.activeElement, notice);
});

test("a visitor who declined can accept later", async () => {
  const { window, document } = await banner("denied");
  press(document, "[data-consent-open]");
  press(document, '[data-consent="granted"]');
  assert.equal(window.localStorage.getItem("cit-analytics-consent"), "granted");
  assert.equal(analyticsScripts(document).length, 1);
});

test("a page with no notice does nothing", async () => {
  const window = setup();
  window.document.body.innerHTML = "";
  const { bind } = await import("../src/lib/consent-banner.js");
  assert.doesNotThrow(() => bind());
});

function trackReloads(window) {
  const reloads = [];
  window.location.reload = () => reloads.push("reload");
  return reloads;
}

test("Decline after Accept clears the Google cookies and reloads, so the loaded tag is gone", async () => {
  const { window, document } = await banner();
  const reloads = trackReloads(window);
  press(document, '[data-consent="granted"]');
  window.document.cookie = "_ga=GA1.1.2; path=/";
  press(document, "[data-consent-open]");
  press(document, '[data-consent="denied"]');
  assert.equal(window.document.cookie, "");
  assert.equal(reloads.length, 1);
  assert.equal(window.localStorage.getItem("cit-analytics-consent"), "denied");
});

test("Decline when analytics never loaded does not reload the page", async () => {
  const { window, document } = await banner();
  const reloads = trackReloads(window);
  press(document, '[data-consent="denied"]');
  assert.equal(reloads.length, 0);
});

test("a visitor with no consent keeps no Google cookies from an earlier visit", async () => {
  const window = setup();
  window.document.cookie = "_ga=GA1.1.2; path=/";
  window.document.cookie = "theme=dark; path=/";
  const { bind } = await import("../src/lib/consent-banner.js");
  bind();
  assert.equal(window.document.cookie, "theme=dark");
});

test("a visitor who accepted keeps the Google cookies", async () => {
  const window = setup("granted");
  window.document.cookie = "_ga=GA1.1.2; path=/";
  const { bind } = await import("../src/lib/consent-banner.js");
  bind();
  assert.equal(window.document.cookie, "_ga=GA1.1.2");
});
