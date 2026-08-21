import { comboDescription } from "../engine/combinations";
import { pilePoints } from "../engine/score";
import type { Card, GameState } from "../engine/types";
import { formatCard, formatCards, visibleTableSummary } from "./cardFormat";
import { playOrder } from "./strategic";

export type VisiblePlay = {
  playerId: number;
  name: string;
  cardsPlayed: number;
  hiddenNumbered: number;
  visibleSpecials: string[];
};

export type AgentObservation = {
  playerId: number;
  playerName: string;
  turn: number;
  phase: GameState["phase"];
  dealerId: number;
  seatInOrder: number;
  playerCount: number;
  hand: Card[];
  handFormatted: string;
  commons: Card[];
  commonsFormatted: string;
  prisme: boolean;
  inversion: boolean;
  deckRemaining: number;
  visiblePlays: VisiblePlay[];
  tableSummary: string;
  scoresEstimate: { playerId: number; name: string; pilePoints: number; tricksWon: number }[];
  playMin: number;
  playMax: number;
  legalCardIds: string[];
  legalCardOptions: { id: string; label: string }[];
  echangeTargets: { playerId: number; name: string }[];
  rulesBrief: string;
  lastTrick?: {
    winnerNames: string[];
    combos: Record<number, string>;
  };
};

function visiblePlaysFor(state: GameState, activeId: number): VisiblePlay[] {
  const order = playOrder(state);
  const idx = order.indexOf(activeId);
  const out: VisiblePlay[] = [];
  for (let i = 0; i < idx; i++) {
    const pid = order[i];
    const pl = state.players.find((p) => p.id === pid)!;
    out.push({
      playerId: pid,
      name: pl.name,
      cardsPlayed: pl.posed.length,
      hiddenNumbered: pl.posed.filter((c) => c.kind === "numbered").length,
      visibleSpecials: pl.posed
        .filter((c) => c.kind === "special")
        .map((c) => state.rules.specialLabels[c.special]),
    });
  }
  return out;
}

function rulesBrief(state: GameState): string {
  const r = state.rules;
  const combos = Object.entries(r.comboLabels)
    .sort((a, b) => r.comboRank[a[0] as keyof typeof r.comboRank] - r.comboRank[b[0] as keyof typeof r.comboRank])
    .map(([, label]) => label)
    .join(", ");
  return [
    `Pose ${r.playMin} à ${r.playMax} cartes par tour, séquentiellement (donneur en premier).`,
    `Combos possibles : ${combos}.`,
    `Spéciales : ${Object.values(r.specialLabels).join(", ")}.`,
    r.tuning.bluffJokerColor ? "Bluff = joker couleur + badge visible ★." : "Bluff = badge visible ★ sans effet combo.",
    r.tuning.winnerCapturesCommons ? "Le vainqueur capture les communes." : "Les communes ne sont pas capturées.",
  ].join(" ");
}

export function projectObservation(state: GameState, playerId: number): AgentObservation {
  const player = state.players.find((p) => p.id === playerId)!;
  const order = playOrder(state);
  const seatInOrder = order.indexOf(playerId) + 1;

  const lastTrick =
    state.lastWinnerIds.length > 0
      ? {
          winnerNames: state.lastWinnerIds.map(
            (id) => state.players.find((p) => p.id === id)?.name ?? "?",
          ),
          combos: Object.fromEntries(
            Object.entries(state.lastCombos).map(([id, combo]) => [
              state.players.find((p) => p.id === Number(id))?.name ?? id,
              combo ? comboDescription(combo) : "—",
            ]),
          ),
        }
      : undefined;

  return {
    playerId,
    playerName: player.name,
    turn: state.turn,
    phase: state.phase,
    dealerId: state.dealerId,
    seatInOrder,
    playerCount: state.players.length,
    hand: [...player.hand],
    handFormatted: formatCards(player.hand, state.rules),
    commons: [...state.commons],
    commonsFormatted: formatCards(state.commons, state.rules),
    prisme: state.prisme,
    inversion: state.inversion,
    deckRemaining: state.deck.length,
    visiblePlays: visiblePlaysFor(state, playerId),
    tableSummary: visibleTableSummary(state, playerId),
    scoresEstimate: state.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      pilePoints: pilePoints(p.pointsPile, state.rules),
      tricksWon: p.tricksWon,
    })),
    playMin: state.rules.playMin,
    playMax: state.rules.playMax,
    legalCardIds: player.hand.map((c) => c.id),
    legalCardOptions: player.hand.map((c) => ({ id: c.id, label: formatCard(c, state.rules) })),
    echangeTargets: state.players
      .filter((p) => p.id !== playerId)
      .map((p) => ({ playerId: p.id, name: p.name })),
    rulesBrief: rulesBrief(state),
    lastTrick,
  };
}

export function observationToPromptText(obs: AgentObservation): string {
  const lines = [
    `Tour ${obs.turn} · ${obs.playerName} · pose n°${obs.seatInOrder}/${obs.playerCount}`,
    `Main : ${obs.handFormatted}`,
    `Communes : ${obs.commonsFormatted}`,
    obs.prisme ? "Prisme actif ce tour." : "",
    obs.inversion ? "Inversion active ce tour." : "",
    `Pioche restante : ${obs.deckRemaining}`,
    `Table : ${obs.tableSummary}`,
    "Scores estimés (piles) : " +
      obs.scoresEstimate.map((s) => `${s.name}=${s.pilePoints}pts/${s.tricksWon}plis`).join(" · "),
  ].filter(Boolean);

  if (obs.lastTrick) {
    lines.push(
      `Pli précédent : ${obs.lastTrick.winnerNames.join(", ")} gagnent · combos ${JSON.stringify(obs.lastTrick.combos)}`,
    );
  }

  lines.push("", "Cartes jouables (id → label) :");
  for (const opt of obs.legalCardOptions) lines.push(`- ${opt.id} → ${opt.label}`);
  lines.push("", `Choisir ${obs.playMin} à ${obs.playMax} ids distincts.`);

  if (obs.echangeTargets.length) {
    lines.push("", "Cibles Échange possibles :");
    for (const t of obs.echangeTargets) lines.push(`- playerId ${t.playerId} → ${t.name}`);
  }

  return lines.join("\n");
}
