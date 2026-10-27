/** The visitor's analytics choice, kept in browser storage. Storage that fails counts as no choice. */
export const CHOICES = Object.freeze({ granted: "granted", denied: "denied" });

const STORAGE_KEY = "cit-analytics-consent";

export function isChoice(value) {
  return Object.values(CHOICES).includes(value);
}

export function readChoice(win) {
  try {
    const stored = win.localStorage.getItem(STORAGE_KEY);
    return isChoice(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

export function writeChoice(win, choice) {
  try {
    win.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // The choice then lasts for this page only; the notice shows again on the next visit.
  }
}
