import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LionCharacter, LionGrowthStage, LionExpression } from "./LionCharacter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HighlightedText from "./HighlightedText";

interface LionTeacherProps {
  childId: string;
  childName: string;
  childLevel: number;
  lessonInstanceId: string;
  lessonTitle?: string;
  lessonSubject?: string;
  lessonObjective?: string;
  currentStep?: string;
  currentPhase?: string;
  onLessonEvent?: (event: LessonEvent) => void;
}

type LessonEvent = 
  | { type: "correct_answer" }
  | { type: "incorrect_answer" }
  | { type: "phase_change"; phase: string }
  | { type: "lesson_complete" }
  | { type: "need_help" };

interface Message {
  id: string;
  role: "child" | "lion";
  content: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

function getLionStage(level: number): LionGrowthStage {
  if (level <= 5) return "cub";
  if (level <= 15) return "young";
  if (level <= 25) return "adult";
  return "wise";
}

function getLionName(stage: LionGrowthStage): string {
  switch (stage) {
    case "cub": return "Ari";
    case "young": return "Ari";
    case "adult": return "King Ari";
    case "wise": return "Wise Ari";
  }
}

export function LionTeacher({
  childId,
  childName,
  childLevel,
  lessonInstanceId,
  lessonTitle,
  lessonSubject,
  lessonObjective,
  currentStep,
  currentPhase,
  onLessonEvent,
}: LionTeacherProps) {
  const [expression, setExpression] = useState<LionExpression>("happy");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordTimestamps, setWordTimestamps] = useState<Array<{word: string, start: number, end: number}>>([]);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  const stage = getLionStage(childLevel);
  const lionName = getLionName(stage);
  
  const isSpeechSupported = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Word timestamp tracking
  const updateWordFromTimestamp = useCallback((currentTime: number) => {
    if (wordTimestamps.length === 0) return;
    
    const leadTime = 0.15;
    const adjustedTime = currentTime + leadTime;
    
    let wordIndex = -1;
    for (let i = 0; i < wordTimestamps.length; i++) {
      if (adjustedTime >= wordTimestamps[i].start && adjustedTime < wordTimestamps[i].end) {
        wordIndex = i;
        break;
      }
      if (adjustedTime >= wordTimestamps[i].end) {
        if (i === wordTimestamps.length - 1 || adjustedTime < wordTimestamps[i + 1].start) {
          wordIndex = i;
        }
      }
    }
    
    if (wordIndex !== -1) {
      setCurrentWordIndex(wordIndex);
    }
  }, [wordTimestamps]);

  const updateTimeLoop = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      updateWordFromTimestamp(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
    }
  }, [updateWordFromTimestamp]);

  useEffect(() => {
    if (currentPhase) {
      switch (currentPhase) {
        case "concept":
          setExpression("teaching");
          break;
        case "practice":
          setExpression("encouraging");
          break;
        case "question":
          setExpression("thinking");
          break;
        case "complete":
          setExpression("celebrating");
          break;
        default:
          setExpression("happy");
      }
    }
  }, [currentPhase]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      setIsProcessing(true);
      setExpression("thinking");
      
      const res = await apiRequest("POST", "/api/ai-teacher/message", {
        lessonInstanceId,
        sessionId,
        message: text,
        lessonTitle,
        lessonSubject,
        lessonObjective,
        currentStep,
        currentPhase,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      
      if (data.assistantMessage?.content) {
        setSpeechBubble(data.assistantMessage.content);
        setExpression("speaking");
        
        if (audioEnabled) {
          await speakText(data.assistantMessage.content);
        }
      }
      
      setMessage("");
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      setExpression("encouraging");
      setIsProcessing(false);
      toast({
        title: "Oops!",
        description: "I had trouble understanding. Can you try again?",
        variant: "destructive",
      });
    },
  });

  
  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setExpression("speaking");
    setCurrentWordIndex(-1);
    setWordTimestamps([]);
    
    // Use new endpoint with word timestamps
    try {
      const res = await fetch(`/api/adaptive/lessons/${lessonInstanceId}/audio-with-timestamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) throw new Error("Failed to generate audio");
      
      const data = await res.json();
      
      if (data.wordTimestamps) {
        setWordTimestamps(data.wordTimestamps);
      }
      
      if (data.audio) {
        playAudioWithTracking(data.audio);
      }
    } catch (e) {
      console.error("Failed to speak:", e);
      setIsSpeaking(false);
      setExpression("happy");
    }
  };

  const playAudioWithTracking = useCallback((base64Audio: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsSpeaking(true);
        setExpression("speaking");
        animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
      };
      audio.onended = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setIsSpeaking(false);
        setExpression("happy");
        setCurrentWordIndex(-1);
        setWordTimestamps([]);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setExpression("happy");
        setCurrentWordIndex(-1);
      };
      
      audio.play().catch(console.error);
    } catch (e) {
      console.error("Failed to play audio:", e);
      setIsSpeaking(false);
    }
  }, [updateTimeLoop]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognitionRef.current = recognition;
    
    recognition.onstart = () => {
      setIsListening(true);
      setExpression("listening");
    };
    
    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      if (final) {
        setMessage(prev => (prev + " " + final).trim());
      }
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      setExpression("happy");
      recognitionRef.current = null;
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setExpression("happy");
      recognitionRef.current = null;
    };
    
    try {
      recognition.start();
    } catch (e) {
      recognitionRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setExpression("happy");
  }, []);

  const handleSend = () => {
    const text = message.trim();
    if (!text || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerEvent = (event: LessonEvent) => {
    switch (event.type) {
      case "correct_answer":
        setExpression("celebrating");
        setSpeechBubble("Amazing job! You got it right!");
        if (audioEnabled) speakText("Amazing job! You got it right!");
        break;
      case "incorrect_answer":
        setExpression("encouraging");
        setSpeechBubble("That's okay! Let's try again together.");
        if (audioEnabled) speakText("That's okay! Let's try again together.");
        break;
      case "lesson_complete":
        setExpression("celebrating");
        setSpeechBubble(`You did it, ${childName}! I'm so proud of you!`);
        if (audioEnabled) speakText(`You did it, ${childName}! I'm so proud of you!`);
        break;
    }
    onLessonEvent?.(event);
  };

  return (
    <div className="flex flex-col items-center" data-testid="lion-teacher-container">
      <div className="relative">
        <LionCharacter
          stage={stage}
          expression={expression}
          size={180}
          isSpeaking={isSpeaking}
          className={`transition-transform duration-300 ${
            expression === "celebrating" ? "animate-bounce" : ""
          }`}
        />
        
        {speechBubble && (
          <div 
            className="fixed sm:absolute left-1/2 -translate-x-1/2 top-4 sm:top-auto sm:-top-4 sm:-translate-y-full w-[92vw] sm:w-[90vw] max-w-[420px] bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-lg border-2 border-[var(--kid-yellow)]/30 z-50"
            data-testid="lion-speech-bubble"
          >
            <div className="text-sm sm:text-base leading-relaxed max-h-[40vh] overflow-y-auto">
              {isSpeaking && wordTimestamps.length > 0 ? (
                <HighlightedText
                  text={speechBubble}
                  currentWordIndex={currentWordIndex}
                  highlightEnabled={true}
                  className=""
                />
              ) : (
                <span>{speechBubble}</span>
              )}
            </div>
            <div className="hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800" />
            </div>
          </div>
        )}
        
        <p className="text-center text-sm font-semibold text-[var(--kid-yellow)] mt-2">
          {lionName}
        </p>
      </div>

      <div className="w-full max-w-sm mt-4 space-y-3">
        <div className="flex items-center gap-2">
          {isSpeechSupported && (
            <Button
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              className={`h-12 w-12 rounded-full shrink-0 ${
                isListening ? "animate-pulse ring-2 ring-red-300" : ""
              }`}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              data-testid="button-lion-mic"
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          )}
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Talk to me..."
            className="flex-1 h-12 text-base rounded-full px-4"
            disabled={isProcessing}
            data-testid="input-lion-message"
          />
          
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shrink-0 bg-[var(--kid-yellow)] hover:bg-[var(--kid-yellow)]/90"
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            data-testid="button-lion-send"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <span className="text-xl">→</span>
            )}
          </Button>
        </div>
        
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => setAudioEnabled(!audioEnabled)}
            data-testid="button-lion-audio-toggle"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 mr-1" /> Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 mr-1" /> Sound Off
              </>
            )}
          </Button>
        </div>
        
        {isListening && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            I'm listening... speak now!
          </p>
        )}
      </div>
    </div>
  );
}

export default LionTeacher;
