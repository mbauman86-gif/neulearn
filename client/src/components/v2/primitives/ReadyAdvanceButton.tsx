/**
 * ReadyAdvanceButton — gentle "Ready?" prompt + circular amber arrow.
 *
 * Replaces aggressive "Next" buttons. Per .stitch/DESIGN.md §7.7, lesson advancement
 * is auto-paced by the karaoke read-along; this button is the SOFT confirmation when
 * the kid wants to move forward. The arrow pulses gently so it feels invited, not pushed.
 *
 * Motion is `nl-pulse-soft` — slow, warm, never spring-loaded. Defined in the
 * accompanying tailwind.config keyframes (TODO: add keyframe extension if missing).
 */
import { ArrowRight } from "lucide-react";

export interface ReadyAdvanceButtonProps {
  readonly onClick: () => void;
  /** Hide the "Ready?" label — useful in tighter chrome. Default false. */
  readonly labelHidden?: boolean;
  readonly disabled?: boolean;
}

export function ReadyAdvanceButton({
  onClick,
  labelHidden = false,
  disabled = false,
}: ReadyAdvanceButtonProps) {
  return (
    <div className="flex items-center gap-3" data-testid="v2-ready-advance">
      {!labelHidden && (
        <span className="font-nl-display italic text-[18px] text-nl-ink">Ready?</span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-12 h-12 bg-nl-amber-500 rounded-full flex items-center justify-center text-nl-raised shadow-lg shadow-nl-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed animate-pulse"
        style={{ animationDuration: "2.4s" }}
        aria-label="Continue to next step"
        data-testid="v2-ready-advance-button"
      >
        <ArrowRight size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
