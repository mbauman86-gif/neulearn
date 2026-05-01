import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Trophy, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import starBadge from "@assets/generated_images/achievement_badge_star.png";
import trophyBadge from "@assets/generated_images/trophy_achievement_badge.png";

interface ProgressDashboardProps {
  childId: string;
  childName: string;
}

const badgeImages: Record<string, string> = {
  FIRST_TASK_COMPLETE: starBadge,
  FIRST_DAY_COMPLETE: trophyBadge,
  FIVE_DAYS_COMPLETE: trophyBadge,
  NATURE_EXPLORER: starBadge,
  KIND_HEART: trophyBadge,
};

const badgeLabels: Record<string, string> = {
  FIRST_TASK_COMPLETE: "First Task",
  FIRST_DAY_COMPLETE: "First Day",
  FIVE_DAYS_COMPLETE: "Five Days",
  NATURE_EXPLORER: "Nature Explorer",
  KIND_HEART: "Kind Heart",
};

export default function ProgressDashboard({ childId, childName }: ProgressDashboardProps) {
  const { data: rewards } = useQuery({
    queryKey: ["/api/children", childId, "rewards"],
    queryFn: () => apiRequest(`/api/children/${childId}/rewards`),
  });

  // Get last 7 days of tasks
  const { data: recentTasks } = useQuery({
    queryKey: ["/api/children", childId, "recent-tasks"],
    queryFn: async () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      return apiRequest(`/api/children/${childId}/tasks?startDate=${startDate}&endDate=${endDate}`);
    },
  });

  // Calculate stats for last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  const getDayStats = (date: string) => {
    if (!recentTasks) return { total: 0, completed: 0 };
    const dayTasks = recentTasks.filter((t: any) => t.date === date);
    return {
      total: dayTasks.length,
      completed: dayTasks.filter((t: any) => t.status === "COMPLETED").length,
    };
  };

  const totalTasks = recentTasks?.length || 0;
  const completedTasks = recentTasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">{childName}'s Progress</h3>
        <p className="text-muted-foreground">Activity over the last 7 days</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl font-bold" data-testid="text-total-points">{rewards?.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold" data-testid="text-completion-rate">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
                <p className="text-3xl font-bold" data-testid="text-badges-earned">{rewards?.badges?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            7-Day Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {last7Days.map((day) => {
              const stats = getDayStats(day.date);
              const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-12 text-sm font-medium">{day.label}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground text-right">
                    {stats.completed}/{stats.total} tasks
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {rewards?.badges && rewards.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rewards.badges.map((badge: string) => (
                <div key={badge} className="flex flex-col items-center gap-2 p-4 rounded-lg border">
                  <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                    <img src={badgeImages[badge] || starBadge} alt={badge} className="w-14 h-14" />
                  </div>
                  <p className="text-sm font-medium text-center">{badgeLabels[badge] || badge}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
