import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Square, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdaptiveLessonReadAloudButtonProps {
  lessonId: string;
  stepType: "concept" | "worked_example" | "worked_example_step" | "worked_example_conclusion" | "instruction" | "practice" | "question" | "full";
  stepContent?: string;
  stepIndex: number;
  compact?: boolean;
}

export default function AdaptiveLessonReadAloudButton({ 
  lessonId, 
  stepType, 
  stepContent,
  stepIndex,
  compact = false 
}: AdaptiveLessonReadAloudButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lastRequestRef = useRef<string>("");
  const { toast } = useToast();

  const requestKey = `${lessonId}-${stepType}-${stepIndex}-${stepContent?.slice(0, 50) || ""}`;
  
  useEffect(() => {
    if (requestKey !== lastRequestRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setAudioReady(false);
      setIsPlaying(false);
      lastRequestRef.current = requestKey;
    }
  }, [requestKey]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const loadAudio = async () => {
    if (audioUrlRef.current) {
      return audioUrlRef.current;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/adaptive/lessons/${lessonId}/audio`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stepType, stepContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioReady(true);
      return url;
    } catch (error: any) {
      toast({
        title: "Oops!",
        description: "Couldn't load the audio. Please try again!",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    try {
      const url = await loadAudio();
      
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          toast({
            title: "Oops!",
            description: "Something went wrong playing the audio.",
            variant: "destructive",
          });
        };
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleReplay = async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      handlePlay();
    }
  };

  const baseClass = compact 
    ? "gap-2" 
    : "h-12 px-6 rounded-xl text-base font-semibold gap-2";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";

  if (isLoading) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        variant="outline"
        disabled
        className={baseClass}
        data-testid="button-read-loading"
      >
        <Loader2 className={`${iconSize} animate-spin`} />
        {!compact && "Loading..."}
      </Button>
    );
  }

  if (isPlaying) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        variant="destructive"
        onClick={handleStop}
        className={baseClass}
        data-testid="button-read-stop"
      >
        <Square className={iconSize} />
        {!compact && "Stop"}
      </Button>
    );
  }

  if (audioReady && !isPlaying) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        variant="outline"
        onClick={handleReplay}
        className={`${baseClass} border-[var(--kid-blue)] text-[var(--kid-blue)]`}
        data-testid="button-read-replay"
      >
        <RotateCcw className={iconSize} />
        {!compact && "Play Again"}
      </Button>
    );
  }

  return (
    <Button
      size={compact ? "sm" : "default"}
      variant="outline"
      onClick={handlePlay}
      className={`${baseClass} border-[var(--kid-blue)] text-[var(--kid-blue)] hover:bg-[var(--kid-blue)]/10`}
      data-testid="button-read-aloud"
    >
      <Volume2 className={iconSize} />
      {!compact && "Read to Me"}
    </Button>
  );
}
