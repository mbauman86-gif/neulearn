import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Sparkles, BookOpen, Calculator, Heart, RefreshCw, 
  CheckCircle2, Circle, PlayCircle, SkipForward, Clock, 
  Star, Zap, BookOpenCheck, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyQueueItem {
  id: string;
  type: "CORE_LEARNING" | "SPIRAL_REVIEW" | "APPLY" | "DEVOTIONAL";
  skillId?: string;
  skillName?: string;
  subject?: string;
  description: string;
  estimatedMinutes: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  lessonInstanceId?: string;
  completedAt?: string;
  order: number;
}

interface DailyQueue {
  id: string;
  childId: string;
  date: string;
  items: DailyQueueItem[];
  status: string;
  completedItems: number;
  totalItems: number;
}

interface DailyQueueSectionProps {
  childId: string;
  childName: string;
  onStartLesson?: (skillId: string, subject: string) => void;
}

const subjectConfig: Record<string, { icon: typeof Calculator; color: string; bgColor: string }> = {
  MATH: { icon: Calculator, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  READING: { icon: BookOpen, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  CHARACTER: { icon: Heart, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
};

const typeConfig: Record<string, { icon: typeof Sparkles; label: string; color: string; bgColor: string }> = {
  CORE_LEARNING: { 
    icon: Sparkles, 
    label: "New Learning", 
    color: "text-purple-600", 
    bgColor: "bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20" 
  },
  SPIRAL_REVIEW: { 
    icon: RefreshCw, 
    label: "Quick Review", 
    color: "text-cyan-600", 
    bgColor: "bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20" 
  },
  APPLY: { 
    icon: Zap, 
    label: "Challenge Time!", 
    color: "text-orange-600", 
    bgColor: "bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20" 
  },
  DEVOTIONAL: { 
    icon: BookOpenCheck, 
    label: "Bible Time", 
    color: "text-rose-600", 
    bgColor: "bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/20" 
  },
};

export function DailyQueueSection({ childId, childName, onStartLesson }: DailyQueueSectionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const { data: queue, isLoading, error } = useQuery<DailyQueue>({
    queryKey: ['/api/daily-queue', childId, today],
    enabled: !!childId,
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ queueId, itemId, status }: { queueId: string; itemId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/daily-queue/${queueId}/items/${itemId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-queue', childId, today] });
    },
  });

  const startLessonMutation = useMutation({
    mutationFn: async ({ queueId, itemId }: { queueId: string; itemId: string }) => {
      const res = await apiRequest("POST", `/api/daily-queue/${queueId}/items/${itemId}/start-lesson`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-queue', childId, today] });
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons/all', childId] });
      if (data.lessonInstanceId) {
        setLocation(`/child/lessons/${data.lessonInstanceId}`);
      }
    },
  });

  const handleStartItem = async (item: DailyQueueItem) => {
    if (!queue) return;
    
    try {
      if (item.type === "DEVOTIONAL") {
        await updateItemMutation.mutateAsync({
          queueId: queue.id,
          itemId: item.id,
          status: "IN_PROGRESS",
        });
        return;
      }

      if (item.skillId && item.subject) {
        await startLessonMutation.mutateAsync({
          queueId: queue.id,
          itemId: item.id,
        });
      }
    } catch (err) {
      toast({
        title: "Oops!",
        description: "Something went wrong. Let's try again!",
        variant: "destructive",
      });
    }
  };

  const handleSkipItem = async (item: DailyQueueItem) => {
    if (!queue) return;
    
    await updateItemMutation.mutateAsync({
      queueId: queue.id,
      itemId: item.id,
      status: "SKIPPED",
    });
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-muted">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Getting your learning plan ready...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !queue) {
    return (
      <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="py-8 text-center">
          <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            Let's explore the Journey Map today!
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = queue.items.filter(i => i.status === "COMPLETED").length;
  const totalCount = queue.items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allComplete = completedCount === totalCount && totalCount > 0;

  const pendingItems = queue.items.filter(i => i.status === "PENDING" || i.status === "IN_PROGRESS");
  const completedItems = queue.items.filter(i => i.status === "COMPLETED" || i.status === "SKIPPED");

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Today's Learning</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {allComplete ? "Amazing job today!" : `${totalCount - completedCount} activities left`}
                </p>
              </div>
            </div>
            {allComplete && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">All Done!</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completedCount} / {totalCount}</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          {pendingItems.length === 0 && completedItems.length > 0 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-1">
                You did it, {childName}!
              </h3>
              <p className="text-muted-foreground text-sm">
                Great job finishing today's learning!
              </p>
            </div>
          )}

          {pendingItems.map((item, index) => {
            const typeInfo = typeConfig[item.type];
            const subjectInfo = item.subject ? subjectConfig[item.subject] : null;
            const TypeIcon = typeInfo?.icon || Sparkles;
            const SubjectIcon = subjectInfo?.icon;
            const isFirst = index === 0;

            return (
              <div
                key={item.id}
                className={`relative rounded-xl p-4 transition-all ${typeInfo?.bgColor || 'bg-muted'} ${
                  isFirst ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                data-testid={`queue-item-${item.id}`}
              >
                {isFirst && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    Up Next!
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${subjectInfo?.bgColor || 'bg-white/50'}`}>
                    {SubjectIcon ? (
                      <SubjectIcon className={`w-5 h-5 ${subjectInfo?.color}`} />
                    ) : (
                      <TypeIcon className={`w-5 h-5 ${typeInfo?.color}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${typeInfo?.color}`}>
                        {typeInfo?.label}
                      </span>
                      {item.subject && (
                        <span className="text-xs text-muted-foreground">
                          • {item.subject.charAt(0) + item.subject.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground truncate">
                      {item.skillName || item.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>~{item.estimatedMinutes} min</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "IN_PROGRESS" ? (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">In Progress</span>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleSkipItem(item)}
                          disabled={updateItemMutation.isPending}
                          data-testid={`button-skip-${item.id}`}
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 px-4 bg-primary hover:bg-primary/90"
                          onClick={() => handleStartItem(item)}
                          disabled={updateItemMutation.isPending}
                          data-testid={`button-start-${item.id}`}
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {completedItems.length > 0 && pendingItems.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Completed Today
              </p>
              <div className="space-y-2">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm line-through text-muted-foreground">
                      {item.skillName || item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
