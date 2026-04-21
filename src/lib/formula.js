/**
 * Converts chemical formula plain text to HTML with proper subscripts.
 * e.g. "C12H6O2" -> "C<sub>12</sub>H<sub>6</sub>O<sub>2</sub>"
 */
export function formulaToHtml(formula) {
  if (!formula) return "";
  return formula.replace(/([A-Za-z\)\]])(\d+)/g, "$1<sub>$2</sub>");
}
