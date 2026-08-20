import { comboDescription } from "../engine/combinations";
import type { TracedGame } from "./tracedGame";
import { formatCards, formatCombo } from "./cardFormat";

function agentTable(game: TracedGame): string {
  const rows = game.agents.map((a, i) => `| ${i + 1} | ${a.name} | ${a.kind} |`);
  return ["| Siège | Agent | Type |", "|-------|-------|------|", ...rows].join("\n");
}

export function formatTurnMarkdown(turn: TracedGame["turns"][0], rules: TracedGame["rules"]): string {
  const mods = turn.modifiers.length ? turn.modifiers.join(", ") : "Aucun modificateur global";
  const lines: string[] = [
    `### Tour ${turn.turn} — donneur : ${turn.dealerName}`,
    "",
    `- **Pioche restante** : ${turn.deckRemaining} cartes`,
    `- **Communes** : ${formatCards(turn.commons, rules)}`,
    `- **Modificateurs** : ${mods}`,
    "",
    "#### Séquence de pose",
    "",
  ];

  for (const play of turn.plays) {
    lines.push(`##### ${play.playerName} (pose n°${play.seatInOrder})`);
    lines.push("");
    lines.push(`- **Main avant coup** : ${formatCards(play.handBefore, rules)}`);
    lines.push(`- **Table visible** : ${play.visibleBeforePlay}`);
    lines.push(`- **Stratégie** : *${play.decision.strategy}*`);
    lines.push(`- **Cartes jouées** : ${formatCards(play.cardsPlayed, rules)}`);
    if (play.decision.target !== null) {
      const targetPlayer = turn.plays.find((p) => p.playerId === play.decision.target);
      const targetLabel = targetPlayer?.playerName ?? `Joueur ${play.decision.target + 1}`;
      lines.push(`- **Cible Échange** : ${targetLabel}`);
    }
    lines.push("");
    lines.push("**Commentaire de l'agent :**");
    lines.push("");
    lines.push(play.decision.reasoning);
    lines.push("");
  }

  lines.push("#### Résolution du pli");
  lines.push("");
  for (const play of turn.plays) {
    const combo = turn.combos[play.playerId];
    lines.push(
      `- **${play.playerName}** → ${formatCombo(combo)} (${combo ? comboDescription(combo) : "—"})`,
    );
  }
  lines.push("");
  lines.push(`- **Vainqueur(s)** : ${turn.winnerName}`);
  lines.push(`- **Capture** : ${turn.captureSummary}`);
  lines.push(
    `- **Points cumulés (piles)** : ${turn.pilePointsAfter.map((pts, i) => `J${i + 1}=${pts}`).join(" · ")}`,
  );

  if (turn.logExcerpt.length) {
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Extraits du journal moteur</summary>");
    lines.push("");
    for (const line of turn.logExcerpt) lines.push(`- ${line}`);
    lines.push("");
    lines.push("</details>");
  }

  return lines.join("\n");
}

export function formatTracedGameMarkdown(game: TracedGame): string {
  const rulesLabel = game.rules.variantLabel ?? "default";
  const tuning = game.rules.tuning;

  const lines: string[] = [
    "# Simulation PRISME — trace tour par tour",
    "",
    "> Agents heuristiques explicables : chaque coup est commenté en français.",
    "> Ce n'est pas un appel LLM externe — la logique est reproductible et auditable.",
    "",
    `- **Seed** : ${game.seed}`,
    `- **Variante** : ${rulesLabel}`,
    `- **Tours joués** : ${game.turns.length}`,
    "",
    "## Agents",
    "",
    agentTable(game),
    "",
    "## Réglages testés",
    "",
    "| Paramètre | Valeur |",
    "|-----------|--------|",
    `| Pioche vainqueur en premier | ${tuning.drawWinnerFirst ? "oui" : "non"} |`,
    `| Prisme global (communes) | ${tuning.globalPrisme ? "oui" : "non"} |`,
    `| Inversion globale | ${tuning.globalInversion ? "oui" : "non"} |`,
    `| Bluff joker couleur | ${tuning.bluffJokerColor ? "oui" : "non"} |`,
    `| Capture des communes | ${tuning.winnerCapturesCommons ? "oui" : "non"} |`,
    "",
    "## Déroulé",
    "",
  ];

  for (const turn of game.turns) {
    lines.push(formatTurnMarkdown(turn, game.rules));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## Bilan final");
  lines.push("");
  const winNames = game.report.winnerIds
    .map((id) => game.report.scores.find((s) => s.playerId === id)?.name)
    .filter(Boolean)
    .join(", ");
  lines.push(`**Vainqueur(s)** : ${winNames}`);
  lines.push("");
  lines.push("| Joueur | Total | Pile | Plis | Bonus plis | Bonus main | Bonus last3 |");
  lines.push("|--------|-------|------|------|--------------|------------|-------------|");
  for (const s of game.report.scores) {
    lines.push(
      `| ${s.name} | ${s.total} | ${s.pile} | ${s.tricks} | ${s.bonusTricks} | ${s.bonusHand} | ${s.bonusLast3} |`,
    );
  }
  lines.push("");
  lines.push(`Écart 1er–dernier : **${game.report.scoreSpread}** pts · seed ${game.report.seed}`);

  return lines.join("\n");
}

export function traceOutputPath(seed: number, variant: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeVariant = variant.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  return `docs/simulations/${date}_seed${seed}_${safeVariant}.md`;
}
