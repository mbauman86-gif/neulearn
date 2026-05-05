/**
 * LessonPage (v2) — production wiring of the LessonPlayerCub component.
 *
 * Lives at /v2/child/lesson/:lessonId (see App.tsx). Fetches the lesson_instance from
 * the existing API, normalizes it to the component's prop shape, and wires the
 * intervention engine + completion endpoints.
 *
 * Currently always renders Cub register. When Wise lands, switch on child.grade.
 */
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LessonPlayerCub } from "@/components/v2/LessonPlayerCub";
import type { LessonStep } from "@/components/v2/primitives/ProgressChip";
import {
  AriIntervention,
  type InterventionActionTag,
} from "@/components/v2/primitives/AriIntervention";
import {
  AssessmentQuestion,
  type AssessmentQuestionData,
} from "@/components/v2/primitives/AssessmentQuestion";
import { apiRequest } from "@/lib/queryClient";

interface InterventionResponse {
  action: InterventionActionTag;
  severity: "low" | "medium" | "high";
  reason: string;
}

interface LessonInstance {
  id: string;
  childId: string;
  subject: string;
  title: string;
  goal?: string | null;
  objective: string;
  targetSkillName: string;
  teachPhase?: {
    conceptExplanation: string;
    workedExample?: { problem: string; answer: string };
  } | null;
  assessment?: {
    questions: AssessmentQuestionData[];
  } | null;
  faithIntegration?: {
    scripture?: string;
    tieIn?: string;
    optionalPrayer?: string;
  } | null;
  status: string;
}

const STEP_ORDER: LessonStep[] = ["goal", "show", "try", "check", "done"];

export default function LessonPage() {
  const [, params] = useRoute<{ lessonId: string }>("/v2/child/lesson/:lessonId");
  const [location, navigate] = useLocation();
  const lessonId = params?.lessonId ?? "";
  const queryClient = useQueryClient();

  // Pull queueId / queueItemId from the URL search params so we can mark the
  // daily-queue item COMPLETED when the lesson finishes.
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const queueId = searchParams.get("queueId") ?? "";
  const queueItemId = searchParams.get("queueItemId") ?? "";

  const [step, setStep] = useState<LessonStep>("goal");
  const [activeIntervention, setActiveIntervention] = useState<InterventionResponse | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recentWrongStreak, setRecentWrongStreak] = useState(0);

  const { data: lesson, isLoading, error } = useQuery<LessonInstance>({
    queryKey: ["/api/adaptive/lessons", lessonId],
    enabled: !!lessonId,
  });

  const stuckMutation = useMutation<InterventionResponse>({
    mutationFn: async () =>
      apiRequest("POST", "/api/intervention/manual", { lessonId, request: "stuck" }).then((r) =>
        r.json(),
      ),
    onSuccess: (rec) => setActiveIntervention(rec),
  });

  const breakMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/intervention/manual", { lessonId, request: "break" }).then((r) =>
        r.json(),
      ),
    onSuccess: () => navigate("/v2/child/today"),
  });

  const completeMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", `/api/adaptive/lessons/${lessonId}/complete`, {}).then((r) => r.json()),
    onSuccess: async () => {
      // Mark the daily-queue item COMPLETED so it disappears from the Today screen.
      if (queueId && queueItemId) {
        await apiRequest("PATCH", `/api/daily-queue/${queueId}/items/${queueItemId}`, {
          status: "COMPLETED",
        }).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ["/api/daily-queue"] });
      navigate("/v2/child/today");
    },
  });

  const attemptMutation = useMutation({
    mutationFn: async (vars: { questionId: string; childAnswer: string; correctAnswer: string; isCorrect: boolean }) =>
      apiRequest("POST", `/api/adaptive/lessons/${lessonId}/attempt`, vars).then((r) => r.json()),
  });

  const recommendMutation = useMutation<InterventionResponse>({
    mutationFn: async () =>
      fetch(`/api/intervention/recommend/${lessonId}`, { credentials: "include" }).then((r) =>
        r.json(),
      ),
    onSuccess: (rec) => {
      // Only surface non-trivial recommendations. "continue" and "encourage" are
      // background-only signals.
      if (rec.action !== "continue") {
        setActiveIntervention(rec);
      }
    },
  });

  if (isLoading || !lesson) {
    return (
      <div className="bg-nl-canvas min-h-[100dvh] flex items-center justify-center">
        <p className="font-nl-display italic text-[20px] text-nl-ink-secondary">
          {error ? "Couldn't load this lesson." : "Loading…"}
        </p>
      </div>
    );
  }

  const focal = pickFocal(lesson, step);
  const questions = lesson.assessment?.questions ?? [];
  const activeQuestion = questions[questionIndex];

  function handleQuestionSubmit(answer: string, isCorrect: boolean) {
    if (!activeQuestion) return;
    attemptMutation.mutate({
      questionId: activeQuestion.questionId,
      childAnswer: answer,
      correctAnswer: String(activeQuestion.correctAnswer),
      isCorrect,
    });

    if (isCorrect) {
      setRecentWrongStreak(0);
      // Advance to next question after a brief celebration moment
      window.setTimeout(() => {
        if (questionIndex < questions.length - 1) {
          setQuestionIndex((i) => i + 1);
        } else if (step === "try") {
          setStep("check");
          setQuestionIndex(0);
        } else if (step === "check") {
          setStep("done");
        }
      }, 900);
    } else {
      const newStreak = recentWrongStreak + 1;
      setRecentWrongStreak(newStreak);
      // After two consecutive wrong, ping the intervention engine for a recommendation.
      if (newStreak >= 2) {
        recommendMutation.mutate();
      }
    }
  }

  const handleAdvance = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx === STEP_ORDER.length - 1) {
      completeMutation.mutate();
      return;
    }
    setStep(STEP_ORDER[idx + 1]);
  };

  const handleStuck = () => {
    stuckMutation.mutate();
  };

  const handleInterventionDismiss = () => {
    if (!activeIntervention) {
      setActiveIntervention(null);
      return;
    }
    // Apply the engine's action when the kid dismisses the overlay. Each action takes
    // a different effect; over time these can become richer (mid-lesson canvas
    // transformations rather than overlay-then-resume).
    switch (activeIntervention.action) {
      case "take_a_break":
        navigate("/v2/child/today");
        return;
      case "branch_to_prereq":
      case "swap_modality":
      case "model_with_ari":
      case "simplify":
        // These all signal that the lesson should soft-restart at the show step with
        // the engine's adaptation. Today we just rewind to "show" and let the lesson
        // re-render. Future: actually swap content in the canvas.
        setStep("show");
        setActiveIntervention(null);
        return;
      case "encourage":
      case "continue":
      default:
        setActiveIntervention(null);
        return;
    }
  };

  // For Try/Check steps, render the live AssessmentQuestion in the focal slot. The
  // lesson's `assessment.questions` field is the source — same items that legacy used.
  // When questions run out (or absent), fall back to the placeholder focal text.
  const focalContent =
    (step === "try" || step === "check") && activeQuestion ? (
      <AssessmentQuestion
        key={`${step}-${questionIndex}`}
        question={activeQuestion}
        onSubmit={handleQuestionSubmit}
        disabled={attemptMutation.isPending}
      />
    ) : undefined;

  return (
    <>
      <LessonPlayerCub
        goal={lesson.goal ?? lesson.objective}
        focalText={focal.text}
        focalEmphasis={focal.emphasis}
        caption={focal.caption}
        focalContent={focalContent}
        currentStep={step}
        onStepTap={(s) => {
          // Only allow tapping completed steps
          if (STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(step)) {
            setStep(s);
            setQuestionIndex(0);
          }
        }}
        currencies={{ depth: 0, explore: 0, comeback: 0 }}
        faithLens={{
          scripture: lesson.faithIntegration?.scripture ?? "",
          tieIn: lesson.faithIntegration?.tieIn ?? "",
          optionalPrayer: lesson.faithIntegration?.optionalPrayer,
        }}
        faithMode="subtle"
        onStuck={handleStuck}
        onBreak={() => breakMutation.mutate()}
        onAdvance={handleAdvance}
        canAdvance={!completeMutation.isPending}
      />
      {activeIntervention && (
        <AriIntervention
          action={activeIntervention.action}
          reason={activeIntervention.reason}
          onDismiss={handleInterventionDismiss}
        />
      )}
    </>
  );
}

function pickFocal(
  lesson: LessonInstance,
  step: LessonStep,
): { text: string; emphasis?: string; caption?: string } {
  const example = lesson.teachPhase?.workedExample?.problem ?? lesson.targetSkillName;
  switch (step) {
    case "goal":
      return { text: lesson.targetSkillName.replace(/_/g, " "), caption: "Today's path" };
    case "show":
      return { text: example, caption: lesson.teachPhase?.conceptExplanation };
    case "try":
      return { text: "Your turn", caption: "Tap the speaker to hear it again." };
    case "check":
      return { text: "Show what you know", caption: "A quick check, no rush." };
    case "done":
      return { text: "Great work.", caption: "Tap to finish." };
  }
}
