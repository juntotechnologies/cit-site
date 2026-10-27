/** Fills the quotation form from the address of the page: ?product=, ?cat= and ?cas= name a catalogue entry. */
import { onPageLoad } from "./page-lifecycle.js";

const FIELDS = { product: "chem-name", cat: "cit-num", cas: "cas-num" };

function fillField(document, params, [param, id]) {
  const value = params.get(param);
  const input = document.getElementById(id);
  if (value && input) input.value = value;
}

export function prefillRfq(document, search) {
  const params = new URLSearchParams(search);
  for (const entry of Object.entries(FIELDS)) fillField(document, params, entry);
}

function prefillFromLocation() {
  prefillRfq(document, location.search);
}

/** Prefills the form on every page load, so it also works after a client-side visit. */
export function initRfqPrefill() {
  onPageLoad(prefillFromLocation);
}
