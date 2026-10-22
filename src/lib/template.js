// The house template. Every horse gets these; only the traced outline changes.
export const TEMPLATE = Object.freeze({
  edge: 1.5,        // plate edge past the hoof wall
  plateT: 4,        // plate thickness
  mirror: true,     // photo looks up at the sole, so the printed part is mirrored
  rimW: 13, rimH: 2,
  holeD: 6, holeSp: 14, holeMargin: 3,
  toothDepth: 3.5, toothPitch: 6, toothSpan: 0.55,
  kerfN: 5, kerfSp: 18, kerfW: 1.2,
  logoCut: false, logoW: 60, logoT: 0.8, logoBoost: 0.25, logoPos: 0.5,
});

export const LOGO_CHOICES = [
  { label: "Full logo", value: 0 },
  { label: "Horse", value: 1 },
  { label: "Words", value: 2 },
  { label: "None", value: -1 },
];

export const REFERENCE_PRESETS = [
  { label: "card 100 mm", value: 100, unit: "mm" },
  { label: "4 in", value: 4, unit: "in" },
  { label: "credit card", value: 85.6, unit: "mm" },
];
