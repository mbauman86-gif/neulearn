/**
 * SpeedChip — three-state karaoke playback speed selector.
 *
 *   0.7×  decoding speed (struggling reader, dyslexia mode default)
 *   0.85× Cub register default
 *   1.0×  Wise register default / fluent reader
 *
 * Per .stitch/DESIGN.md §7.2 — no exposed slider, just three discrete choices.
 */
import type { KaraokeSpeed } from "@/hooks/useKaraoke";

export interface SpeedChipProps {
  readonly speed: KaraokeSpeed;
  readonly onChange: (s: KaraokeSpeed) => void;
}

const OPTIONS: ReadonlyArray<KaraokeSpeed> = [0.7, 0.85, 1.0];

export function SpeedChip({ speed, onChange }: SpeedChipProps) {
  return (
    <div
      className="flex items-center gap-1 bg-nl-canvas rounded-full p-1 border border-nl-ink-secondary/10"
      role="radiogroup"
      aria-label="Read-along speed"
      data-testid="v2-speed-chip"
    >
      {OPTIONS.map((opt) => {
        const active = opt === speed;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={
              active
                ? "px-3 py-1 text-[12px] font-bold bg-nl-amber-500 text-nl-raised rounded-full shadow-sm"
                : "px-3 py-1 text-[12px] font-bold text-nl-ink-secondary opacity-50 hover:opacity-100 transition-opacity"
            }
            data-testid={`v2-speed-option-${opt}`}
          >
            {opt}×
          </button>
        );
      })}
    </div>
  );
}
