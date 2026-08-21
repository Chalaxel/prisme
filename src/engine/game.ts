import { bestCombo, comboDescription, compareCombos } from "./combinations";
import { buildDeck, draw, shuffle } from "./deck";
import { pilePoints } from "./score";
import { defaultRules } from "../rules/defaultRules";
import type { Card, Combo, GameState, PlayerState, RulesConfig, SpecialCard } from "./types";

export type Action =
  | { type: "start"; names: string[]; rules: RulesConfig; rng?: () => number }
  | { type: "confirmCurtain" }
  | { type: "toggleCard"; cardId: string }
  | { type: "setTarget"; playerId: number }
  | { type: "confirmPlay" }
  | { type: "acknowledgeReveal" }
  | { type: "nextTurn" }
  | { type: "backToLobby" };

function dist(rules: RulesConfig, playerCount: number) {
  const row = rules.distribution.find((d) => d.players === playerCount);
  if (!row) throw new Error(`Pas de distribution pour ${playerCount} joueurs`);
  return row;
}

function specialsOf(cards: Card[], kind: SpecialCard["special"]): SpecialCard[] {
  return cards.filter((c): c is SpecialCard => c.kind === "special" && c.special === kind);
}

function takeCards(deck: Card[], discard: Card[], n: number, rng: () => number): {
  taken: Card[];
  deck: Card[];
  discard: Card[];
} {
  let d = deck;
  let disc = discard;
  if (d.length < n && disc.length > 0) {
    d = [...d, ...shuffle(disc, rng)];
    disc = [];
  }
  const { taken, rest } = draw(d, Math.min(n, d.length));
  return { taken, deck: rest, discard: disc };
}

function clockwise(from: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => (from + i) % count);
}

function applyAdds(state: GameState, extraAdds: number): GameState {
  let next = { ...state, commons: [...state.commons], deck: [...state.deck], discard: [...state.discard] };
  let pending = extraAdds;
  while (pending > 0) {
    const pulled = takeCards(next.deck, next.discard, 1, state.rng);
    next = { ...next, deck: pulled.deck, discard: pulled.discard };
    if (!pulled.taken.length) break;
    next.commons = [...next.commons, ...pulled.taken];
    pending -= 1;
    if (pulled.taken[0].kind === "special" && pulled.taken[0].special === "ajoute") {
      pending += 1;
    }
  }
  return next;
}

function beginTurn(state: GameState): GameState {
  const { commonsPerTurn } = dist(state.rules, state.players.length);
  const players = state.players.map((p) => ({
    ...p,
    posed: [],
    exchangeTarget: null,
  }));
  let next: GameState = {
    ...state,
    players,
    commons: [],
    inversion: false,
    prisme: false,
    lastWinnerIds: [],
    lastCombos: {},
    pendingPlay: [],
    pendingTarget: null,
    turn: state.turn + 1,
    log: [...state.log, `— Tour ${state.turn + 1} —`],
  };

  if (next.deck.length === 0) {
    return finishGame(next, "La pioche est vide.");
  }

  const pulled = takeCards(next.deck, next.discard, commonsPerTurn, next.rng);
  next = { ...next, deck: pulled.deck, discard: pulled.discard, commons: pulled.taken };

  const commonAdds = specialsOf(next.commons, "ajoute").length;
  next = applyAdds(next, commonAdds);
  if (next.rules.tuning.globalPrisme) {
    next.prisme = specialsOf(next.commons, "prisme").length > 0;
  }
  if (next.rules.tuning.globalInversion) {
    next.inversion = specialsOf(next.commons, "inversion").length > 0;
  }
  if (next.prisme) next.log = [...next.log, "Prisme commun : seules Couleur et Couleur royale comptent."];
  if (next.inversion) next.log = [...next.log, "Inversion commune : le 1 est le plus fort."];
  if (commonAdds) next.log = [...next.log, `Ajoute (commune) : ${commonAdds} carte(s) de plus.`];

  return {
    ...next,
    phase: "curtain",
    curtainFor: next.dealerId,
    activePlayerId: next.dealerId,
  };
}

function finishGame(state: GameState, reason: string): GameState {
  return { ...state, phase: "gameOver", gameOverReason: reason, curtainFor: null };
}

export const initialState: GameState = {
  rules: defaultRules,
  phase: "lobby",
  players: [],
  dealerId: 0,
  activePlayerId: 0,
  curtainFor: null,
  deck: [],
  discard: [],
  commons: [],
  turn: 0,
  inversion: false,
  prisme: false,
  log: [],
  lastWinnerIds: [],
  lastCombos: {},
  pendingPlay: [],
  pendingTarget: null,
  gameOverReason: null,
  rng: Math.random,
};

function startGame(names: string[], rules: RulesConfig, rng: () => number): GameState {
  const n = names.length;
  const { handSize } = dist(rules, n);
  let deck = shuffle(buildDeck(rules), rng);
  const players: PlayerState[] = names.map((name, id) => ({
    id,
    name,
    hand: [],
    posed: [],
    exchangeTarget: null,
    pointsPile: [],
    tricksWon: 0,
    lastTricks: [],
  }));
  for (let round = 0; round < handSize; round++) {
    for (let i = 0; i < n; i++) {
      if (!deck.length) break;
      const card = deck[0];
      deck = deck.slice(1);
      players[i] = { ...players[i], hand: [...players[i].hand, card] };
    }
  }
  const dealerId = Math.floor(rng() * n);
  return beginTurn({
    ...initialState,
    rules,
    rng,
    players,
    dealerId,
    activePlayerId: dealerId,
    deck,
    log: [`Nouvelle partie — ${n} joueurs. Distributeur : ${players[dealerId].name}.`],
  });
}

function player(state: GameState, id: number): PlayerState {
  return state.players.find((p) => p.id === id)!;
}

function comboFlagsForPlayer(
  player: PlayerState,
  state: GameState,
): { prisme: boolean; inversion: boolean } {
  const { tuning } = state.rules;
  const playedPrisme = specialsOf(player.posed, "prisme").length > 0;
  const playedInversion = specialsOf(player.posed, "inversion").length > 0;
  return {
    prisme:
      (tuning.globalPrisme && state.prisme) ||
      playedPrisme ||
      (tuning.globalPrisme && specialsOf(state.commons, "prisme").length > 0),
    inversion:
      (tuning.globalInversion && state.inversion) ||
      playedInversion ||
      (tuning.globalInversion && specialsOf(state.commons, "inversion").length > 0),
  };
}

function comboPoolForPlayer(player: PlayerState, state: GameState): Card[] {
  const numberedPosed = player.posed.filter((c) => c.kind === "numbered");
  const pool: Card[] = [...numberedPosed, ...state.commons];
  if (state.rules.tuning.bluffJokerColor) {
    pool.push(...player.posed.filter((c) => c.kind === "special" && c.special === "bluff"));
  }
  return pool;
}

function resolveTrick(state: GameState): GameState {
  let next = { ...state, log: [...state.log] };
  const posedSpecials = next.players.flatMap((p) => p.posed.filter((c) => c.kind === "special"));
  const handAdds = specialsOf(posedSpecials, "ajoute").length;
  if (handAdds) {
    next = applyAdds(next, handAdds);
    next.log = [...next.log, `Ajoute (main) : +${handAdds} commune(s).`];
  }
  if (next.rules.tuning.globalPrisme) {
    next.prisme =
      next.prisme ||
      specialsOf(posedSpecials, "prisme").length > 0 ||
      specialsOf(next.commons, "prisme").length > 0;
  }
  if (next.rules.tuning.globalInversion) {
    next.inversion =
      next.inversion ||
      specialsOf(posedSpecials, "inversion").length > 0 ||
      specialsOf(next.commons, "inversion").length > 0;
  }
  if (specialsOf(posedSpecials, "prisme").length) next.log = [...next.log, "Prisme activé depuis une main."];
  if (specialsOf(posedSpecials, "inversion").length) next.log = [...next.log, "Inversion activée depuis une main."];

  const order = clockwise(next.dealerId, next.players.length);
  let players = next.players.map((p) => ({ ...p, posed: [...p.posed], hand: [...p.hand], pointsPile: [...p.pointsPile] }));
  for (const pid of order) {
    const pl = players.find((p) => p.id === pid)!;
    if (!specialsOf(pl.posed, "echange").length) continue;
    const tid = pl.exchangeTarget;
    if (tid === null || tid === pid) {
      next.log = [...next.log, `${pl.name} : Échange sans cible valide, ignoré.`];
      continue;
    }
    const target = players.find((p) => p.id === tid)!;
    const tmp = pl.posed;
    pl.posed = target.posed;
    target.posed = tmp;
    next.log = [...next.log, `${pl.name} échange ses cartes posées avec ${target.name}.`];
  }

  next = { ...next, players };
  const combos: Record<number, Combo | null> = {};
  for (const p of next.players) {
    const flags = comboFlagsForPlayer(p, next);
    const pool = comboPoolForPlayer(p, next);
    combos[p.id] = bestCombo(pool, next.rules, flags);
    next.log = [...next.log, `${p.name} : ${comboDescription(combos[p.id])}`];
  }

  let contenders = [...next.players.map((p) => p.id)];
  const inversionForCompare = next.rules.tuning.globalInversion && next.inversion;
  contenders.sort((a, b) => {
    const ca = combos[a];
    const cb = combos[b];
    if (!ca && !cb) return 0;
    if (!ca) return -1;
    if (!cb) return 1;
    return compareCombos(cb, ca, inversionForCompare, next.rules);
  });

  const best = combos[contenders[0]];
  let tied = contenders.filter((id) => {
    const c = combos[id];
    if (!best && !c) return true;
    if (!best || !c) return false;
    return compareCombos(c, best, inversionForCompare, next.rules) === 0;
  });

  const tiebreakCards: Card[] = [];
  if (tied.length > 1) {
    next.log = [...next.log, `Égalité entre ${tied.map((id) => player(next, id).name).join(", ")}.`];
    const drawn: { id: number; card: Card | null }[] = [];
    for (const id of tied) {
      const pulled = takeCards(next.deck, next.discard, 1, next.rng);
      next = { ...next, deck: pulled.deck, discard: pulled.discard };
      const card = pulled.taken[0] ?? null;
      drawn.push({ id, card });
      if (card) tiebreakCards.push(card);
    }
    const withCards = drawn.filter((d) => d.card && d.card.kind === "numbered") as {
      id: number;
      card: { kind: "numbered"; value: number } & Card;
    }[];
    if (withCards.length) {
      const mapV = (v: number) =>
        inversionForCompare ? next.rules.minValue + next.rules.maxValue - v : v;
      withCards.sort((a, b) => mapV(b.card.value) - mapV(a.card.value));
      const top = mapV(withCards[0].card.value);
      tied = withCards.filter((d) => mapV(d.card.value) === top).map((d) => d.id);
      next.log = [
        ...next.log,
        `Départage pioche : ${drawn.map((d) => `${player(next, d.id).name}=${d.card && d.card.kind === "numbered" ? d.card.value : d.card ? d.card.special : "?"}`).join(", ")}`,
      ];
    } else {
      tied.sort((a, b) => {
        const sa = numberedSum(player(next, a).hand);
        const sb = numberedSum(player(next, b).hand);
        return inversionForCompare ? sa - sb : sb - sa;
      });
      tied = [tied[0]];
      next.log = [...next.log, "Départage par somme des mains restantes."];
    }
  }

  const winnerId = tied[0];
  const winnerName = player(next, winnerId).name;
  const frozen = new Set<number>();
  for (const p of next.players) {
    if (p.id === winnerId) continue;
    if (specialsOf(p.posed, "gele").length) frozen.add(p.id);
  }

  players = next.players.map((p) => ({ ...p, posed: [...p.posed], hand: [...p.hand], pointsPile: [...p.pointsPile] }));
  const spoils: Card[] = [...tiebreakCards];
  if (next.rules.tuning.winnerCapturesCommons) {
    spoils.unshift(...next.commons);
  } else if (next.commons.length) {
    next.discard = [...next.discard, ...next.commons];
    next.log = [...next.log, "Communes défaussées (non capturées)."];
  }
  for (const p of players) {
    if (p.id === winnerId) {
      spoils.push(...p.posed);
      p.posed = [];
    } else if (frozen.has(p.id)) {
      p.hand = [...p.hand, ...p.posed];
      next.log = [...next.log, `Gèle : ${p.name} récupère ses cartes posées.`];
      p.posed = [];
    } else {
      spoils.push(...p.posed);
      p.posed = [];
    }
  }
  const win = players.find((p) => p.id === winnerId)!;
  win.pointsPile = [...win.pointsPile, ...spoils];
  win.tricksWon += 1;
  for (const p of players) {
    p.lastTricks = [...p.lastTricks, p.id === winnerId];
  }

  next.log = [...next.log, `${winnerName} remporte le pli (${spoils.length} cartes).`];

  const { handSize } = dist(next.rules, players.length);
  const drawStart = next.rules.tuning.drawWinnerFirst ? winnerId : next.dealerId;
  const drawOrder = clockwise(drawStart, players.length);
  for (const pid of drawOrder) {
    const pl = players.find((p) => p.id === pid)!;
    const need = Math.max(0, handSize - pl.hand.length);
    if (!need) continue;
    const pulled = takeCards(next.deck, next.discard, need, next.rng);
    next = { ...next, deck: pulled.deck, discard: pulled.discard };
    pl.hand = [...pl.hand, ...pulled.taken];
  }

  const newDealer = (next.dealerId + 1) % players.length;
  const deckEmpty = next.deck.length === 0;
  return {
    ...next,
    players,
    lastWinnerIds: [winnerId],
    lastCombos: combos,
    commons: [],
    dealerId: newDealer,
    phase: deckEmpty ? "gameOver" : "resolved",
    gameOverReason: deckEmpty ? "La pioche est épuisée après ce pli." : null,
  };
}

function numberedSum(cards: Card[]): number {
  return cards.reduce((s, c) => s + (c.kind === "numbered" ? c.value : 0), 0);
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "start":
      return startGame(action.names, action.rules, action.rng ?? Math.random);
    case "backToLobby":
      return { ...initialState };
    case "confirmCurtain": {
      if (state.phase !== "curtain" || state.curtainFor === null) return state;
      return {
        ...state,
        phase: "play",
        activePlayerId: state.curtainFor,
        curtainFor: null,
        pendingPlay: [],
        pendingTarget: null,
      };
    }
    case "toggleCard": {
      if (state.phase !== "play") return state;
      const id = action.cardId;
      const has = state.pendingPlay.includes(id);
      if (has) return { ...state, pendingPlay: state.pendingPlay.filter((x) => x !== id) };
      if (state.pendingPlay.length >= state.rules.playMax) return state;
      const pl = player(state, state.activePlayerId);
      if (!pl.hand.some((c) => c.id === id)) return state;
      return { ...state, pendingPlay: [...state.pendingPlay, id] };
    }
    case "setTarget":
      return { ...state, pendingTarget: action.playerId };
    case "confirmPlay": {
      if (state.phase !== "play") return state;
      const pl = player(state, state.activePlayerId);
      if (state.pendingPlay.length < state.rules.playMin) return state;
      if (state.pendingPlay.length > state.rules.playMax) return state;
      const selected = pl.hand.filter((c) => state.pendingPlay.includes(c.id));
      const hasEchange = specialsOf(selected, "echange").length > 0;
      if (hasEchange && (state.pendingTarget === null || state.pendingTarget === pl.id)) return state;
      const players = state.players.map((p) => {
        if (p.id !== pl.id) return p;
        return {
          ...p,
          posed: selected,
          hand: p.hand.filter((c) => !state.pendingPlay.includes(c.id)),
          exchangeTarget: hasEchange ? state.pendingTarget : null,
        };
      });
      const order = clockwise(state.dealerId, players.length);
      const idx = order.indexOf(pl.id);
      const nextId = order[idx + 1];
      if (nextId === undefined) {
        return { ...state, players, phase: "reveal", pendingPlay: [], pendingTarget: null };
      }
      return {
        ...state,
        players,
        phase: "curtain",
        curtainFor: nextId,
        activePlayerId: nextId,
        pendingPlay: [],
        pendingTarget: null,
      };
    }
    case "acknowledgeReveal":
      if (state.phase !== "reveal") return state;
      return resolveTrick(state);
    case "nextTurn":
      if (state.phase !== "resolved") return state;
      return beginTurn(state);
    default:
      return state;
  }
}

export type FinalScore = {
  playerId: number;
  name: string;
  pile: number;
  bonusTricks: number;
  bonusHand: number;
  bonusLast3: number;
  total: number;
  tricks: number;
};

export function finalScores(state: GameState): { scores: FinalScore[]; winners: number[] } {
  const rules = state.rules;
  const piles = state.players.map((p) => ({
    id: p.id,
    pile: pilePoints(p.pointsPile, rules),
    tricks: p.tricksWon,
  }));
  const maxTricks = Math.max(...piles.map((p) => p.tricks));
  const hands = state.players.map((p) => ({
    id: p.id,
    combo: bestCombo(p.hand, rules, { prisme: false, inversion: false }),
  }));
  let bestHandIds: number[] = [];
  for (const h of hands) {
    if (!h.combo) continue;
    if (!bestHandIds.length) {
      bestHandIds = [h.id];
      continue;
    }
    const current = hands.find((x) => x.id === bestHandIds[0])!.combo!;
    const cmp = compareCombos(h.combo, current, false, rules);
    if (cmp > 0) bestHandIds = [h.id];
    else if (cmp === 0) bestHandIds.push(h.id);
  }

  const scores: FinalScore[] = state.players.map((p) => {
    const pile = pilePoints(p.pointsPile, rules);
    const bonusTricks = p.tricksWon === maxTricks && maxTricks > 0 ? rules.bonusMostTricks : 0;
    const bonusHand = bestHandIds.includes(p.id) ? rules.bonusBestFinalHand : 0;
    const last3 = p.lastTricks.slice(-3);
    const bonusLast3 =
      last3.length === 3 && last3.every(Boolean) ? rules.bonusUnbeatenLast3 : 0;
    return {
      playerId: p.id,
      name: p.name,
      pile,
      bonusTricks,
      bonusHand,
      bonusLast3,
      total: pile + bonusTricks + bonusHand + bonusLast3,
      tricks: p.tricksWon,
    };
  });

  const maxTotal = Math.max(...scores.map((s) => s.total));
  let winners = scores.filter((s) => s.total === maxTotal);
  const maxWTricks = Math.max(...winners.map((s) => s.tricks));
  winners = winners.filter((s) => s.tricks === maxWTricks);
  return { scores, winners: winners.map((w) => w.playerId) };
}

export function canConfirmPlay(state: GameState): boolean {
  if (state.phase !== "play") return false;
  if (state.pendingPlay.length < state.rules.playMin) return false;
  const pl = player(state, state.activePlayerId);
  const selected = pl.hand.filter((c) => state.pendingPlay.includes(c.id));
  const hasEchange = specialsOf(selected, "echange").length > 0;
  if (hasEchange && (state.pendingTarget === null || state.pendingTarget === pl.id)) return false;
  return true;
}

export function selectedHasEchange(state: GameState): boolean {
  const pl = state.players.find((p) => p.id === state.activePlayerId);
  if (!pl) return false;
  const selected = pl.hand.filter((c) => state.pendingPlay.includes(c.id));
  return specialsOf(selected, "echange").length > 0;
}

export type { GameState };
