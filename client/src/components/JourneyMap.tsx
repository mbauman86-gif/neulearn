import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trees, Waves, Star, Mountain,
  Lock, CheckCircle2, Play, Sparkles, 
  Gift, Loader2, ChevronRight, Flower2, TreePine, Bird, Gem
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AvatarRenderer } from "./AvatarRenderer";
import type { WorldDefinition, WorldTool, JourneyTile, ChildWorldProgress, AvatarTraits } from "@shared/schema";
import { defaultAvatarTraits } from "@shared/schema";

interface JourneyData {
  currentWorld: WorldDefinition;
  worldProgress: ChildWorldProgress;
  tiles: JourneyTile[];
  earnedTools: (WorldTool & { earnedAt: string })[];
  allWorlds: WorldDefinition[];
}

interface JourneyMapProps {
  childId: string;
  childName: string;
  onStartLesson: (tileId: string, subject: string) => void;
}

const worldIcons: Record<string, typeof Trees> = {
  FOREST: Trees,
  OCEAN: Waves,
  GALAXY: Star,
  DESERT: Mountain,
};

const worldThemes: Record<string, { 
  bgGradient: string; 
  pathColor: string;
  tileColors: string[];
  accentColor: string;
  decorations: string[];
}> = {
  FOREST: {
    bgGradient: "from-green-100 via-emerald-50 to-lime-100 dark:from-green-950 dark:via-emerald-950 dark:to-green-900",
    pathColor: "#8B4513",
    tileColors: ["#22c55e", "#10b981", "#34d399", "#4ade80", "#86efac"],
    accentColor: "#15803d",
    decorations: ["tree", "flower", "mushroom", "butterfly"],
  },
  OCEAN: {
    bgGradient: "from-cyan-100 via-blue-50 to-sky-100 dark:from-cyan-950 dark:via-blue-950 dark:to-cyan-900",
    pathColor: "#0ea5e9",
    tileColors: ["#06b6d4", "#0891b2", "#22d3ee", "#67e8f9", "#a5f3fc"],
    accentColor: "#0e7490",
    decorations: ["fish", "coral", "shell", "bubble"],
  },
  GALAXY: {
    bgGradient: "from-violet-100 via-purple-50 to-indigo-100 dark:from-violet-950 dark:via-purple-950 dark:to-indigo-900",
    pathColor: "#8b5cf6",
    tileColors: ["#a855f7", "#8b5cf6", "#c084fc", "#d8b4fe", "#e9d5ff"],
    accentColor: "#7c3aed",
    decorations: ["star", "planet", "rocket", "comet"],
  },
  DESERT: {
    bgGradient: "from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900",
    pathColor: "#d97706",
    tileColors: ["#f59e0b", "#d97706", "#fbbf24", "#fcd34d", "#fde68a"],
    accentColor: "#b45309",
    decorations: ["cactus", "sun", "lizard", "rock"],
  },
};

function ForestDecorations() {
  return (
    <>
      <div className="absolute top-4 left-4 text-green-600 dark:text-green-400 opacity-60">
        <TreePine className="w-12 h-12" />
      </div>
      <div className="absolute top-8 right-8 text-green-500 dark:text-green-400 opacity-50">
        <Trees className="w-10 h-10" />
      </div>
      <div className="absolute bottom-20 left-8 text-pink-400 dark:text-pink-300 opacity-60">
        <Flower2 className="w-8 h-8" />
      </div>
      <div className="absolute bottom-32 right-12 text-pink-500 dark:text-pink-300 opacity-50">
        <Flower2 className="w-6 h-6" />
      </div>
      <div className="absolute top-1/3 left-2 text-amber-600 dark:text-amber-400 opacity-40">
        <div className="w-6 h-6 rounded-full bg-current" style={{ borderRadius: "50% 50% 50% 0" }} />
      </div>
      <div className="absolute top-1/2 right-4 text-sky-400 dark:text-sky-300 opacity-50">
        <Bird className="w-6 h-6" />
      </div>
      <div className="absolute bottom-16 right-1/4 text-green-700 dark:text-green-500 opacity-40">
        <TreePine className="w-8 h-8" />
      </div>
    </>
  );
}

function OceanDecorations() {
  return (
    <>
      <div className="absolute top-6 left-6 text-cyan-400 opacity-50">
        <Waves className="w-10 h-10" />
      </div>
      <div className="absolute top-12 right-10 text-blue-300 opacity-40">
        <div className="w-4 h-4 rounded-full bg-current animate-pulse" />
      </div>
      <div className="absolute bottom-24 left-10 text-pink-300 opacity-50">
        <Gem className="w-8 h-8" />
      </div>
      <div className="absolute top-1/3 right-6 text-cyan-300 opacity-40">
        <div className="w-3 h-3 rounded-full bg-current animate-bounce" />
      </div>
    </>
  );
}

function GalaxyDecorations() {
  return (
    <>
      <div className="absolute top-4 left-8 text-yellow-300 opacity-60 animate-pulse">
        <Star className="w-6 h-6 fill-current" />
      </div>
      <div className="absolute top-16 right-6 text-purple-300 opacity-50">
        <Star className="w-4 h-4 fill-current" />
      </div>
      <div className="absolute bottom-28 left-4 text-indigo-300 opacity-40">
        <Star className="w-5 h-5 fill-current" />
      </div>
      <div className="absolute top-1/2 right-10 text-pink-300 opacity-50 animate-pulse">
        <Star className="w-3 h-3 fill-current" />
      </div>
    </>
  );
}

function DesertDecorations() {
  return (
    <>
      <div className="absolute top-6 right-8 text-yellow-500 opacity-60">
        <div className="w-10 h-10 rounded-full bg-current" />
      </div>
      <div className="absolute bottom-24 left-6 text-green-600 opacity-50">
        <div className="flex flex-col items-center">
          <div className="w-2 h-8 bg-current rounded-full" />
          <div className="w-6 h-2 bg-current rounded-full -mt-4" />
        </div>
      </div>
      <div className="absolute top-1/3 left-4 text-amber-700 opacity-40">
        <Mountain className="w-8 h-8" />
      </div>
    </>
  );
}

function WorldDecorations({ worldSlug }: { worldSlug: string }) {
  switch (worldSlug) {
    case "FOREST": return <ForestDecorations />;
    case "OCEAN": return <OceanDecorations />;
    case "GALAXY": return <GalaxyDecorations />;
    case "DESERT": return <DesertDecorations />;
    default: return <ForestDecorations />;
  }
}

function calculateTilePosition(index: number, total: number) {
  const tilesPerRow = 5;
  const row = Math.floor(index / tilesPerRow);
  const posInRow = index % tilesPerRow;
  const isEvenRow = row % 2 === 0;
  const xPos = isEvenRow ? posInRow : (tilesPerRow - 1 - posInRow);
  const horizontalSpacing = 100 / (tilesPerRow + 1);
  const x = (xPos + 1) * horizontalSpacing;
  const verticalSpacing = 90;
  const y = 60 + row * verticalSpacing;
  
  return { x, y, row };
}

export function JourneyMap({ childId, childName, onStartLesson }: JourneyMapProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTile, setSelectedTile] = useState<JourneyTile | null>(null);
  const [showToolUnlock, setShowToolUnlock] = useState<WorldTool | null>(null);

  const { data: journeyData, isLoading, error } = useQuery<JourneyData>({
    queryKey: ["/api/journey", childId],
    enabled: !!childId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: avatarTraitsData } = useQuery<{ traits: AvatarTraits }>({
    queryKey: ['/api/children', childId, 'avatar', 'traits'],
    enabled: !!childId,
  });
  const avatarTraits = avatarTraitsData?.traits || defaultAvatarTraits;

  const startTileMutation = useMutation({
    mutationFn: async (tileId: string) => {
      const res = await apiRequest("POST", `/api/journey/tiles/${tileId}/start`, {
        childId,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to start tile");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/journey", childId] });
      if (data.lessonInstanceId) {
        setLocation(`/child/lesson/${data.lessonInstanceId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentWorld = journeyData?.currentWorld;
  const tiles = journeyData?.tiles || [];
  const worldProgress = journeyData?.worldProgress;
  const earnedTools = journeyData?.earnedTools || [];
  const allWorlds = journeyData?.allWorlds || [];

  const theme = currentWorld ? worldThemes[currentWorld.slug] || worldThemes.FOREST : worldThemes.FOREST;
  const WorldIcon = currentWorld ? worldIcons[currentWorld.slug] || Trees : Trees;

  const tilesCompleted = worldProgress?.tilesCompleted || 0;

  const sortedTiles = useMemo(() => {
    return [...tiles].sort((a, b) => a.tileNumber - b.tileNumber);
  }, [tiles]);

  const tilePositions = useMemo(() => {
    return sortedTiles.map((tile, index) => ({
      tile,
      position: calculateTilePosition(index, sortedTiles.length),
    }));
  }, [sortedTiles]);

  const pathPoints = useMemo(() => {
    return tilePositions.map(({ position }) => ({
      x: position.x,
      y: position.y,
    }));
  }, [tilePositions]);

  const maxRow = Math.max(...tilePositions.map(t => t.position.row), 0);
  const mapHeight = 140 + maxRow * 90;

  const handleTileClick = (tile: JourneyTile) => {
    if (tile.status === "LOCKED") {
      toast({
        title: "Locked!",
        description: "Complete the previous lessons to unlock this one!",
      });
      return;
    }
    setSelectedTile(tile);
  };

  const handleStartTile = () => {
    if (selectedTile) {
      if (selectedTile.lessonInstanceId) {
        setLocation(`/child/lesson/${selectedTile.lessonInstanceId}`);
      } else {
        startTileMutation.mutate(selectedTile.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[var(--neulearn-teal)]" />
          <p className="text-lg text-muted-foreground font-child">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  if (error || !journeyData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trees className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-bold mb-2">Adventure Not Ready</h3>
          <p className="text-muted-foreground">Your journey is being prepared. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: currentWorld?.themeColor }}
          >
            <WorldIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-child" style={{ color: currentWorld?.themeColor }}>
              {currentWorld?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tilesCompleted} of {currentWorld?.tilesCount || 20} completed
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {allWorlds.map((world, index) => {
            const Icon = worldIcons[world.slug] || Trees;
            const isCurrentWorld = world.id === currentWorld?.id;
            const isCompleted = index < allWorlds.findIndex(w => w.id === currentWorld?.id);
            const isLocked = index > allWorlds.findIndex(w => w.id === currentWorld?.id);
            
            return (
              <div
                key={world.id}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCurrentWorld 
                    ? "ring-2 ring-offset-2 ring-offset-background" 
                    : isLocked 
                      ? "opacity-30" 
                      : "opacity-70"
                }`}
                style={{ 
                  backgroundColor: isCurrentWorld ? world.themeColor : isCompleted ? `${world.themeColor}80` : `${world.themeColor}30`,
                  boxShadow: isCurrentWorld ? `0 0 12px ${world.themeColor}60` : undefined,
                }}
                title={world.name}
              >
                {isLocked ? (
                  <Lock className="w-4 h-4 text-white/50" />
                ) : (
                  <Icon className="w-4 h-4 text-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card className={`overflow-hidden bg-gradient-to-br ${theme.bgGradient} border-2`} style={{ borderColor: `${currentWorld?.themeColor}40` }}>
        <CardContent className="p-0">
          <div 
            className="relative w-full overflow-hidden"
            style={{ height: `${mapHeight}px` }}
          >
            <WorldDecorations worldSlug={currentWorld?.slug || "FOREST"} />
            
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <filter id="pathGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {pathPoints.map((point, index) => {
                if (index === 0) return null;
                const prev = pathPoints[index - 1];
                const isCompleted = sortedTiles[index - 1]?.status === "COMPLETED";
                
                return (
                  <line
                    key={`path-${index}`}
                    x1={`${prev.x}%`}
                    y1={prev.y}
                    x2={`${point.x}%`}
                    y2={point.y}
                    stroke={isCompleted ? theme.accentColor : `${theme.pathColor}40`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={isCompleted ? "none" : "12 8"}
                    filter="url(#pathGlow)"
                  />
                );
              })}
            </svg>

            {tilePositions.map(({ tile, position }, index) => {
              const isCompleted = tile.status === "COMPLETED";
              const isCurrent = tile.status === "CURRENT";
              const isLocked = tile.status === "LOCKED";
              const isMilestone = tile.tileType === "MILESTONE" || (tile.tileNumber % 5 === 0);
              const hasTool = tile.rewardToolId;
              const tileColor = theme.tileColors[index % theme.tileColors.length];
              const tileSize = isMilestone ? 56 : 48;

              return (
                <motion.div
                  key={tile.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
                  className="absolute"
                  style={{
                    left: `${position.x}%`,
                    top: position.y,
                    transform: "translate(-50%, -50%)",
                    zIndex: isCurrent ? 20 : 10,
                  }}
                >
                  <button
                    onClick={() => handleTileClick(tile)}
                    disabled={isLocked}
                    className={`
                      relative rounded-full flex items-center justify-center
                      transition-all duration-300 font-bold text-white
                      ${!isLocked ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"}
                      ${isCurrent ? "animate-pulse" : ""}
                    `}
                    style={{
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: isLocked ? "#94a3b8" : tileColor,
                      boxShadow: isCurrent 
                        ? `0 0 20px ${tileColor}, 0 0 40px ${tileColor}50, inset 0 -4px 0 rgba(0,0,0,0.2)` 
                        : isCompleted
                          ? `0 4px 12px ${tileColor}60, inset 0 -4px 0 rgba(0,0,0,0.2)`
                          : `0 4px 8px rgba(0,0,0,0.2), inset 0 -4px 0 rgba(0,0,0,0.15)`,
                      border: isMilestone ? "4px solid #fbbf24" : "3px solid rgba(255,255,255,0.4)",
                    }}
                    data-testid={`tile-${tile.tileNumber}`}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="w-6 h-6 drop-shadow-md" />
                    )}
                    {isCurrent && (
                      <Play className="w-6 h-6 drop-shadow-md" />
                    )}
                    {isLocked && (
                      <span className="text-sm opacity-70">{tile.tileNumber}</span>
                    )}

                    {hasTool && !isCompleted && (
                      <motion.div 
                        className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg"
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Gift className="w-4 h-4 text-amber-800" />
                      </motion.div>
                    )}

                    {isMilestone && isCompleted && (
                      <motion.div
                        className="absolute -bottom-3"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
                      </motion.div>
                    )}
                  </button>

                  {isCurrent && (
                    <motion.div
                      className="absolute -top-8 left-1/2 -translate-x-1/2"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      <div 
                        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-xl border-2 border-white bg-white"
                      >
                        <AvatarRenderer traits={avatarTraits} size={40} />
                      </div>
                      <div 
                        className="w-3 h-3 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r-2 border-b-2 border-white"
                        style={{ backgroundColor: currentWorld?.themeColor }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            <div 
              className="absolute right-4 bottom-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
              style={{ backgroundColor: currentWorld?.themeColor }}
            >
              <Sparkles className="w-4 h-4" />
              {tilesCompleted}/{currentWorld?.tilesCount || 20}
            </div>
          </div>
        </CardContent>
      </Card>

      {earnedTools.length > 0 && (
        <Card className="overflow-visible">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" style={{ color: currentWorld?.themeColor }} />
              Collected Tools ({earnedTools.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {earnedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800"
                  title={tool.description}
                >
                  <Gem className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{tool.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {selectedTile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="overflow-visible border-2 shadow-xl" style={{ borderColor: currentWorld?.themeColor }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: currentWorld?.themeColor }}
                      >
                        Tile {selectedTile.tileNumber}
                      </span>
                      {selectedTile.status === "COMPLETED" && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold font-child">
                      {selectedTile.status === "COMPLETED" || selectedTile.lessonInstanceId
                        ? `${selectedTile.subject} Adventure`
                        : "Mystery Lesson!"
                      }
                    </h3>
                    
                    <p className="text-muted-foreground">
                      {selectedTile.status === "COMPLETED"
                        ? "You already completed this adventure!"
                        : selectedTile.lessonInstanceId
                          ? "Continue your learning journey!"
                          : "Tap the button to discover what you'll learn!"
                      }
                    </p>
                  </div>

                  {selectedTile.rewardToolId && (
                    <motion.div 
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl border-2 border-yellow-300 dark:border-yellow-700"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Gift className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        Tool Reward!
                      </span>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTile(null)}
                    className="flex-1"
                  >
                    Back to Map
                  </Button>
                  
                  {selectedTile.status !== "COMPLETED" && (
                    <Button
                      onClick={handleStartTile}
                      disabled={startTileMutation.isPending}
                      className="flex-1 text-white"
                      style={{ backgroundColor: currentWorld?.themeColor }}
                    >
                      {startTileMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Preparing...
                        </>
                      ) : selectedTile.lessonInstanceId ? (
                        <>
                          Continue
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Adventure!
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToolUnlock && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowToolUnlock(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md overflow-visible shadow-2xl">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 flex items-center justify-center shadow-xl ring-4 ring-yellow-200">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      >
                        <Gift className="w-14 h-14 text-white drop-shadow-lg" />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold font-child mb-2 bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                      New Tool Unlocked!
                    </h2>
                    <h3 className="text-xl font-semibold mb-3" style={{ color: currentWorld?.themeColor }}>
                      {showToolUnlock.name}
                    </h3>
                    <p className="text-muted-foreground mb-6">{showToolUnlock.description}</p>
                  </motion.div>
                  
                  <Button 
                    onClick={() => setShowToolUnlock(null)}
                    className="px-8 text-white"
                    style={{ backgroundColor: currentWorld?.themeColor }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Awesome!
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default JourneyMap;
