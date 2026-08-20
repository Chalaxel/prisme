import type { Card, Combo, ComboKind, NumberedCard, RulesConfig } from "./types";

export function numbered(cards: Card[]): NumberedCard[] {
  return cards.filter((c): c is NumberedCard => c.kind === "numbered");
}

function ranksOf(cards: Card[]): number[] {
  return numbered(cards)
    .map((c) => c.value)
    .sort((a, b) => a - b);
}

function consecutive(values: number[]): boolean {
  if (values.length < 2) return false;
  const uniq = [...new Set(values)].sort((a, b) => a - b);
  if (uniq.length !== values.length) return false;
  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] !== uniq[i - 1] + 1) return false;
  }
  return true;
}

function rankCounts(cards: Card[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const c of numbered(cards)) {
    map.set(c.value, (map.get(c.value) ?? 0) + 1);
  }
  return map;
}

function colorCounts(cards: Card[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of cards) {
    map.set(c.color, (map.get(c.color) ?? 0) + 1);
  }
  return map;
}

function makeCombo(
  rules: RulesConfig,
  kind: ComboKind,
  cards: Card[],
  primary: number,
  secondary = 0,
  tertiary = 0,
): Combo {
  const nums = numbered(cards);
  return {
    kind,
    rank: rules.comboRank[kind],
    primary,
    secondary,
    tertiary,
    sum: nums.reduce((s, c) => s + c.value, 0),
    cards,
    label: rules.comboLabels[kind],
  };
}

function bluffCount(cards: Card[]): number {
  return cards.filter((c) => c.kind === "special" && c.special === "bluff").length;
}

function numberedColors(cards: Card[]): Map<string, number> {
  return colorCounts(cards.filter((c) => c.kind === "numbered"));
}

function qualifiesFlush(cards: Card[], rules: RulesConfig): boolean {
  if (cards.length < 5) return false;
  const wild = rules.tuning.bluffJokerColor ? bluffCount(cards) : 0;
  if (!wild) return [...colorCounts(cards).values()].some((n) => n === 5);
  const byColor = numberedColors(cards);
  return [...byColor.values()].some((n) => n + wild >= 5);
}

function qualifiesRainbow(cards: Card[], rules: RulesConfig): boolean {
  if (cards.length < 6) return false;
  const wild = rules.tuning.bluffJokerColor ? bluffCount(cards) : 0;
  const distinct = numberedColors(cards).size;
  return distinct + wild >= 6;
}

/** Best combo this exact set qualifies as (must use every card). */
export function classifySet(cards: Card[], rules: RulesConfig): Combo | null {
  if (cards.length === 0) return null;
  const nums = numbered(cards);
  const colors = colorCounts(cards);
  const counts = rankCounts(cards);
  const countList = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const distinctColors = colors.size;
  const values = ranksOf(cards);

  if (nums.length === 3 && cards.length === 3) {
    const byColor = new Map<string, Set<number>>();
    for (const c of nums) {
      const set = byColor.get(c.color) ?? new Set();
      set.add(c.value);
      byColor.set(c.color, set);
    }
    for (const set of byColor.values()) {
      if (set.has(1) && set.has(6) && set.has(13) && nums.every((c) => set.has(c.value))) {
        const colorOk = nums.every((c) => c.color === nums[0].color);
        if (colorOk) return makeCombo(rules, "prismale", cards, 13, 6, 1);
      }
    }
  }

  if (cards.length === 6 && nums.length === 6 && distinctColors === 6 && consecutive(values)) {
    return makeCombo(rules, "royal", cards, values[values.length - 1]);
  }

  if (qualifiesRainbow(cards, rules)) {
    return makeCombo(rules, "rainbow", cards, nums.length ? Math.max(...nums.map((c) => c.value)) : 0);
  }

  if (qualifiesFlush(cards, rules)) {
    const high = nums.length ? Math.max(...nums.map((c) => c.value)) : 0;
    return makeCombo(rules, "flush", cards, high);
  }

  if (nums.length === cards.length && nums.length === 4 && countList[0]?.[1] === 4) {
    return makeCombo(rules, "four", cards, countList[0][0]);
  }

  if (
    nums.length === cards.length &&
    nums.length === 5 &&
    countList.length === 2 &&
    countList[0][1] === 3 &&
    countList[1][1] === 2
  ) {
    return makeCombo(rules, "full", cards, countList[0][0], countList[1][0]);
  }

  if (nums.length === cards.length && nums.length === 5 && consecutive(values)) {
    return makeCombo(rules, "bigStraight", cards, values[values.length - 1]);
  }

  if (nums.length === cards.length && nums.length === 3 && consecutive(values)) {
    const sameColor = nums.every((c) => c.color === nums[0].color);
    if (sameColor) return makeCombo(rules, "echo", cards, values[2]);
    return makeCombo(rules, "smallStraight", cards, values[2]);
  }

  if (nums.length === cards.length && nums.length === 3 && countList[0]?.[1] === 3) {
    return makeCombo(rules, "three", cards, countList[0][0]);
  }

  if (
    nums.length === cards.length &&
    nums.length === 4 &&
    countList.length === 2 &&
    countList[0][1] === 2 &&
    countList[1][1] === 2
  ) {
    const high = Math.max(countList[0][0], countList[1][0]);
    const low = Math.min(countList[0][0], countList[1][0]);
    return makeCombo(rules, "twoPair", cards, high, low);
  }

  if (nums.length === cards.length && nums.length === 2 && countList[0]?.[1] === 2) {
    return makeCombo(rules, "pair", cards, countList[0][0]);
  }

  if (nums.length === 1 && cards.length === 1) {
    return makeCombo(rules, "high", cards, nums[0].value);
  }

  return null;
}

function mapValue(value: number, inverted: boolean, rules: RulesConfig): number {
  if (!inverted) return value;
  return rules.minValue + rules.maxValue - value;
}

export function compareCombos(
  a: Combo,
  b: Combo,
  inverted: boolean,
  rules: RulesConfig,
): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  const fields: (keyof Combo)[] = ["primary", "secondary", "tertiary"];
  for (const field of fields) {
    const av = mapValue(a[field] as number, inverted, rules);
    const bv = mapValue(b[field] as number, inverted, rules);
    if (av !== bv) return av - bv;
  }
  const as = inverted
    ? numbered(a.cards).reduce((s, c) => s + mapValue(c.value, true, rules), 0)
    : a.sum;
  const bs = inverted
    ? numbered(b.cards).reduce((s, c) => s + mapValue(c.value, true, rules), 0)
    : b.sum;
  return as - bs;
}

function eachSubset<T>(items: T[], fn: (subset: T[]) => void) {
  const n = items.length;
  const limit = 1 << n;
  for (let mask = 1; mask < limit; mask++) {
    const subset: T[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(items[i]);
    }
    fn(subset);
  }
}

export function bestCombo(
  pool: Card[],
  rules: RulesConfig,
  opts: { prisme: boolean; inversion: boolean },
): Combo | null {
  let best: Combo | null = null;
  eachSubset(pool, (subset) => {
    const combo = classifySet(subset, rules);
    if (!combo) return;
    if (opts.prisme && combo.kind !== "flush" && combo.kind !== "royal" && combo.kind !== "prismale") {
      return;
    }
    if (!best || compareCombos(combo, best, opts.inversion, rules) > 0) {
      best = combo;
    }
  });
  if (!best && pool.length) {
    const highs = numbered(pool);
    if (highs.length) {
      const top = highs.reduce((a, b) =>
        mapValue(a.value, opts.inversion, rules) >= mapValue(b.value, opts.inversion, rules) ? a : b,
      );
      best = makeCombo(rules, "high", [top], top.value);
    }
  }
  return best;
}

export function comboDescription(combo: Combo | null): string {
  if (!combo) return "Aucune";
  const extra =
    combo.kind === "high" || combo.kind === "pair" || combo.kind === "three" || combo.kind === "four"
      ? ` (${combo.primary})`
      : combo.kind === "twoPair" || combo.kind === "full"
        ? ` (${combo.primary}+${combo.secondary})`
        : "";
  return `${combo.label}${extra}`;
}
