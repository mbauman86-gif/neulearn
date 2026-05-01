import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import { defaultAvatarTraits, type AvatarTraits } from "@shared/schema";
import { 
  ArrowLeft, Edit, Heart, Sparkles, ThumbsUp, Star, 
  Award, Trophy, CheckCircle, Book, Calculator, Users,
  TreePine, Waves, Rocket, Mountain, Palette,
  Lightbulb, Target, Puzzle, Music, Pencil, Hand
} from "lucide-react";
import EditProfileDialog from "@/components/EditProfileDialog";

const THEME_CONFIG: Record<string, { gradient: string; accent: string; icon: any }> = {
  forest: { gradient: "from-green-400 via-emerald-400 to-teal-500", accent: "bg-green-500", icon: TreePine },
  ocean: { gradient: "from-blue-400 via-cyan-400 to-teal-500", accent: "bg-blue-500", icon: Waves },
  galaxy: { gradient: "from-purple-500 via-violet-400 to-indigo-500", accent: "bg-purple-500", icon: Rocket },
  desert: { gradient: "from-orange-400 via-amber-400 to-yellow-500", accent: "bg-orange-500", icon: Mountain },
};

const ACCENT_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
};

const IDENTITY_TAGS_ICONS: Record<string, any> = {
  "Explorer": Rocket,
  "Scientist": Lightbulb,
  "Artist": Palette,
  "Reader": Book,
  "Builder": Puzzle,
  "Leader": Star,
  "Helper": Heart,
  "Musician": Music,
  "Writer": Pencil,
  "Athlete": Target,
};

const PROFILE_REACTIONS = {
  NICE: { icon: ThumbsUp, label: "Nice!", color: "text-blue-500" },
  SO_COOL: { icon: Sparkles, label: "So cool!", color: "text-purple-500" },
  INSPIRING: { icon: Star, label: "Inspiring!", color: "text-yellow-600" },
};

function getAvatarTraits(child: any): AvatarTraits {
  if (child?.avatarTraits && typeof child.avatarTraits === 'object') {
    return child.avatarTraits as AvatarTraits;
  }
  return defaultAvatarTraits;
}

export default function BuddyProfile() {
  const { child } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const childId = params.childId;
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data: profileData, isLoading, error } = useQuery<{
    child: {
      id: string;
      name: string;
      username: string;
      grade: string;
      avatarTraits: AvatarTraits | null;
    };
    profile: {
      id: string;
      childId: string;
      theme: string;
      accentColor: string;
      identityTags: string[];
      learningStyles: string[];
      funFacts: string[];
      favoriteSubjects: string[];
      topBuddyIds: string[];
    };
    reactions: Array<{
      id: string;
      reactionType: string;
      reactor: { id: string; name: string; username: string };
    }>;
    recentActivity: Array<{
      id: string;
      eventType: string;
      metadata: any;
      createdAt: string;
    }>;
    earnedBadges: Array<{
      id: string;
      earnedAt: string;
      badge: { name: string; slug: string; category: string };
    }>;
    stats: {
      level: number;
      xp: number;
    } | null;
    isOwnProfile: boolean;
  }>({
    queryKey: ['/api/buddy-profile', childId],
    enabled: !!childId,
  });

  const reactMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      return apiRequest("POST", `/api/buddy-profile/${childId}/react`, { reactionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buddy-profile', childId] });
      toast({
        title: "Reaction sent!",
        description: "Your friend will see your encouragement",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not react",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if we can send a poke to this buddy
  const { data: canPokeData } = useQuery<{ canPoke: boolean; reason: string | null }>({
    queryKey: ['/api/social/buddies', childId, 'can-poke'],
    enabled: !!childId && childId !== child?.id,
  });

  const pokeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/social/buddies/${childId}/poke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/buddies', childId, 'can-poke'] });
      toast({
        title: "Wave sent!",
        description: "Your buddy will see that you waved at them",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not send wave",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground font-child">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <Card className="max-w-md text-center p-6">
          <CardContent>
            <p className="text-lg text-muted-foreground font-child">Could not load this profile</p>
            <Button 
              onClick={() => navigate("/child/social")}
              className="mt-4"
              data-testid="button-back-to-social"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Friends
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { child: profileChild, profile, reactions, recentActivity, earnedBadges, stats, isOwnProfile } = profileData;
  
  // Belt-and-suspenders: also check if logged-in child's ID matches the profile being viewed
  const isViewingOwnProfile = isOwnProfile || (child?.id === profileChild.id);
  
  const themeConfig = THEME_CONFIG[profile.theme] || THEME_CONFIG.forest;
  const ThemeIcon = themeConfig.icon;

  const reactionCounts: Record<string, number> = {};
  reactions.forEach(r => {
    reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
  });

  const hasReacted = (type: string) => {
    return reactions.some(r => r.reactionType === type && r.reactor.id === child?.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div
        className={`bg-gradient-to-r ${themeConfig.gradient} pt-6 pb-16 px-4 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8">
            <ThemeIcon className="h-20 w-20 text-white" />
          </div>
          <div className="absolute bottom-4 right-8">
            <ThemeIcon className="h-16 w-16 text-white" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/child/social")}
            className="text-white hover:bg-white/20 mb-4"
            data-testid="button-back-to-social"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span className="text-lg font-child">Back</span>
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-20 pb-8">
        <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="flex flex-col items-center -mt-8 pt-0 pb-4 bg-white rounded-t-2xl">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                <AvatarRenderer 
                  traits={getAvatarTraits(profileChild)} 
                  size={88} 
                  className="rounded-full"
                />
              </div>
              {isViewingOwnProfile && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md"
                  onClick={() => setEditOpen(true)}
                  data-testid="button-edit-profile"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <h1 className="text-2xl font-bold font-child mt-3 text-foreground" data-testid="text-profile-name">
              {profileChild.name}
            </h1>
            <p className="text-muted-foreground font-child" data-testid="text-profile-username">
              @{profileChild.username}
            </p>
            
            {stats && (
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{stats.level}</div>
                  <div className="text-sm text-muted-foreground">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{stats.xp}</div>
                  <div className="text-sm text-muted-foreground">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{earnedBadges.length}</div>
                  <div className="text-sm text-muted-foreground">Badges</div>
                </div>
              </div>
            )}
          </div>

          {!isViewingOwnProfile && (
            <div className="px-4 py-4 border-t bg-gray-50">
              <div className="flex flex-col gap-4">
                {/* Wave Button */}
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="lg"
                        className={`bg-gradient-to-r from-[var(--kid-pink)] to-[var(--kid-purple)] text-white font-child text-lg px-8 shadow-md ${
                          !canPokeData?.canPoke ? 'opacity-50' : ''
                        }`}
                        onClick={() => pokeMutation.mutate()}
                        disabled={!canPokeData?.canPoke || pokeMutation.isPending}
                        data-testid="button-wave-buddy"
                      >
                        <Hand className="w-6 h-6 mr-2" />
                        Wave at {profileData?.child.name.split(' ')[0]}
                      </Button>
                    </TooltipTrigger>
                    {!canPokeData?.canPoke && canPokeData?.reason && (
                      <TooltipContent>
                        <p className="font-child">{canPokeData.reason}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3 font-child">
                    Send encouragement
                  </p>
                  <div className="flex justify-center gap-3">
                    {Object.entries(PROFILE_REACTIONS).map(([type, config]) => {
                      const Icon = config.icon;
                      const count = reactionCounts[type] || 0;
                      const alreadyReacted = hasReacted(type);
                      return (
                        <Tooltip key={type}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="lg"
                              className={`flex-col gap-1 h-auto py-3 px-4 ${alreadyReacted ? 'bg-gray-100' : ''}`}
                              onClick={() => !alreadyReacted && reactMutation.mutate(type)}
                              disabled={alreadyReacted || reactMutation.isPending}
                              data-testid={`button-react-${type.toLowerCase()}`}
                            >
                              <Icon className={`h-6 w-6 ${config.color}`} />
                              <span className="text-sm font-child">{count > 0 ? count : ''}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-child">{config.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {profile.identityTags.length > 0 && (
            <div className="px-4 py-4 border-t">
              <h3 className="text-lg font-semibold font-child mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Who I Am
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.identityTags.map((tag, i) => {
                  const TagIcon = IDENTITY_TAGS_ICONS[tag] || Star;
                  return (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="text-base py-1.5 px-3 font-child"
                      data-testid={`badge-identity-${tag.toLowerCase()}`}
                    >
                      <TagIcon className="h-4 w-4 mr-1" />
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {profile.favoriteSubjects.length > 0 && (
            <div className="px-4 py-4 border-t">
              <h3 className="text-lg font-semibold font-child mb-3 flex items-center gap-2">
                <Book className="h-5 w-5 text-blue-500" />
                Favorite Subjects
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.favoriteSubjects.map((subject, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-base py-1.5 px-3 font-child"
                    data-testid={`badge-subject-${subject.toLowerCase()}`}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.funFacts.length > 0 && (
            <div className="px-4 py-4 border-t">
              <h3 className="text-lg font-semibold font-child mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Fun Facts
              </h3>
              <div className="space-y-2">
                {profile.funFacts.map((fact, i) => (
                  <div 
                    key={i} 
                    className="text-base font-child bg-purple-50 rounded-lg px-3 py-2"
                    data-testid={`text-funfact-${i}`}
                  >
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}

          {earnedBadges.length > 0 && (
            <div className="px-4 py-4 border-t">
              <h3 className="text-lg font-semibold font-child mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Badges Earned
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {earnedBadges.slice(0, 6).map((eb) => (
                  <div 
                    key={eb.id}
                    className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg"
                    data-testid={`badge-earned-${eb.badge.slug}`}
                  >
                    <Award className="h-8 w-8 text-yellow-500" />
                    <span className="text-xs text-center font-child mt-1 truncate w-full">
                      {eb.badge.name}
                    </span>
                  </div>
                ))}
              </div>
              {earnedBadges.length > 6 && (
                <p className="text-sm text-muted-foreground text-center mt-2 font-child">
                  +{earnedBadges.length - 6} more badges
                </p>
              )}
            </div>
          )}

          {recentActivity.length > 0 && (
            <div className="px-4 py-4 border-t">
              <h3 className="text-lg font-semibold font-child mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    data-testid={`activity-${activity.id}`}
                  >
                    {activity.eventType === "LESSON_COMPLETED" && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    {activity.eventType === "BADGE_EARNED" && (
                      <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    )}
                    {activity.eventType === "LEVEL_UP" && (
                      <Trophy className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    )}
                    {activity.eventType === "BADGE_SHARED" && (
                      <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-child text-foreground">
                      {activity.eventType === "LESSON_COMPLETED" && `Completed a ${activity.metadata?.subject || 'lesson'}`}
                      {activity.eventType === "BADGE_EARNED" && `Earned ${activity.metadata?.badgeName || 'a badge'}`}
                      {activity.eventType === "BADGE_SHARED" && `Shared ${activity.metadata?.badgeName || 'a badge'}`}
                      {activity.eventType === "LEVEL_UP" && `Reached Level ${activity.metadata?.level || '?'}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {isViewingOwnProfile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          childId={profileChild.id}
        />
      )}
    </div>
  );
}
