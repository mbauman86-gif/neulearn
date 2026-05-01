import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume2, Loader2, Square, RotateCcw, Highlighter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HighlightedText from "./HighlightedText";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface ReadAloudSectionProps {
  text: string;
  lessonId: string;
  stepType: string;
  stepContent?: string;
  stepIndex: number;
  compact?: boolean;
  textClassName?: string;
  showHighlightToggle?: boolean;
  defaultHighlightEnabled?: boolean;
}

export default function ReadAloudSection({
  text,
  lessonId,
  stepType,
  stepContent,
  stepIndex,
  compact = false,
  textClassName = "",
  showHighlightToggle = true,
  defaultHighlightEnabled = true,
}: ReadAloudSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [highlightEnabled, setHighlightEnabled] = useState(defaultHighlightEnabled);
  const [hasPlayed, setHasPlayed] = useState(false);
  
  // Audio and timestamp data
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const wordTimestampsRef = useRef<WordTimestamp[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  const lastRequestRef = useRef<string>("");
  const { toast } = useToast();

  // Calculate word positions for text display
  const wordPositions = useMemo(() => {
    const positions: { start: number; end: number; word: string }[] = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      positions.push({
        start: match.index,
        end: match.index + match[0].length,
        word: match[0]
      });
    }
    return positions;
  }, [text]);

  const wordCount = wordPositions.length;

  const requestKey = `${lessonId}-${stepType}-${stepIndex}-${stepContent?.slice(0, 50) || ""}`;

  // Reset state when content changes
  useEffect(() => {
    if (requestKey !== lastRequestRef.current) {
      // Cancel audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      wordTimestampsRef.current = [];
      
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setHasPlayed(false);
      lastRequestRef.current = requestKey;
    }
  }, [requestKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Find current word based on audio time and Whisper timestamps
  const updateWordFromTimestamp = useCallback((currentTime: number) => {
    if (!highlightEnabled) return;
    
    const timestamps = wordTimestampsRef.current;
    if (timestamps.length === 0) return;
    
    // Add a small lead time so highlight appears slightly before the word is spoken
    // This helps with short words that pass quickly
    const leadTime = 0.15; // 150ms ahead
    const adjustedTime = currentTime + leadTime;
    
    // Find which word should be highlighted at adjustedTime
    let wordIndex = -1;
    for (let i = 0; i < timestamps.length; i++) {
      if (adjustedTime >= timestamps[i].start && adjustedTime < timestamps[i].end) {
        wordIndex = i;
        break;
      }
      // If we're past this word's end but before next word's start
      if (adjustedTime >= timestamps[i].end) {
        if (i === timestamps.length - 1 || adjustedTime < timestamps[i + 1].start) {
          wordIndex = i;
        }
      }
    }
    
    // Map Whisper word index to our display word index
    if (wordIndex !== -1 && wordIndex < wordCount) {
      setCurrentWordIndex(wordIndex);
    }
  }, [highlightEnabled, wordCount]);

  // Animation loop for timestamp-based tracking
  const updateTimeLoop = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      updateWordFromTimestamp(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
    }
  }, [updateWordFromTimestamp]);

  // Load audio with word timestamps from Whisper
  const loadAudioWithTimestamps = async () => {
    if (audioUrlRef.current && wordTimestampsRef.current.length > 0) {
      return audioUrlRef.current;
    }

    const response = await fetch(`/api/adaptive/lessons/${lessonId}/audio-with-timestamps`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate audio");
    }

    const data = await response.json();
    
    // Store word timestamps from Whisper
    wordTimestampsRef.current = data.wordTimestamps || [];
    
    // Convert base64 audio to blob URL
    const audioBlob = new Blob(
      [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
      { type: data.audioType }
    );
    const url = URL.createObjectURL(audioBlob);
    audioUrlRef.current = url;
    
    return url;
  };

  // Play audio with synchronized highlighting
  const playAudio = async () => {
    try {
      const url = await loadAudioWithTimestamps();

      if (!audioRef.current) {
        audioRef.current = new Audio(url);

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentWordIndex(-1);
          setHasPlayed(true);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };

        audioRef.current.onerror = () => {
          setIsPlaying(false);
          setCurrentWordIndex(-1);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          toast({
            title: "Oops!",
            description: "Something went wrong playing the audio.",
            variant: "destructive",
          });
        };
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setCurrentWordIndex(0);
      animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
    } catch (error) {
      toast({
        title: "Oops!",
        description: "Couldn't load the audio. Please try again!",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await playAudio();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    setHasPlayed(true);
  }, []);

  const handleReplay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentWordIndex(0);
      animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
    } else {
      handlePlay();
    }
  }, [handlePlay, updateTimeLoop]);

  const baseClass = compact
    ? "gap-2"
    : "h-12 px-6 rounded-xl text-base font-semibold gap-2";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";

  const renderButton = () => {
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
          variant="outline"
          onClick={handleStop}
          className={baseClass}
          data-testid="button-read-stop"
        >
          <Square className={iconSize} />
          {!compact && "Stop"}
        </Button>
      );
    }

    if (hasPlayed) {
      return (
        <Button
          size={compact ? "sm" : "default"}
          variant="outline"
          onClick={handleReplay}
          className={baseClass}
          data-testid="button-read-replay"
        >
          <RotateCcw className={iconSize} />
          {!compact && "Listen Again"}
        </Button>
      );
    }

    return (
      <Button
        size={compact ? "sm" : "default"}
        variant="default"
        onClick={handlePlay}
        className={`${baseClass} bg-primary hover:bg-primary/90`}
        data-testid="button-read-play"
      >
        <Volume2 className={iconSize} />
        {!compact && "Read to Me"}
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        {renderButton()}
        
        {showHighlightToggle && (
          <div className="flex items-center gap-2">
            <Switch
              id="highlight-toggle"
              checked={highlightEnabled}
              onCheckedChange={setHighlightEnabled}
              data-testid="switch-highlight-toggle"
            />
            <Label 
              htmlFor="highlight-toggle" 
              className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer"
            >
              <Highlighter className="w-4 h-4" />
              Follow Along
            </Label>
          </div>
        )}
      </div>

      {text && (
        <HighlightedText
          text={text}
          currentWordIndex={highlightEnabled && isPlaying ? currentWordIndex : -1}
          highlightEnabled={highlightEnabled && isPlaying}
          className={textClassName}
        />
      )}
    </div>
  );
}
