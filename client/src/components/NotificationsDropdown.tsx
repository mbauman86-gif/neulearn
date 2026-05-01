import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, Hand, ThumbsUp, Sparkles, Star, Heart, Award } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface NotificationItem {
  id: string;
  type: "WAVE" | "REACTION";
  fromChildId: string;
  fromChildName: string;
  createdAt: string;
  acknowledged: boolean;
  metadata: {
    reactionType?: string;
    activityEventId?: string;
    activityEventType?: string;
  } | null;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

const reactionIcons: Record<string, typeof ThumbsUp> = {
  NICE_WORK: ThumbsUp,
  SO_COOL: Sparkles,
  GREAT_JOB: Star,
  AMAZING: Heart,
  WAY_TO_GO: Award,
};

const reactionLabels: Record<string, string> = {
  NICE_WORK: "Nice Work",
  SO_COOL: "So Cool",
  GREAT_JOB: "Great Job",
  AMAZING: "Amazing",
  WAY_TO_GO: "Way to Go",
};

interface NotificationsDropdownProps {
  childId: string;
}

export function NotificationsDropdown({ childId }: NotificationsDropdownProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ["/api/social/notifications/all", childId],
    refetchInterval: 30000,
  });

  const acknowledgePokeMutation = useMutation({
    mutationFn: async (pokeId: string) => {
      const res = await apiRequest("POST", `/api/social/notifications/${pokeId}/acknowledge`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/notifications/all", childId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/social/notifications/all", childId] });
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

  const handleWaveBack = async (pokeId: string, fromChildId: string) => {
    acknowledgePokeMutation.mutate(pokeId);
    sendPokeMutation.mutate(fromChildId);
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleWaveClick = () => {
    setOpen(false);
    setLocation("/child/social?tab=buddies");
  };

  const isPending = acknowledgePokeMutation.isPending || sendPokeMutation.isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:shadow-lg hover:scale-105 transition-all shadow-md"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        data-testid="dropdown-notifications"
      >
        <div className="p-3 border-b">
          <h3 className="font-bold text-lg font-child">Notifications</h3>
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-lg font-child">No notifications yet!</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                When buddies wave or react to your posts, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onWaveBack={handleWaveBack}
                  isPending={isPending}
                  onWaveClick={handleWaveClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  notification,
  onWaveBack,
  isPending,
  onWaveClick,
}: {
  notification: NotificationItem;
  onWaveBack: (pokeId: string, fromChildId: string) => void;
  isPending: boolean;
  onWaveClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  if (notification.type === "WAVE") {
    return (
      <div 
        className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-accent/50 transition-colors ${!notification.acknowledged ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
        data-testid={`notification-wave-${notification.id}`}
        onClick={onWaveClick}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
          <Hand className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-child">
            <span className="font-bold">{notification.fromChildName}</span> waved at you!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
          {!notification.acknowledged && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-8 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onWaveBack(notification.id, notification.fromChildId);
              }}
              disabled={isPending}
              data-testid={`button-wave-back-${notification.id}`}
            >
              <Hand className="w-3.5 h-3.5 mr-1.5" />
              Wave Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const reactionType = notification.metadata?.reactionType || "NICE_WORK";
  const ReactionIcon = reactionIcons[reactionType] || ThumbsUp;
  const reactionLabel = reactionLabels[reactionType] || reactionType;

  return (
    <div 
      className="p-3 flex items-start gap-3"
      data-testid={`notification-reaction-${notification.id}`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center flex-shrink-0">
        <ReactionIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-child">
          <span className="font-bold">{notification.fromChildName}</span>{" "}
          said <span className="font-semibold text-primary">{reactionLabel}</span> on your post!
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}
