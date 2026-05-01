import { useQuery } from "@tanstack/react-query";
import { Star, Flame, Trophy, BookOpen, Calculator, Beaker, Heart, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/useAuth";
import type { RewardState } from "@shared/schema";

interface ProgressStats {
  totalTasksCompleted: number;
  weeklyActivity: Array<{ date: string; completed: number; total: number }>;
  subjectBreakdown: Array<{ subject: string; completed: number; total: number }>;
  streakDays: number;
  todayCompleted: number;
  todayTotal: number;
}

const subjectIcons: Record<string, typeof BookOpen> = {
  READING: BookOpen,
  MATH: Calculator,
  SCIENCE: Beaker,
  CHARACTER: Heart,
};

const subjectColors: Record<string, string> = {
  READING: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  MATH: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  SCIENCE: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  CHARACTER: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
};

const subjectLabels: Record<string, string> = {
  READING: "Reading",
  MATH: "Math",
  SCIENCE: "Science",
  CHARACTER: "Character",
};

export default function ChildProgressDashboard() {
  const { child } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<ProgressStats>({
    queryKey: ['/api/children', child?.id, 'progress'],
    enabled: !!child,
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery<RewardState>({
    queryKey: ['/api/children', child?.id, 'rewards'],
    enabled: !!child,
  });

  if (statsLoading || rewardsLoading || !child) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 text-center" data-testid="stat-total-completed">
          <Star className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-foreground" data-testid="text-total-completed">{stats?.totalTasksCompleted || 0}</p>
          <p className="text-lg text-muted-foreground">Tasks Done</p>
        </Card>
        
        <Card className="p-6 text-center" data-testid="stat-streak">
          <Flame className="w-12 h-12 text-orange-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-foreground" data-testid="text-streak">{stats?.streakDays || 0}</p>
          <p className="text-lg text-muted-foreground">Day Streak</p>
        </Card>

        <Card className="p-6 text-center" data-testid="stat-points">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-foreground" data-testid="text-points">{rewards?.points || 0}</p>
          <p className="text-lg text-muted-foreground">Points</p>
        </Card>

        <Card className="p-6 text-center" data-testid="stat-badges">
          <Award className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-foreground" data-testid="text-badge-count">{rewards?.badges?.length || 0}</p>
          <p className="text-lg text-muted-foreground">Badges</p>
        </Card>
      </div>

      <Card className="p-6" data-testid="section-weekly-activity">
        <h3 className="text-2xl font-bold mb-6">This Week</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats?.weeklyActivity.map((day, index) => {
            const date = new Date(day.date);
            const dayName = dayNames[date.getDay()];
            const heightPercent = day.total > 0 ? (day.completed / day.total) * 100 : 0;
            const isToday = day.date === new Date().toISOString().split('T')[0];
            
            return (
              <div key={day.date} className="flex flex-col items-center flex-1" data-testid={`day-${index}`}>
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full max-w-12 relative bg-muted rounded-t-lg overflow-hidden"
                    style={{ height: '80px' }}
                  >
                    <div 
                      className={`absolute bottom-0 w-full transition-all duration-500 rounded-t-lg ${
                        heightPercent === 100 ? 'bg-green-500' : heightPercent > 0 ? 'bg-primary' : 'bg-muted'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    />
                  </div>
                  <span className={`text-lg font-semibold mt-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dayName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6" data-testid="section-subjects">
        <h3 className="text-2xl font-bold mb-6">My Subjects</h3>
        <div className="space-y-4">
          {stats?.subjectBreakdown.map((subject) => {
            const Icon = subjectIcons[subject.subject] || BookOpen;
            const colorClass = subjectColors[subject.subject] || "bg-gray-100 text-gray-600";
            const label = subjectLabels[subject.subject] || subject.subject;
            const percent = subject.total > 0 ? Math.round((subject.completed / subject.total) * 100) : 0;
            
            return (
              <div key={subject.subject} className="flex items-center gap-4" data-testid={`subject-${subject.subject.toLowerCase()}`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold">{label}</span>
                    <span className="text-lg text-muted-foreground">{subject.completed}/{subject.total}</span>
                  </div>
                  <Progress value={percent} className="h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
