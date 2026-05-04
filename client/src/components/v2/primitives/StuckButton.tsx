/**
 * StuckButton — bottom-chrome "I'm stuck" affordance.
 *
 * Always visible at the bottom of the lesson player so the kid never has to navigate
 * to find help. Per .stitch/DESIGN.md §7.7 (Lesson canvas).
 *
 * Tapping it should signal the intervention engine (server-side) to pivot the lesson —
 * simplify, branch to a prerequisite, or have Ari model the answer. The actual
 * intervention wiring is server-side and not part of this primitive.
 */
import { LifeBuoy } from "lucide-react";

export interface StuckButtonProps {
  readonly onClick: () => void;
  /** Compact mode for Wise register (text-only link, not pill). */
  readonly compact?: boolean;
}

export function StuckButton({ onClick, compact = false }: StuckButtonProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-[14px] font-nl-body font-medium text-nl-slate-500 hover:text-nl-slate-700 transition-colors"
        data-testid="v2-stuck-button-compact"
      >
        I'm stuck
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-nl-ink-secondary opacity-70 hover:opacity-100 transition-opacity"
      data-testid="v2-stuck-button"
    >
      <LifeBuoy size={20} />
      <span className="text-[14px] font-nl-body font-medium">I'm stuck</span>
    </button>
  );
}
