/**
 * interventionEngine — turn collected learning signals into mid-lesson intervention actions.
 *
 * The Phase 1 audit identified that `learning_signals` was being collected but never read
 * in real time — anti-stuck logic was passive instrumentation. This module fixes that.
 *
 * Recommendation contract: given a child + lesson + recent attempt outcome, return the
 * action the lesson player should take RIGHT NOW. The player is responsible for honoring
 * the action — pivot to a simpler example, branch back to a prerequisite skill, swap
 * modality (visual → tactile, etc.), or have Ari model the answer.
 *
 * Important constraints:
 *   - Never shame. The action is an opportunity, not a verdict.
 *   - Don't over-intervene. A single wrong answer is normal — only escalate on patterns.
 *   - The kid never sees the action label. The UI translates it into a soft transformation.
 */
import { db } from "./db";
import { learningSignals } from "@shared/schema";
import { and, desc, eq, gte } from "drizzle-orm";

export type InterventionAction =
  | "continue" // No intervention needed.
  | "encourage" // Light verbal nudge from Ari, no UI change.
  | "simplify" // Lower the difficulty of the next question / show a smaller example.
  | "branch_to_prereq" // The child likely lacks a prerequisite. Pivot to the prereq skill.
  | "swap_modality" // Try a different mode (e.g. story → hands-on).
  | "model_with_ari" // Ari demonstrates the worked example again, slowly.
  | "take_a_break"; // The kid is fatigued / frustrated. Suggest a pause.

export type InterventionSeverity = "low" | "medium" | "high";

export interface InterventionRecommendation {
  readonly action: InterventionAction;
  readonly severity: InterventionSeverity;
  /** Human-readable reason. Useful for analytics + parent dashboard insight. */
  readonly reason: string;
  /** Specific signal counts that fed the decision — surfaces in Sentry breadcrumbs. */
  readonly signals: {
    readonly recentAttempts: number;
    readonly recentWrong: number;
    readonly wrongStreak: number;
    readonly hintsUsed: number;
    readonly avgVoiceConfidence: number | null;
    readonly secondsSinceFirstAttempt: number;
  };
}

interface AnalyzeOptions {
  readonly childId: string;
  readonly lessonInstanceId: string;
  /** How far back to look at signals. Default 600 seconds (10 minutes). */
  readonly lookbackSeconds?: number;
}

/**
 * Read recent learning signals for one child + lesson and recommend the next action.
 * Called by the lesson route handler after each question outcome (or whenever the player
 * pings for a recommendation).
 */
export async function recommendIntervention({
  childId,
  lessonInstanceId,
  lookbackSeconds = 600,
}: AnalyzeOptions): Promise<InterventionRecommendation> {
  const since = new Date(Date.now() - lookbackSeconds * 1000);

  const rows = await db
    .select()
    .from(learningSignals)
    .where(
      and(
        eq(learningSignals.childId, childId),
        eq(learningSignals.lessonInstanceId, lessonInstanceId),
        gte(learningSignals.createdAt, since),
      ),
    )
    .orderBy(desc(learningSignals.createdAt))
    .limit(50);

  // Most recent first. Reverse for streak detection (chronological).
  const chronological = [...rows].reverse();

  let recentWrong = 0;
  let recentAttempts = 0;
  let wrongStreak = 0;
  let currentStreak = 0;
  let hintsUsed = 0;
  let voiceConfidenceSum = 0;
  let voiceConfidenceCount = 0;
  let frustrationCount = 0;

  for (const row of chronological) {
    const data = (row.data as any) ?? {};
    if (row.signalType === "QUESTION_ATTEMPT" || row.signalType === "PRACTICE_ACTIVITY") {
      recentAttempts++;
      if (data.isCorrect === false) {
        recentWrong++;
        currentStreak++;
        if (currentStreak > wrongStreak) wrongStreak = currentStreak;
      } else if (data.isCorrect === true) {
        currentStreak = 0;
      }
    }
    if (row.signalType === "HINT_USED" || (data.hintLevel && data.hintLevel > 0)) {
      hintsUsed++;
    }
    if (typeof data.voiceConfidenceScore === "number") {
      voiceConfidenceSum += data.voiceConfidenceScore;
      voiceConfidenceCount++;
    }
    if (data.expressedFrustration) frustrationCount++;
  }

  const avgVoiceConfidence =
    voiceConfidenceCount > 0 ? voiceConfidenceSum / voiceConfidenceCount : null;

  const oldest = chronological[0];
  const secondsSinceFirstAttempt = oldest
    ? Math.round((Date.now() - new Date(oldest.createdAt).getTime()) / 1000)
    : 0;

  const signals = {
    recentAttempts,
    recentWrong,
    wrongStreak,
    hintsUsed,
    avgVoiceConfidence,
    secondsSinceFirstAttempt,
  };

  // Decision rules. Tightest signals first; defaults to "continue" if nothing's wrong.

  // High severity — the kid is clearly stuck on a fundamental gap.
  if (wrongStreak >= 3) {
    return {
      action: "branch_to_prereq",
      severity: "high",
      reason: "Three consecutive wrong attempts suggest a missing prerequisite skill.",
      signals,
    };
  }

  // High — sustained struggle plus frustration cues.
  if (frustrationCount >= 2 && recentWrong >= 2) {
    return {
      action: "take_a_break",
      severity: "high",
      reason: "Repeated frustration cues alongside wrong answers — break > push.",
      signals,
    };
  }

  // Medium — voice answers low confidence + hint dependence.
  if (avgVoiceConfidence !== null && avgVoiceConfidence < 50 && hintsUsed >= 2) {
    return {
      action: "model_with_ari",
      severity: "medium",
      reason: "Low voice confidence and multiple hints — Ari should re-model the example.",
      signals,
    };
  }

  // Medium — multiple hints used, modality may be wrong.
  if (hintsUsed >= 3 && recentAttempts >= 2 && recentWrong >= 1) {
    return {
      action: "swap_modality",
      severity: "medium",
      reason: "Heavy hint usage with mixed accuracy — try a different teaching mode.",
      signals,
    };
  }

  // Medium — two wrong in a row but not enough to declare prereq gap.
  if (wrongStreak >= 2) {
    return {
      action: "simplify",
      severity: "medium",
      reason: "Two wrong in a row — drop difficulty before continuing.",
      signals,
    };
  }

  // Low — single recent wrong; offer light encouragement, no UI change.
  if (recentWrong >= 1 && recentAttempts >= 1) {
    return {
      action: "encourage",
      severity: "low",
      reason: "Single wrong answer — encourage and continue.",
      signals,
    };
  }

  return {
    action: "continue",
    severity: "low",
    reason: "No intervention indicators in recent signals.",
    signals,
  };
}

/**
 * Manual "I'm stuck" / "Take a break" tap from the lesson player. The kid is telling us
 * what they need; we honor it directly but still record the request as a signal so the
 * temperament model picks it up over time.
 */
export function manualInterventionAction(
  request: "stuck" | "break",
): InterventionRecommendation {
  if (request === "stuck") {
    return {
      action: "model_with_ari",
      severity: "medium",
      reason: "Child manually tapped 'I'm stuck' — Ari re-models the example.",
      signals: {
        recentAttempts: 0,
        recentWrong: 0,
        wrongStreak: 0,
        hintsUsed: 0,
        avgVoiceConfidence: null,
        secondsSinceFirstAttempt: 0,
      },
    };
  }
  return {
    action: "take_a_break",
    severity: "low",
    reason: "Child manually requested a break.",
    signals: {
      recentAttempts: 0,
      recentWrong: 0,
      wrongStreak: 0,
      hintsUsed: 0,
      avgVoiceConfidence: null,
      secondsSinceFirstAttempt: 0,
    },
  };
}
