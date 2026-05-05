/**
 * TodayCompleteState — what the kid sees when every queue item is done for the day.
 *
 * Two things, side by side:
 *   - A warm "Great work today" message so the kid feels closure and accomplishment.
 *     Per editorial stance: never compare, never push for more, never shame the
 *     length of session. Done is done.
 *   - A small parent-only "Generate a fresh queue" affordance so a parent watching
 *     over the kid's shoulder can regenerate without waiting until tomorrow. The
 *     button has clear "this is for you, parent" copy so the kid doesn't infer
 *     they did something wrong by finishing.
 *
 * Used by TodayPage when queueData.items has zero items left after the
 * pending-only filter. Renders inside the same TodayCub chrome (greeting,
 * currency strip, Faith Lens) so the chrome doesn't disappear.
 */
import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { AriCub } from "./AriCub";

export interface TodayCompleteStateProps {
  /** True when the parent (not just the kid) is viewing — controls the regenerate button visibility. */
  readonly parentMode?: boolean;
  /** Called when parent taps "Generate a fresh queue". */
  readonly onRegenerate?: () => void;
  /** Disable while regen is in flight. */
  readonly regenerating?: boolean;
}

export function TodayCompleteState({
  parentMode = false,
  onRegenerate,
  regenerating = false,
}: TodayCompleteStateProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-12 max-w-[34ch] mx-auto"
      data-testid="v2-today-complete-state"
    >
      {/* Held celebration moment, never confetti. */}
      <div className="relative mb-6">
        <div className="w-40 h-40">
          <AriCub />
        </div>
        <Sparkles
          size={28}
          className="absolute -top-2 -right-2 text-nl-amber-500"
          aria-hidden
        />
      </div>

      <h2 className="font-nl-display italic text-[36px] sm:text-[44px] leading-[1.1] text-nl-ink mb-4">
        Great work today.
      </h2>
      <p className="font-nl-reading text-[18px] sm:text-[20px] text-nl-ink-secondary leading-relaxed mb-2">
        You finished everything on today's path.
      </p>
      <p className="font-nl-reading text-[16px] sm:text-[18px] text-nl-ink-tertiary leading-relaxed">
        Come back tomorrow — or go outside, build something, or read a book.
      </p>

      {/* Parent-only regenerate affordance. Lives below the celebration so the kid's
          experience is closed before any "more" appears. */}
      {parentMode && onRegenerate && !bannerDismissed && (
        <div
          className="mt-10 pt-6 border-t border-nl-ink-tertiary/20 w-full"
          data-testid="v2-today-parent-regenerate"
        >
          <p className="font-nl-body text-[12px] uppercase tracking-wide text-nl-ink-tertiary mb-3">
            Parent
          </p>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 bg-nl-raised border border-nl-ink-secondary/15 hover:border-nl-amber-500/40 px-5 py-3 rounded-full font-nl-body font-medium text-[15px] text-nl-ink-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={16}
              className={regenerating ? "animate-spin" : ""}
              aria-hidden
            />
            <span>{regenerating ? "Generating…" : "Generate a fresh queue"}</span>
          </button>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="mt-3 block mx-auto text-[12px] text-nl-ink-tertiary underline underline-offset-2 hover:text-nl-ink-secondary"
          >
            Hide this
          </button>
        </div>
      )}
    </div>
  );
}
