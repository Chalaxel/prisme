import type { Card, RulesConfig } from "../engine/types";

type Props = {
  card: Card;
  rules: RulesConfig;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  small?: boolean;
};

export function CardView({ card, rules, selected, faceDown, onClick, small }: Props) {
  const color = rules.colors.find((c) => c.id === card.color);
  const hex = color?.hex ?? "#888";
  const name = color?.name ?? card.color;

  if (faceDown) {
    return (
      <button
        type="button"
        className={`card back ${small ? "small" : ""}`}
        disabled={!onClick}
        onClick={onClick}
      >
        <span>PRISME</span>
      </button>
    );
  }

  const label = card.kind === "numbered" ? String(card.value) : rules.specialLabels[card.special];
  return (
    <button
      type="button"
      className={`card ${card.kind} ${small ? "small" : ""} ${selected ? "selected" : ""}`}
      style={{ "--card-color": hex } as React.CSSProperties}
      onClick={onClick}
    >
      <strong>{label}</strong>
      <em>{name}</em>
    </button>
  );
}
