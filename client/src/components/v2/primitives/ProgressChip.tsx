/**
 * ProgressChip — five-segment progress indicator at the top of every lesson.
 *
 * Shows where the child is in the lesson: Goal → Show → Try → Check → Done.
 * Active segment fills amber with a soft glow; completed segments fill amber solid;
 * future segments are outline-only. Completed segments are tappable to revisit.
 *
 * Per .stitch/DESIGN.md §7.4.
 */

export type LessonStep = "goal" | "show" | "try" | "check" | "done";

const STEPS: ReadonlyArray<LessonStep> = ["goal", "show", "try", "check", "done"] as const;

const STEP_LABELS: Readonly<Record<LessonStep, string>> = {
  goal: "Goal",
  show: "Show",
  try: "Try",
  check: "Check",
  done: "Done",
};

export interface ProgressChipProps {
  readonly currentStep: LessonStep;
  /**
   * Optional override for which steps are tappable. Defaults to all steps before currentStep.
   */
  readonly onStepTap?: (step: LessonStep) => void;
  /** Show text labels under the dots. Default true (Cub register); false in Wise register. */
  readonly showLabels?: boolean;
}

function stepIndex(step: LessonStep): number {
  return STEPS.indexOf(step);
}

export function ProgressChip({ currentStep, onStepTap, showLabels = true }: ProgressChipProps) {
  const currentIdx = stepIndex(currentStep);

  return (
    <div className="flex items-end gap-3" data-testid="v2-progress-chip">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;
        const isFuture = i > currentIdx;
        const tappable = isCompleted && !!onStepTap;

        const segmentClasses = [
          "w-4 h-1.5 rounded-full transition-all",
          isCompleted && "bg-nl-amber-500",
          isActive && "bg-nl-amber-500 shadow-[0_0_8px_rgba(200,146,58,0.6)]",
          isFuture && "border border-nl-amber-500/30",
          tappable && "cursor-pointer hover:opacity-80",
        ]
          .filter(Boolean)
          .join(" ");

        const labelClasses = [
          "text-[10px] font-nl-body font-medium uppercase tracking-wider mt-1.5",
          isActive && "text-nl-amber-500",
          isCompleted && "text-nl-moss-500",
          isFuture && "text-nl-ink-tertiary",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={step} className="flex flex-col items-center">
            <button
              type="button"
              disabled={!tappable}
              onClick={tappable ? () => onStepTap(step) : undefined}
              className={segmentClasses}
              aria-label={`Lesson step: ${STEP_LABELS[step]}${isActive ? " (current)" : isCompleted ? " (completed, tap to revisit)" : ""}`}
              aria-current={isActive ? "step" : undefined}
              data-testid={`v2-progress-segment-${step}`}
            />
            {showLabels && isActive && (
              <span className={labelClasses}>{STEP_LABELS[step]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
