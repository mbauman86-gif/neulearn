/**
 * CurrencyStrip — three-pill chrome element showing the kid's earned reward currencies.
 *
 *   Depth   (tree-roots / moss green) — stick-with-it / mastery
 *   Explore (compass-rose / slate)    — variety / new topics
 *   Comeback (returning bird / amber) — courage to return to skipped items
 *
 * Per .stitch/DESIGN.md §7.5. The mix of currencies a kid earns is itself a temperament
 * signal that feeds back into the engine — the strip isn't decoration.
 *
 * NOTE: Phosphor / lucide-react icons are used as semantic placeholders. Custom-drawn
 * icons (tree-roots, compass-rose, returning-bird) are pending — see DESIGN.md §7.5.
 */
import { Compass, Bird, Sprout } from "lucide-react";

export interface CurrencyStripProps {
  readonly depth: number;
  readonly explore: number;
  readonly comeback: number;
  readonly onTap?: () => void;
  /** Compact mode for Wise register (smaller pill, smaller numbers). */
  readonly compact?: boolean;
}

export function CurrencyStrip({
  depth,
  explore,
  comeback,
  onTap,
  compact = false,
}: CurrencyStripProps) {
  const containerClasses = compact
    ? "flex items-center gap-2 bg-nl-raised/50 px-2 py-1 rounded-full"
    : "flex items-center gap-3 bg-nl-raised/50 px-3 py-1.5 rounded-full";
  const iconSize = compact ? 16 : 18;
  const numberClasses = compact ? "text-[11px] font-bold" : "text-[13px] font-bold";

  const Pill = ({
    icon,
    value,
    color,
    label,
  }: {
    icon: React.ReactNode;
    value: number;
    color: string;
    label: string;
  }) => (
    <div className={`flex items-center gap-1 ${color}`} aria-label={`${label}: ${value}`}>
      {icon}
      <span className={numberClasses}>{value}</span>
    </div>
  );

  return (
    <button
      type="button"
      onClick={onTap}
      className={`${containerClasses} ${onTap ? "hover:bg-nl-raised cursor-pointer" : "cursor-default"} transition-colors`}
      aria-label="Reward currencies"
      data-testid="v2-currency-strip"
    >
      <Pill
        icon={<Sprout size={iconSize} />}
        value={depth}
        color="text-nl-moss-500"
        label="Depth"
      />
      <Pill
        icon={<Compass size={iconSize} />}
        value={explore}
        color="text-nl-slate-500"
        label="Explore"
      />
      <Pill
        icon={<Bird size={iconSize} />}
        value={comeback}
        color="text-nl-amber-500"
        label="Comeback"
      />
    </button>
  );
}
