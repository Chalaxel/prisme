import type { Card, RulesConfig } from "../engine/types";

type Props = {
  card: Card;
  rules: RulesConfig;
  selected?: boolean;
  faceDown?: boolean;
  hiddenSpecial?: boolean;
  onClick?: () => void;
  small?: boolean;
};

export function CardView({ card, rules, selected, faceDown, hiddenSpecial, onClick, small }: Props) {
  const color = rules.colors.find((c) => c.id === card.color);
  const hex = color?.hex ?? "#888";
  const name = color?.name ?? card.color;

  if (faceDown) {
    const isHiddenSpecial = hiddenSpecial ?? card.kind === "special";
    return (
      <button
        type="button"
        className={`card back ${isHiddenSpecial ? "special-back" : ""} ${small ? "small" : ""}`}
        disabled={!onClick}
        onClick={onClick}
        aria-label={isHiddenSpecial ? "Carte spéciale cachée" : "Carte cachée"}
      >
        <span>{isHiddenSpecial ? "★" : "PRISME"}</span>
        {isHiddenSpecial && <em>Spéciale</em>}
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
