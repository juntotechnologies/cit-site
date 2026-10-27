/** Reads a color token from the palette file, so the page color and the social image follow the site colors. */
export function brandColor(paletteCss) {
  return paletteCss.match(/--color-brand-primary:\s*(#[0-9a-f]{6})/i)[1];
}
