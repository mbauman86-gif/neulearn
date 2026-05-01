import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Lock, Star, Flame, Trophy, Target, Sparkles, Share2, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  xpReward: number;
}

interface EarnedBadge {
  id: string;
  badgeId: string;
  earnedAt: string;
  badge: BadgeDefinition;
}

interface BadgeDisplayProps {
  earnedBadges: EarnedBadge[];
  allBadges?: BadgeDefinition[];
  showLocked?: boolean;
  compact?: boolean;
  maxDisplay?: number;
  newBadgeSlugs?: string[];
  className?: string;
  childId?: string;
  enableSharing?: boolean;
}

const categoryIcons: Record<string, any> = {
  ACHIEVEMENT: Trophy,
  STREAK: Flame,
  LEVEL: Star,
  XP: Target,
  SPECIAL: Sparkles,
};

const categoryColors: Record<string, string> = {
  ACHIEVEMENT: "from-amber-400 to-orange-500",
  STREAK: "from-orange-400 to-red-500",
  LEVEL: "from-yellow-400 to-amber-500",
  XP: "from-green-400 to-emerald-500",
  SPECIAL: "from-purple-400 to-pink-500",
};

function BadgeIcon({ badge, isLocked, isNew, size = "md" }: { 
  badge: BadgeDefinition; 
  isLocked?: boolean; 
  isNew?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = categoryIcons[badge.category] || Award;
  const colorClass = categoryColors[badge.category] || "from-slate-400 to-slate-500";
  
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };
  
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
  };

  return (
    <motion.div 
      className="relative"
      whileHover={!isLocked ? { scale: 1.1, rotate: 5 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div 
        className={cn(
          "rounded-full flex items-center justify-center shadow-lg",
          sizeClasses[size],
          isLocked 
            ? "bg-slate-200 dark:bg-slate-700" 
            : `bg-gradient-to-br ${colorClass}`
        )}
      >
        {isLocked ? (
          <Lock className={cn(iconSizes[size], "text-slate-400 dark:text-slate-500")} />
        ) : (
          <Icon className={cn(iconSizes[size], "text-white fill-current")} />
        )}
      </div>
      
      {isNew && !isLocked && (
        <motion.div 
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <span className="text-[10px] font-bold text-white">!</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function BadgeDisplay({
  earnedBadges,
  allBadges = [],
  showLocked = false,
  compact = false,
  maxDisplay = 8,
  newBadgeSlugs = [],
  className,
  childId,
  enableSharing = false,
}: BadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<{badge: BadgeDefinition; isLocked: boolean; earnedAt?: string} | null>(null);
  const [justShared, setJustShared] = useState(false);
  const { toast } = useToast();

  const shareBadgeMutation = useMutation({
    mutationFn: async (badge: BadgeDefinition) => {
      const response = await apiRequest("POST", "/api/social/share/badge", {
        badgeSlug: badge.slug,
        badgeName: badge.name,
        badgeCategory: badge.category,
      });
      return response.json();
    },
    onSuccess: () => {
      setJustShared(true);
      toast({
        title: "Badge shared!",
        description: "Your buddies can now see this badge!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
      setTimeout(() => setJustShared(false), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't share",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });
  
  const earnedSlugs = new Set(earnedBadges.map(b => b.badge.slug));
  const lockedBadges = allBadges.filter(b => !earnedSlugs.has(b.slug));
  
  const displayEarned = compact ? earnedBadges.slice(0, maxDisplay) : earnedBadges;
  const displayLocked = compact ? lockedBadges.slice(0, Math.max(0, maxDisplay - earnedBadges.length)) : lockedBadges;
  const hasMore = earnedBadges.length + (showLocked ? lockedBadges.length : 0) > maxDisplay;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)} data-testid="badge-display-compact">
        {displayEarned.slice(0, 4).map((earned) => (
          <BadgeIcon 
            key={earned.id} 
            badge={earned.badge} 
            size="sm"
            isNew={newBadgeSlugs.includes(earned.badge.slug)}
          />
        ))}
        {earnedBadges.length > 4 && (
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              +{earnedBadges.length - 4}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-4", className)} data-testid="badge-display">
        {earnedBadges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Earned Badges ({earnedBadges.length})
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {displayEarned.map((earned) => (
                <motion.button
                  key={earned.id}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover-elevate active-elevate-2 transition-colors"
                  onClick={() => setSelectedBadge({ 
                    badge: earned.badge, 
                    isLocked: false, 
                    earnedAt: earned.earnedAt 
                  })}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-testid={`badge-earned-${earned.badge.slug}`}
                >
                  <BadgeIcon 
                    badge={earned.badge} 
                    isNew={newBadgeSlugs.includes(earned.badge.slug)}
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center line-clamp-1">
                    {earned.badge.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        {showLocked && lockedBadges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-500 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Locked Badges ({lockedBadges.length})
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {displayLocked.map((badge) => (
                <motion.button
                  key={badge.id}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover-elevate transition-colors opacity-60"
                  onClick={() => setSelectedBadge({ badge, isLocked: true })}
                  data-testid={`badge-locked-${badge.slug}`}
                >
                  <BadgeIcon badge={badge} isLocked />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-500 text-center line-clamp-1">
                    {badge.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        {hasMore && compact && (
          <p className="text-xs text-slate-500 text-center">
            +{earnedBadges.length + (showLocked ? lockedBadges.length : 0) - maxDisplay} more badges
          </p>
        )}
      </div>
      
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-sm">
          {selectedBadge && (
            <>
              <DialogHeader className="items-center">
                <BadgeIcon 
                  badge={selectedBadge.badge} 
                  isLocked={selectedBadge.isLocked}
                  size="lg"
                />
                <DialogTitle className="text-center mt-3">
                  {selectedBadge.badge.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="text-center space-y-3">
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedBadge.badge.description}
                </p>
                
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedBadge.badge.category.toLowerCase()}
                  </Badge>
                  {selectedBadge.badge.xpReward > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="w-3 h-3" />
                      +{selectedBadge.badge.xpReward} XP
                    </Badge>
                  )}
                </div>
                
                {selectedBadge.earnedAt && (
                  <p className="text-xs text-slate-500">
                    Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                  </p>
                )}
                
                {selectedBadge.isLocked && (
                  <p className="text-sm text-slate-500 italic">
                    Keep learning to unlock this badge!
                  </p>
                )}
                
                {enableSharing && !selectedBadge.isLocked && childId && (
                  <div className="pt-4 border-t">
                    <Button
                      size="lg"
                      className="w-full font-child text-lg"
                      onClick={() => shareBadgeMutation.mutate(selectedBadge.badge)}
                      disabled={shareBadgeMutation.isPending || justShared}
                      data-testid="button-share-badge"
                    >
                      {shareBadgeMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sharing...
                        </>
                      ) : justShared ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Shared!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-5 h-5 mr-2" />
                          Share with Buddies
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
