/**
 * FaithLensButton — the always-present, opt-in doorway to Christian perspective on the
 * current topic.
 *
 * Per .stitch/DESIGN.md §7.3:
 *   - The button is ALWAYS visible on every content screen.
 *   - In `subtle` mode (parent default), the panel only opens on tap.
 *   - In `woven` mode, a brief teaser auto-shows; tap reveals the full panel.
 *   - In `centered` mode, the panel is open by default and can be collapsed.
 *
 * The warm-gold (#D6A85B) halo is the ONLY place this color appears in the system —
 * it carries semantic meaning. Don't use `nl-faith` anywhere else.
 */
import { useState } from "react";
import { BookOpenText, X } from "lucide-react";

export type FaithMode = "subtle" | "woven" | "centered";

export interface FaithLensContent {
  readonly scripture: string;
  readonly tieIn: string;
  readonly optionalPrayer?: string;
  /** Optional "go deeper" link — articles/clips from vetted teachers (Wes Huff, Tim Keller, etc.) */
  readonly goDeeperUrl?: string;
}

export interface FaithLensButtonProps {
  readonly content: FaithLensContent;
  readonly mode: FaithMode;
  /** Click target size (default 36px). Compact (28px) for Wise register chrome. */
  readonly size?: "default" | "compact";
}

export function FaithLensButton({ content, mode, size = "default" }: FaithLensButtonProps) {
  // In `centered` mode, panel starts open. Otherwise closed.
  const [open, setOpen] = useState(mode === "centered");

  const buttonSize = size === "compact" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "compact" ? 16 : 20;

  return (
    <div className="relative" data-testid="v2-faith-lens">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${buttonSize} rounded-full bg-nl-raised flex items-center justify-center border border-nl-faith/20 shadow-[0_0_15px_rgba(214,168,91,0.3)] transition-shadow hover:shadow-[0_0_18px_rgba(214,168,91,0.45)]`}
        aria-label={open ? "Close Faith Lens" : "Open Faith Lens — Bible perspective on this topic"}
        aria-expanded={open}
        data-testid="v2-faith-lens-button"
      >
        <BookOpenText size={iconSize} className="text-nl-faith" />
      </button>

      {/* Woven mode: brief teaser strip beside the button when closed */}
      {mode === "woven" && !open && (
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] font-nl-display italic text-nl-ink-secondary pointer-events-none">
          {content.scripture.split(" ").slice(0, 6).join(" ")}…
        </div>
      )}

      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-[min(360px,calc(100vw-32px))] bg-nl-raised rounded-xl shadow-lg border border-nl-faith/20 p-5 z-50"
          role="dialog"
          aria-label="Faith Lens"
          data-testid="v2-faith-lens-panel"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-nl-ink-tertiary hover:text-nl-ink"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <p className="font-nl-display text-[18px] leading-snug text-nl-ink mb-3">
            {content.scripture}
          </p>
          <p className="font-nl-reading text-[15px] leading-relaxed text-nl-ink-secondary">
            {content.tieIn}
          </p>
          {content.goDeeperUrl && (
            <a
              href={content.goDeeperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[13px] font-nl-body font-medium text-nl-faith underline decoration-nl-faith/40 underline-offset-2 hover:decoration-nl-faith"
            >
              Go deeper
            </a>
          )}
        </div>
      )}
    </div>
  );
}
