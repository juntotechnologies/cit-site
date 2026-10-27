/** Pure steps of the layout check: lines in a heading, uneven outer margins, sideways scroll, small tap targets and structure images drawn too small. */

/** The number of text lines in a heading: its height over its line height. */
export function linesOf(row) {
  return Math.round(row.height / row.lineHeight);
}

function hasTooManyLines(max, row) {
  return linesOf(row) > max;
}

/** The headings that wrap to more lines than `max`. Each row is { text, height, lineHeight }. */
export function tooManyLines(rows, max) {
  return rows.filter(hasTooManyLines.bind(null, max));
}

/** The gaps between a block and the two screen edges. */
export function marginsOf(frame, clientWidth) {
  return { left: frame.left, right: clientWidth - frame.right };
}

function isUneven(clientWidth, tolerance, frame) {
  const margins = marginsOf(frame, clientWidth);
  return Math.abs(margins.left - margins.right) > tolerance;
}

/** The blocks whose left and right gaps differ by more than `tolerance` pixels. Each frame is { selector, left, right }. */
export function unevenMargins(frames, clientWidth, tolerance) {
  return frames.filter(isUneven.bind(null, clientWidth, tolerance));
}

/** How far the page scrolls sideways, in pixels. Zero when it does not. */
export function overflowBy(widths) {
  return Math.max(0, widths.scroll - widths.client);
}

function isTooSmall(min, row) {
  return row.height > 0 && row.height < min - 0.5;
}

/** The visible controls shorter than `min` pixels. A control with no height is hidden and does not count. Each row is { text, height }. */
export function tooSmallTargets(rows, min) {
  return rows.filter(isTooSmall.bind(null, min));
}

export function describeHeading(where, max, row) {
  return `${where}: heading "${row.text}" has ${linesOf(row)} lines; the most is ${max}`;
}

export function describeMargins(where, clientWidth, frame) {
  const { left, right } = marginsOf(frame, clientWidth);
  return `${where}: ${frame.selector} has a left gap of ${Math.round(left)} px and a right gap of ${Math.round(right)} px`;
}

export function describeOverflow(where, pixels) {
  return `${where}: the page scrolls sideways by ${pixels} px`;
}

export function describeTarget(where, min, row) {
  return `${where}: control "${row.text}" is ${Math.round(row.height)} px tall; the least is ${min} px`;
}

function isSmallStructure(minRatio, row) {
  return row.frameWidth > 0 && row.width < row.frameWidth * minRatio - 0.5;
}

/** The structure images drawn narrower than `minRatio` of their box. A hidden image has no box and does not count. Each row is { text, width, frameWidth }. */
export function smallStructures(rows, minRatio) {
  return rows.filter(isSmallStructure.bind(null, minRatio));
}

export function describeStructure(where, minRatio, row) {
  return `${where}: image "${row.text}" is ${Math.round(row.width)} px wide in a ${Math.round(row.frameWidth)} px box; the least is ${Math.round(minRatio * 100)}%`;
}
