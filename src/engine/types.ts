export const COLOR_IDS = [
  "or",
  "sarcelle",
  "bleuNuit",
  "vert",
  "rouge",
  "orange",
] as const;

export type ColorId = (typeof COLOR_IDS)[number];

export const SPECIAL_KINDS = [
  "inversion",
  "prisme",
  "gele",
  "ajoute",
  "echange",
  "bluff",
] as const;

export type SpecialKind = (typeof SPECIAL_KINDS)[number];

export const COMBO_KINDS = [
  "high",
  "pair",
  "twoPair",
  "three",
  "smallStraight",
  "echo",
  "bigStraight",
  "full",
  "four",
  "flush",
  "rainbow",
  "royal",
  "prismale",
] as const;

export type ComboKind = (typeof COMBO_KINDS)[number];

export type NumberedCard = {
  id: string;
  kind: "numbered";
  color: ColorId;
  value: number;
};

export type SpecialCard = {
  id: string;
  kind: "special";
  special: SpecialKind;
  color: ColorId;
};

export type Card = NumberedCard | SpecialCard;

export type Combo = {
  kind: ComboKind;
  rank: number;
  primary: number;
  secondary: number;
  tertiary: number;
  sum: number;
  cards: Card[];
  label: string;
};

export type DistributionRow = {
  players: number;
  handSize: number;
  commonsPerTurn: number;
};

export type PointTier = {
  min: number;
  max: number;
  points: number;
};

/** Paramètres comportementaux tunables (équilibrage / itérations). */
export type RulesTuning = {
  /** Vainqueur pioche en premier (livret) ou ordre distributeur. */
  drawWinnerFirst: boolean;
  /** Prisme/Inversion en commune affectent tout le pli. */
  globalPrisme: boolean;
  globalInversion: boolean;
  /** Bluff compte comme joker de couleur (Couleur / Arc-en-ciel). */
  bluffJokerColor: boolean;
  /** Le vainqueur capture les communes dans sa pile de points. */
  winnerCapturesCommons: boolean;
};

export type RulesConfig = {
  colors: { id: ColorId; name: string; hex: string }[];
  minValue: number;
  maxValue: number;
  copiesPerNumbered: number;
  specialCopies: Record<SpecialKind, number>;
  specialColor: Record<SpecialKind, ColorId>;
  distribution: DistributionRow[];
  comboRank: Record<ComboKind, number>;
  comboLabels: Record<ComboKind, string>;
  specialLabels: Record<SpecialKind, string>;
  numberedTiers: PointTier[];
  specialPoints: Record<SpecialKind, number>;
  bonusMostTricks: number;
  bonusBestFinalHand: number;
  bonusUnbeatenLast3: number;
  playMin: number;
  playMax: number;
  tuning: RulesTuning;
  /** Libellé court pour rapports de simulation. */
  variantLabel?: string;
};

export type Phase =
  | "lobby"
  | "curtain"
  | "play"
  | "reveal"
  | "resolved"
  | "gameOver";

export type PlayerState = {
  id: number;
  name: string;
  hand: Card[];
  posed: Card[];
  exchangeTarget: number | null;
  pointsPile: Card[];
  tricksWon: number;
  lastTricks: boolean[];
};

export type GameState = {
  rules: RulesConfig;
  phase: Phase;
  players: PlayerState[];
  dealerId: number;
  activePlayerId: number;
  curtainFor: number | null;
  deck: Card[];
  discard: Card[];
  commons: Card[];
  turn: number;
  inversion: boolean;
  prisme: boolean;
  log: string[];
  lastWinnerIds: number[];
  lastCombos: Record<number, Combo | null>;
  pendingPlay: string[];
  pendingTarget: number | null;
  gameOverReason: string | null;
  rng: () => number;
};
