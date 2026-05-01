import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sparkles, TrendingUp, ArrowLeft, BookOpen, Calculator, Heart, Play, Loader2, Package, Award, Map, Pencil, Users, SkipForward, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdaptiveLessonCard from "./AdaptiveLessonCard";
import ChildProgressDashboard from "./ChildProgressDashboard";
import DailyDevotionalCard from "./DailyDevotionalCard";
import NeuLearnLogo from "./NeuLearnLogo";
import { ProgressionBar } from "./ProgressionBar";
import { BadgeDisplay } from "./BadgeDisplay";
import { InventoryPanel } from "./InventoryPanel";
import { JourneyMap } from "./JourneyMap";
import { DailyQueueSection } from "./DailyQueueSection";
import { AvatarRenderer } from "./AvatarRenderer";
import { AvatarBuilderDialog } from "./AvatarBuilderDialog";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LessonInstance, RewardState, AvatarState, BadgeDefinition, InventoryItem, AvatarTraits } from "@shared/schema";
import { defaultAvatarTraits } from "@shared/schema";

interface EarnedBadgeWithDef {
  id: string;
  badgeId: string;
  earnedAt: string;
  badge: BadgeDefinition;
}

interface InventoryItemWithDef {
  id: string;
  itemId: string;
  obtainedAt: string;
  obtainedVia: string;
  item: InventoryItem;
}

interface ProgressionData {
  avatarState: AvatarState;
  currentLevelInfo?: { level: number; title: string; xpRequired: number };
  nextLevelInfo?: { level: number; title: string; xpRequired: number };
  xpToNextLevel: number;
  earnedBadges: EarnedBadgeWithDef[];
  inventory: InventoryItemWithDef[];
  lessonsCompletedCount: number;
}

const subjectConfig = {
  MATH: { icon: Calculator, color: "var(--kid-blue)", label: "Math" },
  READING: { icon: BookOpen, color: "var(--kid-green)", label: "Reading" },
  CHARACTER: { icon: Heart, color: "var(--kid-yellow)", label: "Character" },
};

type TabType = "learn" | "progress";
type LearnSubTab = "active" | "completed";

interface JourneyProgress {
  journeyStage: number;
  journeyPosition: number;
  growthPoints: number;
  nextMilestone: number;
}

export default function ChildHome() {
  const [, setLocation] = useLocation();
  const { child, logout, isImpersonating, stopImpersonation } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("learn");
  const [learnSubTab, setLearnSubTab] = useState<LearnSubTab>("active");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [avatarBuilderOpen, setAvatarBuilderOpen] = useState(false);
  const { toast } = useToast();

  const handleReturnToParent = async () => {
    try {
      await stopImpersonation();
      setLocation("/parent/dashboard");
    } catch (error) {
      console.error("Failed to return to parent view:", error);
    }
  };

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<LessonInstance[]>({
    queryKey: ['/api/adaptive/lessons/all', child?.id],
    enabled: !!child,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery<RewardState>({
    queryKey: ['/api/children', child?.id, 'rewards'],
    enabled: !!child,
  });

  const { data: journey } = useQuery<JourneyProgress>({
    queryKey: ['/api/adaptive/journey', child?.id],
    enabled: !!child,
  });

  const { data: progression, isLoading: progressionLoading } = useQuery<ProgressionData>({
    queryKey: ['/api/children', child?.id, 'progression'],
    enabled: !!child,
  });

  const { data: allBadges = [] } = useQuery<BadgeDefinition[]>({
    queryKey: ['/api/badges'],
    enabled: !!child,
  });

  const { data: avatarTraitsData } = useQuery<{ traits: AvatarTraits }>({
    queryKey: ['/api/children', child?.id, 'avatar', 'traits'],
    enabled: !!child,
  });
  const avatarTraits = avatarTraitsData?.traits || defaultAvatarTraits;

  const equipItemMutation = useMutation({
    mutationFn: async ({ slot, itemSlug }: { slot: string; itemSlug: string | null }) => {
      const res = await apiRequest("POST", `/api/children/${child?.id}/progression/equip`, {
        slot,
        itemSlug,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', child?.id, 'progression'] });
    },
  });

  const generateLessonMutation = useMutation({
    mutationFn: async (subject: string) => {
      setGenerationError(null);
      const res = await apiRequest("POST", "/api/adaptive/lessons/generate", {
        childId: child?.id,
        subject,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create lesson");
      }
      return res.json() as Promise<LessonInstance>;
    },
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/lessons/all', child?.id] });
      setLocation(`/child/lesson/${lesson.id}`);
    },
    onError: (error: Error) => {
      console.error("Lesson generation failed:", error);
      setGenerationError(error.message);
      toast({
        title: "Oops! Couldn't create your lesson",
        description: "Let's try again! Tap the subject to retry.",
        variant: "destructive",
      });
    },
  });

  const handleStartLesson = (subject: string) => {
    const existingLesson = lessons.find(
      (l) => l.subject === subject && l.status !== "COMPLETED"
    );
    
    if (existingLesson) {
      setLocation(`/child/lesson/${existingLesson.id}`);
    } else {
      generateLessonMutation.mutate(subject);
    }
  };

  const activeLessons = lessons.filter((l) => l.status !== "COMPLETED" && l.status !== "SKIPPED");
  const skippedLessons = lessons.filter((l) => l.status === "SKIPPED");
  const completedLessons = lessons.filter((l) => l.status === "COMPLETED");
  const totalPoints = rewards?.points || 0;
  const journeyProgress = journey ? (journey.journeyPosition / 10) * 100 : 0;

  const handleEquipItem = async (slot: string, itemSlug: string | null) => {
    await equipItemMutation.mutateAsync({ slot, itemSlug });
  };

  if (lessonsLoading || rewardsLoading || progressionLoading || !child) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--kid-blue)]/10 via-[var(--neulearn-surface-light)] to-[var(--kid-green)]/10 font-child">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neulearn-teal)] mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Loading your lessons...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--kid-blue)]/10 via-[var(--neulearn-surface-light)] to-[var(--kid-green)]/10 font-child">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <NeuLearnLogo size="sm" />
          <div className="flex gap-2">
            {isImpersonating && (
              <Button 
                variant="default" 
                size="lg"
                onClick={handleReturnToParent}
                className="h-12 px-5 text-base bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90"
                data-testid="button-exit-impersonation"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Parent View
              </Button>
            )}
            {!isImpersonating && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={logout}
                className="h-12 px-5 text-base"
                data-testid="button-child-logout"
              >
                Log Out
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAvatarBuilderOpen(true)}
            className="relative group"
            data-testid="button-edit-avatar"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 ring-4 ring-white dark:ring-gray-800 shadow-lg transition-transform group-hover:scale-105">
              <AvatarRenderer traits={avatarTraits} size={96} className="w-full h-full" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800">
              <Pencil className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </button>
          <div className="text-left space-y-1 flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--neulearn-text-primary)]" data-testid="text-child-greeting">
              Hi, {child.name}!
            </h1>
            <p className="text-muted-foreground text-sm">Tap your picture to customize your look!</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown childId={child.id} />
            <button
              onClick={() => setLocation("/child/social")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--kid-green)] to-[var(--neulearn-teal)] hover:shadow-lg hover:scale-105 transition-all shadow-md"
              data-testid="button-buddies"
            >
              <Users className="w-5 h-5 text-white" />
              <span className="text-lg font-child font-bold text-white">Buddies</span>
            </button>
          </div>
        </div>

        <AvatarBuilderDialog
          childId={child.id}
          open={avatarBuilderOpen}
          onOpenChange={setAvatarBuilderOpen}
        />

        {progression && (
          <ProgressionBar
            level={progression.avatarState.level}
            title={progression.currentLevelInfo?.title || "Curious Beginner"}
            currentXP={progression.avatarState.currentXP}
            xpToNextLevel={progression.xpToNextLevel}
            totalXPEarned={progression.avatarState.totalXPEarned}
            currentStreak={progression.avatarState.currentStreak}
            longestStreak={progression.avatarState.longestStreak}
          />
        )}

        {progression && progression.earnedBadges.length > 0 && (
          <BadgeDisplay
            earnedBadges={progression.earnedBadges}
            compact
            maxDisplay={6}
            childId={child.id}
            enableSharing
          />
        )}

        <DailyDevotionalCard childId={child.id} />

        <div className="flex gap-2 p-1 bg-muted rounded-2xl">
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-lg font-semibold transition-all ${
              activeTab === "learn" 
                ? "bg-background text-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-learn"
          >
            <Sparkles className="w-6 h-6" />
            <span>Learn</span>
            {completedLessons.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {completedLessons.length} done
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-lg font-semibold transition-all ${
              activeTab === "progress" 
                ? "bg-background text-foreground shadow-md" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-progress"
          >
            <TrendingUp className="w-6 h-6" />
            <span>My Progress</span>
          </button>
        </div>

        {activeTab === "learn" && (
          <div className="space-y-6">
            <DailyQueueSection
              childId={child.id}
              childName={child.name}
              onStartLesson={(skillId, subject) => {
                setSelectedSubject(subject);
              }}
            />
            
            <JourneyMap
              childId={child.id}
              childName={child.name}
              onStartLesson={(tileId, subject) => {
                setSelectedSubject(subject);
              }}
            />

            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setLearnSubTab("active")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    learnSubTab === "active" 
                      ? "bg-[var(--neulearn-teal)] text-white" 
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-active-lessons"
                >
                  <Play className="w-4 h-4" />
                  <span>Active</span>
                  {activeLessons.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
                      {activeLessons.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setLearnSubTab("completed")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    learnSubTab === "completed" 
                      ? "bg-green-600 text-white" 
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-completed-lessons"
                >
                  <Award className="w-4 h-4" />
                  <span>Completed</span>
                  {completedLessons.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
                      {completedLessons.length}
                    </span>
                  )}
                </button>
              </div>

              {learnSubTab === "active" && (
                <>
                  {activeLessons.length > 0 ? (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">Continue Learning</h2>
                      {activeLessons.map((lesson) => (
                        <AdaptiveLessonCard
                          key={lesson.id}
                          lesson={lesson}
                          onClick={() => setLocation(`/child/lesson/${lesson.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="overflow-visible">
                      <CardContent className="p-8 text-center">
                        <Map className="w-16 h-16 text-[var(--neulearn-teal)] mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">Your Adventure Awaits!</h3>
                        <p className="text-muted-foreground text-lg">
                          Tap a tile on the map above to start your next lesson!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {skippedLessons.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-6 h-6 text-orange-500" />
                        <h2 className="text-2xl font-bold">Come Back To These</h2>
                        <span className="px-2 py-1 rounded-full text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {skippedLessons.length} skipped
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Finish these lessons to earn your mastery badges!
                      </p>
                      {skippedLessons.map((lesson) => (
                        <div key={lesson.id} className="relative">
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-orange-400 rounded-full" />
                          <AdaptiveLessonCard
                            lesson={lesson}
                            onClick={() => setLocation(`/child/lesson/${lesson.id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {learnSubTab === "completed" && (
                <>
                  {completedLessons.length > 0 ? (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">Completed Lessons</h2>
                      {completedLessons.map((lesson) => (
                        <AdaptiveLessonCard
                          key={lesson.id}
                          lesson={lesson}
                          onClick={() => setLocation(`/child/lesson/${lesson.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="overflow-visible">
                      <CardContent className="p-8 text-center">
                        <Award className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">No Completed Lessons Yet</h3>
                        <p className="text-muted-foreground text-lg">
                          Complete a lesson to see it here!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-6">
            {progression && (
              <Tabs defaultValue="badges" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="badges" className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Badges
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    My Stuff
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="badges" className="mt-4">
                  <Card>
                    <CardContent className="p-5">
                      <BadgeDisplay
                        earnedBadges={progression.earnedBadges}
                        allBadges={allBadges}
                        showLocked
                        childId={child.id}
                        enableSharing
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="inventory" className="mt-4">
                  <Card>
                    <CardContent className="p-5">
                      <InventoryPanel
                        inventory={progression.inventory}
                        equippedItems={progression.avatarState.equippedItems as Record<string, string | null>}
                        onEquip={handleEquipItem}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
            
            <ChildProgressDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
