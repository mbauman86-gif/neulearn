import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Package, ListChecks, ClipboardCheck, Sparkles, Heart, Lightbulb, CheckCircle2 } from "lucide-react";
import Quiz from "./Quiz";
import ReadAloudButton from "./ReadAloudButton";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Quiz as QuizType, LessonStep, LessonAssessment, FaithIntegration } from "@shared/schema";

export default function TaskDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const taskId = params.taskId;
  const { toast } = useToast();

  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ['/api/tasks', taskId],
    enabled: !!taskId,
  });

  const { data: quiz } = useQuery<QuizType | null>({
    queryKey: ['/api/tasks', taskId, 'quiz'],
    enabled: !!task,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (quizAnswers?: string[]) => {
      return apiRequest('/api/tasks/complete', {
        method: "POST",
        body: JSON.stringify({ taskId, quizAnswers }),
      });
    },
    onSuccess: () => {
      if (task) {
        queryClient.invalidateQueries({ queryKey: ['/api/children', task.childId, 'tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/children', task.childId, 'rewards'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
      }
      toast({
        title: "Great job!",
        description: "You completed the task!",
      });
      setLocation("/child/home");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (taskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 font-child">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 font-child">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Task not found</p>
          <Link href="/child/home">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 font-child">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <Link href="/child/home">
          <Button
            variant="ghost"
            size="lg"
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        </Link>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-task-title">{task.title}</h1>
              <p className="text-lg text-muted-foreground" data-testid="text-task-objective">{task.objective}</p>
            </div>
            <ReadAloudButton taskId={task.id} />
          </div>

          {task.overview && (
            <Card className="bg-accent/20">
              <CardContent className="p-6">
                <p className="text-lg leading-relaxed" data-testid="text-task-overview">{task.overview}</p>
              </CardContent>
            </Card>
          )}

          {task.materialsNeeded && task.materialsNeeded.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Package className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">What you'll need:</h3>
                    <div className="flex flex-wrap gap-2" data-testid="list-materials">
                      {task.materialsNeeded.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-base py-1 px-3">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {task.lessonSteps && task.lessonSteps.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <ListChecks className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-4">Let's do it step by step:</h3>
                    <div className="space-y-4" data-testid="list-lesson-steps">
                      {task.lessonSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start p-4 bg-muted/50 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {step.stepNumber}
                          </div>
                          <div className="flex-1">
                            <p className="text-lg font-medium" data-testid={`text-step-${idx + 1}`}>{step.childTask}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-semibold">What to do:</h3>
                    <p className="text-lg leading-relaxed" data-testid="text-task-instructions">{task.instructionsForChild}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {task.assessment && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-amber-800 dark:text-amber-200">
                      {task.assessment.type === 'skill_check' ? 'Show What You Learned!' : 
                       task.assessment.type === 'mini_quiz' ? 'Quick Quiz!' : 'Think About It!'}
                    </h3>
                    <p className="text-lg" data-testid="text-assessment">{task.assessment.instructions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {task.faithIntegration && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-2" data-testid="text-scripture-ref">
                      {task.faithIntegration.scripture}
                    </p>
                    <p className="text-lg font-medium" data-testid="text-faith-tiein">{task.faithIntegration.tieIn}</p>
                    {task.faithIntegration.optionalPrayer && (
                      <div className="mt-4 p-4 bg-primary/10 rounded-xl">
                        <p className="text-sm font-semibold text-primary mb-1">Let's Pray:</p>
                        <p className="text-base italic" data-testid="text-prayer">{task.faithIntegration.optionalPrayer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!task.faithIntegration && task.scriptureReference && task.scriptureText && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm uppercase tracking-wide font-semibold text-primary" data-testid="text-scripture-ref-legacy">
                  {task.scriptureReference}
                </p>
                <p className="text-lg font-medium italic" data-testid="text-scripture-text-legacy">"{task.scriptureText}"</p>
              </CardContent>
            </Card>
          )}

          {task.extensionOptions && task.extensionOptions.length > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Want to do more?</h3>
                    <ul className="space-y-2" data-testid="list-extensions">
                      {task.extensionOptions.map((option, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-base">
                          <Lightbulb className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{option}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {quiz && quiz.questions ? (
            <Quiz 
              questions={quiz.questions} 
              onComplete={(answers?: string[]) => completeTaskMutation.mutate(answers)} 
            />
          ) : (
            <Button
              onClick={() => completeTaskMutation.mutate(undefined)}
              size="lg"
              className="w-full h-16 text-xl font-semibold rounded-2xl"
              disabled={completeTaskMutation.isPending || task.status === 'COMPLETED'}
              data-testid="button-complete-task"
            >
              {task.status === 'COMPLETED' ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  All Done!
                </span>
              ) : completeTaskMutation.isPending ? "Completing..." : "I Did This!"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
