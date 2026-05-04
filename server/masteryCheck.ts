/**
 * masteryCheck — separate-from-practice mastery assessment.
 *
 * The Phase 1 audit found that the legacy progression engine treated lesson completion as
 * mastery — kids advanced just by working through practice items. Real mastery means
 * demonstrating the skill on FRESH items, sourced from a different pool than practice,
 * scored on a stricter bar.
 *
 * This module is the bridge:
 *   - `buildMasteryCheck` creates a lesson_instance with `kind = "MASTERY_CHECK"` and
 *     items drawn from the template's `assessmentBank.checkpoint` or `.challenge`.
 *   - `scoreMasteryCheck` applies the strict bar: ≥80% accuracy AND no hint > level 2 used.
 *     A passing mastery check is what justifies the kid's first PROFICIENT promotion in
 *     a skill (the progression engine's promotion gates additionally require spacing +
 *     varied contexts; the mastery check is one input).
 *
 * Mastery check items are ALWAYS sourced separately from practice items — the same
 * question must never appear in both. We enforce this by drawing from disjoint banks
 * (practice → `assessmentBank.formative`; mastery → `assessmentBank.checkpoint` or
 * `.challenge`).
 */
import { storage } from "./storage";
import type { LessonInstanceAssessment, AssessmentQuestion, LessonTemplate } from "@shared/schema";

export interface BuildMasteryCheckOptions {
  readonly childId: string;
  readonly skillId: string;
  readonly skillName: string;
  readonly templateId?: string;
  /** "checkpoint" for first-promotion attempts, "challenge" for FLUENT/TRANSFER attempts. */
  readonly tier?: "checkpoint" | "challenge";
  /** Max number of items to include. Default 5 — enough for stable signal, short enough to feel like a check, not a chore. */
  readonly itemCount?: number;
}

export interface MasteryCheckScore {
  readonly passed: boolean;
  readonly accuracy: number; // 0–1
  readonly correctCount: number;
  readonly totalCount: number;
  readonly disqualifiedByHints: boolean;
  readonly bar: {
    readonly minAccuracy: number;
    readonly maxHintLevel: number;
  };
  readonly reason: string;
}

const PASSING_ACCURACY = 0.8;
const MAX_HINT_LEVEL = 2; // a level-3 hint is essentially the answer; using one disqualifies the check

/**
 * Build a mastery-check lesson instance for a child + skill. Fails if the underlying
 * lesson template doesn't have an assessment bank in the requested tier.
 */
export async function buildMasteryCheck(options: BuildMasteryCheckOptions): Promise<{
  lessonInstanceId: string;
  itemsPicked: number;
}> {
  const tier = options.tier ?? "checkpoint";
  const itemCount = options.itemCount ?? 5;

  const child = await storage.getChildById(options.childId);
  if (!child) throw new Error("Child not found");

  // Find a template for this skill at the child's grade band.
  let template: LessonTemplate | undefined;
  if (options.templateId) {
    template = await storage.getLessonTemplateById(options.templateId);
  } else {
    template = await storage.getLessonTemplateBySkill(options.skillName, child.grade);
  }
  if (!template) {
    throw new Error(`No lesson template available for ${options.skillName}`);
  }

  const bank = template.assessmentBank?.[tier] ?? [];
  if (bank.length === 0) {
    throw new Error(`Template has no items in '${tier}' bank for mastery check`);
  }

  // Draw items WITHOUT replacement; cap at requested count.
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(itemCount, bank.length));

  const assessment: LessonInstanceAssessment = {
    questions: picked.map((q: AssessmentQuestion, i: number) => ({
      questionId: q.questionId ?? `mastery-${i}`,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
  };

  const today = new Date().toISOString().split("T")[0];

  const lesson = await storage.createLessonInstance({
    childId: options.childId,
    lessonTemplateId: template.id,
    difficultyUsed: tier === "challenge" ? "hard" : "medium",
    modeUsed: "visual", // mastery checks are mode-neutral; UI will render plainly
    subject: template.subject,
    title: `Mastery Check: ${options.skillName}`,
    goal: `Show what you know about ${options.skillName}.`,
    objective: template.objective,
    targetSkillName: options.skillName,
    steps: [],
    teachPhase: undefined,
    practicePhase: undefined,
    assessment,
    parentNote: tier === "challenge"
      ? "This is a challenge mastery check — skills applied in a fresh context. Pass means real fluency."
      : "This is a mastery check — fresh items the child hasn't practiced. Pass means real proficiency.",
    faithIntegration: undefined, // Faith Lens still available via button; not auto-shown on checks
    date: today,
    kind: "MASTERY_CHECK",
  });

  return { lessonInstanceId: lesson.id, itemsPicked: picked.length };
}

/**
 * Score a completed mastery check. Pulls all attempts for the lesson instance, applies the
 * strict bar (≥80% AND no hint > level 2), and returns a structured verdict.
 *
 * The caller is responsible for THEN passing the verdict to the progression engine
 * (`progressionEngine.updateChildMastery`) with `isCorrect = passed` so the promotion
 * gates evaluate against the mastery check, not loose practice accuracy.
 */
export async function scoreMasteryCheck(lessonInstanceId: string): Promise<MasteryCheckScore> {
  const lesson = await storage.getLessonInstanceById(lessonInstanceId);
  if (!lesson) throw new Error("Lesson not found");
  if (lesson.kind !== "MASTERY_CHECK") {
    throw new Error("Cannot score: lesson is not a mastery check (kind != 'MASTERY_CHECK')");
  }

  const attempts = await storage.getAttemptsForLesson(lessonInstanceId);
  const totalCount = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  // Was a "tell-me-the-answer" hint (level 3) used at any point? That disqualifies a pass
  // because the kid didn't independently demonstrate the skill on those items.
  const disqualifiedByHints = attempts.some((a) => {
    const hint = a.hint ?? null;
    // Hints are stored as text in legacy schema; for now infer level from presence.
    // TODO: when hint-level is plumbed through, switch to attempt.hintLevel >= 3.
    return !!hint && a.isCorrect; // a correct answer that needed a hint counts toward disqualification
  });

  const passed = accuracy >= PASSING_ACCURACY && !disqualifiedByHints;

  return {
    passed,
    accuracy,
    correctCount,
    totalCount,
    disqualifiedByHints,
    bar: {
      minAccuracy: PASSING_ACCURACY,
      maxHintLevel: MAX_HINT_LEVEL,
    },
    reason: passed
      ? `Passed: ${correctCount}/${totalCount} correct without dependence on full-answer hints.`
      : disqualifiedByHints
        ? `Did not pass: child needed full-answer hints on at least one item.`
        : `Did not pass: ${correctCount}/${totalCount} correct (need ≥${Math.ceil(totalCount * PASSING_ACCURACY)}).`,
  };
}
