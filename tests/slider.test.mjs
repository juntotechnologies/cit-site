/** Tests for the slideshow: stepping, wrapping, loading the next picture, and the pause button. */
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { goTo, initSlider, wrapIndex } from "../src/lib/slider.js";

const HTML = `<div id="s"><div class="slide active"><img src="/a.jpg"></div><div class="slide"><img data-src="/b.jpg"></div><div class="slide"><img data-src="/c.jpg"></div>
<button data-slider-prev></button><button data-slider-next></button><button data-slider-pause aria-pressed="false" aria-label="Pause slideshow"></button>
<button class="slider-dot active"></button><button class="slider-dot"></button><button class="slider-dot"></button></div>`;

function setup(reduced = true) {
  const window = new Window({ url: "https://example.test/" });
  window.document.body.innerHTML = HTML;
  window.matchMedia = () => ({ matches: reduced });
  globalThis.document = window.document;
  globalThis.window = window;
  initSlider("s", 1000000);
  window.document.dispatchEvent(new window.Event("astro:page-load"));
  return window.document;
}

function activeIndex(document) {
  return [...document.querySelectorAll(".slide")].findIndex((slide) => slide.classList.contains("active"));
}

test("wrapIndex wraps at both ends", () => {
  assert.equal(wrapIndex(-1, 3), 2);
  assert.equal(wrapIndex(3, 3), 0);
});

test("next and previous step through the slides and wrap", () => {
  const document = setup();
  document.querySelector("[data-slider-next]").click();
  assert.equal(activeIndex(document), 1);
  document.querySelector("[data-slider-prev]").click();
  document.querySelector("[data-slider-prev]").click();
  assert.equal(activeIndex(document), 2);
});

test("a dot goes to its slide and the active dot follows", () => {
  const document = setup();
  document.querySelectorAll(".slider-dot")[2].click();
  assert.equal(activeIndex(document), 2);
  assert.equal(document.querySelectorAll(".slider-dot")[2].classList.contains("active"), true);
});

test("the picture after the current slide loads early", () => {
  const document = setup();
  assert.equal(document.querySelectorAll("img")[1].getAttribute("src"), "/b.jpg");
  assert.equal(document.querySelectorAll("img")[2].getAttribute("src"), null);
  goTo({ slides: [...document.querySelectorAll(".slide")], dots: [] }, 1);
  assert.equal(document.querySelectorAll("img")[2].getAttribute("src"), "/c.jpg");
});

test("the pause button stops the slideshow and says what it will do next", () => {
  const document = setup(false);
  const button = document.querySelector("[data-slider-pause]");
  button.click();
  assert.equal(button.getAttribute("aria-label"), "Play slideshow");
  assert.equal(button.getAttribute("aria-pressed"), "true");
});

test("a visitor who prefers less motion starts with the slideshow paused", () => {
  const document = setup();
  assert.equal(document.querySelector("[data-slider-pause]").getAttribute("aria-pressed"), "true");
});
