import { BookOpen, Calculator, Heart, Sparkles, Play, CheckCircle2, Clock, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LessonInstance } from "@shared/schema";

const subjectIcons = {
  MATH: Calculator,
  READING: BookOpen,
  CHARACTER: Heart,
};

const subjectColors = {
  MATH: "var(--kid-blue)",
  READING: "var(--kid-green)",
  CHARACTER: "var(--kid-yellow)",
};

const subjectBgColors = {
  MATH: "bg-[var(--kid-blue)]/10",
  READING: "bg-[var(--kid-green)]/10",
  CHARACTER: "bg-[var(--kid-yellow)]/10",
};

const statusLabels = {
  PENDING: "Ready to Start",
  IN_PROGRESS: "Continue",
  COMPLETED: "Finished!",
};

interface AdaptiveLessonCardProps {
  lesson: LessonInstance;
  onClick: () => void;
}

export default function AdaptiveLessonCard({ lesson, onClick }: AdaptiveLessonCardProps) {
  const Icon = subjectIcons[lesson.subject as keyof typeof subjectIcons] || BookOpen;
  const color = subjectColors[lesson.subject as keyof typeof subjectColors] || "var(--neulearn-teal)";
  const bgColor = subjectBgColors[lesson.subject as keyof typeof subjectBgColors] || "bg-muted";
  const isCompleted = lesson.status === "COMPLETED";
  const isInProgress = lesson.status === "IN_PROGRESS";
  
  return (
    <Card 
      className={`overflow-visible hover-elevate active-elevate-2 cursor-pointer ${
        isCompleted ? "opacity-75" : ""
      }`}
      onClick={onClick}
      data-testid={`lesson-card-${lesson.id}`}
    >
      <div className="p-5 flex items-center gap-4">
        <div 
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bgColor}`}
          style={{ borderColor: color, borderWidth: 2 }}
        >
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span 
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color }}
            >
              {lesson.subject}
            </span>
            {lesson.difficultyUsed && (
              <span className="text-xs text-muted-foreground">
                {lesson.difficultyUsed.charAt(0).toUpperCase() + lesson.difficultyUsed.slice(1)}
              </span>
            )}
            {lesson.parentLessonId && (
              <Badge variant="outline" className="text-xs py-0 px-1.5 gap-1 text-[var(--kid-orange)] border-[var(--kid-orange)]">
                <Gift className="w-3 h-3" />
                From Parent
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground truncate">
            {lesson.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {lesson.objective}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm font-semibold">Done!</span>
            </div>
          ) : (
            <Button
              size="lg"
              className={`h-12 px-6 rounded-xl font-bold text-white ${
                isInProgress 
                  ? "bg-[var(--kid-orange)] hover:bg-[var(--kid-orange)]/90" 
                  : "bg-[var(--neulearn-teal)] hover:bg-[var(--neulearn-teal)]/90"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              data-testid={`button-start-lesson-${lesson.id}`}
            >
              {isInProgress ? (
                <>
                  <Clock className="w-5 h-5 mr-2" />
                  Continue
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>
          )}
          
          {lesson.pointsEarned && lesson.pointsEarned > 0 && (
            <div className="flex items-center gap-1 text-[var(--kid-yellow)]">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">+{lesson.pointsEarned} pts</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
