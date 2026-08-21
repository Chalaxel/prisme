import { comboDescription } from "../engine/combinations";
import type { LlmTracedGame } from "./asyncTracedGame";
import { formatCards, formatCombo } from "./cardFormat";
import { PERSONALITIES } from "./agents/personalities";

function agentTable(game: LlmTracedGame): string {
  const rows = game.agents.map((a, i) => {
    const p = PERSONALITIES[a.personalityId];
    return `| ${i + 1} | ${a.name} | ${p?.displayName ?? a.personalityId} | ${game.llmProvider} |`;
  });
  return [
    "| Siège | Joueur | Personnalité | Moteur |",
    "|-------|--------|--------------|--------|",
    ...rows,
  ].join("\n");
}

export function formatLlmTurnMarkdown(
  turn: LlmTracedGame["turns"][0],
  rules: LlmTracedGame["rules"],
): string {
  const mods = turn.modifiers.length ? turn.modifiers.join(", ") : "Aucun modificateur global";
  const lines: string[] = [
    `### Tour ${turn.turn} — donneur : ${turn.dealerName}`,
    "",
    `- **Pioche restante** : ${turn.deckRemaining} cartes`,
    `- **Communes** : ${formatCards(turn.commons, rules)}`,
    `- **Modificateurs** : ${mods}`,
    "",
    "#### Séquence de pose (agents IA)",
    "",
  ];

  for (const play of turn.plays) {
    lines.push(`##### ${play.playerName} (pose n°${play.seatInOrder})`);
    lines.push("");
    if (play.memoryBefore) {
      lines.push("<details>");
      lines.push("<summary>Mémoire avant coup</summary>");
      lines.push("");
      lines.push(play.memoryBefore);
      lines.push("");
      lines.push("</details>");
      lines.push("");
    }
    lines.push(`- **Main** : ${formatCards(play.handBefore, rules)}`);
    lines.push(`- **Table visible** : ${play.visibleBeforePlay}`);
    lines.push(`- **Stratégie** : *${play.decision.strategy}*`);
    lines.push(`- **Cartes jouées** : ${formatCards(play.cardsPlayed, rules)}`);
    if (play.decision.opponentRead) {
      lines.push(`- **Lecture adverse** : ${play.decision.opponentRead}`);
    }
    if (play.decision.confidence !== undefined) {
      lines.push(`- **Confiance** : ${(play.decision.confidence * 100).toFixed(0)} %`);
    }
    if (play.deliberationMs !== undefined) {
      lines.push(`- **Délibération** : ${play.deliberationMs} ms`);
    }
    if (play.decision.llmMeta?.fallback) {
      lines.push(`- **Note** : repli heuristique (réponse LLM invalide ou erreur)`);
    }
    lines.push("");
    lines.push("**Commentaire IA :**");
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

  return lines.join("\n");
}

export function formatLlmTracedGameMarkdown(game: LlmTracedGame): string {
  const rulesLabel = game.rules.variantLabel ?? "default";
  const tuning = game.rules.tuning;

  const lines: string[] = [
    "# Simulation PRISME — agents IA",
    "",
    `- **Seed** : ${game.seed}`,
    `- **Variante** : ${rulesLabel}`,
    `- **Moteur IA** : ${game.llmProvider} · modèle ${game.llmModel}`,
    `- **Appels IA** : ${game.stats.llmCalls} · replis ${game.stats.fallbacks} · ${game.stats.totalDeliberationMs} ms total`,
    "",
    "## Agents",
    "",
    agentTable(game),
    "",
    "## Réglages",
    "",
    "| Paramètre | Valeur |",
    "|-----------|--------|",
    `| Capture communes | ${tuning.winnerCapturesCommons ? "oui" : "non"} |`,
    `| Bluff joker | ${tuning.bluffJokerColor ? "oui" : "non"} |`,
    "",
    "## Déroulé",
    "",
  ];

  for (const turn of game.turns) {
    lines.push(formatLlmTurnMarkdown(turn, game.rules));
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
  lines.push("| Joueur | Total | Pile | Plis |");
  lines.push("|--------|-------|------|------|");
  for (const s of game.report.scores) {
    lines.push(`| ${s.name} | ${s.total} | ${s.pile} | ${s.tricks} |`);
  }
  lines.push("");
  lines.push(`Écart 1er–dernier : **${game.report.scoreSpread}** pts`);

  return lines.join("\n");
}

export function llmTraceOutputPath(seed: number, variant: string, provider: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeVariant = variant.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  return `docs/simulations/${date}_llm_${provider}_seed${seed}_${safeVariant}.md`;
}
