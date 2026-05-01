import { Progress } from "@/components/ui/progress";
import { Star, Trophy, Flame, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressionBarProps {
  level: number;
  title: string;
  currentXP: number;
  xpToNextLevel: number;
  totalXPEarned: number;
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
  showStreak?: boolean;
  className?: string;
}

export function ProgressionBar({
  level,
  title,
  currentXP,
  xpToNextLevel,
  totalXPEarned,
  currentStreak,
  longestStreak,
  compact = false,
  showStreak = true,
  className,
}: ProgressionBarProps) {
  const xpForCurrentLevel = xpToNextLevel > 0 
    ? xpToNextLevel + currentXP 
    : 100;
  const progressPercent = xpToNextLevel > 0 
    ? Math.min((currentXP / xpForCurrentLevel) * 100, 100)
    : 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)} data-testid="progression-bar-compact">
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-md">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-bold font-nunito">{level}</span>
        </div>
        
        <div className="flex-1 max-w-32">
          <Progress 
            value={progressPercent} 
            className="h-2 bg-slate-200 dark:bg-slate-700"
          />
        </div>
        
        {showStreak && currentStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold font-nunito">{currentStreak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50",
        className
      )}
      data-testid="progression-bar"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="relative"
            initial={false}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Star className="w-8 h-8 text-white fill-current" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full px-2.5 py-0.5 shadow border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-bold font-nunito text-slate-800 dark:text-white">{level}</span>
            </div>
          </motion.div>
          
          <div>
            <h3 className="text-xl font-bold font-nunito text-slate-800 dark:text-white" data-testid="text-level-title">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-inter">
              Level {level} Explorer
            </p>
          </div>
        </div>
        
        {showStreak && (
          <motion.div 
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl",
              currentStreak > 0 
                ? "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30"
                : "bg-slate-100 dark:bg-slate-800"
            )}
            animate={currentStreak > 0 ? { y: [0, -2, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flame 
              className={cn(
                "w-6 h-6",
                currentStreak > 0 
                  ? "text-orange-500 fill-current" 
                  : "text-slate-400"
              )} 
            />
            <div className="text-center">
              <div className="text-lg font-bold font-nunito text-slate-800 dark:text-white" data-testid="text-streak">
                {currentStreak}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Day Streak
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400 font-inter">XP Progress</span>
          <span className="font-bold font-nunito text-slate-800 dark:text-white">
            {currentXP} / {xpToNextLevel > 0 ? xpForCurrentLevel : "MAX"} XP
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={progressPercent} 
            className="h-4 bg-slate-200 dark:bg-slate-700"
          />
          <AnimatePresence>
            {progressPercent >= 90 && progressPercent < 100 && (
              <motion.div 
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-white"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <ArrowUp className="w-3 h-3" />
                Almost!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {xpToNextLevel > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Total: {totalXPEarned} XP earned
            </span>
            <span>{xpToNextLevel} XP to Level {level + 1}</span>
          </div>
        )}
      </div>
    </div>
  );
}
