// Astro's View Transitions (ClientRouter) swap the DOM on client-side
// navigation without re-executing page <script> modules. `astro:page-load`
// fires once after the initial load and again after every swap, so binding
// DOM lookups/listeners here (instead of at module top level) keeps them
// pointed at the currently-visible elements.
export function onPageLoad(fn) {
  document.addEventListener("astro:page-load", fn);
}
