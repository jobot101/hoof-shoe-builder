export const MM_PER_IN = 25.4;

/** Both units, the chosen one first. */
export function lengthParts(mm, unit) {
  const m = mm.toFixed(1) + " mm";
  const i = (mm / MM_PER_IN).toFixed(3) + " in";
  return unit === "in" ? [i, m] : [m, i];
}
export function lengthText(mm, unit) {
  return lengthParts(mm, unit).join(" · ");
}
