import { useMemo, useReducer, useState } from "react";
import {
  canConfirmPlay,
  finalScores,
  initialState,
  reduce,
  selectedHasEchange,
} from "../engine/game";
import { comboDescription } from "../engine/combinations";
import { pilePoints } from "../engine/score";
import { cloneRules, defaultRules } from "../rules/defaultRules";
import { BalancePanel } from "./BalancePanel";
import { CardView } from "./CardView";

export default function App() {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [draft, setDraft] = useState(() => cloneRules(defaultRules));
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["Joueur 1", "Joueur 2", "Joueur 3", "Joueur 4", "Joueur 5", "Joueur 6"]);
  const [panel, setPanel] = useState(true);

  const active = state.players.find((p) => p.id === state.activePlayerId);
  const needsEchange = selectedHasEchange(state);
  const scores = useMemo(() => (state.phase === "gameOver" ? finalScores(state) : null), [state]);

  const start = (rules = draft) => {
    dispatch({
      type: "start",
      rules: cloneRules(rules),
      names: names.slice(0, count).map((n, i) => n.trim() || `Joueur ${i + 1}`),
    });
  };

  return (
    <div className={`app ${panel ? "with-panel" : ""}`}>
      <div className="board">
        <header className="topbar">
          <div>
            <p className="kicker">Prototype d’équilibrage</p>
            <h1>PRISME</h1>
          </div>
          <div className="top-actions">
            {state.phase !== "lobby" && (
              <span className="meta">
                Tour {state.turn} · Pioche {state.deck.length}
                {state.prisme ? " · PRISME" : ""}
                {state.inversion ? " · INVERSION" : ""}
              </span>
            )}
            <button type="button" onClick={() => setPanel((v) => !v)}>
              {panel ? "Masquer les règles" : "Équilibrage"}
            </button>
            {state.phase !== "lobby" && (
              <button type="button" onClick={() => dispatch({ type: "backToLobby" })}>
                Accueil
              </button>
            )}
          </div>
        </header>

        {state.phase === "lobby" && (
          <section className="lobby">
            <p>Hot-seat, 2 à 6 joueurs. Passez-vous l’écran à chaque pose.</p>
            <label>
              Joueurs
              <input
                type="number"
                min={2}
                max={6}
                value={count}
                onChange={(e) => setCount(Math.min(6, Math.max(2, Number(e.target.value))))}
              />
            </label>
            {names.slice(0, count).map((name, i) => (
              <label key={i}>
                Nom {i + 1}
                <input
                  value={name}
                  onChange={(e) =>
                    setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))
                  }
                />
              </label>
            ))}
            <button type="button" className="primary" onClick={() => start()}>
              Nouvelle partie
            </button>
          </section>
        )}

        {state.phase !== "lobby" && (
          <>
            <section className="commons">
              <h2>Communes</h2>
              <div className="row">
                {state.commons.map((card) => (
                  <CardView key={card.id} card={card} rules={state.rules} />
                ))}
                {!state.commons.length && <p className="muted">Aucune (entre deux plis)</p>}
              </div>
            </section>

            <section className="seats">
              {state.players.map((p) => (
                <article
                  key={p.id}
                  className={`seat ${p.id === state.activePlayerId ? "active" : ""} ${state.lastWinnerIds.includes(p.id) ? "winner" : ""}`}
                >
                  <h3>
                    {p.name}
                    <small>
                      {pilePoints(p.pointsPile, state.rules)} pts · {p.tricksWon} pli
                      {p.tricksWon > 1 ? "s" : ""} · {p.hand.length} en main
                    </small>
                  </h3>
                  {(() => {
                    const hidden = state.phase === "play" || state.phase === "curtain";
                    const numbered = p.posed.filter((c) => c.kind === "numbered");
                    const specials = p.posed.filter((c) => c.kind === "special");
                    return (
                      <div className="posed-area">
                        {specials.length > 0 && (
                          <div className="posed-stack special-stack" aria-label="Cartes spéciales posées">
                            {specials.map((card) => (
                              <CardView
                                key={card.id}
                                card={card}
                                rules={state.rules}
                                small
                                faceDown={hidden}
                                hiddenSpecial={hidden}
                              />
                            ))}
                          </div>
                        )}
                        <div className="posed-stack main-stack row">
                          {numbered.map((card) => (
                            <CardView
                              key={card.id}
                              card={card}
                              rules={state.rules}
                              small
                              faceDown={hidden}
                            />
                          ))}
                          {!hidden && state.lastCombos[p.id] && (
                            <span className="combo-tag">{comboDescription(state.lastCombos[p.id])}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </article>
              ))}
            </section>
          </>
        )}

        {state.phase === "play" && active && (
          <section className="hand-dock">
            <h2>Main de {active.name}</h2>
            <p>
              Pose {state.rules.playMin} à {state.rules.playMax} cartes. Tout reste caché jusqu’à la
              révélation, spéciales incluses.
            </p>
            <div className="row">
              {active.hand.map((card) => (
                <CardView
                  key={card.id}
                  card={card}
                  rules={state.rules}
                  selected={state.pendingPlay.includes(card.id)}
                  onClick={() => dispatch({ type: "toggleCard", cardId: card.id })}
                />
              ))}
            </div>
            {needsEchange && (
              <label>
                Cible de l’échange (à l’aveugle)
                <select
                  value={state.pendingTarget ?? ""}
                  onChange={(e) => dispatch({ type: "setTarget", playerId: Number(e.target.value) })}
                >
                  <option value="">Choisir…</option>
                  {state.players
                    .filter((p) => p.id !== active.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <button
              type="button"
              className="primary"
              disabled={!canConfirmPlay(state)}
              onClick={() => dispatch({ type: "confirmPlay" })}
            >
              Poser
            </button>
          </section>
        )}

        {state.phase === "reveal" && (
          <section className="hand-dock">
            <h2>Révélation</h2>
            <p>Combinaisons calculées après la pose. Résolvez les pouvoirs puis le pli.</p>
            <button type="button" className="primary" onClick={() => dispatch({ type: "acknowledgeReveal" })}>
              Résoudre le pli
            </button>
          </section>
        )}

        {state.phase === "resolved" && (
          <section className="hand-dock">
            <h2>Pli résolu</h2>
            <p>{state.log.slice(-4).join(" · ")}</p>
            <button type="button" className="primary" onClick={() => dispatch({ type: "nextTurn" })}>
              Tour suivant
            </button>
          </section>
        )}

        {state.phase === "gameOver" && scores && (
          <section className="hand-dock">
            <h2>Fin de partie</h2>
            <p>{state.gameOverReason}</p>
            <table>
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>Pile</th>
                  <th>Bonus plis</th>
                  <th>Bonus main</th>
                  <th>Bonus 3 derniers</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {scores.scores.map((s) => (
                  <tr key={s.playerId} className={scores.winners.includes(s.playerId) ? "winner" : ""}>
                    <td>{s.name}</td>
                    <td>{s.pile}</td>
                    <td>{s.bonusTricks}</td>
                    <td>{s.bonusHand}</td>
                    <td>{s.bonusLast3}</td>
                    <td>
                      <strong>{s.total}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              {scores.winners.length > 1 ? "Victoire partagée : " : "Vainqueur : "}
              {scores.winners.map((id) => state.players.find((p) => p.id === id)?.name).join(", ")}
            </p>
            <button type="button" className="primary" onClick={() => start(state.rules)}>
              Rejouer
            </button>
          </section>
        )}

        {state.log.length > 0 && state.phase !== "lobby" && (
          <section className="journal">
            <h2>Journal</h2>
            <ol>
              {state.log.slice(-16).map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {panel && (
        <BalancePanel
          draft={draft}
          onChange={setDraft}
          onApply={() => start(draft)}
        />
      )}

      {state.phase === "curtain" && state.curtainFor !== null && (
        <div className="curtain">
          <div>
            <p>Passez l’écran à</p>
            <h2>{state.players.find((p) => p.id === state.curtainFor)?.name}</h2>
            <button type="button" className="primary" onClick={() => dispatch({ type: "confirmCurtain" })}>
              C’est moi — montrer ma main
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
