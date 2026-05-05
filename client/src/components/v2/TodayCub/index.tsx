/**
 * TodayCub — Cub register (K-2) Today screen.
 *
 * Daily queue with up to four sections: Core Learning, Spiral Review, Apply,
 * Devotional. Hero greeting up top, Faith Lens accessible from chrome,
 * three-currency strip, persistent "I'm stuck" / "Take a break" / swap-budget
 * affordances at bottom.
 *
 * Presentational only — accepts a typed queue and child profile via props.
 * Parent route owns the data fetch + handlers.
 */
import type { ReactNode } from "react";
import {
  PencilLine,
  Hash,
  TreeDeciduous,
  Sparkles,
  Music,
  Brush,
  Plus,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { CurrencyStrip } from "../primitives/CurrencyStrip";
import {
  FaithLensButton,
  type FaithLensContent,
  type FaithMode,
} from "../primitives/FaithLensButton";
import { StuckButton } from "../primitives/StuckButton";
import { BreakButton } from "../primitives/BreakButton";
import { AriCub } from "../primitives/AriCub";
import { QueueCard, type QueueSection } from "../primitives/QueueCard";

export interface TodayQueueItem {
  readonly id: string;
  readonly section: QueueSection;
  readonly title: string;
  readonly subtitle: string;
  readonly minutes: number;
  readonly icon: LucideIcon;
  readonly hasAudio?: boolean;
}

export interface LaterShelfItem {
  readonly id: string;
  readonly title: string;
  readonly icon: LucideIcon;
}

export interface TodayCubProps {
  readonly childName: string;
  readonly currencies: { depth: number; explore: number; comeback: number };
  readonly queue: ReadonlyArray<TodayQueueItem>;
  readonly laterShelf?: ReadonlyArray<LaterShelfItem>;
  /** How many subject swaps the kid has remaining today (default 3). */
  readonly swapsRemaining: number;
  readonly faithLens: FaithLensContent;
  readonly faithMode: FaithMode;
  readonly onQueueItemClick: (id: string) => void;
  readonly onSaveForLater: (id: string) => void;
  readonly onLaterItemClick?: (id: string) => void;
  readonly onSaveNew?: () => void;
  readonly onStuck: () => void;
  readonly onBreak: () => void;
  /**
   * Optional override rendered in place of the queue + Later shelf when the queue
   * is empty (everything done for the day, or the parent hasn't generated one yet).
   * Lets the page show a celebratory closure state inside the same chrome.
   */
  readonly emptyState?: ReactNode;
}

export const DEFAULT_QUEUE_ICONS: Readonly<Record<QueueSection, LucideIcon>> = {
  core: PencilLine,
  review: Hash,
  apply: TreeDeciduous,
  devotional: Sparkles,
};

export function TodayCub({
  childName,
  currencies,
  queue,
  laterShelf = [],
  swapsRemaining,
  faithLens,
  faithMode,
  onQueueItemClick,
  onSaveForLater,
  onLaterItemClick,
  onSaveNew,
  onStuck,
  onBreak,
  emptyState,
}: TodayCubProps) {
  const greeting = greetingForTimeOfDay();
  const isEmpty = queue.length === 0;

  return (
    <div
      className="bg-nl-canvas text-nl-ink font-nl-body min-h-[100dvh] pb-32"
      data-testid="v2-today-cub"
    >
      {/* Top chrome — small Ari + greeting (left), currencies + Faith Lens (right) */}
      <header className="flex justify-between items-center w-full px-4 sm:px-6 pt-4 pb-2 max-w-screen-xl mx-auto sticky top-0 bg-nl-canvas z-40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-nl-amber-500/10 border-2 border-nl-amber-500/20 flex items-center justify-center">
            <AriCub className="w-full h-full" />
          </div>
          <h1 className="font-nl-display text-[24px] sm:text-[28px] leading-tight tracking-tight">
            {greeting}, {childName}.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyStrip
            depth={currencies.depth}
            explore={currencies.explore}
            comeback={currencies.comeback}
          />
          <FaithLensButton content={faithLens} mode={faithMode} />
        </div>
      </header>

      {/* Hero — today's path */}
      <main className="px-4 sm:px-6 mt-6 sm:mt-10 max-w-screen-xl mx-auto">
        {!isEmpty && (
          <section className="mb-8 sm:mb-12">
            <h2 className="font-nl-display italic text-[40px] sm:text-[56px] leading-[1.05] text-nl-ink mb-3">
              Today's path
            </h2>
            <p className="font-nl-reading text-[18px] sm:text-[22px] text-nl-ink-secondary leading-relaxed max-w-md">
              {queue.length === 1
                ? "One thing to explore. Take your time."
                : `${queue.length} things to explore. Take your time.`}
            </p>
          </section>
        )}

        {/* Either the queue cards OR (when queue is empty) the parent-supplied
            empty state — typically TodayCompleteState. */}
        {isEmpty && emptyState ? (
          <section className="mt-8">{emptyState}</section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {queue.map((item) => (
              <QueueCard
                key={item.id}
                section={item.section}
                title={item.title}
                subtitle={item.subtitle}
                minutes={item.minutes}
                icon={item.icon}
                hasAudio={item.hasAudio ?? true}
                onClick={() => onQueueItemClick(item.id)}
                onSaveForLater={() => onSaveForLater(item.id)}
              />
            ))}
          </section>
        )}

        {/* Later shelf — saved-for-later items + a "save new" CTA. Hidden in
            the empty/end-state so the celebration moment is uncluttered. */}
        {!isEmpty && (
        <section className="mt-12 sm:mt-16">
          <h4 className="font-nl-display text-[20px] sm:text-[24px] text-nl-ink-secondary mb-5 sm:mb-6">
            Later shelf
          </h4>
          <div className="flex flex-wrap gap-3">
            {laterShelf.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onLaterItemClick?.(item.id)}
                  className="bg-nl-raised border border-nl-ink-secondary/10 px-5 py-3 rounded-full flex items-center gap-2 hover:bg-nl-canvas-dim transition-colors"
                  data-testid={`v2-later-shelf-${item.id}`}
                >
                  <Icon size={18} className="text-nl-ink-secondary" />
                  <span className="font-nl-body font-medium text-nl-ink-secondary">{item.title}</span>
                </button>
              );
            })}
            {onSaveNew && (
              <button
                type="button"
                onClick={onSaveNew}
                className="bg-nl-raised border border-nl-ink-secondary/10 px-5 py-3 rounded-full flex items-center gap-2 hover:bg-nl-canvas-dim transition-colors"
                data-testid="v2-later-shelf-add"
              >
                <Plus size={18} className="text-nl-ink-secondary" />
                <span className="font-nl-body font-medium text-nl-ink-secondary">Save new</span>
              </button>
            )}
          </div>
        </section>
        )}
      </main>

      {/* Bottom chrome — swaps-left + I'm stuck + Take a break */}
      <div className="fixed bottom-6 left-0 w-full px-4 sm:px-6 flex justify-between items-end pointer-events-none z-50">
        <div className="pointer-events-auto flex items-center bg-nl-raised shadow-lg border border-black/5 rounded-full px-4 py-2">
          <Compass size={18} className="text-nl-slate-500 mr-2" />
          <span className="font-nl-body font-bold text-nl-ink-secondary text-sm tracking-wide uppercase">
            {swapsRemaining} {swapsRemaining === 1 ? "swap" : "swaps"} left
          </span>
        </div>
        <div className="pointer-events-auto flex gap-3">
          <StuckButton onClick={onStuck} />
          <BreakButton onClick={onBreak} />
        </div>
      </div>
    </div>
  );
}

function greetingForTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up early";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Hi there";
}

// Re-export icon defaults so demos can pick the same set without importing lucide directly.
export { Music, Brush } from "lucide-react";
