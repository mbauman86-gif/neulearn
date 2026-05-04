/**
 * AssessmentQuestion — renders a single assessment item from a lesson_instance.
 *
 * Supports the existing question types from `LessonInstanceAssessment.questions`:
 *   - "choice": tap one of N option cards
 *   - "yes_no": tap Yes or No
 *   - "number": tap one of small numeric tiles (0-10)
 *   - "text": (TODO) voice + free-text input — dictation route lands separately
 *
 * Calls `onSubmit(answer, isCorrect)` so the parent route can POST the attempt to the
 * server and advance / intervene accordingly.
 *
 * Visual fidelity: cream-raised tap cards with generous padding. NEVER bright red on
 * incorrect — flash a brief muted-terracotta tone, then let the parent route decide
 * what happens next. No shame.
 */
import { useState } from "react";
import { Check, X } from "lucide-react";

export interface AssessmentQuestionData {
  readonly questionId: string;
  readonly prompt: string;
  readonly type: "number" | "text" | "choice" | "yes_no";
  readonly options?: ReadonlyArray<string>;
  readonly correctAnswer: string | number;
  readonly hint?: string;
}

export interface AssessmentQuestionProps {
  readonly question: AssessmentQuestionData;
  /** Called when the kid submits an answer. parent posts the attempt + advances. */
  readonly onSubmit: (answer: string, isCorrect: boolean) => void;
  /** Disables interaction (e.g. while the parent is submitting the previous attempt). */
  readonly disabled?: boolean;
}

function normalize(answer: unknown): string {
  if (answer === null || answer === undefined) return "";
  return String(answer).trim().toLowerCase();
}

export function AssessmentQuestion({
  question,
  onSubmit,
  disabled,
}: AssessmentQuestionProps) {
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [submittedCorrect, setSubmittedCorrect] = useState<boolean | null>(null);

  function handle(answer: string) {
    if (disabled || submittedAnswer !== null) return;
    const isCorrect = normalize(answer) === normalize(question.correctAnswer);
    setSubmittedAnswer(answer);
    setSubmittedCorrect(isCorrect);
    onSubmit(answer, isCorrect);
  }

  // Build the candidate options list from the question type.
  const options: string[] = (() => {
    if (question.type === "yes_no") return ["Yes", "No"];
    if (question.type === "number" && !question.options) {
      return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    }
    return [...(question.options ?? [])];
  })();

  return (
    <div
      className="flex flex-col items-center gap-6 w-full max-w-xl"
      data-testid="v2-assessment-question"
    >
      <p
        className="font-nl-reading text-[24px] sm:text-[28px] leading-relaxed text-nl-ink text-center max-w-[28ch]"
        style={{ wordSpacing: "0.05em", letterSpacing: "0.01em" }}
      >
        {question.prompt}
      </p>

      {options.length > 0 && (
        <div
          className={`grid gap-3 w-full ${
            options.length <= 3 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {options.map((opt, i) => {
            const isThisSubmitted = submittedAnswer === opt;
            const showCorrect = isThisSubmitted && submittedCorrect === true;
            const showWrong = isThisSubmitted && submittedCorrect === false;
            const isOtherSubmitted = submittedAnswer !== null && !isThisSubmitted;

            const baseClass =
              "relative bg-nl-raised border-2 rounded-[1.5rem] px-6 py-5 text-[20px] sm:text-[22px] font-nl-reading font-medium text-nl-ink transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed";

            const stateClass = showCorrect
              ? "border-nl-moss-500 bg-nl-moss-500/10"
              : showWrong
                ? "border-nl-error bg-nl-error/10"
                : isOtherSubmitted
                  ? "border-black/5 opacity-50"
                  : "border-black/5 hover:border-nl-amber-500/40";

            return (
              <button
                key={`${opt}-${i}`}
                type="button"
                onClick={() => handle(opt)}
                disabled={disabled || submittedAnswer !== null}
                className={`${baseClass} ${stateClass}`}
                data-testid={`v2-assessment-option-${i}`}
              >
                <span className="block">{opt}</span>
                {showCorrect && (
                  <Check
                    size={20}
                    className="absolute top-2 right-2 text-nl-moss-500"
                    aria-label="Correct"
                  />
                )}
                {showWrong && (
                  <X
                    size={20}
                    className="absolute top-2 right-2 text-nl-error"
                    aria-label="Not quite"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Text input for "text" questions — minimal placeholder, voice input lands later. */}
      {question.type === "text" && (
        <input
          type="text"
          disabled={disabled || submittedAnswer !== null}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              handle(e.currentTarget.value.trim());
            }
          }}
          placeholder="Type your answer and press Enter"
          className="w-full max-w-md px-4 py-3 rounded-xl border-2 border-black/10 bg-nl-raised font-nl-reading text-[20px] focus:outline-none focus:border-nl-amber-500"
          data-testid="v2-assessment-text-input"
        />
      )}

      {submittedAnswer !== null && question.hint && submittedCorrect === false && (
        <p className="font-nl-reading italic text-[16px] text-nl-ink-secondary text-center max-w-[40ch]">
          Hint: {question.hint}
        </p>
      )}
    </div>
  );
}
