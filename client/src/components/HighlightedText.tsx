import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  currentWordIndex: number;
  highlightEnabled: boolean;
  className?: string;
}

export default function HighlightedText({
  text,
  currentWordIndex,
  highlightEnabled,
  className = "",
}: HighlightedTextProps) {
  const words = useMemo(() => text.split(/(\s+)/).filter(Boolean), [text]);

  if (!highlightEnabled) {
    return <span className={className}>{text}</span>;
  }

  let wordCounter = 0;

  return (
    <span className={className}>
      {words.map((word, index) => {
        const isWhitespace = word.trim().length === 0;

        if (isWhitespace) {
          return <span key={index}>{word}</span>;
        }

        const thisWordIndex = wordCounter;
        wordCounter++;

        const isHighlighted = thisWordIndex === currentWordIndex;
        const isPast = currentWordIndex >= 0 && thisWordIndex < currentWordIndex;

        return (
          <span
            key={index}
            className={`transition-all duration-100 rounded px-0.5 ${
              isHighlighted
                ? "bg-yellow-300 dark:bg-yellow-500/70 text-foreground scale-105 inline-block font-semibold"
                : isPast
                ? "text-muted-foreground/60"
                : ""
            }`}
            data-testid={`word-${thisWordIndex}`}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}
