/** Reads color tokens from the palette file and measures the contrast between two of them. */

const VARIABLE = /^var\(--([\w-]+)\)$/;
const CUSTOM_PROPERTY = /--([\w-]+):\s*([^;]+);/g;

function tokenEntry(match) {
  return [match[1], match[2].trim()];
}

function hexPair(pair) {
  return parseInt(pair, 16);
}

/** The custom properties of a CSS text, as { name: value }. */
export function readTokens(css) {
  return Object.fromEntries([...css.matchAll(CUSTOM_PROPERTY)].map(tokenEntry));
}

/** The value of a token, with each var(--other) followed to a color. */
export function resolveToken(tokens, name) {
  const value = tokens[name];
  const reference = VARIABLE.exec(value ?? "");
  return reference ? resolveToken(tokens, reference[1]) : value;
}

function channels(color) {
  if (color.startsWith("#")) return [...color.slice(1).match(/../g).map(hexPair), 1];
  const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
  return [r, g, b, a];
}

function mixChannel(alpha, background, value, index) {
  return value * alpha + background[index] * (1 - alpha);
}

function mix(foreground, background) {
  return foreground.slice(0, 3).map(mixChannel.bind(null, foreground[3], background));
}

function byLightFirst(a, b) {
  return b - a;
}

function linear(value) {
  const share = value / 255;
  return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of a text color on a background color. A text color with alpha is mixed over the background first. */
export function contrastRatio(textColor, backgroundColor) {
  const background = channels(backgroundColor).slice(0, 3);
  const text = mix(channels(textColor), background);
  const [light, dark] = [luminance(text), luminance(background)].sort(byLightFirst);
  return (light + 0.05) / (dark + 0.05);
}
