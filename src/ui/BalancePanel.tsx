import { defaultRules, cloneRules } from "../rules/defaultRules";
import type { ComboKind, RulesConfig, SpecialKind } from "../engine/types";
import { COMBO_KINDS, SPECIAL_KINDS } from "../engine/types";

type Props = {
  draft: RulesConfig;
  onChange: (next: RulesConfig) => void;
  onApply: () => void;
};

export function BalancePanel({ draft, onChange, onApply }: Props) {
  const set = (patch: Partial<RulesConfig>) => onChange({ ...draft, ...patch });

  return (
    <aside className="panel">
      <header>
        <h2>Équilibrage</h2>
        <p>Appliquer relance une nouvelle partie.</p>
      </header>

      <section>
        <h3>Pose</h3>
        <label>
          Min
          <input
            type="number"
            min={1}
            max={draft.playMax}
            value={draft.playMin}
            onChange={(e) => set({ playMin: Number(e.target.value) })}
          />
        </label>
        <label>
          Max
          <input
            type="number"
            min={draft.playMin}
            max={6}
            value={draft.playMax}
            onChange={(e) => set({ playMax: Number(e.target.value) })}
          />
        </label>
      </section>

      <section>
        <h3>Copies des spéciales</h3>
        {SPECIAL_KINDS.map((kind: SpecialKind) => (
          <label key={kind}>
            {draft.specialLabels[kind]}
            <input
              type="number"
              min={0}
              max={20}
              value={draft.specialCopies[kind]}
              onChange={(e) =>
                set({
                  specialCopies: { ...draft.specialCopies, [kind]: Number(e.target.value) },
                })
              }
            />
          </label>
        ))}
      </section>

      <section>
        <h3>Distribution</h3>
        {draft.distribution.map((row, i) => (
          <div className="dist-row" key={row.players}>
            <span>{row.players}j</span>
            <label>
              main
              <input
                type="number"
                min={1}
                max={12}
                value={row.handSize}
                onChange={(e) => {
                  const distribution = draft.distribution.map((d, j) =>
                    j === i ? { ...d, handSize: Number(e.target.value) } : d,
                  );
                  set({ distribution });
                }}
              />
            </label>
            <label>
              communes
              <input
                type="number"
                min={1}
                max={8}
                value={row.commonsPerTurn}
                onChange={(e) => {
                  const distribution = draft.distribution.map((d, j) =>
                    j === i ? { ...d, commonsPerTurn: Number(e.target.value) } : d,
                  );
                  set({ distribution });
                }}
              />
            </label>
          </div>
        ))}
      </section>

      <section>
        <h3>Rangs des combinaisons</h3>
        {COMBO_KINDS.map((kind: ComboKind) => (
          <label key={kind}>
            {draft.comboLabels[kind]}
            <input
              type="number"
              min={1}
              max={200}
              value={draft.comboRank[kind]}
              onChange={(e) =>
                set({ comboRank: { ...draft.comboRank, [kind]: Number(e.target.value) } })
              }
            />
          </label>
        ))}
      </section>

      <section>
        <h3>Paliers numérotés (pts)</h3>
        {draft.numberedTiers.map((tier, i) => (
          <div className="dist-row" key={i}>
            <label>
              {tier.min}–{tier.max}
              <input
                type="number"
                min={0}
                max={10}
                value={tier.points}
                onChange={(e) => {
                  const numberedTiers = draft.numberedTiers.map((t, j) =>
                    j === i ? { ...t, points: Number(e.target.value) } : t,
                  );
                  set({ numberedTiers });
                }}
              />
            </label>
          </div>
        ))}
      </section>

      <section>
        <h3>Points spéciales</h3>
        {SPECIAL_KINDS.map((kind: SpecialKind) => (
          <label key={kind}>
            {draft.specialLabels[kind]}
            <input
              type="number"
              min={0}
              max={10}
              value={draft.specialPoints[kind]}
              onChange={(e) =>
                set({
                  specialPoints: { ...draft.specialPoints, [kind]: Number(e.target.value) },
                })
              }
            />
          </label>
        ))}
      </section>

      <section>
        <h3>Bonus de fin</h3>
        <label>
          Plus de plis
          <input
            type="number"
            value={draft.bonusMostTricks}
            onChange={(e) => set({ bonusMostTricks: Number(e.target.value) })}
          />
        </label>
        <label>
          Meilleure main finale
          <input
            type="number"
            value={draft.bonusBestFinalHand}
            onChange={(e) => set({ bonusBestFinalHand: Number(e.target.value) })}
          />
        </label>
        <label>
          3 derniers plis
          <input
            type="number"
            value={draft.bonusUnbeatenLast3}
            onChange={(e) => set({ bonusUnbeatenLast3: Number(e.target.value) })}
          />
        </label>
      </section>

      <footer className="panel-actions">
        <button type="button" onClick={() => onChange(cloneRules(defaultRules))}>
          Livret
        </button>
        <button type="button" className="primary" onClick={onApply}>
          Appliquer (nouvelle partie)
        </button>
      </footer>
    </aside>
  );
}
