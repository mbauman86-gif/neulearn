import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Heart, Sparkles, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Devotional } from "@shared/schema";

interface Props {
  childId: string;
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DailyDevotionalCard({ childId }: Props) {
  const [showMore, setShowMore] = useState(false);
  const [currentDate, setCurrentDate] = useState(getCurrentDate);
  
  // Check for date change every minute to handle midnight rollover
  useEffect(() => {
    const checkDate = () => {
      const newDate = getCurrentDate();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
      }
    };
    
    const interval = setInterval(checkDate, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  const { data: devotional, isLoading, error } = useQuery<Devotional>({
    queryKey: ['devotional', childId, currentDate],
    queryFn: async () => {
      const res = await fetch(`/api/children/${childId}/devotional`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch devotional');
      return res.json();
    },
    enabled: !!childId,
    staleTime: 1000 * 60 * 60, // 1 hour stale time
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-800 animate-pulse" />
            <div className="h-8 w-48 bg-amber-200 dark:bg-amber-800 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-amber-200 dark:bg-amber-800 rounded animate-pulse" />
            <div className="h-4 bg-amber-200 dark:bg-amber-800 rounded w-3/4 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !devotional) {
    return null;
  }

  return (
    <>
      <Card 
        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 overflow-hidden"
        data-testid="card-daily-devotional"
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Today's Devotional</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-devotional-title">
                {devotional.title}
              </h3>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 mb-4 border border-amber-200/50 dark:border-amber-700/50">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1" data-testid="text-scripture-reference">
              {devotional.scriptureReference}
            </p>
            <p className="text-lg md:text-xl font-medium italic text-foreground leading-relaxed" data-testid="text-scripture-text">
              "{devotional.scriptureText}"
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-base md:text-lg text-foreground leading-relaxed" data-testid="text-devotional-explanation">
              {devotional.explanation}
            </p>

            <div className="flex items-start gap-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl p-4">
              <Heart className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-base md:text-lg text-foreground" data-testid="text-devotional-reflection">
                {devotional.reflection}
              </p>
            </div>
          </div>

          {(devotional.prayerPrompt || devotional.deeperContext) && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full mt-4 h-14 text-lg font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              onClick={() => setShowMore(true)}
              data-testid="button-learn-more"
            >
              <span>Learn More</span>
              <ChevronDown className="w-5 h-5 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showMore} onOpenChange={setShowMore}>
        <DialogContent className="max-w-lg font-child">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-amber-500" />
              {devotional.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
                {devotional.scriptureReference}
              </p>
              <p className="text-lg italic text-foreground">
                "{devotional.scriptureText}"
              </p>
            </div>

            {devotional.prayerPrompt && (
              <div className="space-y-2">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-2xl">🙏</span>
                  Let's Pray
                </h4>
                <p className="text-base text-foreground bg-muted/50 rounded-xl p-4" data-testid="text-prayer-prompt">
                  {devotional.prayerPrompt}
                </p>
              </div>
            )}

            {devotional.deeperContext && (
              <div className="space-y-2">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Dig Deeper
                </h4>
                <p className="text-base text-foreground bg-muted/50 rounded-xl p-4" data-testid="text-deeper-context">
                  {devotional.deeperContext}
                </p>
              </div>
            )}
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            onClick={() => setShowMore(false)}
            data-testid="button-close-devotional"
          >
            Got It!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
