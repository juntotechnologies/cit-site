/** A fade slideshow. It shows one slide, loads the next picture early, and stays still when paused or when the visitor prefers less motion. */
import { onPageLoad } from "./page-lifecycle.js";

const timers = new WeakMap();

/** The slide index after a step, wrapped around the ends. */
export function wrapIndex(index, count) {
  return ((index % count) + count) % count;
}

function hydrate(slide) {
  const image = slide?.querySelector("img[data-src]");
  if (image && !image.src) image.src = image.dataset.src;
}

function isActive(slide) {
  return slide.classList.contains("active");
}

function setActive(show, index) {
  for (const [i, slide] of show.slides.entries()) slide.classList.toggle("active", i === index);
  for (const [i, dot] of show.dots.entries()) dot.classList.toggle("active", i === index);
}

/** Shows slide `index` and loads the picture after it. `show` is { root, interval, slides, dots }. */
export function goTo(show, index) {
  const target = wrapIndex(index, show.slides.length);
  hydrate(show.slides[target]);
  setActive(show, target);
  hydrate(show.slides[wrapIndex(target + 1, show.slides.length)]);
}

function advance(show, delta) {
  goTo(show, show.slides.findIndex(isActive) + delta);
}

function stop(show) {
  clearInterval(timers.get(show.root));
  timers.delete(show.root);
}

function start(show) {
  stop(show);
  timers.set(show.root, setInterval(advance.bind(null, show, 1), show.interval));
}

function togglePause(show, button) {
  const paused = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(paused));
  button.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
  if (paused) stop(show);
  else start(show);
}

function bindDots(show) {
  for (const [index, dot] of show.dots.entries()) dot.addEventListener("click", goTo.bind(null, show, index));
}

function bindControls(show) {
  show.root.querySelector("[data-slider-prev]")?.addEventListener("click", advance.bind(null, show, -1));
  show.root.querySelector("[data-slider-next]")?.addEventListener("click", advance.bind(null, show, 1));
  const pause = show.root.querySelector("[data-slider-pause]");
  pause?.addEventListener("click", togglePause.bind(null, show, pause));
  bindDots(show);
}

function prefersLessMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function begin(show) {
  if (!prefersLessMotion()) return start(show);
  show.root.querySelector("[data-slider-pause]")?.setAttribute("aria-pressed", "true");
}

function bind(id, interval) {
  const root = document.getElementById(id);
  if (!root) return;
  const show = { root, interval, slides: [...root.querySelectorAll(".slide")], dots: [...root.querySelectorAll(".slider-dot")] };
  hydrate(show.slides[1]);
  bindControls(show);
  begin(show);
}

/** Wires the slideshow with this id on every page load, so it keeps working after a client-side visit. */
export function initSlider(id, interval) {
  onPageLoad(bind.bind(null, id, interval));
}
