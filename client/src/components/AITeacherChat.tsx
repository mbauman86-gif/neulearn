import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, HelpCircle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HighlightedText from "./HighlightedText";

interface Message {
  id: string;
  role: "child" | "assistant";
  content: string;
  createdAt: string;
}

interface SessionData {
  session: {
    id: string;
    status: string;
  };
  messages: Message[];
}

interface AITeacherChatProps {
  lessonInstanceId: string;
  childId: string;
  childName: string;
  grade: number;
  lessonTitle?: string;
  lessonSubject?: string;
  lessonObjective?: string;
  currentStep?: string;
  currentPhase?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function AITeacherChat({
  lessonInstanceId,
  childId,
  childName,
  grade,
  lessonTitle,
  lessonSubject,
  lessonObjective,
  currentStep,
  currentPhase,
}: AITeacherChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(grade <= 2);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [pendingAudioMessage, setPendingAudioMessage] = useState<string | null>(null);
  const [spokenMessageIds, setSpokenMessageIds] = useState<Set<string>>(new Set());
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordTimestamps, setWordTimestamps] = useState<Array<{word: string, start: number, end: number}>>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const isYoungChild = grade <= 2;
  const isSpeechSupported = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const { data: sessionData, refetch: refetchSession } = useQuery<SessionData>({
    queryKey: ['/api/ai-teacher/session', lessonInstanceId],
    queryFn: async () => {
      const res = await fetch(`/api/ai-teacher/session/lesson/${lessonInstanceId}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch session");
      }
      return res.json();
    },
    enabled: isOpen && !hasLoadedSession,
    staleTime: 0,
  });

  useEffect(() => {
    if (sessionData && !hasLoadedSession) {
      setSessionId(sessionData.session.id);
      setMessages(sessionData.messages || []);
      const existingIds = new Set(sessionData.messages?.map(m => m.id) || []);
      setSpokenMessageIds(existingIds);
      setHasLoadedSession(true);
    }
  }, [sessionData, hasLoadedSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (ttsDebounceRef.current) {
        clearTimeout(ttsDebounceRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Word timestamp tracking loop
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

  // Play a specific message with word highlighting
  const playMessageWithHighlight = useCallback(async (messageId: string, text: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setPlayingMessageId(messageId);
    setCurrentWordIndex(-1);
    setWordTimestamps([]);
    setIsPlayingAudio(true);
    
    try {
      const res = await fetch("/api/adaptive/lessons/audio-with-timestamps", {
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
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        
        audio.onplay = () => {
          animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
        };
        
        audio.onended = () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          setIsPlayingAudio(false);
          setPlayingMessageId(null);
          setCurrentWordIndex(-1);
          setWordTimestamps([]);
        };
        
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setPlayingMessageId(null);
          setCurrentWordIndex(-1);
        };
        
        await audio.play();
      }
    } catch (e) {
      console.error("Failed to play audio:", e);
      setIsPlayingAudio(false);
      setPlayingMessageId(null);
    }
  }, [updateTimeLoop]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlayingAudio(false);
    setPlayingMessageId(null);
    setCurrentWordIndex(-1);
    setWordTimestamps([]);
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
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
      
      const newMessages: Message[] = [];
      
      if (data.userMessage) {
        newMessages.push({
          id: data.userMessage.id,
          role: "child",
          content: data.userMessage.content,
          createdAt: data.userMessage.createdAt,
        });
      }
      
      if (data.assistantMessage) {
        newMessages.push({
          id: data.assistantMessage.id,
          role: "assistant",
          content: data.assistantMessage.content,
          createdAt: data.assistantMessage.createdAt,
        });
        
        if (audioEnabled && data.assistantMessage.content && !spokenMessageIds.has(data.assistantMessage.id)) {
          setSpokenMessageIds(prev => {
            const updated = new Set(prev);
            updated.add(data.assistantMessage.id);
            return updated;
          });
          scheduleTTS(data.assistantMessage.content);
        }
      }
      
      setMessages(prev => [...prev, ...newMessages]);
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: "I couldn't send that message. Try again!",
        variant: "destructive",
      });
    },
  });

  const speakMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/ai-teacher/speak", { text });
      if (!res.ok) {
        throw new Error("Failed to generate speech");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.audio) {
        playAudio(data.audio);
      }
      setPendingAudioMessage(null);
    },
    onError: () => {
      setPendingAudioMessage(null);
    },
  });

  const scheduleTTS = useCallback((text: string) => {
    if (ttsDebounceRef.current) {
      clearTimeout(ttsDebounceRef.current);
    }
    
    ttsDebounceRef.current = setTimeout(() => {
      if (audioEnabled && !speakMutation.isPending) {
        setPendingAudioMessage(text);
      }
    }, 300);
  }, [audioEnabled, speakMutation.isPending]);

  useEffect(() => {
    if (pendingAudioMessage && audioEnabled && !speakMutation.isPending && !isPlayingAudio) {
      speakMutation.mutate(pendingAudioMessage);
    }
  }, [pendingAudioMessage, audioEnabled, isPlayingAudio]);

  const playAudio = useCallback((base64Audio: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => {
        setIsPlayingAudio(false);
        setPendingAudioMessage(null);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setPendingAudioMessage(null);
      };
      
      audio.play().catch(console.error);
    } catch (e) {
      console.error("Failed to play audio:", e);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognitionRef.current = recognition;
    
    recognition.onstart = () => setIsListening(true);
    
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
      recognitionRef.current = null;
    };
    
    recognition.onend = () => {
      setIsListening(false);
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

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasLoadedSession) {
      refetchSession();
    }
  };

  const suggestedQuestions = [
    "Can you explain this again?",
    "I don't understand",
    "Give me a hint",
    "What do I do next?",
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 rounded-full shadow-lg ${
          isYoungChild ? "h-20 w-20" : "h-16 w-16"
        } bg-gradient-to-br from-[var(--kid-blue)] to-[var(--neulearn-teal)] hover:scale-110 transition-transform`}
        data-testid="button-ai-teacher-open"
      >
        <div className="flex flex-col items-center gap-1">
          <HelpCircle className={isYoungChild ? "w-8 h-8" : "w-6 h-6"} />
          {isYoungChild && <span className="text-xs font-bold">Help!</span>}
        </div>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[440px] max-w-[calc(100vw-3rem)] h-[520px] shadow-2xl border-2 border-[var(--neulearn-teal)]/30 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-[var(--kid-blue)] to-[var(--neulearn-teal)] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Teacher</h3>
            <p className="text-xs opacity-80">Here to help you learn!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setAudioEnabled(!audioEnabled)}
            data-testid="button-ai-teacher-audio-toggle"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
            data-testid="button-ai-teacher-close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-[var(--neulearn-teal)] mb-4" />
              <p className="text-lg font-semibold mb-2">Hi {childName}!</p>
              <p className="text-muted-foreground text-sm">
                {isYoungChild 
                  ? "Tap a button below or use the microphone to ask me anything!"
                  : "Ask me anything about your lesson. I'm here to help!"
                }
              </p>
              
              <div className="mt-6 space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size={isYoungChild ? "lg" : "sm"}
                    className={`w-full ${isYoungChild ? "text-base py-4" : "text-sm"}`}
                    onClick={() => sendMessageMutation.mutate(q)}
                    disabled={sendMessageMutation.isPending}
                    data-testid={`button-suggested-question-${i}`}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "child" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                  msg.role === "child"
                    ? "bg-[var(--kid-blue)] text-white rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                {msg.role === "assistant" ? (
                  <div className="space-y-2">
                    <div className={`${isYoungChild ? "text-base" : "text-sm"} leading-relaxed`}>
                      {playingMessageId === msg.id ? (
                        <HighlightedText
                          text={msg.content}
                          currentWordIndex={currentWordIndex}
                          highlightEnabled={true}
                          className=""
                        />
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          if (playingMessageId === msg.id) {
                            stopPlayback();
                          } else {
                            playMessageWithHighlight(msg.id, msg.content);
                          }
                        }}
                        disabled={isPlayingAudio && playingMessageId !== msg.id}
                        data-testid={`button-play-message-${msg.id}`}
                      >
                        {playingMessageId === msg.id ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 mr-1" />
                            Read to Me
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={`${isYoungChild ? "text-base" : "text-sm"} leading-relaxed whitespace-pre-wrap`}>
                    {msg.content}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {isPlayingAudio && (
            <div className="flex justify-start">
              <div className="bg-[var(--neulearn-teal)]/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[var(--neulearn-teal)] animate-pulse" />
                <span className="text-xs text-[var(--neulearn-teal)]">Speaking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          {isSpeechSupported && (
            <Button
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              className={`${isYoungChild ? "h-12 w-12" : "h-10 w-10"} rounded-full shrink-0 ${
                isListening ? "animate-pulse ring-2 ring-red-300" : ""
              }`}
              onClick={isListening ? stopListening : startListening}
              disabled={sendMessageMutation.isPending}
              data-testid="button-ai-teacher-mic"
            >
              {isListening ? (
                <MicOff className={isYoungChild ? "w-6 h-6" : "w-5 h-5"} />
              ) : (
                <Mic className={isYoungChild ? "w-6 h-6" : "w-5 h-5"} />
              )}
            </Button>
          )}
          
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isYoungChild ? "Type or tap the mic..." : "Type your question..."}
            className={`flex-1 ${isYoungChild ? "h-12 text-base" : "h-10"}`}
            disabled={sendMessageMutation.isPending}
            data-testid="input-ai-teacher-message"
          />
          
          <Button
            size="icon"
            className={`${isYoungChild ? "h-12 w-12" : "h-10 w-10"} rounded-full shrink-0 bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90`}
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="button-ai-teacher-send"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className={`${isYoungChild ? "w-6 h-6" : "w-5 h-5"} animate-spin`} />
            ) : (
              <Send className={isYoungChild ? "w-6 h-6" : "w-5 h-5"} />
            )}
          </Button>
        </div>
        
        {isListening && (
          <p className="text-center text-sm text-muted-foreground mt-2 animate-pulse">
            Listening... speak now!
          </p>
        )}
      </div>
    </Card>
  );
}
