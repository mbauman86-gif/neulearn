/**
 * QueueCard — a single item in the daily queue (Core Learning, Spiral Review, Apply,
 * or Devotional). Rendered on the Today screen; tap to open the lesson player.
 *
 * Per .stitch/DESIGN.md and .stitch/screens/01_child-home-cub.html:
 *   - Cream-raised surface, generous radius, thin warm border, soft shadow.
 *   - Left-edge color strip identifies the section (amber / moss / slate / faith-gold).
 *   - Read-aloud (karaoke) speaker glyph in the corner indicates the card has audio.
 *   - "Save for later" never shows shame — just a quiet move to the Later shelf.
 */
import { Volume2, Clock, MoveRight, type LucideIcon } from "lucide-react";

export type QueueSection = "core" | "review" | "apply" | "devotional";

const SECTION_STRIPS: Readonly<Record<QueueSection, string>> = {
  core: "bg-nl-amber-500",
  review: "bg-nl-moss-500",
  apply: "bg-nl-slate-500",
  devotional: "bg-nl-faith",
};

const SECTION_TINTS: Readonly<Record<QueueSection, string>> = {
  core: "bg-nl-amber-500/10 text-nl-amber-500",
  review: "bg-nl-moss-500/10 text-nl-moss-500",
  apply: "bg-nl-slate-500/10 text-nl-slate-500",
  devotional: "bg-nl-faith/10 text-nl-faith",
};

const SECTION_LABELS: Readonly<Record<QueueSection, string>> = {
  core: "Core Learning",
  review: "Spiral Review",
  apply: "Apply",
  devotional: "Today's Wonder",
};

export interface QueueCardProps {
  readonly section: QueueSection;
  readonly title: string;
  readonly subtitle: string;
  readonly minutes: number;
  /** Lucide icon component to render inside the section badge. */
  readonly icon: LucideIcon;
  readonly hasAudio?: boolean;
  /** Show "Save for later" link. Defaults true. Hidden once already saved. */
  readonly showSaveForLater?: boolean;
  readonly onClick: () => void;
  readonly onSaveForLater?: () => void;
}

export function QueueCard({
  section,
  title,
  subtitle,
  minutes,
  icon: Icon,
  hasAudio = true,
  showSaveForLater = true,
  onClick,
  onSaveForLater,
}: QueueCardProps) {
  return (
    <article
      className="relative bg-nl-raised rounded-[2rem] p-6 sm:p-8 shadow-sm border border-black/5 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${SECTION_LABELS[section]}: ${title}, ${minutes} minutes`}
      data-testid={`v2-queue-card-${section}`}
    >
      {/* Left-edge color strip — semantic section indicator */}
      <div className={`absolute top-0 left-0 w-3 h-full ${SECTION_STRIPS[section]}`} aria-hidden />

      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${SECTION_TINTS[section]}`} aria-hidden>
          <Icon size={28} />
        </div>
        {hasAudio && (
          <Volume2 size={24} className="text-nl-amber-500/50" aria-label="Read-along available" />
        )}
      </div>

      <h3 className="font-nl-reading font-bold text-[26px] sm:text-[28px] text-nl-ink mb-2 leading-tight">
        {title}
      </h3>
      <p className="font-nl-reading text-[18px] sm:text-[20px] text-nl-ink-secondary mb-6 leading-relaxed">
        {subtitle}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-nl-ink-secondary font-medium gap-2">
          <Clock size={18} />
          <span className="font-nl-body tracking-wide uppercase text-sm">~{minutes} min</span>
        </div>
        <div className="flex items-center gap-3">
          {showSaveForLater && onSaveForLater && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSaveForLater();
              }}
              className="text-[12px] font-nl-body text-nl-ink-tertiary hover:text-nl-ink-secondary underline underline-offset-2 transition-colors"
              data-testid={`v2-queue-card-${section}-save-for-later`}
            >
              Save for later
            </button>
          )}
          <MoveRight size={20} className="text-nl-ink-tertiary group-hover:text-nl-amber-500 transition-colors" />
        </div>
      </div>
    </article>
  );
}
