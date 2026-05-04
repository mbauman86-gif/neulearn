/**
 * LessonPlayerCubDemo — preview route for the Cub-register lesson player.
 *
 * Mounted at `/v2/preview/lesson-cub` (see App.tsx). Wires the v2 LessonPlayerCub
 * component up with mock data so we can iterate on visual fidelity before the
 * server-side integration lands.
 *
 * No authentication required so it's easy to preview during alpha review.
 */
import { useState } from "react";
import { LessonPlayerCub } from "@/components/v2/LessonPlayerCub";
import type { LessonStep } from "@/components/v2/primitives/ProgressChip";

export default function LessonPlayerCubDemo() {
  const [step, setStep] = useState<LessonStep>("show");
  const [currencies, setCurrencies] = useState({ depth: 12, explore: 5, comeback: 3 });

  return (
    <LessonPlayerCub
      goal="Today we'll listen for /sh/ in words"
      focalEmphasis="/sh/"
      focalText="ship"
      caption="Two letters, one sound."
      currentStep={step}
      onStepTap={setStep}
      currencies={currencies}
      faithLens={{
        scripture:
          "Train up a child in the way he should go; even when he is old he will not depart from it.",
        tieIn:
          "Learning to read is a small daily training. Each new sound is a step on a long journey — and the journey itself is part of the gift.",
        optionalPrayer: undefined,
        goDeeperUrl: undefined,
      }}
      faithMode="subtle"
      onStuck={() => alert("[demo] intervention engine would simplify or branch here")}
      onBreak={() => alert("[demo] would persist progress and pause")}
      onAdvance={() => {
        const order: LessonStep[] = ["goal", "show", "try", "check", "done"];
        const i = order.indexOf(step);
        if (i < order.length - 1) {
          setStep(order[i + 1]);
          setCurrencies((c) => ({ ...c, depth: c.depth + 1 }));
        }
      }}
    />
  );
}
