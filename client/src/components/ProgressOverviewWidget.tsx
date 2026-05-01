import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, CheckCircle2, Calendar } from "lucide-react";

interface ChildProgressSummary {
  childId: string;
  childName: string;
  grade: string;
  todayCompleted: number;
  todayTotal: number;
  streakDays: number;
  totalPoints: number;
  weeklyActivity: Array<{ date: string; completed: number; total: number }>;
}

export default function ProgressOverviewWidget() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: summaries = [], isLoading } = useQuery<ChildProgressSummary[]>({
    queryKey: ['/api/children/progress-summary'],
  });

  const selectedChild = selectedChildId 
    ? summaries.find(s => s.childId === selectedChildId)
    : summaries[0];

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (summaries.length === 0) {
    return null;
  }

  const todayPercent = selectedChild && selectedChild.todayTotal > 0
    ? Math.round((selectedChild.todayCompleted / selectedChild.todayTotal) * 100)
    : 0;

  const weeklyCompleted = selectedChild?.weeklyActivity.reduce((sum, day) => sum + day.completed, 0) || 0;
  const weeklyTotal = selectedChild?.weeklyActivity.reduce((sum, day) => sum + day.total, 0) || 0;

  return (
    <Card className="mb-8" data-testid="widget-progress-overview">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-xl">Progress Overview</CardTitle>
          {summaries.length > 1 && (
            <Tabs 
              value={selectedChild?.childId || summaries[0]?.childId} 
              onValueChange={setSelectedChildId}
              className="w-auto"
            >
              <TabsList>
                {summaries.map((child) => (
                  <TabsTrigger 
                    key={child.childId} 
                    value={child.childId}
                    data-testid={`tab-child-${child.childName}`}
                  >
                    {child.childName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedChild && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Today</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-today-progress">
                  {selectedChild.todayCompleted}/{selectedChild.todayTotal}
                </p>
                <p className="text-xs text-muted-foreground">tasks done</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Streak</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-streak">
                  {selectedChild.streakDays}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedChild.streakDays === 1 ? 'day' : 'days'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Points</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-points">
                  {selectedChild.totalPoints}
                </p>
                <p className="text-xs text-muted-foreground">earned</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>This Week</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-weekly">
                  {weeklyCompleted}/{weeklyTotal}
                </p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today's Progress</span>
                <span className="font-medium">{todayPercent}%</span>
              </div>
              <Progress value={todayPercent} className="h-2" data-testid="progress-today" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Weekly Activity</p>
              <div className="flex gap-1 justify-between">
                {selectedChild.weeklyActivity.map((day, idx) => {
                  const dayPercent = day.total > 0 ? (day.completed / day.total) * 100 : 0;
                  const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                      <div 
                        className={`w-full h-8 rounded-md flex items-end justify-center overflow-hidden ${
                          day.total === 0 ? 'bg-muted/30' : 'bg-muted/50'
                        }`}
                        data-testid={`bar-day-${idx}`}
                      >
                        {day.total > 0 && (
                          <div 
                            className={`w-full transition-all ${
                              dayPercent === 100 ? 'bg-green-500' : 
                              dayPercent > 0 ? 'bg-primary' : 'bg-muted'
                            }`}
                            style={{ height: `${Math.max(dayPercent, 10)}%` }}
                          />
                        )}
                      </div>
                      <span className={`text-xs ${isToday ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
