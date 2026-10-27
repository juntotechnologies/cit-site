/** Shows the analytics notice until the visitor chooses. Analytics loads only after an accept. */
import { clearAnalyticsCookies, isAnalyticsLoaded, loadAnalytics } from "./analytics.js";
import { CHOICES, isChoice, readChoice, writeChoice } from "./consent.js";
import { onPageLoad } from "./page-lifecycle.js";

function setOpen(notice, open) {
  notice.hidden = !open;
}

function reopen(notice) {
  setOpen(notice, true);
  notice.focus();
}

/** A loaded Google tag cannot be stopped in place: page swaps do not reload, and neither its disable flag nor consent mode stopped the hits in a browser test. So a withdrawal reloads the page, which unloads the tag. */
function withdraw() {
  const wasLoaded = isAnalyticsLoaded();
  clearAnalyticsCookies();
  if (wasLoaded) window.location.reload();
}

function choose(notice, choice) {
  writeChoice(window, choice);
  setOpen(notice, false);
  if (choice === CHOICES.granted) loadAnalytics(notice.dataset.gaId);
  else withdraw();
}

function onChoice(notice, event) {
  const choice = event.target.closest("[data-consent]")?.dataset.consent;
  if (isChoice(choice)) choose(notice, choice);
}

/** Without consent a visitor keeps no Google cookies, including ones from visits before this notice existed. */
function applyStoredChoice(notice) {
  const choice = readChoice(window);
  if (choice === CHOICES.granted) loadAnalytics(notice.dataset.gaId);
  else clearAnalyticsCookies();
  setOpen(notice, choice === undefined);
}

export function bind() {
  const notice = document.getElementById("consent");
  if (!notice) return;
  notice.addEventListener("click", onChoice.bind(null, notice));
  document.querySelector("[data-consent-open]")?.addEventListener("click", reopen.bind(null, notice));
  applyStoredChoice(notice);
}

export function initConsent() {
  onPageLoad(bind);
}
