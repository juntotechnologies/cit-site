/** Wires the phone menu: the button opens and closes the drawer, a tap on a link or the Escape key closes it. */
import { onPageLoad } from "./page-lifecycle.js";

export function setMenuState(button, nav, open) {
  nav.classList.toggle("open", open);
  button.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

function toggle(button, nav) {
  setMenuState(button, nav, !nav.classList.contains("open"));
}

function closeOnEscape(button, nav, event) {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    setMenuState(button, nav, false);
    button.focus();
  }
}

function closeOnLink(button, nav, event) {
  if (event.target.closest("a")) setMenuState(button, nav, false);
}

let escapeHandler;

/** The page swaps its nodes on each client-side visit, so the key listener on the document is replaced, not added again. */
function replaceEscapeHandler(button, nav) {
  document.removeEventListener("keydown", escapeHandler);
  escapeHandler = closeOnEscape.bind(null, button, nav);
  document.addEventListener("keydown", escapeHandler);
}

export function bind() {
  const button = document.getElementById("hamburger");
  const nav = document.getElementById("mobile-nav");
  if (!button || !nav) return;
  button.addEventListener("click", toggle.bind(null, button, nav));
  nav.addEventListener("click", closeOnLink.bind(null, button, nav));
  replaceEscapeHandler(button, nav);
}

export function initMobileMenu() {
  onPageLoad(bind);
}
