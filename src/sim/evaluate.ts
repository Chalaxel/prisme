import { finalScores } from "../engine/game";
import { pilePoints } from "../engine/score";
import type { GameState, RulesConfig } from "../engine/types";
import type { DesignInsight, GameReport } from "./metrics";

export function evaluateGameState(state: GameState): DesignInsight[] {
  if (state.phase === "lobby") {
    return [{ severity: "info", topic: "État", message: "Partie non démarrée." }];
  }

  const rules = state.rules;
  const insights: DesignInsight[] = [];
  const piles = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    pile: pilePoints(p.pointsPile, rules),
    tricks: p.tricksWon,
    hand: p.hand.length,
    last3: p.lastTricks.slice(-3),
  }));

  const pileLeader = [...piles].sort((a, b) => b.pile - a.pile)[0];
  const trickLeader = [...piles].sort((a, b) => b.tricks - a.tricks)[0];
  const deckRatio = state.deck.length / Math.max(state.turn * 4, 1);

  insights.push({
    severity: "info",
    topic: "Phase",
    message: `Tour ${state.turn}, phase « ${state.phase} », pioche ${state.deck.length} cartes (~${deckRatio.toFixed(1)} tours restants estimés).`,
  });

  if (pileLeader.pile - piles.map((p) => p.pile).sort((a, b) => a - b)[0] >= 10) {
    insights.push({
      severity: "warn",
      topic: "Écart pile",
      message: `${pileLeader.name} mène la pile (${pileLeader.pile} pts) avec un écart déjà marqué — le snowball est en train de se former.`,
    });
  }

  if (trickLeader.tricks >= Math.ceil(state.turn / state.players.length) + 1) {
    insights.push({
      severity: "info",
      topic: "Bonus plis",
      message: `${trickLeader.name} domine les plis (${trickLeader.tricks}) et vise le bonus +${rules.bonusMostTricks}.`,
    });
  }

  const unbeatenCandidates = piles.filter(
    (p) => p.last3.length === 3 && p.last3.every(Boolean),
  );
  if (unbeatenCandidates.length) {
    insights.push({
      severity: "info",
      topic: "Bonus 3 plis",
      message: `${unbeatenCandidates.map((p) => p.name).join(", ")} invaincu(s) sur les 3 derniers plis (+${rules.bonusUnbeatenLast3} en vue).`,
    });
  }

  if (state.prisme) {
    insights.push({
      severity: "warn",
      topic: "Prisme",
      message: "Prisme actif : seules Couleur / Couleur royale / Prismale décident du pli en cours.",
    });
  }

  if (state.inversion) {
    insights.push({
      severity: "info",
      topic: "Inversion",
      message: "Inversion active : les faibles valeurs (1–4) deviennent des atouts.",
    });
  }

  if (state.phase === "gameOver") {
    const { scores, winners } = finalScores(state);
    const winnerNames = winners.map((id) => state.players.find((p) => p.id === id)?.name).join(", ");
    const totals = scores.map((s) => s.total);
    const spread = Math.max(...totals) - Math.min(...totals);
    insights.push({
      severity: spread <= 8 ? "info" : "warn",
      topic: "Résultat",
      message: `Vainqueur(s) : ${winnerNames}. Écart final ${spread} pts.`,
    });
  }

  return insights;
}

export function evaluateGameReport(report: GameReport, rules: RulesConfig): DesignInsight[] {
  const insights: DesignInsight[] = [];
  const spread = report.scoreSpread;
  const winner = report.scores.find((s) => report.winnerIds.includes(s.playerId));

  insights.push({
    severity: spread <= 8 ? "info" : spread >= 25 ? "alert" : "warn",
    topic: "Écart final",
    message: `Écart ${spread} pts entre premier et dernier${winner ? ` (${winner.name} : ${winner.total} pts)` : ""}.`,
  });

  if (report.tricks.length >= 4) {
    const mid = report.tricks[Math.floor(report.tricks.length / 2) - 1];
    const leaderAtMid = mid.pilePoints.indexOf(Math.max(...mid.pilePoints));
    const leaderWon = report.winnerIds.includes(leaderAtMid);
    insights.push({
      severity: leaderWon ? "warn" : "info",
      topic: "Comeback",
      message: leaderWon
        ? `Le leader à mi-partie (${report.scores[leaderAtMid]?.name}) a gagné — peu de retournement.`
        : `Le leader à mi-partie a perdu — la partie a basculé.`,
    });
  }

  const comboCounts = new Map<string, number>();
  for (const trick of report.tricks) {
    for (const id of trick.winnerIds) {
      const combo = trick.combos[id];
      if (combo) comboCounts.set(combo.kind, (comboCounts.get(combo.kind) ?? 0) + 1);
    }
  }
  const topCombo = [...comboCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCombo) {
    insights.push({
      severity: "info",
      topic: "Combos",
      message: `Combo gagnante la plus fréquente : ${rules.comboLabels[topCombo[0] as keyof typeof rules.comboLabels]} (${topCombo[1]} plis).`,
    });
  }

  return insights;
}

export function formatEvaluation(insights: DesignInsight[]): string {
  return insights.map((i) => `[${i.topic}] ${i.message}`).join("\n");
}
