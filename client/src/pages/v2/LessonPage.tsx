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
  const [, navigate] = useLocation();
  const lessonId = params?.lessonId ?? "";
  const queryClient = useQueryClient();

  const [step, setStep] = useState<LessonStep>("goal");
  const [activeIntervention, setActiveIntervention] = useState<InterventionResponse | null>(null);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-queue"] });
      navigate("/v2/child/today");
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

  // Pick what to show in the focal slot based on the current step. For now this is a
  // simplified mapping — Goal shows the goal text, Show shows the worked example
  // problem, Try shows a placeholder, Check shows a placeholder. The full transforming
  // canvas will be wired through as the assessment-driven steps land.
  const focal = pickFocal(lesson, step);

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

  return (
    <>
      <LessonPlayerCub
        goal={lesson.goal ?? lesson.objective}
        focalText={focal.text}
        focalEmphasis={focal.emphasis}
        caption={focal.caption}
        currentStep={step}
        onStepTap={(s) => {
          // Only allow tapping completed steps
          if (STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(step)) {
            setStep(s);
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
