import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceInput({ onTranscript, disabled = false, className = "" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    cancelledRef.current = false;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (!cancelledRef.current) {
        setIsListening(true);
        setInterimTranscript("");
      }
    };

    recognition.onresult = (event: any) => {
      if (cancelledRef.current) {
        return;
      }
      
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      
      if (final && !cancelledRef.current) {
        onTranscript(final.trim());
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      recognitionRef.current = null;
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    cancelledRef.current = true;
    setIsListening(false);
    setInterimTranscript("");
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop speech recognition:", e);
      }
      recognitionRef.current = null;
    }
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Button
        type="button"
        size="lg"
        variant={isListening ? "destructive" : "outline"}
        className={`h-16 w-16 rounded-full p-0 transition-all duration-300 ${
          isListening 
            ? "animate-pulse ring-4 ring-red-300 dark:ring-red-700" 
            : "hover:bg-primary/10 hover:border-primary"
        }`}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        data-testid="button-voice-input"
      >
        {isListening ? (
          <MicOff className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </Button>
      
      <span className="text-sm font-medium text-muted-foreground">
        {isListening ? "Listening... tap to stop" : "Tap to speak"}
      </span>
      
      {interimTranscript && (
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm italic">"{interimTranscript}"</span>
        </div>
      )}
    </div>
  );
}
