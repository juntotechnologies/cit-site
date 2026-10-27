/** Tests for the stored analytics choice: only a known value counts, and storage that fails counts as no choice. */
import assert from "node:assert/strict";
import test from "node:test";
import { CHOICES, isChoice, readChoice, writeChoice } from "../src/lib/consent.js";

function fakeWindow(store = new Map()) {
  return { store, localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) } };
}

const BLOCKED = { get localStorage() { throw new Error("storage is blocked"); } };

test("a visitor with no stored choice has no choice", () => {
  assert.equal(readChoice(fakeWindow()), undefined);
});

test("a written choice reads back", () => {
  const win = fakeWindow();
  writeChoice(win, CHOICES.granted);
  assert.equal(readChoice(win), CHOICES.granted);
  writeChoice(win, CHOICES.denied);
  assert.equal(readChoice(win), CHOICES.denied);
});

test("an unknown stored value is not a choice", () => {
  const win = fakeWindow();
  win.localStorage.setItem("cit-analytics-consent", "maybe");
  assert.equal(readChoice(win), undefined);
});

test("blocked storage reads as no choice and a write does not throw", () => {
  assert.equal(readChoice(BLOCKED), undefined);
  assert.doesNotThrow(() => writeChoice(BLOCKED, CHOICES.granted));
});

test("isChoice accepts the two choices only", () => {
  assert.equal(isChoice(CHOICES.granted), true);
  assert.equal(isChoice(CHOICES.denied), true);
  assert.equal(isChoice("maybe"), false);
  assert.equal(isChoice(undefined), false);
});
