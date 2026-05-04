/**
 * useKaraoke — reads a text passage aloud with word-level highlighting.
 *
 * Per .stitch/DESIGN.md §7.2:
 *   - Active word gets a soft warm-amber radial glow (NOT a yellow rectangle)
 *   - Already-read words fade to ink-tertiary
 *   - Adjustable speed (0.7× / 0.85× / 1.0×); decoding-friendly default for new readers
 *
 * Audio source priority:
 *   1. If `audioCacheId` is provided, fetch from `/api/audio-cache/:id` — returns the
 *      cached MP3 + word timestamps from the `lesson_audio_cache` table. This is the
 *      production path; once one read-along is generated, every replay is free.
 *   2. Otherwise, the hook returns plaintext-only state — words are rendered without
 *      audio playback. Graceful fallback for legacy lessons that haven't been TTS'd yet.
 *
 * TODO(server): the `/api/audio-cache/:id` endpoint doesn't exist yet — see Slice 1
 * tasks. When it lands, this hook is already wired.
 */
import { useEffect, useMemo, useRef, useState } from "react";

export type KaraokeSpeed = 0.7 | 0.85 | 1.0;

export interface AudioCacheResponse {
  readonly audio: string; // base64-encoded MP3
  readonly audioType: string; // "audio/mpeg"
  readonly wordTimestamps: ReadonlyArray<{
    readonly word: string;
    readonly start: number; // seconds
    readonly end: number;
  }>;
  readonly duration: number;
}

export interface UseKaraokeOptions {
  readonly text: string;
  readonly audioCacheId?: string;
  readonly defaultSpeed?: KaraokeSpeed;
}

export interface KaraokeState {
  /** Words split from the text, in render order. */
  readonly words: ReadonlyArray<string>;
  /** Index of the currently-spoken word, or -1 if not playing. */
  readonly activeWordIndex: number;
  /** Indexes of already-played words. */
  readonly playedWordIndexes: ReadonlySet<number>;
  readonly isPlaying: boolean;
  readonly isLoading: boolean;
  readonly hasAudio: boolean;
  readonly speed: KaraokeSpeed;
  readonly play: () => void;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly setSpeed: (s: KaraokeSpeed) => void;
  /** Tap a single word to hear it in isolation; the glow pulses once. */
  readonly playWord: (index: number) => void;
}

export function useKaraoke({
  text,
  audioCacheId,
  defaultSpeed = 0.85,
}: UseKaraokeOptions): KaraokeState {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const [audioBuffer, setAudioBuffer] = useState<AudioCacheResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [playedWordIndexes, setPlayedWordIndexes] = useState<Set<number>>(new Set());
  const [speed, setSpeed] = useState<KaraokeSpeed>(defaultSpeed);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // Fetch audio + timestamps when audioCacheId changes.
  useEffect(() => {
    if (!audioCacheId) return;
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/audio-cache/${audioCacheId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("audio fetch failed");
        return r.json() as Promise<AudioCacheResponse>;
      })
      .then((body) => {
        if (cancelled) return;
        setAudioBuffer(body);
        const blob = new Blob(
          [Uint8Array.from(atob(body.audio), (c) => c.charCodeAt(0))],
          { type: body.audioType },
        );
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
      })
      .catch(() => {
        // Silent failure — falls back to plaintext rendering.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [audioCacheId]);

  // Cleanup audio URL on unmount.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function ensureAudioElement(): HTMLAudioElement | null {
    if (!audioUrlRef.current) return null;
    if (!audioElRef.current) {
      const audio = new Audio(audioUrlRef.current);
      audio.onended = () => {
        setIsPlaying(false);
        setActiveWordIndex(-1);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
      audioElRef.current = audio;
    }
    audioElRef.current.playbackRate = speed;
    return audioElRef.current;
  }

  function tickWordTimings() {
    if (!audioElRef.current || !audioBuffer) return;
    const t = audioElRef.current.currentTime;
    const idx = audioBuffer.wordTimestamps.findIndex((w) => t >= w.start && t < w.end);
    if (idx !== -1 && idx !== activeWordIndex) {
      setActiveWordIndex(idx);
      setPlayedWordIndexes((prev) => {
        const next = new Set(prev);
        for (let i = 0; i < idx; i++) next.add(i);
        return next;
      });
    }
    rafRef.current = requestAnimationFrame(tickWordTimings);
  }

  const play = () => {
    const audio = ensureAudioElement();
    if (!audio) return;
    audio.playbackRate = speed;
    audio.play().catch(() => undefined);
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tickWordTimings);
  };

  const pause = () => {
    audioElRef.current?.pause();
    setIsPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  };

  const stop = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setPlayedWordIndexes(new Set());
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  };

  const playWord = (index: number) => {
    if (!audioBuffer || !audioElRef.current) {
      // Without audio we just visually pulse via activeWordIndex.
      setActiveWordIndex(index);
      window.setTimeout(() => setActiveWordIndex(-1), 600);
      return;
    }
    const ts = audioBuffer.wordTimestamps[index];
    if (!ts) return;
    audioElRef.current.currentTime = ts.start;
    audioElRef.current.playbackRate = speed;
    audioElRef.current.play().catch(() => undefined);
    setActiveWordIndex(index);
    rafRef.current = requestAnimationFrame(tickWordTimings);
    // Stop after this single word ends.
    const stopAfter = (ts.end - ts.start) / speed;
    window.setTimeout(() => {
      audioElRef.current?.pause();
      setIsPlaying(false);
      setActiveWordIndex(-1);
    }, stopAfter * 1000 + 80);
  };

  return {
    words,
    activeWordIndex,
    playedWordIndexes,
    isPlaying,
    isLoading,
    hasAudio: !!audioBuffer,
    speed,
    play,
    pause,
    stop,
    setSpeed,
    playWord,
  };
}
