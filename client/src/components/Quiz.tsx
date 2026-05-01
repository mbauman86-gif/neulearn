import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  type: "MULTIPLE_CHOICE" | "YES_NO" | "SHORT_TEXT";
  questionText: string;
  options?: string[];
  correctAnswer: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (answers?: string[]) => void;
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleNext = () => {
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      setShowResults(true);
      onComplete(newAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    }
  };

  const correctCount = answers.filter(
    (answer, index) => answer === questions[index].correctAnswer
  ).length;

  if (showResults) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="w-20 h-20 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold" data-testid="text-quiz-complete">Great Job!</h2>
          <p className="text-2xl">
            You got <span className="font-bold text-primary" data-testid="text-quiz-score">{correctCount}</span> out of{" "}
            <span className="font-bold">{questions.length}</span> correct!
          </p>
          <div className="text-5xl font-bold text-primary" data-testid="text-points-earned">+15 Points</div>
          <Button
            onClick={() => {}}
            size="lg"
            className="h-16 text-xl font-semibold rounded-2xl px-12"
            data-testid="button-finish-quiz"
          >
            Awesome!
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <h3 className="text-2xl font-semibold" data-testid={`text-question-${currentQuestion}`}>{question.questionText}</h3>
        </div>

        <div className="space-y-3">
          {question.type === "SHORT_TEXT" ? (
            <Input
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="h-12 text-lg"
              data-testid="input-quiz-answer"
            />
          ) : (
            question.options?.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === option ? "default" : "outline"}
                className="w-full h-16 text-lg justify-start"
                onClick={() => setSelectedAnswer(option)}
                data-testid={`button-quiz-option-${index}`}
              >
                {option}
              </Button>
            ))
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!selectedAnswer}
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          data-testid="button-quiz-next"
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </Button>
      </CardContent>
    </Card>
  );
}
