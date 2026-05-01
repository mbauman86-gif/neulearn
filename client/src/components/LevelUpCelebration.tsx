import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Sparkles, Gift, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface UnlockedItem {
  name: string;
  slug: string;
}

interface EarnedBadge {
  name: string;
  slug: string;
  xpAwarded: number;
}

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  newTitle: string;
  xpEarned: number;
  unlockedItems?: UnlockedItem[];
  badgesEarned?: EarnedBadge[];
  currentStreak?: number;
}

const confettiColors = [
  "bg-amber-400",
  "bg-orange-400", 
  "bg-rose-400",
  "bg-teal-400",
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
];

function ConfettiPiece({ delay, left }: { delay: number; left: number }) {
  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
  const size = Math.random() > 0.5 ? "w-2 h-2" : "w-3 h-1";
  
  return (
    <motion.div
      className={cn("absolute rounded-sm", color, size)}
      style={{ left: `${left}%`, top: -10 }}
      initial={{ y: -10, opacity: 1, rotate: 0 }}
      animate={{
        y: 400,
        opacity: [1, 1, 0],
        rotate: Math.random() > 0.5 ? 360 : -360,
        x: Math.random() * 100 - 50,
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        ease: "easeOut",
      }}
    />
  );
}

function LevelUpCelebration({
  isOpen,
  onClose,
  newLevel,
  newTitle,
  xpEarned,
  unlockedItems = [],
  badgesEarned = [],
  currentStreak = 0,
}: LevelUpCelebrationProps) {
  const hasRewards = unlockedItems.length > 0 || badgesEarned.length > 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-none"
        data-testid="level-up-celebration"
      >
        <div className="relative overflow-hidden">
          <AnimatePresence>
            {isOpen && (
              <>
                {[...Array(30)].map((_, i) => (
                  <ConfettiPiece key={i} delay={i * 0.05} left={Math.random() * 100} />
                ))}
              </>
            )}
          </AnimatePresence>
          
          <div className="relative z-10 p-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
              className="relative inline-block"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl mx-auto">
                <Star className="w-16 h-16 text-white fill-current" />
              </div>
              
              <motion.div
                className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className="text-lg font-bold text-white font-nunito">
                  {newLevel}
                </span>
              </motion.div>
              
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    x: Math.cos(i * 60 * Math.PI / 180) * 70 - 6,
                    y: Math.sin(i * 60 * Math.PI / 180) * 70 - 6,
                    scale: [0, 1, 0.8],
                    opacity: [0, 1, 0.6],
                  }}
                  transition={{
                    delay: 0.2 + i * 0.1,
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 space-y-2"
            >
              <h2 className="text-3xl font-bold font-nunito bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                Level Up!
              </h2>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 font-nunito">
                {newTitle}
              </p>
              
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">+{xpEarned} XP</span>
              </div>
            </motion.div>
            
            {hasRewards && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-teal-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    New Rewards!
                  </span>
                </div>
                
                <div className="space-y-2">
                  {unlockedItems.map((item) => (
                    <div 
                      key={item.slug}
                      className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>{item.name}</span>
                    </div>
                  ))}
                  
                  {badgesEarned.map((badge) => (
                    <div 
                      key={badge.slug}
                      className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>{badge.name}</span>
                      {badge.xpAwarded > 0 && (
                        <span className="text-amber-500 text-xs">+{badge.xpAwarded} XP</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {currentStreak > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 text-sm text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1"
              >
                <span className="font-bold">{currentStreak} day streak!</span> 🔥
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold shadow-lg gap-2"
                onClick={onClose}
                data-testid="button-continue-learning"
              >
                Keep Learning!
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SimpleLevelUpProps {
  level: number;
  title: string;
  onComplete: () => void;
  xpEarned?: number;
  unlockedItems?: UnlockedItem[];
  badgesEarned?: EarnedBadge[];
  currentStreak?: number;
}

export default function SimpleLevelUpCelebration({
  level,
  title,
  onComplete,
  xpEarned = 0,
  unlockedItems = [],
  badgesEarned = [],
  currentStreak = 0,
}: SimpleLevelUpProps) {
  return (
    <LevelUpCelebration
      isOpen={true}
      onClose={onComplete}
      newLevel={level}
      newTitle={title}
      xpEarned={xpEarned}
      unlockedItems={unlockedItems}
      badgesEarned={badgesEarned}
      currentStreak={currentStreak}
    />
  );
}

export { LevelUpCelebration };
