/** Tests for form sending and the quotation prefill. */
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { bindForm, sendForm } from "../src/lib/form-submit.js";
import { prefillRfq } from "../src/lib/rfq-prefill.js";

const FORM = '<form id="f" action="https://example.test/send"><input name="a" value="1"><button type="submit">Go</button></form><p id="ok" hidden>Thanks</p><p id="no" hidden>Failed</p>';

function setup() {
  const window = new Window({ url: "https://example.test/" });
  window.document.body.innerHTML = FORM;
  globalThis.document = window.document;
  globalThis.FormData = window.FormData;
  return window;
}

function submit(window) {
  window.document.getElementById("f").dispatchEvent(new window.Event("submit", { cancelable: true }));
  return new Promise((resolve) => setTimeout(resolve, 10));
}

test("sendForm is true when the server accepts the form", async () => {
  setup();
  assert.equal(await sendForm(document.getElementById("f"), async () => ({ ok: true })), true);
});

test("sendForm is false when the network fails", async () => {
  setup();
  assert.equal(await sendForm(document.getElementById("f"), async () => { throw new Error("offline"); }), false);
});

test("a sent form shows the thank-you note and hides the error", async () => {
  const window = setup();
  bindForm({ form: "f", success: "ok", error: "no" }, async () => ({ ok: true }));
  await submit(window);
  assert.equal(window.document.getElementById("ok").hidden, false);
  assert.equal(window.document.getElementById("no").hidden, true);
});

test("a failed send shows the error note and keeps the button usable", async () => {
  const window = setup();
  bindForm({ form: "f", success: "ok", error: "no" }, async () => ({ ok: false }));
  await submit(window);
  assert.equal(window.document.getElementById("no").hidden, false);
  assert.equal(window.document.querySelector("button").disabled, false);
});

test("the quotation form fills from the address of the page", () => {
  const window = new Window();
  window.document.body.innerHTML = '<input id="chem-name"><input id="cit-num"><input id="cas-num">';
  prefillRfq(window.document, "?product=Acetone&cas=67-64-1");
  assert.equal(window.document.getElementById("chem-name").value, "Acetone");
  assert.equal(window.document.getElementById("cas-num").value, "67-64-1");
  assert.equal(window.document.getElementById("cit-num").value, "");
});
