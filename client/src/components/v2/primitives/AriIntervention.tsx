/**
 * AriIntervention — soft overlay that surfaces an intervention recommendation as a
 * brief Ari moment. Replaces the previous pattern where intervention signals were
 * just console.logged.
 *
 * Each action has its own warm phrasing — never shaming, always inviting. The kid sees
 * Ari, hears (or reads) a short line, taps "okay" and the lesson resumes (or pauses,
 * for the take_a_break case).
 *
 * Per .stitch/DESIGN.md §7.7: "anti-stuck transformation: when the engine pivots, the
 * canvas softly transforms — no shame moment, no pop-up."
 *
 * This is currently a centered overlay rather than an in-canvas transformation —
 * pragmatic step-1 implementation. Future pass: each action morphs the lesson canvas
 * directly (simplify replaces the focal item; model_with_ari shows the worked example
 * again; etc.).
 */
import { AriCub } from "./AriCub";

export type InterventionActionTag =
  | "continue"
  | "encourage"
  | "simplify"
  | "branch_to_prereq"
  | "swap_modality"
  | "model_with_ari"
  | "take_a_break";

export interface AriInterventionMessage {
  readonly title: string;
  readonly body: string;
  readonly cta: string;
}

const COPY: Readonly<Record<InterventionActionTag, AriInterventionMessage>> = {
  continue: {
    title: "Looking good.",
    body: "Keep going at your pace.",
    cta: "Okay",
  },
  encourage: {
    title: "Hmm — close.",
    body: "Let's try one more time.",
    cta: "Try again",
  },
  simplify: {
    title: "Let's try a smaller version.",
    body: "Same idea, less to hold in your head.",
    cta: "Show me",
  },
  branch_to_prereq: {
    title: "Let's try a different way.",
    body: "We'll come back to this. First, something a little easier that gets us there.",
    cta: "Show me the easier one",
  },
  swap_modality: {
    title: "Let's switch how we're doing this.",
    body: "Same idea, different approach. Same brain, new gear.",
    cta: "Try the new way",
  },
  model_with_ari: {
    title: "I'll show you.",
    body: "Watch me do one. Then your turn.",
    cta: "Watch",
  },
  take_a_break: {
    title: "Let's take a breath.",
    body: "Going outside or stretching is part of learning, too. Come back when you're ready.",
    cta: "Take a break",
  },
};

export interface AriInterventionProps {
  readonly action: InterventionActionTag;
  /** Optional override for the engine-emitted reason (kept human-readable). */
  readonly reason?: string;
  readonly onDismiss: () => void;
}

export function AriIntervention({ action, reason, onDismiss }: AriInterventionProps) {
  const copy = COPY[action];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-nl-ink/30 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ari-intervention-title"
      data-testid={`v2-intervention-${action}`}
    >
      <div className="bg-nl-raised rounded-[2rem] shadow-xl border border-black/5 max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center">
        <div className="w-32 h-32 mb-4">
          <AriCub />
        </div>
        <h2
          id="ari-intervention-title"
          className="font-nl-display italic text-[28px] sm:text-[32px] leading-tight text-nl-ink mb-3"
        >
          {copy.title}
        </h2>
        <p className="font-nl-reading text-[18px] sm:text-[20px] text-nl-ink-secondary leading-relaxed max-w-[40ch] mb-6">
          {copy.body}
        </p>
        {reason && import.meta.env.MODE !== "production" && (
          <p className="font-nl-body text-[12px] text-nl-ink-tertiary mb-3 italic">[engine: {reason}]</p>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="bg-nl-amber-500 text-nl-raised font-nl-body font-semibold rounded-full px-8 py-3 text-[16px] hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-nl-amber-500/20"
          data-testid="v2-intervention-dismiss"
        >
          {copy.cta}
        </button>
      </div>
    </div>
  );
}
