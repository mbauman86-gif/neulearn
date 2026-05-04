/**
 * KaraokeText — word-level highlighted read-along.
 *
 * Per .stitch/DESIGN.md §7.2:
 *   - Active word: warm-amber radial glow (radial-gradient, NOT a yellow rectangle)
 *   - Already-read words: faded to ink-tertiary
 *   - Tap any word to hear it in isolation
 *   - Tap the speaker icon to play the whole passage
 *
 * If `audioRef` is omitted, the component renders plaintext only (graceful fallback for
 * legacy lessons). The visual structure (word spans, click-to-pulse) still works.
 */
import { Volume2, Pause, Play } from "lucide-react";
import { useKaraoke, type KaraokeSpeed } from "@/hooks/useKaraoke";
import { SpeedChip } from "./SpeedChip";

export interface KaraokeAudioRef {
  /** lesson_audio_cache.id — fetched via /api/audio-cache/:id */
  readonly audioCacheId: string;
  /** The same text the audio was generated from (sanity check). */
  readonly text: string;
}

export interface KaraokeTextProps {
  readonly text: string;
  readonly audioRef?: KaraokeAudioRef;
  /** Tailwind text size classes — controls the rendered word size (e.g. "text-[96px]"). */
  readonly textClassName?: string;
  /** Show the play / pause button (default true). */
  readonly showPlayer?: boolean;
  /** Show the speed chip (default true when audioRef present). */
  readonly showSpeedChip?: boolean;
  /** Default playback speed. Cub register: 0.85; Wise register: 1.0. */
  readonly defaultSpeed?: KaraokeSpeed;
}

export function KaraokeText({
  text,
  audioRef,
  textClassName = "text-[22px]",
  showPlayer = true,
  showSpeedChip,
  defaultSpeed = 0.85,
}: KaraokeTextProps) {
  const k = useKaraoke({
    text,
    audioCacheId: audioRef?.audioCacheId,
    defaultSpeed,
  });

  const speedChipVisible = showSpeedChip ?? !!audioRef;

  return (
    <div className="flex flex-col items-center gap-4" data-testid="v2-karaoke-text">
      {showPlayer && (
        <button
          type="button"
          onClick={k.isPlaying ? k.pause : k.play}
          disabled={!k.hasAudio && !!audioRef}
          className="w-16 h-16 rounded-full bg-nl-amber-500/10 flex items-center justify-center text-nl-amber-500 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
          aria-label={k.isPlaying ? "Pause read-along" : "Play read-along"}
          data-testid="v2-karaoke-play"
        >
          {k.isPlaying ? <Pause size={32} fill="currentColor" /> : !audioRef ? <Volume2 size={32} /> : <Play size={32} fill="currentColor" />}
        </button>
      )}

      <p
        className={`font-nl-reading ${textClassName} leading-relaxed text-center select-none`}
        // word-spacing per DESIGN.md §3
        style={{ wordSpacing: "0.05em", letterSpacing: "0.01em" }}
      >
        {k.words.map((word, i) => {
          const isActive = i === k.activeWordIndex;
          const isPlayed = k.playedWordIndexes.has(i) && !isActive;

          const colorClass = isActive
            ? "text-nl-ink"
            : isPlayed
              ? "text-nl-ink-tertiary transition-colors duration-300"
              : "text-nl-ink";

          // Soft warm-amber radial glow — KEY visual primitive (DESIGN.md §7.2).
          // Implemented as a radial-gradient background, NOT a flat yellow rectangle.
          const glowStyle = isActive
            ? {
                background:
                  "radial-gradient(ellipse at center, rgba(214, 168, 91, 0.45) 0%, rgba(214, 168, 91, 0) 75%)",
                fontWeight: 600,
              }
            : undefined;

          return (
            <span
              key={`${word}-${i}`}
              onClick={() => k.playWord(i)}
              className={`${colorClass} relative inline-block transition-colors px-1 cursor-pointer hover:text-nl-amber-500`}
              style={glowStyle}
              data-testid={`v2-karaoke-word-${i}`}
            >
              {word}
              {i < k.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </p>

      {speedChipVisible && (
        <SpeedChip speed={k.speed} onChange={k.setSpeed} />
      )}
    </div>
  );
}
