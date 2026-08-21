import { comboDescription } from "../../engine/combinations";
import type { GameState } from "../../engine/types";

export type TrickMemory = {
  turn: number;
  winnerNames: string[];
  myPlayed: string;
  myCombo: string | null;
  iWon: boolean;
  visibleSignals: string[];
  opponentPlays: { name: string; cards: number; visibleSpecials: string[] }[];
};

export type AgentMemory = {
  tricks: TrickMemory[];
  opponentNotes: Record<number, string[]>;
  selfNotes: string[];
};

export function emptyMemory(): AgentMemory {
  return { tricks: [], opponentNotes: {}, selfNotes: [] };
}

export function memorySummary(memory: AgentMemory, maxTricks = 5): string {
  const lines: string[] = [];
  const recent = memory.tricks.slice(-maxTricks);
  if (recent.length) {
    lines.push("Historique récent :");
    for (const t of recent) {
      lines.push(
        `- Tour ${t.turn} : ${t.iWon ? "gagné" : "perdu"} · posé ${t.myPlayed} · combo ${t.myCombo ?? "?"} · vainqueur ${t.winnerNames.join(", ")}`,
      );
      if (t.visibleSignals.length) lines.push(`  Signaux : ${t.visibleSignals.join("; ")}`);
    }
  }

  const notes = Object.entries(memory.opponentNotes).flatMap(([pid, arr]) =>
    arr.slice(-2).map((n) => `- J${Number(pid) + 1} : ${n}`),
  );
  if (notes.length) {
    lines.push("", "Notes adverses :", ...notes);
  }

  if (memory.selfNotes.length) {
    lines.push("", "Mes intentions :", ...memory.selfNotes.slice(-3).map((n) => `- ${n}`));
  }

  return lines.length ? lines.join("\n") : "Première partie — pas encore d'historique.";
}

export function recordTrickReveal(
  memory: AgentMemory,
  state: GameState,
  playerId: number,
  myPlayedLabel: string,
): AgentMemory {
  const iWon = state.lastWinnerIds.includes(playerId);
  const myComboObj = state.lastCombos[playerId];
  const myComboDesc = myComboObj ? comboDescription(myComboObj) : null;
  const opponentPlays = state.players
    .filter((p) => p.id !== playerId)
    .map((p) => ({
      name: p.name,
      cards: p.posed.length,
      visibleSpecials: p.posed
        .filter((c) => c.kind === "special")
        .map((c) => state.rules.specialLabels[c.special]),
    }));

  const visibleSignals = opponentPlays
    .filter((p) => p.visibleSpecials.length)
    .map((p) => `${p.name} avait ${p.visibleSpecials.join(", ")} visible`);

  const trick: TrickMemory = {
    turn: state.turn,
    winnerNames: state.lastWinnerIds.map((id) => state.players.find((p) => p.id === id)?.name ?? "?"),
    myPlayed: myPlayedLabel,
    myCombo: myComboDesc,
    iWon,
    visibleSignals,
    opponentPlays,
  };

  const opponentNotes = { ...memory.opponentNotes };
  for (const opp of opponentPlays) {
    const oppPlayer = state.players.find((p) => p.name === opp.name);
    if (!oppPlayer) continue;
    const notes = [...(opponentNotes[oppPlayer.id] ?? [])];
    if (opp.visibleSpecials.includes(state.rules.specialLabels.bluff)) {
      notes.push(`Tour ${state.turn} : a posé un Bluff visible (${iWon ? "j'ai quand même gagné" : "attention"})`);
    }
    if (opp.cards >= 3 && !iWon) {
      notes.push(`Tour ${state.turn} : grosse mise (${opp.cards} cartes)`);
    }
    opponentNotes[oppPlayer.id] = notes.slice(-6);
  }

  const selfNotes = [...memory.selfNotes];
  if (myComboDesc?.includes("Arc-en-ciel")) {
    selfNotes.push(`Tour ${state.turn} : Arc-en-ciel tenté`);
  }

  return {
    tricks: [...memory.tricks, trick].slice(-12),
    opponentNotes,
    selfNotes: selfNotes.slice(-8),
  };
}
