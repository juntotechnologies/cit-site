/** Sends a form to its address without leaving the page. It shows a thank-you note, or an error note when the send fails. */
import { onPageLoad } from "./page-lifecycle.js";

function setHidden(node, hidden) {
  if (node) node.hidden = hidden;
}

/** True when the server accepted the form. A network failure is false, not an exception. */
export async function sendForm(form, fetcher) {
  try {
    const response = await fetcher(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    return response.ok;
  } catch {
    return false;
  }
}

function showResult(parts, ok) {
  if (ok) parts.form.reset();
  setHidden(parts.success, !ok);
  setHidden(parts.error, ok);
  parts.button.disabled = ok;
}

async function handleSubmit(parts, event) {
  event.preventDefault();
  parts.button.disabled = true;
  setHidden(parts.error, true);
  showResult(parts, await sendForm(parts.form, parts.fetcher));
}

/** Wires one form. `ids` is { form, success, error }. The submit button is the form's submit button. */
export function bindForm(ids, fetcher = fetch) {
  const form = document.getElementById(ids.form);
  if (!form) return;
  const parts = { form, button: form.querySelector("[type=submit]"), success: document.getElementById(ids.success), error: document.getElementById(ids.error), fetcher };
  form.addEventListener("submit", handleSubmit.bind(null, parts));
}

export function initForm(ids) {
  onPageLoad(bindForm.bind(null, ids));
}
