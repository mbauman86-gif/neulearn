/**
 * LessonPlayerCub — Cub register (K-2) lesson player.
 *
 * The single transforming canvas (per .stitch/DESIGN.md §7.7) replaces the legacy
 * stacked-card model. The lesson lives on ONE canvas that morphs between Goal → Show
 * → Try → Check → Done; karaoke pacing IS the lesson rhythm.
 *
 * This component is presentational — no data fetching. Parent route owns the lesson
 * data and handlers. See `client/src/components/v2/README.md` for migration notes.
 *
 * TODO(server): persist active step + intervention signals back to the server. The
 * intervention engine (`server/interventionEngine.ts`) doesn't exist yet — its absence
 * means "I'm stuck" currently just calls a no-op handler.
 */
import type { LessonStep } from "../primitives/ProgressChip";
import { ProgressChip } from "../primitives/ProgressChip";
import { CurrencyStrip } from "../primitives/CurrencyStrip";
import {
  FaithLensButton,
  type FaithLensContent,
  type FaithMode,
} from "../primitives/FaithLensButton";
import { KaraokeText, type KaraokeAudioRef } from "../primitives/KaraokeText";
import { StuckButton } from "../primitives/StuckButton";
import { BreakButton } from "../primitives/BreakButton";
import { ReadyAdvanceButton } from "../primitives/ReadyAdvanceButton";
import { AriCub } from "../primitives/AriCub";

export interface LessonPlayerCubProps {
  /** Lesson goal in plain language — "Today we'll listen for /sh/ in words." */
  readonly goal: string;
  /** Optional pre-rendered audio for the goal text. */
  readonly goalAudio?: KaraokeAudioRef;
  /** The focal content for the active step — for "Show", typically a single decoded word. */
  readonly focalText: string;
  /** Optional emphasized substring (e.g. "sh" in "ship") that gets the karaoke glow even at rest. */
  readonly focalEmphasis?: string;
  /** Caption beneath the focal content — "Two letters, one sound." */
  readonly caption?: string;
  readonly captionAudio?: KaraokeAudioRef;
  /** Pre-rendered audio for the focal word/phrase. */
  readonly focalAudio?: KaraokeAudioRef;
  /** Current step in the lesson flow (Goal → Show → Try → Check → Done). */
  readonly currentStep: LessonStep;
  readonly onStepTap?: (step: LessonStep) => void;
  /** The kid's three reward currency totals. */
  readonly currencies: { depth: number; explore: number; comeback: number };
  /** Faith Lens content. ALWAYS populated; mode controls auto-display. */
  readonly faithLens: FaithLensContent;
  readonly faithMode: FaithMode;
  /** Handler when the kid taps "I'm stuck". Should signal the server intervention engine. */
  readonly onStuck: () => void;
  /** Handler when the kid taps "Take a break". Should pause + persist progress. */
  readonly onBreak: () => void;
  /** Handler for the gentle "Ready?" advance. */
  readonly onAdvance: () => void;
  /** Whether advancement is enabled (e.g. wait for read-along to complete first). */
  readonly canAdvance?: boolean;
}

export function LessonPlayerCub({
  goal,
  goalAudio: _goalAudio,
  focalText,
  focalEmphasis,
  caption,
  captionAudio: _captionAudio,
  focalAudio,
  currentStep,
  onStepTap,
  currencies,
  faithLens,
  faithMode,
  onStuck,
  onBreak,
  onAdvance,
  canAdvance = true,
}: LessonPlayerCubProps) {
  return (
    <div
      className="bg-nl-canvas text-nl-ink font-nl-body min-h-[100dvh] flex flex-col"
      data-testid="v2-lesson-player-cub"
    >
      {/* Top chrome — progress chip (left) | currencies + Faith Lens (right) */}
      <header className="flex justify-between items-center w-full px-4 h-[60px] max-w-screen-xl mx-auto">
        <ProgressChip currentStep={currentStep} onStepTap={onStepTap} />
        <div className="flex items-center gap-2">
          <CurrencyStrip
            depth={currencies.depth}
            explore={currencies.explore}
            comeback={currencies.comeback}
          />
          <FaithLensButton content={faithLens} mode={faithMode} />
        </div>
      </header>

      {/* Lesson canvas — the single transforming surface */}
      <main className="flex-1 px-4 py-2 flex flex-col">
        <section
          className="flex-1 bg-nl-raised rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col p-8 border border-[#E8DFCA]/50"
          aria-label="Lesson canvas"
        >
          {/* Goal headline — ALWAYS visible at top of canvas */}
          <div className="max-w-[80%]">
            <h1 className="font-nl-display italic text-[28px] leading-tight text-nl-ink">
              {focalEmphasis && goal.includes(focalEmphasis) ? (
                <>
                  {goal.split(focalEmphasis)[0]}
                  <span className="text-nl-amber-500">{focalEmphasis}</span>
                  {goal.split(focalEmphasis)[1]}
                </>
              ) : (
                goal
              )}
            </h1>
          </div>

          {/* Center — focal interactive content */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <KaraokeText
              text={focalText}
              audioRef={focalAudio}
              textClassName="text-[96px] font-bold leading-none tracking-tight"
              defaultSpeed={0.85}
            />
            {caption && (
              <p className="font-nl-reading text-[22px] text-nl-ink-secondary mt-4 text-center max-w-[60ch]">
                {caption}
              </p>
            )}

            {/* Cub Ari — illustrated companion in lower right of canvas */}
            <div className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none">
              <AriCub />
            </div>
          </div>
        </section>
      </main>

      {/* Bottom chrome — affordances always reachable */}
      <footer className="h-[80px] px-6 flex items-center justify-between">
        <div className="flex gap-4">
          <StuckButton onClick={onStuck} />
          <BreakButton onClick={onBreak} />
        </div>
        <ReadyAdvanceButton onClick={onAdvance} disabled={!canAdvance} />
      </footer>
    </div>
  );
}
