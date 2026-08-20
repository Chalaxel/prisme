import { cloneRules, defaultRules, livretTuning } from "./defaultRules";
import type { RulesConfig, RulesTuning } from "../engine/types";

function withTuning(base: RulesConfig, tuning: Partial<RulesTuning>, label: string): RulesConfig {
  const rules = cloneRules(base);
  rules.tuning = { ...rules.tuning, ...tuning };
  rules.variantLabel = label;
  return rules;
}

/** Itération 1 — règles livret (baseline). */
export const iter1Livret: RulesConfig = cloneRules(defaultRules);

/** Itération 2 — frein au snowball : pioche horaire, bonus plis réduit, moins de Bluff. */
export const iter2AntiSnowball: RulesConfig = withTuning(
  {
    ...cloneRules(defaultRules),
    bonusMostTricks: 4,
    specialCopies: {
      ...defaultRules.specialCopies,
      bluff: 4,
      gele: 2,
    },
  },
  { drawWinnerFirst: false },
  "iter2-anti-snowball",
);

/** Itération 3 — Prisme/Inversion personnels (commune ne globalise plus). */
export const iter3PersonalModifiers: RulesConfig = withTuning(
  {
    ...cloneRules(iter2AntiSnowball),
    specialCopies: {
      ...iter2AntiSnowball.specialCopies,
      prisme: 2,
      inversion: 2,
    },
  },
  { globalPrisme: false, globalInversion: false },
  "iter3-personal-modifiers",
);

/** Itération 4 — Bluff joker + Gèle rare. */
export const iter4BluffJoker: RulesConfig = withTuning(
  {
    ...cloneRules(iter3PersonalModifiers),
    specialCopies: {
      ...iter3PersonalModifiers.specialCopies,
      bluff: 5,
      gele: 1,
    },
    specialPoints: {
      ...iter3PersonalModifiers.specialPoints,
      bluff: 2,
    },
  },
  { bluffJokerColor: true },
  "iter4-bluff-joker",
);

/** Itération 5 — capture allégée + bonus relancés + communes plus riches. */
export const iter5LightCapture: RulesConfig = withTuning(
  {
    ...cloneRules(iter4BluffJoker),
    bonusBestFinalHand: 5,
    bonusUnbeatenLast3: 8,
    distribution: iter4BluffJoker.distribution.map((row) =>
      row.players <= 4 ? { ...row, commonsPerTurn: row.commonsPerTurn + 1 } : row,
    ),
  },
  { winnerCapturesCommons: false },
  "iter5-light-capture",
);

export const BALANCE_ITERATIONS = [
  { id: 1, name: "Livret (baseline)", rules: iter1Livret },
  { id: 2, name: "Anti-snowball", rules: iter2AntiSnowball },
  { id: 3, name: "Modificateurs personnels", rules: iter3PersonalModifiers },
  { id: 4, name: "Bluff joker", rules: iter4BluffJoker },
  { id: 5, name: "Capture allégée", rules: iter5LightCapture },
] as const;

export { livretTuning };
