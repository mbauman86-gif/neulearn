import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronUp, Package, ListChecks, Lightbulb, Heart, Pencil, StickyNote } from "lucide-react";
import GeneratePlanCard from "./GeneratePlanCard";
import ProgressDashboard from "./ProgressDashboard";
import TaskEditModal from "./TaskEditModal";
import NeuLearnLogo from "./NeuLearnLogo";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Plan, Child } from "@shared/schema";

interface GroupedPlan {
  date: string;
  tasks: Task[];
}

const subjectColors: Record<string, string> = {
  READING: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  MATH: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  SCIENCE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  CHARACTER: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
};

export default function PlanView() {
  const params = useParams();
  const childId = params.childId;
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditModalOpen(true);
  };

  const { data: child, isLoading: childLoading } = useQuery<Child>({
    queryKey: ['/api/children', childId],
    enabled: !!childId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/children', childId, 'tasks'],
    enabled: !!childId,
  });

  const generatePlanMutation = useMutation({
    mutationFn: async ({ type }: { type: 'DAILY' | 'WEEKLY' }) => {
      return apiRequest('/api/plans/generate', {
        method: "POST",
        body: JSON.stringify({ childId, planType: type }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'tasks'] });
      toast({
        title: "Plan generated!",
        description: "Your AI-powered curriculum has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const groupTasksByDate = (tasks: Task[]): GroupedPlan[] => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.date]) {
        acc[task.date] = [];
      }
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return Object.entries(grouped)
      .map(([date, tasks]) => ({ date, tasks }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const groupedPlan = groupTasksByDate(tasks);
  
  if (childLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Child not found</p>
          <Link href="/parent/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neulearn-surface-light)]">
      <header className="border-b sticky top-0 bg-white z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/parent/dashboard">
            <Button variant="ghost" data-testid="button-back-to-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <NeuLearnLogo size="sm" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-heading font-semibold mb-2 text-[var(--neulearn-text-primary)]">{child.name}'s Learning</h2>
          <p className="text-muted-foreground">
            Generate curriculum and track progress
          </p>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">Plans & Generate</TabsTrigger>
            <TabsTrigger value="progress">Progress & Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-8">
            <GeneratePlanCard
              onGenerateDaily={() => generatePlanMutation.mutate({ type: 'DAILY' })}
              onGenerateWeekly={() => generatePlanMutation.mutate({ type: 'WEEKLY' })}
              isGenerating={generatePlanMutation.isPending}
            />

        {groupedPlan.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Generated Plan</h3>
            {groupedPlan.map((day, dayIndex) => (
              <Card key={dayIndex}>
                <CardHeader>
                  <CardTitle>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.tasks.map((task) => (
                      <Collapsible key={task.id} className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="flex items-start gap-3 p-4 w-full hover-elevate text-left" data-testid={`task-${task.id}`}>
                          <div className="flex-shrink-0 mt-1">
                            {task.status === "COMPLETED" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <Badge className={subjectColors[task.subject]}>
                                {task.subject}
                              </Badge>
                              <h4 className="font-medium flex-1" data-testid={`text-task-title-${task.id}`}>{task.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.objective}</p>
                            {(task.lessonSteps && task.lessonSteps.length > 0) ? (
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                <ChevronDown className="w-4 h-4" />
                                {task.lessonSteps.length} steps • Click to expand
                              </p>
                            ) : (task.instructionsForParent || task.instructionsForChild) ? (
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                <ChevronDown className="w-4 h-4" />
                                Click to see details
                              </p>
                            ) : null}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t p-4 bg-muted/30 space-y-4">
                            {task.overview && (
                              <div>
                                <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Overview</h5>
                                <p className="text-sm">{task.overview}</p>
                              </div>
                            )}
                            
                            {task.materialsNeeded && task.materialsNeeded.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                  <Package className="w-4 h-4" /> Materials Needed
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {task.materialsNeeded.map((item, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {task.lessonSteps && task.lessonSteps.length > 0 ? (
                              <div>
                                <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                  <ListChecks className="w-4 h-4" /> Parent Instructions
                                </h5>
                                <div className="space-y-3">
                                  {task.lessonSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm">
                                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {step.stepNumber}
                                      </span>
                                      <div className="flex-1">
                                        <p className="font-medium text-foreground">{step.parentInstructions}</p>
                                        <p className="text-muted-foreground mt-1">Child task: {step.childTask}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (task.instructionsForParent || task.instructionsForChild) ? (
                              <div>
                                <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                  <ListChecks className="w-4 h-4" /> Instructions
                                </h5>
                                {task.instructionsForParent && (
                                  <div className="mb-3">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">For Parent:</p>
                                    <p className="text-sm">{task.instructionsForParent}</p>
                                  </div>
                                )}
                                {task.instructionsForChild && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">For Child:</p>
                                    <p className="text-sm">{task.instructionsForChild}</p>
                                  </div>
                                )}
                              </div>
                            ) : null}
                            
                            {task.assessment && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                                  Assessment ({task.assessment.type.replace('_', ' ')})
                                </h5>
                                <p className="text-sm text-amber-700 dark:text-amber-300">{task.assessment.instructions}</p>
                              </div>
                            )}
                            
                            {task.faithIntegration ? (
                              <div className="p-3 bg-primary/5 rounded-lg">
                                <h5 className="text-sm font-semibold text-primary mb-1 flex items-center gap-1">
                                  <Heart className="w-4 h-4" /> Faith Connection
                                </h5>
                                <p className="text-xs font-medium text-primary">{task.faithIntegration.scripture}</p>
                                <p className="text-sm mt-1">{task.faithIntegration.tieIn}</p>
                              </div>
                            ) : (task.scriptureReference || task.scriptureText) ? (
                              <div className="p-3 bg-primary/5 rounded-lg">
                                <h5 className="text-sm font-semibold text-primary mb-1 flex items-center gap-1">
                                  <Heart className="w-4 h-4" /> Scripture
                                </h5>
                                {task.scriptureReference && (
                                  <p className="text-xs font-medium text-primary">{task.scriptureReference}</p>
                                )}
                                {task.scriptureText && (
                                  <p className="text-sm mt-1 italic">"{task.scriptureText}"</p>
                                )}
                              </div>
                            ) : null}
                            
                            {task.extensionOptions && task.extensionOptions.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                  <Lightbulb className="w-4 h-4" /> Extension Options
                                </h5>
                                <ul className="space-y-1">
                                  {task.extensionOptions.map((option, idx) => (
                                    <li key={idx} className="text-sm flex items-start gap-2">
                                      <span className="text-primary">•</span>
                                      {option}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {task.customizationPoints && task.customizationPoints.length > 0 && (
                              <div className="p-3 border-l-4 border-primary/30 bg-muted/50">
                                <h5 className="text-sm font-semibold text-muted-foreground mb-1">Customization Ideas</h5>
                                <ul className="space-y-1">
                                  {task.customizationPoints.map((point, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground">{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {task.parentNotes && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1">
                                  <StickyNote className="w-4 h-4" /> Your Notes
                                </h5>
                                <p className="text-sm text-amber-700 dark:text-amber-300">{task.parentNotes}</p>
                              </div>
                            )}
                            
                            <div className="pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                data-testid={`button-edit-task-${task.id}`}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Lesson
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDashboard childId={childId!} childName={child.name} />
          </TabsContent>
        </Tabs>
      </main>
      
      <TaskEditModal
        task={editingTask}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        childId={childId!}
      />
    </div>
  );
}
