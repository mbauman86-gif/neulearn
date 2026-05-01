import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Lightbulb, PartyPopper, ArrowRight, Star, BookOpen, Calculator, Heart, HelpCircle, Mic, TrendingUp, Flame, Trophy, Users, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import NeuLearnLogo from "./NeuLearnLogo";
import AdaptiveLessonReadAloudButton from "./AdaptiveLessonReadAloudButton";
import ReadAloudSection from "./ReadAloudSection";
import VoiceInput from "./VoiceInput";
import LevelUpCelebration from "./LevelUpCelebration";
import LionTeacher from "./LionTeacher";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/useAuth";
import type { LessonInstance, AssessmentQuestion, PracticeActivity, LessonProgressState } from "@shared/schema";

const subjectIcons = {
  MATH: Calculator,
  READING: BookOpen,
  CHARACTER: Heart,
};

const subjectColors = {
  MATH: "var(--kid-blue)",
  READING: "var(--kid-green)",
  CHARACTER: "var(--kid-yellow)",
};

interface LessonStep {
  type: "concept" | "worked_example" | "worked_example_step" | "worked_example_conclusion" | "instruction" | "practice" | "question" | "complete";
  content?: string;
  question?: AssessmentQuestion;
  practiceActivity?: PracticeActivity;
  stepIndex: number;
  workedExampleStep?: {
    stepNumber: number;
    instruction: string;
    visual?: string;
  };
  workedExampleAnswer?: string;
  doStep?: {
    stepNumber: number;
    parentInstructions: string;
    childTask: string;
  };
}

interface AttemptResponse {
  isCorrect: boolean;
  attemptNumber: number;
  message: string;
  hint?: string;
  nextAction?: string;
  validationMode?: 'strict' | 'fuzzy' | 'lenient';
  correctAnswer?: string;
  showCorrectAnswer?: boolean;
  allowSkip?: boolean;
  skippedForParent?: boolean;
}

interface CompletionResult {
  message: string;
  pointsEarned: number;
  accuracy: number;
  journeyProgress?: {
    journeyPosition: number;
    growthPoints: number;
  };
  progression?: {
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    newTitle?: string;
    unlockedItems?: Array<{
      name: string;
      slug: string;
    }>;
    badgesEarned?: Array<{
      name: string;
      slug: string;
      xpAwarded: number;
    }>;
    currentStreak: number;
  };
}

interface AdaptiveLessonPlayerProps {
  lessonId: string;
}

export default function AdaptiveLessonPlayer({ lessonId }: AdaptiveLessonPlayerProps) {
  const [, setLocation] = useLocation();
  const { child } = useAuth();
  const { toast } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [attemptFeedback, setAttemptFeedback] = useState<AttemptResponse | null>(null);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [practiceFeedback, setPracticeFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; title: string } | null>(null);
  
  const { data: lesson, isLoading } = useQuery<LessonInstance>({
    queryKey: ['/api/adaptive/lessons', lessonId],
  });
  
  const { data: progression } = useQuery<{ avatarState: { level: number } }>({
    queryKey: ['/api/children', child?.id, 'progression'],
    enabled: !!child?.id,
  });
  
  const childLevel = progression?.avatarState?.level || 1;
  
  const startLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/adaptive/lessons/${lessonId}/start`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons', lessonId] });
    },
  });
  
  const submitAttemptMutation = useMutation({
    mutationFn: async (data: { questionId: string; childAnswer: string; skipForParent?: boolean }) => {
      const res = await apiRequest("POST", `/api/adaptive/lessons/${lessonId}/attempt`, data);
      return res.json() as Promise<AttemptResponse>;
    },
    onSuccess: (response: AttemptResponse, variables: { questionId: string; childAnswer: string; skipForParent?: boolean }) => {
      setAttemptFeedback(response);
      
      // Track the answered question for resume functionality
      setAnsweredQuestions(prev => {
        const updated = {
          ...prev,
          [variables.questionId]: {
            answer: variables.childAnswer,
            isCorrect: response.isCorrect,
            attemptCount: response.attemptNumber,
          },
        };
        return updated;
      });
      
      if (response.isCorrect || response.skippedForParent) {
        setTimeout(() => {
          moveToNextStep();
        }, 1500);
      } else {
        setHintMessage(response.hint || null);
        setShowHint(true);
      }
    },
  });
  
  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/adaptive/lessons/${lessonId}/complete`);
      return res.json() as Promise<CompletionResult>;
    },
    onSuccess: (result: CompletionResult) => {
      setCompletionResult(result);
      setIsCompleted(true);
      
      // Invalidate all lesson-related queries including today's lessons
      const childId = lesson?.childId;
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/journey'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      if (childId) {
        queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons/all', childId] });
        queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'progression'] });
      }
      
      if (result.progression?.leveledUp && result.progression.newLevel) {
        setLevelUpData({
          level: result.progression.newLevel,
          title: result.progression.newTitle || `Level ${result.progression.newLevel}`,
        });
        setShowLevelUp(true);
      }
    },
  });

  // Save progress mutation for resume functionality
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { progressStepIndex: number; progressState: LessonProgressState }) => {
      const res = await apiRequest("PATCH", `/api/adaptive/lessons/${lessonId}/progress`, data);
      return res.json();
    },
  });

  // Skip lesson mutation
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const skipLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/adaptive/lessons/${lessonId}/skip`, {
        reason: "Child chose to skip",
      });
      return res.json();
    },
    onSuccess: () => {
      const childId = lesson?.childId;
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons'] });
      if (childId) {
        queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'skipped-lessons'] });
        queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons/all', childId] });
      }
      toast({
        title: "Lesson Skipped",
        description: "You can come back to this lesson anytime!",
      });
      setLocation("/child/home");
    },
    onError: () => {
      toast({
        title: "Oops!",
        description: "Couldn't skip the lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Share lesson mutation
  const [hasSharedLesson, setHasSharedLesson] = useState(false);
  const shareLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/social/share/lesson", {
        lessonId,
        lessonTitle: lesson?.title,
        subject: lesson?.subject,
        accuracy: completionResult?.accuracy || 0,
        pointsEarned: completionResult?.pointsEarned || 0,
      });
      return res.json();
    },
    onSuccess: () => {
      setHasSharedLesson(true);
      toast({
        title: "Shared!",
        description: "Your buddies can now see your completed lesson!",
      });
    },
    onError: () => {
      toast({
        title: "Oops!",
        description: "Couldn't share your lesson right now. Try again later!",
        variant: "destructive",
      });
    },
  });

  // Track answered questions for resume
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { answer: string; isCorrect: boolean; attemptCount: number }>>({});
  const [completedPractice, setCompletedPractice] = useState<string[]>([]);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  
  useEffect(() => {
    if (lesson && lesson.status === "PENDING") {
      startLessonMutation.mutate();
    }
  }, [lesson?.id, lesson?.status]);

  // Restore progress from saved state when lesson loads
  useEffect(() => {
    if (lesson && !hasRestoredProgress && lesson.status === "IN_PROGRESS") {
      const savedStep = (lesson as any).progressStepIndex;
      const savedState = (lesson as any).progressState as LessonProgressState | null;
      
      if (savedStep !== undefined && savedStep !== null && savedStep > 0) {
        setCurrentStepIndex(savedStep);
      }
      
      if (savedState) {
        if (savedState.answeredQuestions) {
          setAnsweredQuestions(savedState.answeredQuestions);
        }
        if (savedState.completedPracticeActivities) {
          setCompletedPractice(savedState.completedPracticeActivities);
        }
      }
      
      setHasRestoredProgress(true);
    }
  }, [lesson?.id, lesson?.status, hasRestoredProgress]);
  
  if (isLoading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--kid-blue)]/10 via-[var(--neulearn-surface-light)] to-[var(--kid-green)]/10 font-child">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neulearn-teal)] mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Loading your lesson...</p>
        </div>
      </div>
    );
  }
  
  const steps: LessonStep[] = [];
  const teachPhase = lesson.teachPhase as any;
  
  // 1. Add concept explanation step (TEACH PHASE - "I Do")
  if (teachPhase?.conceptExplanation) {
    steps.push({
      type: "concept",
      content: teachPhase.conceptExplanation,
      stepIndex: 0,
    });
  }
  
  // 2. Add worked example intro
  if (teachPhase?.workedExample) {
    steps.push({
      type: "worked_example",
      content: teachPhase.workedExample.problem,
      stepIndex: steps.length,
    });
    
    // 3. Add each step of the worked example
    if (teachPhase.workedExample.steps && Array.isArray(teachPhase.workedExample.steps)) {
      teachPhase.workedExample.steps.forEach((exStep: any) => {
        steps.push({
          type: "worked_example_step",
          workedExampleStep: exStep,
          stepIndex: steps.length,
        });
      });
    }
    
    // 4. Add the answer/conclusion of worked example
    steps.push({
      type: "worked_example_conclusion",
      content: teachPhase.workedExample.answer,
      workedExampleAnswer: teachPhase.workedExample.answer,
      stepIndex: steps.length,
    });
  }
  
  // 5. Add DO steps (parent-guided activities)
  if (lesson.steps && Array.isArray(lesson.steps)) {
    lesson.steps.forEach((step, index) => {
      if (typeof step === "string") {
        steps.push({
          type: "instruction",
          content: step,
          stepIndex: steps.length,
        });
      } else {
        const s = step as any;
        if (s.parentInstructions && s.childTask) {
          steps.push({
            type: "instruction",
            doStep: {
              stepNumber: s.stepNumber || (index + 1),
              parentInstructions: s.parentInstructions,
              childTask: s.childTask,
            },
            stepIndex: steps.length,
          });
        } else {
          const content = s.childTask || s.instruction || s.content || s.text || 
            (s.stepNumber ? `Step ${s.stepNumber}: ${s.parentInstructions || ''}` : JSON.stringify(step));
          steps.push({
            type: "instruction",
            content,
            stepIndex: steps.length,
          });
        }
      }
    });
  }
  
  // 6. Add interactive practice activities (child's "Your Turn" phase)
  const practicePhase = lesson.practicePhase as any;
  if (practicePhase?.activities && Array.isArray(practicePhase.activities)) {
    practicePhase.activities.forEach((activity: PracticeActivity) => {
      steps.push({
        type: "practice",
        practiceActivity: activity,
        stepIndex: steps.length,
      });
    });
  }
  
  // 7. Add assessment questions (ASSESSMENT PHASE)
  if (lesson.assessment?.questions) {
    lesson.assessment.questions.forEach((q) => {
      steps.push({
        type: "question",
        question: q,
        stepIndex: steps.length,
      });
    });
  }
  
  steps.push({ type: "complete", stepIndex: steps.length });
  
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;
  
  const Icon = subjectIcons[lesson.subject as keyof typeof subjectIcons] || BookOpen;
  const color = subjectColors[lesson.subject as keyof typeof subjectColors] || "var(--neulearn-teal)";
  
  // Helper to determine current phase based on step type
  const getPhaseFromStepType = (stepType: string): LessonProgressState['currentPhase'] => {
    if (stepType === "concept" || stepType === "worked_example" || stepType === "worked_example_step" || stepType === "worked_example_conclusion" || stepType === "instruction") {
      return "teach";
    }
    if (stepType === "practice") {
      return "practice";
    }
    if (stepType === "question") {
      return "assess";
    }
    return "complete";
  };

  // Save progress to server
  const saveProgress = (stepIndex: number, currentAnswers: typeof answeredQuestions, currentPractice: string[]) => {
    const stepType = steps[stepIndex]?.type || "complete";
    const progressState: LessonProgressState = {
      currentPhase: getPhaseFromStepType(stepType),
      answeredQuestions: currentAnswers,
      completedPracticeActivities: currentPractice,
      lastUpdated: new Date().toISOString(),
    };
    
    saveProgressMutation.mutate({ 
      progressStepIndex: stepIndex, 
      progressState 
    });
  };

  const moveToNextStep = () => {
    setAnswer("");
    setShowHint(false);
    setHintMessage(null);
    setAttemptFeedback(null);
    setPracticeAnswer(null);
    setPracticeFeedback(null);
    
    if (currentStepIndex < steps.length - 1) {
      const nextStep = currentStepIndex + 1;
      setCurrentStepIndex(nextStep);
      
      // Save progress after moving to next step (but not on completion)
      if (nextStep < steps.length - 1) {
        saveProgress(nextStep, answeredQuestions, completedPractice);
      }
    }
    
    if (currentStepIndex === steps.length - 2) {
      completeLessonMutation.mutate();
    }
  };
  
  const moveToPreviousStep = () => {
    setAnswer("");
    setShowHint(false);
    setHintMessage(null);
    setAttemptFeedback(null);
    setPracticeAnswer(null);
    setPracticeFeedback(null);
    
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const handlePracticeAnswer = (selectedAnswer: string) => {
    if (!currentStep.practiceActivity) return;
    
    const activity = currentStep.practiceActivity;
    
    // Normalize answers for flexible matching
    // Handles quotes, punctuation, whitespace, and numeric formats
    const normalizeAnswer = (ans: string | number): string => {
      let normalized = String(ans).toLowerCase().trim();
      
      // Remove surrounding quotes (single, double, or backticks)
      normalized = normalized.replace(/^['"`]+|['"`]+$/g, '');
      
      // Remove common punctuation that doesn't affect meaning
      normalized = normalized.replace(/[.,!?;:()]/g, '');
      
      // Normalize multiple spaces to single space
      normalized = normalized.replace(/\s+/g, ' ').trim();
      
      // Handle numeric strings
      const numericValue = parseFloat(normalized);
      if (!isNaN(numericValue) && normalized.match(/^-?\d+\.?\d*$/)) {
        normalized = String(numericValue);
      }
      
      return normalized;
    };
    
    const selectedNormalized = normalizeAnswer(selectedAnswer);
    const correctNormalized = normalizeAnswer(activity.correctAnswer);
    
    const isCorrect = selectedNormalized === correctNormalized;
    
    setPracticeAnswer(selectedAnswer);
    setPracticeFeedback({
      isCorrect,
      message: isCorrect ? activity.successFeedback : activity.tryAgainFeedback,
    });
    
    if (isCorrect) {
      // Track completed practice activity for resume
      setCompletedPractice(prev => {
        if (!prev.includes(activity.activityId)) {
          return [...prev, activity.activityId];
        }
        return prev;
      });
      
      setTimeout(() => {
        moveToNextStep();
      }, 2000);
    }
  };
  
  const handleSubmitAnswer = () => {
    if (!currentStep.question || !answer.trim()) return;
    
    submitAttemptMutation.mutate({
      questionId: currentStep.question.questionId,
      childAnswer: answer.trim(),
    });
  };
  
  const handleSkipForParent = () => {
    if (!currentStep.question) return;
    
    submitAttemptMutation.mutate({
      questionId: currentStep.question.questionId,
      childAnswer: answer.trim() || "[SKIPPED]",
      skipForParent: true,
    });
  };
  
  const handleTryAgain = () => {
    setAnswer("");
    setAttemptFeedback(null);
    setShowHint(false);
  };
  
  const isTeachingPhase = ["concept", "worked_example", "worked_example_step", "worked_example_conclusion", "instruction"].includes(currentStep?.type || "");
  const isInteractivePhase = ["practice", "question"].includes(currentStep?.type || "");
  const isCompletePhase = currentStep?.type === "complete";
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--kid-blue)]/10 via-[var(--neulearn-surface-light)] to-[var(--kid-green)]/10 font-child">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex justify-between items-center gap-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLocation("/child/home")}
            className="h-12 px-4 text-base"
            data-testid="button-back-to-home"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-sm border-orange-300 text-orange-600 hover:bg-orange-50"
                  data-testid="button-skip-lesson"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="font-child">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Skip this lesson?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    That's okay! You can come back to this lesson later. But remember, you'll need to finish all skipped lessons before earning your mastery badge! 🌟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-base" data-testid="button-cancel-skip">
                    Keep Learning
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => skipLessonMutation.mutate()}
                    className="bg-orange-500 hover:bg-orange-600 text-base"
                    disabled={skipLessonMutation.isPending}
                    data-testid="button-confirm-skip"
                  >
                    {skipLessonMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Skipping...
                      </>
                    ) : (
                      "Skip for Now"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <NeuLearnLogo size="sm" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}20`, borderColor: color, borderWidth: 2 }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{lesson.title}</h1>
              <p className="text-xs text-muted-foreground truncate">{lesson.objective}</p>
            </div>
          </div>
          
          {lesson.goal && (
            <div 
              className="p-3 rounded-lg border-l-4"
              style={{ backgroundColor: `${color}10`, borderColor: color }}
              data-testid="lesson-goal"
            >
              <p className="text-sm font-medium" style={{ color }}>
                <span className="font-bold">Goal: </span>
                {lesson.goal}
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-3 flex-1" />
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        
        {child && lesson && !isCompleted && isTeachingPhase && (
          <div 
            className="fixed bottom-4 right-4 z-50 scale-75 sm:scale-90 origin-bottom-right sm:relative sm:bottom-auto sm:right-auto sm:flex sm:flex-col sm:items-center sm:py-2 sm:origin-center" 
            data-testid="lion-teacher-immersive"
          >
            <LionTeacher
              lessonInstanceId={lessonId}
              childId={child.id}
              childName={child.name}
              childLevel={childLevel}
              lessonTitle={lesson.title}
              lessonSubject={lesson.subject}
              lessonObjective={lesson.objective || undefined}
              currentStep={currentStep?.content || currentStep?.doStep?.childTask || undefined}
              currentPhase={currentStep?.type}
            />
          </div>
        )}
        
        {currentStep.type === "concept" && (
          <Card className="overflow-visible border-2 border-[var(--neulearn-teal)]/30">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--neulearn-teal)]/10 rounded-full mb-6">
                <BookOpen className="w-5 h-5 text-[var(--neulearn-teal)]" />
                <span className="text-sm font-semibold text-[var(--neulearn-teal)]">Let's Learn!</span>
              </div>
              <div className="text-5xl mb-6">
                {lesson.subject === "MATH" ? "📚" : lesson.subject === "READING" ? "📖" : "💡"}
              </div>
              <div className="mb-4">
                <ReadAloudSection
                  text={currentStep.content || ""}
                  lessonId={lessonId}
                  stepType="concept"
                  stepIndex={currentStepIndex}
                  textClassName="text-xl leading-relaxed text-foreground"
                  showHighlightToggle={true}
                  defaultHighlightEnabled={true}
                />
              </div>
              
              {teachPhase?.vocabulary && teachPhase.vocabulary.length > 0 && (
                <div className="my-6 p-4 bg-muted/50 rounded-lg inline-block" data-testid="vocabulary-section">
                  <p className="text-sm font-semibold text-muted-foreground mb-2" data-testid="vocabulary-header">New Words:</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {teachPhase.vocabulary.map((v: any, i: number) => (
                      <div key={i} className="text-left" data-testid={`vocabulary-item-${i}`}>
                        <span className="font-bold text-foreground" data-testid={`vocabulary-term-${i}`}>{v.term}</span>
                        <span className="text-muted-foreground" data-testid={`vocabulary-definition-${i}`}> - {v.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                {currentStepIndex > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 text-lg font-bold"
                    onClick={moveToPreviousStep}
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  className="h-12 px-8 text-lg font-bold text-white bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90"
                  onClick={moveToNextStep}
                  data-testid="button-next-step"
                >
                  <span>I'm Ready to Learn!</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "worked_example" && (
          <Card className="overflow-visible border-2 border-[var(--kid-yellow)]/50">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--kid-yellow)]/20 rounded-full mb-6">
                <Star className="w-5 h-5 text-[var(--kid-yellow)]" />
                <span className="text-sm font-semibold text-[var(--kid-yellow)]">Watch and Learn!</span>
              </div>
              <div className="text-5xl mb-6">🎯</div>
              <p className="text-2xl font-bold leading-relaxed mb-4 text-foreground">{currentStep.content}</p>
              <p className="text-lg text-muted-foreground mb-6">Follow along step by step...</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {currentStepIndex > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 text-lg font-bold"
                    onClick={moveToPreviousStep}
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </Button>
                )}
                <AdaptiveLessonReadAloudButton 
                  lessonId={lessonId} 
                  stepType="worked_example"
                  stepIndex={currentStepIndex}
                />
                <Button
                  size="lg"
                  className="h-12 px-8 text-lg font-bold text-white bg-[var(--kid-yellow)] hover:bg-[var(--kid-yellow)]/90"
                  onClick={moveToNextStep}
                  data-testid="button-next-step"
                >
                  <span>Show Me How!</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "worked_example_step" && currentStep.workedExampleStep && (
          <Card className="overflow-visible border-2 border-[var(--kid-blue)]/30">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--kid-blue)] text-white text-xl font-bold mb-6" data-testid="worked-example-step-number">
                {currentStep.workedExampleStep.stepNumber}
              </div>
              {currentStep.workedExampleStep.visual && (
                <div className="text-6xl mb-4" data-testid="worked-example-visual">{currentStep.workedExampleStep.visual}</div>
              )}
              <p className="text-xl leading-relaxed mb-6 text-foreground" data-testid="worked-example-instruction">
                {currentStep.workedExampleStep.instruction}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {currentStepIndex > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 text-lg font-bold"
                    onClick={moveToPreviousStep}
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </Button>
                )}
                <AdaptiveLessonReadAloudButton 
                  lessonId={lessonId} 
                  stepType="worked_example_step"
                  stepContent={currentStep.workedExampleStep.instruction}
                  stepIndex={currentStepIndex}
                />
                <Button
                  size="lg"
                  className="h-12 px-8 text-lg font-bold text-white bg-[var(--kid-blue)] hover:bg-[var(--kid-blue)]/90"
                  onClick={moveToNextStep}
                  data-testid="button-next-step"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "worked_example_conclusion" && (
          <Card className="overflow-visible border-2 border-green-500/30">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full mb-6">
                <PartyPopper className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-green-500" data-testid="conclusion-badge">Great Job!</span>
              </div>
              <div className="text-6xl mb-6" data-testid="celebration-emoji">🎉</div>
              <p className="text-2xl font-bold leading-relaxed mb-6 text-green-600 dark:text-green-400" data-testid="worked-example-answer">
                {currentStep.workedExampleAnswer}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {currentStepIndex > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 text-lg font-bold"
                    onClick={moveToPreviousStep}
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </Button>
                )}
                <AdaptiveLessonReadAloudButton 
                  lessonId={lessonId} 
                  stepType="worked_example_conclusion"
                  stepIndex={currentStepIndex}
                />
                <Button
                  size="lg"
                  className="h-12 px-8 text-lg font-bold text-white bg-green-500 hover:bg-green-500/90"
                  onClick={moveToNextStep}
                  data-testid="button-next-step"
                >
                  <span>Now I'll Try!</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "instruction" && (
          <Card className="overflow-visible border-2 border-[var(--kid-orange)]/30">
            <CardContent className="p-8">
              {currentStep.doStep ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-12 h-12 rounded-full bg-[var(--kid-orange)] text-white flex items-center justify-center text-xl font-bold flex-shrink-0"
                      data-testid="do-step-number"
                    >
                      {currentStep.doStep.stepNumber}
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--kid-orange)]/20 rounded-full">
                      <span className="text-sm font-semibold text-[var(--kid-orange)]">Activity Time!</span>
                    </div>
                  </div>
                  
                  <div className="text-5xl text-center mb-6">
                    {lesson.subject === "MATH" ? "🔢" : lesson.subject === "READING" ? "📖" : "💝"}
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div 
                      className="p-4 rounded-lg bg-muted/50 border-l-4 border-[var(--kid-blue)]"
                      data-testid="parent-instructions"
                    >
                      <p className="text-xs font-semibold text-[var(--kid-blue)] uppercase tracking-wide mb-1">
                        For Grown-Ups:
                      </p>
                      <p className="text-base text-muted-foreground">
                        {currentStep.doStep.parentInstructions}
                      </p>
                    </div>
                    
                    <div 
                      className="p-5 rounded-lg bg-[var(--kid-orange)]/10 border-2 border-[var(--kid-orange)]/30"
                      data-testid="child-task"
                    >
                      <p className="text-xs font-semibold text-[var(--kid-orange)] uppercase tracking-wide mb-2">
                        Your Task:
                      </p>
                      <p className="text-xl leading-relaxed text-foreground font-medium">
                        {currentStep.doStep.childTask}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {currentStepIndex > 0 && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-6 text-lg font-bold"
                        onClick={moveToPreviousStep}
                        data-testid="button-previous-step"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span>Back</span>
                      </Button>
                    )}
                    <AdaptiveLessonReadAloudButton 
                      lessonId={lessonId} 
                      stepType="instruction"
                      stepContent={currentStep.doStep.childTask}
                      stepIndex={currentStepIndex}
                    />
                    <Button
                      size="lg"
                      className="h-12 px-8 text-lg font-bold text-white bg-[var(--kid-orange)] hover:bg-[var(--kid-orange)]/90"
                      onClick={moveToNextStep}
                      data-testid="button-next-step"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      <span>Done!</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--kid-green)]/20 rounded-full mb-6">
                    <span className="text-sm font-semibold text-[var(--kid-green)]">Your Turn!</span>
                  </div>
                  <div className="text-5xl mb-6">
                    {lesson.subject === "MATH" ? "🔢" : lesson.subject === "READING" ? "📖" : "💝"}
                  </div>
                  <p className="text-xl leading-relaxed mb-6">{currentStep.content}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {currentStepIndex > 0 && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-6 text-lg font-bold"
                        onClick={moveToPreviousStep}
                        data-testid="button-previous-step"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span>Back</span>
                      </Button>
                    )}
                    <AdaptiveLessonReadAloudButton 
                      lessonId={lessonId} 
                      stepType="instruction"
                      stepContent={currentStep.content}
                      stepIndex={currentStepIndex}
                    />
                    <Button
                      size="lg"
                      className="h-12 px-8 text-lg font-bold text-white bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90"
                      onClick={moveToNextStep}
                      data-testid="button-next-step"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "practice" && currentStep.practiceActivity && (
          <Card className="overflow-visible border-2 border-[var(--kid-green)]/40">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--kid-green)]/20 rounded-full mb-6">
                <Star className="w-5 h-5 text-[var(--kid-green)]" />
                <span className="text-sm font-semibold text-[var(--kid-green)]">Let's Practice!</span>
              </div>
              
              <div className="text-5xl mb-6">
                {lesson.subject === "MATH" ? "✨" : lesson.subject === "READING" ? "📚" : "💪"}
              </div>
              
              <div className="mb-6" data-testid="practice-prompt">
                <ReadAloudSection
                  text={currentStep.practiceActivity.prompt}
                  lessonId={lessonId}
                  stepType="practice"
                  stepContent={currentStep.practiceActivity.prompt}
                  stepIndex={currentStepIndex}
                  textClassName="text-xl leading-relaxed font-medium"
                  showHighlightToggle={true}
                  defaultHighlightEnabled={true}
                  compact
                />
              </div>
              
              {currentStep.practiceActivity.interactionType === "tap_choice" && currentStep.practiceActivity.options && (
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                  {currentStep.practiceActivity.options.map((option, i) => {
                    const isSelected = practiceAnswer === option;
                    const isCorrect = practiceFeedback?.isCorrect && isSelected;
                    const isWrong = practiceFeedback && !practiceFeedback.isCorrect && isSelected;
                    
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`min-h-[64px] px-6 py-4 text-xl font-bold rounded-md border-2 transition-all duration-200 cursor-pointer ${
                          isCorrect
                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 ring-2 ring-green-500"
                            : isWrong
                            ? "bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500"
                            : isSelected
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-background border-border text-foreground hover:bg-muted active:scale-[0.98]"
                        } ${practiceFeedback?.isCorrect ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => !practiceFeedback?.isCorrect && handlePracticeAnswer(option)}
                        disabled={practiceFeedback?.isCorrect}
                        data-testid={`practice-option-${i}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {currentStep.practiceActivity.interactionType === "fill_blank" && (
                <div className="max-w-md mx-auto mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Input
                      type="text"
                      value={practiceAnswer || ""}
                      onChange={(e) => setPracticeAnswer(e.target.value)}
                      placeholder="Type or speak your answer..."
                      className="text-xl text-center py-4 flex-1"
                      disabled={practiceFeedback?.isCorrect}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && practiceAnswer?.trim()) {
                          handlePracticeAnswer(practiceAnswer.trim());
                        }
                      }}
                      data-testid="practice-input"
                    />
                  </div>
                  
                  <div className="flex flex-col items-center gap-4">
                    <VoiceInput
                      onTranscript={(text) => {
                        setPracticeAnswer(text);
                        setTimeout(() => handlePracticeAnswer(text), 500);
                      }}
                      disabled={practiceFeedback?.isCorrect}
                    />
                    
                    {!practiceFeedback && practiceAnswer?.trim() && (
                      <Button
                        size="lg"
                        className="px-8 text-lg font-bold text-white bg-[var(--kid-green)] hover:bg-[var(--kid-green)]/90"
                        onClick={() => handlePracticeAnswer(practiceAnswer.trim())}
                        data-testid="practice-submit"
                      >
                        Check My Answer!
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {practiceFeedback && (
                <div 
                  className={`p-4 rounded-xl mb-6 ${
                    practiceFeedback.isCorrect 
                      ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200" 
                      : "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
                  }`}
                  data-testid="practice-feedback"
                >
                  <div className="flex items-center justify-center gap-2 font-semibold mb-1">
                    {practiceFeedback.isCorrect ? (
                      <>
                        <PartyPopper className="w-5 h-5" />
                        Awesome!
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-5 h-5" />
                        Try Again!
                      </>
                    )}
                  </div>
                  <p className="text-base">{practiceFeedback.message}</p>
                  
                  {!practiceFeedback.isCorrect && currentStep.practiceActivity.hint && (
                    <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-200">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lightbulb className="w-4 h-4" />
                        Hint: {currentStep.practiceActivity.hint}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!practiceFeedback?.isCorrect && practiceFeedback && (
                <Button
                  size="lg"
                  className="px-8 text-lg font-bold text-white bg-[var(--kid-blue)] hover:bg-[var(--kid-blue)]/90"
                  onClick={() => {
                    setPracticeAnswer(null);
                    setPracticeFeedback(null);
                  }}
                  data-testid="practice-try-again"
                >
                  Try Again!
                </Button>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                {currentStepIndex > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 text-lg font-bold"
                    onClick={moveToPreviousStep}
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "question" && currentStep.question && (
          <Card className="overflow-visible">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <ReadAloudSection
                    text={currentStep.question.prompt}
                    lessonId={lessonId}
                    stepType="question"
                    stepContent={currentStep.question.prompt}
                    stepIndex={currentStepIndex}
                    textClassName="text-xl font-medium leading-relaxed"
                    showHighlightToggle={true}
                    defaultHighlightEnabled={true}
                    compact
                  />
                </div>
              </div>
              
              {currentStep.question.type === "choice" && currentStep.question.options ? (
                <div className="space-y-3">
                  {currentStep.question.options.map((option, i) => (
                    <Button
                      key={i}
                      variant={answer === option ? "default" : "outline"}
                      size="lg"
                      className={`w-full h-14 text-lg justify-start px-6 ${
                        answer === option 
                          ? "bg-primary text-primary-foreground" 
                          : ""
                      }`}
                      onClick={() => setAnswer(option)}
                      disabled={submitAttemptMutation.isPending}
                      data-testid={`option-${i}`}
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 text-sm font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <Input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type or speak your answer..."
                    className="h-14 text-xl text-center"
                    disabled={submitAttemptMutation.isPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && answer.trim()) {
                        handleSubmitAnswer();
                      }
                    }}
                    data-testid="input-answer"
                  />
                  
                  <VoiceInput
                    onTranscript={(text) => {
                      setAnswer(text);
                      setTimeout(() => {
                        if (text.trim()) {
                          handleSubmitAnswer();
                        }
                      }, 500);
                    }}
                    disabled={submitAttemptMutation.isPending || !!attemptFeedback?.isCorrect}
                  />
                </div>
              )}
              
              {attemptFeedback && (
                <div 
                  className={`p-4 rounded-xl ${
                    attemptFeedback.isCorrect || attemptFeedback.skippedForParent
                      ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200" 
                      : "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {attemptFeedback.isCorrect ? (
                      <>
                        <Check className="w-5 h-5" />
                        {attemptFeedback.skippedForParent ? "Skipped for Parent" : "Correct!"}
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-5 h-5" />
                        {attemptFeedback.attemptNumber === 1 && "Let's try again!"}
                        {attemptFeedback.attemptNumber === 2 && "Almost there! One more try..."}
                        {attemptFeedback.attemptNumber >= 3 && "Here's some help!"}
                      </>
                    )}
                  </div>
                  <p>{attemptFeedback.message}</p>
                  
                  {attemptFeedback.showCorrectAnswer && attemptFeedback.correctAnswer && (
                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <p className="text-sm font-medium mb-1">The answer is:</p>
                      <p className="text-lg font-bold">{attemptFeedback.correctAnswer}</p>
                      <p className="text-sm mt-2">Try saying or typing it now!</p>
                    </div>
                  )}
                </div>
              )}
              
              {showHint && hintMessage && (
                <div className="p-4 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Lightbulb className="w-5 h-5" />
                    Hint
                  </div>
                  <p>{hintMessage}</p>
                </div>
              )}
              
              <div className="flex gap-3 justify-center flex-wrap">
                {currentStepIndex > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-6 text-lg font-bold"
                    onClick={moveToPreviousStep}
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </Button>
                )}
                
                {attemptFeedback && !attemptFeedback.isCorrect && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-6"
                    onClick={handleTryAgain}
                    data-testid="button-try-again"
                  >
                    Try Again
                  </Button>
                )}
                
                {attemptFeedback && attemptFeedback.allowSkip && !attemptFeedback.isCorrect && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-6 border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={handleSkipForParent}
                    disabled={submitAttemptMutation.isPending}
                    data-testid="button-skip-for-parent"
                  >
                    {submitAttemptMutation.isPending ? "..." : "Skip for Parent to Help"}
                  </Button>
                )}
                
                {!attemptFeedback && (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg font-bold text-white bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90"
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || submitAttemptMutation.isPending}
                    data-testid="button-submit-answer"
                  >
                    {submitAttemptMutation.isPending ? "Checking..." : "Check Answer"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep.type === "complete" && (
          <Card className="overflow-visible">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-bounce">
                  <PartyPopper className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Amazing Job!
                </h2>
                <p className="text-lg text-muted-foreground">
                  {completionResult?.message || "You completed the lesson!"}
                </p>
              </div>
              
              {completionResult && (
                <div className="flex justify-center gap-8 flex-wrap">
                  {completionResult.progression?.xpEarned && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-[var(--kid-blue)]">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-2xl font-bold">
                          +{completionResult.progression.xpEarned} XP
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-[var(--kid-yellow)]">
                      <Star className="w-6 h-6 fill-current" />
                      <span className="text-2xl font-bold">
                        +{completionResult.pointsEarned}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Points</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--neulearn-teal)]">
                      {Math.round(completionResult.accuracy)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  
                  {completionResult.progression?.currentStreak && completionResult.progression.currentStreak > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[var(--kid-orange)]">
                        <Flame className="w-6 h-6 fill-current" />
                        <span className="text-2xl font-bold">
                          {completionResult.progression.currentStreak}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Day Streak</p>
                    </div>
                  )}
                </div>
              )}
              
              {completionResult?.progression?.badgesEarned && completionResult.progression.badgesEarned.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">New Badge Earned!</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {completionResult.progression.badgesEarned.map((badge) => (
                      <div key={badge.slug} className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-[var(--kid-yellow)]/20 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-[var(--kid-yellow)]" />
                        </div>
                        <span className="text-xs font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-6 text-lg font-bold border-2"
                  onClick={() => shareLessonMutation.mutate()}
                  disabled={hasSharedLesson || shareLessonMutation.isPending || !completionResult || !lesson || !isCompleted}
                  data-testid="button-share-lesson"
                >
                  {shareLessonMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : hasSharedLesson ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Shared!
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Share with Buddies
                    </>
                  )}
                </Button>
                
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-bold text-white bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90"
                  onClick={() => setLocation("/child/home")}
                  data-testid="button-finish-lesson"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {showLevelUp && levelUpData && (
        <LevelUpCelebration
          level={levelUpData.level}
          title={levelUpData.title}
          onComplete={() => setShowLevelUp(false)}
        />
      )}
      
      {child && lesson && !isCompleted && isInteractivePhase && (
        <div className="fixed bottom-4 right-4 z-50 scale-75 sm:scale-90 origin-bottom-right" data-testid="lion-teacher-wrapper">
          <LionTeacher
            lessonInstanceId={lessonId}
            childId={child.id}
            childName={child.name}
            childLevel={childLevel}
            lessonTitle={lesson.title}
            lessonSubject={lesson.subject}
            lessonObjective={lesson.objective || undefined}
            currentStep={currentStep?.content || currentStep?.doStep?.childTask || undefined}
            currentPhase={currentStep?.type}
          />
        </div>
      )}
    </div>
  );
}
