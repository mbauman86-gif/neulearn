/**
 * BreakButton — bottom-chrome "Take a break" affordance.
 *
 * Pauses the lesson and saves progress so the child can return without losing place.
 * Per .stitch/DESIGN.md §7.7.
 */
import { Leaf } from "lucide-react";

export interface BreakButtonProps {
  readonly onClick: () => void;
  readonly compact?: boolean;
}

export function BreakButton({ onClick, compact = false }: BreakButtonProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-[14px] font-nl-body font-medium text-nl-slate-500 hover:text-nl-slate-700 transition-colors"
        data-testid="v2-break-button-compact"
      >
        Take a break
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-nl-ink-secondary opacity-70 hover:opacity-100 transition-opacity"
      data-testid="v2-break-button"
    >
      <Leaf size={20} />
      <span className="text-[14px] font-nl-body font-medium">Take a break</span>
    </button>
  );
}
