/**
 * useTextToSpeech — small helper for the AssessmentQuestion (and other places
 * where the kid needs a passage spoken without the full karaoke word-by-word
 * highlighting).
 *
 * Hits POST /api/audio-cache (idempotent — same text = cache hit, no OpenAI
 * spend after first call). Returns a `play(text)` function the caller can
 * trigger on mount, on tap, or anywhere else.
 *
 * Critical for non-readers: the AssessmentQuestion component auto-plays the
 * prompt on mount and exposes per-option speakers so the kid can hear each
 * option before choosing.
 */
import { useCallback, useRef } from "react";

interface AudioCachePayload {
  id: string;
  audio: string; // base64
  audioType: string; // "audio/mpeg"
  duration: number;
  cached: boolean;
}

export interface UseTextToSpeechOptions {
  /** Playback rate. 0.85 is the default Cub register speed. */
  readonly speed?: number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const speed = options.speed ?? 0.85;
  // Map of text → object URL of decoded audio, so repeats during the same session
  // don't even hit the cache endpoint.
  const cacheRef = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const play = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      stop();

      let url = cacheRef.current.get(trimmed);
      if (!url) {
        try {
          const res = await fetch("/api/audio-cache", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed }),
          });
          if (!res.ok) return;
          const body = (await res.json()) as AudioCachePayload;
          const blob = new Blob(
            [Uint8Array.from(atob(body.audio), (c) => c.charCodeAt(0))],
            { type: body.audioType },
          );
          url = URL.createObjectURL(blob);
          cacheRef.current.set(trimmed, url);
        } catch {
          // Silent failure — non-readers will need to wait for the operator to step in.
          return;
        }
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.playbackRate = speed;
      try {
        await audioRef.current.play();
      } catch {
        // Autoplay can fail before any user gesture; swallow — the kid can tap to retry.
      }
    },
    [speed, stop],
  );

  return { play, stop };
}
