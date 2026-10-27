/** Tests for the phone menu: open, close on a link, close on Escape and return focus to the button. */
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

function setup() {
  const window = new Window({ url: "https://example.test/" });
  window.document.body.innerHTML = '<button id="hamburger" aria-expanded="false"></button><nav id="mobile-nav"><a href="/a/">A</a></nav>';
  globalThis.document = window.document;
  return window.document;
}

async function menu() {
  const document = setup();
  const { bind } = await import("../src/lib/mobile-menu.js");
  bind();
  return { document, button: document.getElementById("hamburger"), nav: document.getElementById("mobile-nav") };
}

test("the button opens the drawer and says so to a screen reader", async () => {
  const { button, nav } = await menu();
  button.click();
  assert.equal(nav.classList.contains("open"), true);
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(button.getAttribute("aria-label"), "Close menu");
});

test("a tap on a link closes the drawer", async () => {
  const { button, nav } = await menu();
  button.click();
  nav.querySelector("a").click();
  assert.equal(nav.classList.contains("open"), false);
  assert.equal(button.getAttribute("aria-expanded"), "false");
});

test("the Escape key closes the drawer and focuses the button", async () => {
  const { document, button, nav } = await menu();
  button.click();
  document.dispatchEvent(new document.defaultView.KeyboardEvent("keydown", { key: "Escape" }));
  assert.equal(nav.classList.contains("open"), false);
  assert.equal(document.activeElement, button);
});
