import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Square, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReadAloudButtonProps {
  taskId: string;
}

export default function ReadAloudButton({ taskId }: ReadAloudButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  const loadAudio = async () => {
    if (audioUrlRef.current) {
      return audioUrlRef.current;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/audio`, {
        method: "POST",
        credentials: "include",
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

  if (isLoading) {
    return (
      <Button
        size="lg"
        variant="secondary"
        disabled
        className="h-16 px-8 rounded-2xl text-lg font-semibold gap-3"
        data-testid="button-read-loading"
      >
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading Voice...
      </Button>
    );
  }

  if (isPlaying) {
    return (
      <Button
        size="lg"
        variant="destructive"
        onClick={handleStop}
        className="h-16 px-8 rounded-2xl text-lg font-semibold gap-3"
        data-testid="button-read-stop"
      >
        <Square className="w-6 h-6" />
        Stop Reading
      </Button>
    );
  }

  if (audioReady && !isPlaying) {
    return (
      <Button
        size="lg"
        variant="secondary"
        onClick={handleReplay}
        className="h-16 px-8 rounded-2xl text-lg font-semibold gap-3 bg-primary/10 hover:bg-primary/20 text-primary"
        data-testid="button-read-replay"
      >
        <RotateCcw className="w-6 h-6" />
        Read Again
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="secondary"
      onClick={handlePlay}
      className="h-16 px-8 rounded-2xl text-lg font-semibold gap-3 bg-accent hover:bg-accent/80"
      data-testid="button-read-aloud"
    >
      <Volume2 className="w-6 h-6" />
      Read to Me
    </Button>
  );
}
