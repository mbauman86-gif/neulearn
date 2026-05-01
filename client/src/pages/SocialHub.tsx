import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import { defaultAvatarTraits, type AvatarTraits } from "@shared/schema";
import { 
  ArrowLeft, Users, Activity, UserPlus, Search, 
  CheckCircle, XCircle, Trophy, Award, Star,
  ThumbsUp, Sparkles, Zap, Medal, Clock, Heart,
  TreePine, Waves, Rocket, Mountain, User, Bell, Hand
} from "lucide-react";
import type { Child, ActivityEvent, ActivityReaction, BuddyLink } from "@shared/schema";

type ActivityWithDetails = ActivityEvent & {
  child: Child;
  reactions: Array<ActivityReaction & { child: Child }>;
};

type BuddyWithLink = Child & { buddyLinkId: string };

type WaitingBuddy = Child & { buddyLinkId: string; status: string };

type PendingRequest = BuddyLink & { requester: Child & { avatarTraits?: AvatarTraits | null } };

type SearchResult = { id: string; name: string; username: string; avatarTraits: any };

type PokeNotification = {
  id: string;
  buddyLinkId: string;
  senderChildId: string;
  recipientChildId: string;
  createdAt: string;
  acknowledgedAt: string | null;
  sender: Child & { avatarTraits?: AvatarTraits | null };
};

function getAvatarTraits(child: any): AvatarTraits {
  if (child?.avatarTraits && typeof child.avatarTraits === 'object' && child.avatarTraits.skinTone) {
    return child.avatarTraits as AvatarTraits;
  }
  return defaultAvatarTraits;
}

const REACTION_CONFIG = {
  NICE_WORK: { icon: ThumbsUp, label: "Nice work!", iconColor: "text-blue-500" },
  SO_COOL: { icon: Sparkles, label: "So cool!", iconColor: "text-purple-500" },
  GREAT_JOB: { icon: Star, label: "Great job!", iconColor: "text-yellow-600" },
  AMAZING: { icon: Zap, label: "Amazing!", iconColor: "text-orange-500" },
  WAY_TO_GO: { icon: Medal, label: "Way to go!", iconColor: "text-green-500" },
};

const EVENT_STYLES = {
  LESSON_COMPLETED: { 
    icon: CheckCircle, 
    bgGradient: "from-green-100 to-emerald-50",
    iconBg: "bg-green-500",
    iconColor: "text-white",
    accentColor: "bg-green-500",
    label: "Lesson"
  },
  BADGE_EARNED: { 
    icon: Award, 
    bgGradient: "from-yellow-100 to-amber-50",
    iconBg: "bg-yellow-500",
    iconColor: "text-white",
    accentColor: "bg-yellow-500",
    label: "Badge"
  },
  LEVEL_UP: { 
    icon: Trophy, 
    bgGradient: "from-orange-100 to-amber-50",
    iconBg: "bg-orange-500",
    iconColor: "text-white",
    accentColor: "bg-orange-500",
    label: "Level Up"
  },
  TOOL_EARNED: { 
    icon: Star, 
    bgGradient: "from-purple-100 to-violet-50",
    iconBg: "bg-purple-500",
    iconColor: "text-white",
    accentColor: "bg-purple-500",
    label: "Tool"
  },
  WORLD_COMPLETED: { 
    icon: Rocket, 
    bgGradient: "from-blue-100 to-cyan-50",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    accentColor: "bg-blue-500",
    label: "World"
  },
  BADGE_SHARED: { 
    icon: Award, 
    bgGradient: "from-pink-100 to-rose-50",
    iconBg: "bg-pink-500",
    iconColor: "text-white",
    accentColor: "bg-pink-500",
    label: "Badge"
  },
};

function getEventStyle(eventType: string) {
  return EVENT_STYLES[eventType as keyof typeof EVENT_STYLES] || {
    icon: Activity,
    bgGradient: "from-gray-100 to-slate-50",
    iconBg: "bg-gray-500",
    iconColor: "text-white",
    accentColor: "bg-gray-500",
    label: "Activity"
  };
}

function getEventMessage(event: ActivityWithDetails) {
  const name = event.child.name;
  const metadata = event.metadata as any;
  
  switch (event.eventType) {
    case "LESSON_COMPLETED":
      return `${name} completed a ${metadata.subject?.toLowerCase() || ""} lesson!`;
    case "BADGE_EARNED":
      return `${name} earned the ${metadata.badgeName || "new"} badge!`;
    case "LEVEL_UP":
      return `${name} reached level ${metadata.newLevel}!`;
    case "TOOL_EARNED":
      return `${name} found a new tool in ${metadata.worldName}!`;
    case "WORLD_COMPLETED":
      return `${name} completed ${metadata.worldName}!`;
    case "BADGE_SHARED":
      return `${name} is showing off the ${metadata.badgeName} badge!`;
    default:
      return `${name} did something awesome!`;
  }
}

function formatTimeAgo(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function WelcomeHeader({ childName, avatarTraits }: { childName: string; avatarTraits: AvatarTraits }) {
  // Ensure we always have valid traits
  const safeTraits = avatarTraits?.skinTone ? avatarTraits : defaultAvatarTraits;
  
  return (
    <Card className="mb-6 border-2 border-[var(--kid-purple)]/20 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <AvatarRenderer traits={safeTraits} size={64} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-child font-bold text-[var(--neulearn-text-primary)]">
              Welcome, {childName}!
            </h2>
            <p className="text-muted-foreground font-child text-lg">
              Cheer on your buddies and celebrate together!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyFeedState({ onFindBuddies }: { onFindBuddies: () => void }) {
  return (
    <Card className="border-2 border-dashed border-[var(--kid-blue)]/30 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardContent className="py-12 text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-[var(--kid-blue)]/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--kid-blue)] to-[var(--kid-purple)] rounded-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-child font-bold text-[var(--neulearn-text-primary)] mb-2">
          Your Feed is Waiting!
        </h3>
        <p className="text-muted-foreground font-child text-lg mb-6 max-w-sm mx-auto">
          Complete lessons to share your achievements, or add buddies to see what they're learning!
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-[var(--kid-blue)] to-[var(--kid-purple)] text-white font-child text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
          onClick={onFindBuddies}
          data-testid="button-find-buddies-empty"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Find Buddies
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyBuddiesState({ onFindBuddies }: { onFindBuddies: () => void }) {
  return (
    <Card className="border-2 border-dashed border-[var(--kid-green)]/30 bg-gradient-to-br from-green-50 to-teal-50">
      <CardContent className="py-12 text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-[var(--kid-green)]/20 rounded-full animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--kid-green)] to-[var(--neulearn-teal)] rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-child font-bold text-[var(--neulearn-text-primary)] mb-2">
          Make New Friends!
        </h3>
        <p className="text-muted-foreground font-child text-lg mb-6 max-w-sm mx-auto">
          Buddies can cheer you on when you complete lessons. Find friends to start learning together!
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-[var(--kid-green)] to-[var(--neulearn-teal)] text-white font-child text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
          onClick={onFindBuddies}
          data-testid="button-find-buddies"
        >
          <Search className="w-5 h-5 mr-2" />
          Search for Buddies
        </Button>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ event, childId, onReact, isPending }: { 
  event: ActivityWithDetails; 
  childId: string;
  onReact: (activityId: string, reactionType: string) => void;
  isPending: boolean;
}) {
  const style = getEventStyle(event.eventType);
  const Icon = style.icon;
  
  return (
    <Card 
      className={`overflow-visible bg-gradient-to-r ${style.bgGradient} shadow-md hover:shadow-lg transition-shadow`}
      data-testid={`activity-${event.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <AvatarRenderer traits={getAvatarTraits(event.child)} size={64} />
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 ${style.iconBg} rounded-full flex items-center justify-center shadow-md`}>
              <Icon className={`w-4 h-4 ${style.iconColor}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${style.accentColor} text-white`}>
                {style.label}
              </Badge>
            </div>
            <p className="font-child text-xl font-bold text-[var(--neulearn-text-primary)]">
              {getEventMessage(event)}
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-child">
              {formatTimeAgo(event.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/50">
          <p className="text-sm font-child text-muted-foreground mb-3">Send encouragement:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(REACTION_CONFIG).map(([type, config]) => {
              const ReactionIcon = config.icon;
              const hasReacted = event.reactions.some(
                (r) => r.childId === childId && r.reactionType === type
              );
              const count = event.reactions.filter((r) => r.reactionType === type).length;
              
              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={hasReacted ? "default" : "outline"}
                      size="sm"
                      onClick={() => onReact(event.id, type)}
                      disabled={isPending}
                      data-testid={`reaction-${type}-${event.id}`}
                    >
                      <ReactionIcon className={`w-4 h-4 mr-1 ${config.iconColor}`} />
                      <span className="font-child font-semibold">
                        {count > 0 ? count : ""}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-child">{config.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SocialHub() {
  const { child } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Read tab from URL params for navigation from notifications
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "feed";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch child's actual avatar traits from the database
  const { data: avatarTraitsData } = useQuery<{ traits: AvatarTraits }>({
    queryKey: ['/api/children', child?.id, 'avatar', 'traits'],
    enabled: !!child,
  });
  const childAvatarTraits = avatarTraitsData?.traits || defaultAvatarTraits;

  const { data: feed = [], isLoading: feedLoading } = useQuery<ActivityWithDetails[]>({
    queryKey: ["/api/social/feed"],
    enabled: !!child,
  });

  const { data: buddies = [], isLoading: buddiesLoading } = useQuery<BuddyWithLink[]>({
    queryKey: ["/api/social/buddies"],
    enabled: !!child,
  });

  const { data: pendingRequests = [] } = useQuery<PendingRequest[]>({
    queryKey: ["/api/social/buddies/pending"],
    enabled: !!child,
  });

  const { data: waitingBuddies = [] } = useQuery<WaitingBuddy[]>({
    queryKey: ["/api/social/buddies/waiting"],
    enabled: !!child,
  });

  const { data: notifications = [] } = useQuery<PokeNotification[]>({
    queryKey: ["/api/social/notifications"],
    enabled: !!child,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery<SearchResult[]>({
    queryKey: ["/api/social/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await fetch(`/api/social/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverUsername: string) => {
      const res = await apiRequest("POST", "/api/social/buddies/request", { receiverUsername });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request sent!", description: "Ask your parent to approve it." });
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/buddies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/buddies/waiting"] });
    },
    onError: (error: Error) => {
      toast({ title: "Oops!", description: error.message, variant: "destructive" });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (buddyLinkId: string) => {
      const res = await apiRequest("POST", `/api/social/buddies/${buddyLinkId}/accept`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request accepted!", description: "Your parent needs to approve it too." });
      queryClient.invalidateQueries({ queryKey: ["/api/social/buddies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/buddies/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/buddies/waiting"] });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (buddyLinkId: string) => {
      const res = await apiRequest("POST", `/api/social/buddies/${buddyLinkId}/decline`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/buddies/pending"] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ activityId, reactionType }: { activityId: string; reactionType: string }) => {
      const res = await apiRequest("POST", `/api/social/feed/${activityId}/react`, { reactionType });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
    },
  });

  const acknowledgePokeMutation = useMutation({
    mutationFn: async (pokeId: string) => {
      const res = await apiRequest("POST", `/api/social/notifications/${pokeId}/acknowledge`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/notifications"] });
    },
  });

  const sendPokeMutation = useMutation({
    mutationFn: async (buddyChildId: string) => {
      const res = await apiRequest("POST", `/api/social/buddies/${buddyChildId}/poke`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Wave sent!",
        description: "Your buddy will see your wave!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/notifications"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("already waved")) {
        toast({
          title: "Already waved!",
          description: "You already waved at this buddy recently. Try again later!",
        });
      }
    },
  });

  const handleWaveBack = (pokeId: string, senderChildId: string) => {
    acknowledgePokeMutation.mutate(pokeId);
    sendPokeMutation.mutate(senderChildId);
  };

  if (!child) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--kid-blue)]/5 via-[var(--neulearn-surface-light)] to-[var(--kid-purple)]/5">
      <header className="bg-gradient-to-r from-[var(--neulearn-teal)] to-[#0D8F7F] sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/child/home")}
            className="rounded-full bg-white/20 hover:bg-white/30 text-white"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-child font-bold text-white">
                Buddy World
              </h1>
              <p className="text-lg text-white/90 font-child">
                Connect with friends
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingRequests.length > 0 && (
              <Badge className="bg-white text-[var(--neulearn-teal)] font-bold animate-pulse shadow-md" data-testid="badge-pending-count">
                {pendingRequests.length} new
              </Badge>
            )}
            <Button
              onClick={() => setLocation(`/child/buddy/${child.id}`)}
              className="h-12 px-4 rounded-full bg-white hover:bg-white/90 text-[var(--neulearn-text-primary)] font-child font-bold shadow-md flex items-center gap-2"
              data-testid="button-my-profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--neulearn-teal)]/10 flex items-center justify-center">
                <AvatarRenderer traits={childAvatarTraits} size={32} />
              </div>
              <span className="text-lg">My Profile</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <WelcomeHeader childName={child.name} avatarTraits={childAvatarTraits} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-16 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-md">
            <TabsTrigger 
              value="feed" 
              className="text-lg font-child gap-2 rounded-lg text-[var(--kid-blue)] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--kid-blue)] data-[state=active]:to-[var(--kid-purple)] data-[state=active]:text-white" 
              data-testid="tab-feed"
            >
              <Activity className="w-5 h-5" />
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="buddies" 
              className="text-lg font-child gap-2 rounded-lg text-[var(--kid-green)] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--kid-green)] data-[state=active]:to-[var(--neulearn-teal)] data-[state=active]:text-white" 
              data-testid="tab-buddies"
            >
              <Users className="w-5 h-5" />
              Buddies
            </TabsTrigger>
            <TabsTrigger 
              value="add" 
              className="text-lg font-child gap-2 rounded-lg text-[var(--kid-orange)] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--kid-orange)] data-[state=active]:to-[var(--kid-pink)] data-[state=active]:text-white" 
              data-testid="tab-add"
            >
              <UserPlus className="w-5 h-5" />
              Add
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4 mt-6">
            {pendingRequests.length > 0 && (
              <Card className="border-2 border-[var(--kid-orange)] bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-child flex items-center gap-2">
                    <div className="w-8 h-8 bg-[var(--kid-orange)] rounded-full flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-white" />
                    </div>
                    Buddy Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-4 p-4 bg-white/80 rounded-xl shadow-sm"
                      data-testid={`pending-request-${req.id}`}
                    >
                      <AvatarRenderer traits={getAvatarTraits(req.requester)} size={56} />
                      <div className="flex-1">
                        <p className="font-child font-bold text-lg">{req.requester.name}</p>
                        <p className="text-sm text-muted-foreground">@{req.requester.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-[var(--kid-green)] to-[var(--neulearn-teal)] text-white font-child shadow-md"
                          onClick={() => acceptRequestMutation.mutate(req.id)}
                          disabled={acceptRequestMutation.isPending}
                          data-testid={`button-accept-${req.id}`}
                        >
                          <CheckCircle className="w-5 h-5 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => declineRequestMutation.mutate(req.id)}
                          disabled={declineRequestMutation.isPending}
                          data-testid={`button-decline-${req.id}`}
                        >
                          <XCircle className="w-6 h-6 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {feedLoading ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--kid-blue)]/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--kid-blue)] border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 font-child text-lg text-muted-foreground">Loading adventures...</p>
              </div>
            ) : feed.length === 0 ? (
              <EmptyFeedState onFindBuddies={() => setActiveTab("add")} />
            ) : (
              <div className="space-y-4">
                {feed.map((event) => (
                  <ActivityCard 
                    key={event.id}
                    event={event}
                    childId={child.id}
                    onReact={(activityId, reactionType) => reactMutation.mutate({ activityId, reactionType })}
                    isPending={reactMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="buddies" className="space-y-4 mt-6">
            {buddiesLoading ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--kid-green)]/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--kid-green)] border-t-transparent animate-spin" />
                </div>
              </div>
            ) : (
              <>
                {notifications.length > 0 && (
                  <Card className="border-2 border-[var(--kid-pink)] bg-gradient-to-r from-pink-50 to-rose-50 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-child text-xl flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--kid-pink)] rounded-full flex items-center justify-center animate-bounce">
                          <Hand className="w-4 h-4 text-white" />
                        </div>
                        Someone waved at you!
                        <Badge className="bg-[var(--kid-pink)] text-white font-child ml-auto">
                          {notifications.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {notifications.map((poke) => (
                        <div
                          key={poke.id}
                          className="flex items-center gap-4 p-4 bg-white/80 rounded-xl"
                          data-testid={`poke-notification-${poke.id}`}
                        >
                          <AvatarRenderer traits={getAvatarTraits(poke.sender)} size={56} />
                          <div className="flex-1">
                            <p className="font-child font-bold text-lg text-[var(--neulearn-text-primary)]">
                              {poke.sender.name} waved at you!
                            </p>
                            <p className="text-sm text-muted-foreground font-child">
                              {formatTimeAgo(poke.createdAt)}
                            </p>
                          </div>
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-[var(--kid-pink)] to-[var(--kid-purple)] text-white font-child shadow-md"
                            onClick={() => handleWaveBack(poke.id, poke.senderChildId)}
                            disabled={acknowledgePokeMutation.isPending || sendPokeMutation.isPending}
                            data-testid={`button-wave-back-${poke.id}`}
                          >
                            <Hand className="w-5 h-5 mr-2" />
                            Wave Back
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {waitingBuddies.length > 0 && (
                  <Card className="border-2 border-[var(--kid-orange)] bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-child text-xl flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--kid-orange)] rounded-full flex items-center justify-center animate-pulse">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        Waiting for Parents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground font-child">
                        Ask your parent to check their dashboard!
                      </p>
                      {waitingBuddies.map((buddy) => (
                        <div
                          key={buddy.id}
                          className="flex items-center gap-4 p-4 bg-white/80 rounded-xl"
                          data-testid={`waiting-buddy-${buddy.id}`}
                        >
                          <AvatarRenderer traits={getAvatarTraits(buddy)} size={56} />
                          <div className="flex-1">
                            <p className="font-child font-bold text-lg">{buddy.name}</p>
                            <p className="text-sm text-muted-foreground">@{buddy.username}</p>
                          </div>
                          <Badge variant="outline" className="border-[var(--kid-orange)] text-[var(--kid-orange)] font-child">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {buddies.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-[var(--kid-green)] to-[var(--neulearn-teal)] rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-child text-xl font-bold">My Buddies</h3>
                      <Badge className="bg-[var(--kid-green)] text-white font-child">
                        {buddies.length}
                      </Badge>
                    </div>
                    {buddies.map((buddy) => (
                      <Card 
                        key={buddy.id} 
                        className="bg-gradient-to-r from-green-50 to-teal-50 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/child/buddy/${buddy.id}`)}
                        data-testid={`buddy-card-${buddy.id}`}
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                          <AvatarRenderer traits={getAvatarTraits(buddy)} size={72} />
                          <div className="flex-1">
                            <p className="text-2xl font-child font-bold text-[var(--neulearn-text-primary)]">{buddy.name}</p>
                            <p className="text-muted-foreground font-child">@{buddy.username}</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-[var(--kid-green)] to-[var(--neulearn-teal)] text-white font-child">
                            <Heart className="w-4 h-4 mr-1" />
                            Buddy
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {buddies.length === 0 && waitingBuddies.length === 0 && (
                  <EmptyBuddiesState onFindBuddies={() => setActiveTab("add")} />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-6">
            <Card className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-[var(--kid-orange)]/30 shadow-lg">
              <CardHeader>
                <CardTitle className="font-child text-xl flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-[var(--kid-orange)] to-[var(--kid-pink)] rounded-full flex items-center justify-center">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  Find a Buddy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Type a name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="!pl-16 h-14 text-lg font-child rounded-xl border-2 focus:border-[var(--kid-orange)]"
                    data-testid="input-search-buddy"
                  />
                </div>

                {searching && (
                  <div className="text-center py-6">
                    <div className="relative w-10 h-10 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-[var(--kid-orange)]/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-[var(--kid-orange)] border-t-transparent animate-spin" />
                    </div>
                    <p className="mt-2 font-child text-muted-foreground">Searching...</p>
                  </div>
                )}

                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground font-child text-lg">
                      No one found. Try a different name!
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center gap-4 p-4 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        data-testid={`search-result-${result.id}`}
                      >
                        <AvatarRenderer traits={getAvatarTraits(result)} size={56} />
                        <div className="flex-1">
                          <p className="font-child font-bold text-lg">{result.name}</p>
                          <p className="text-sm text-muted-foreground">@{result.username}</p>
                        </div>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-[var(--kid-blue)] to-[var(--kid-purple)] text-white font-child shadow-md"
                          onClick={() => sendRequestMutation.mutate(result.username)}
                          disabled={sendRequestMutation.isPending}
                          data-testid={`button-add-${result.id}`}
                        >
                          <UserPlus className="w-5 h-5 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-6 border-t border-[var(--kid-orange)]/20">
                  <div className="bg-white/60 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground font-child">
                      Your parent will need to approve new buddy requests to keep you safe!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
