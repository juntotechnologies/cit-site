/** Turns known phrases in a paragraph into links. */

function escapePattern(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseOf(link) {
  return escapePattern(link.phrase);
}

function hasPhrase(part, link) {
  return link.phrase === part;
}

function partOf(links, part) {
  const link = links.find(hasPhrase.bind(null, part));
  return link ? { text: part, href: link.href } : { text: part };
}

/** Splits `text` into parts. A part is { text } or, for a listed phrase, { text, href }. `links` is a list of { phrase, href }. */
export function linkify(text, links) {
  const pattern = new RegExp(`(${links.map(phraseOf).join("|")})`, "g");
  return text.split(pattern).filter(Boolean).map(partOf.bind(null, links));
}
