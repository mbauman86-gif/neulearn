import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calculator,
  Heart,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProgressionContext {
  childId: string;
  grade: string;
  currentStrands: {
    strandId: string;
    strandName: string;
    subject: string;
    progressPercent: number;
    currentSkillId?: string;
  }[];
  readySkills: {
    id: string;
    name: string;
    subject: string;
    masteryLevel: string;
  }[];
  needsReviewSkills: {
    id: string;
    name: string;
    subject: string;
    masteryLevel: string;
  }[];
  yearGoalProgress: {
    goalTitle: string;
    subject: string;
    progressPercent: number;
    skillsRemaining: number;
  }[];
}

interface CurriculumProgressWidgetProps {
  childId: string;
  childName: string;
  grade: string;
}

const subjectIcons: Record<string, typeof BookOpen> = {
  READING: BookOpen,
  MATH: Calculator,
  CHARACTER: Heart,
};

const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
  READING: { 
    bg: "bg-blue-500/10", 
    text: "text-blue-600 dark:text-blue-400", 
    border: "border-blue-200 dark:border-blue-800" 
  },
  MATH: { 
    bg: "bg-green-500/10", 
    text: "text-green-600 dark:text-green-400", 
    border: "border-green-200 dark:border-green-800" 
  },
  CHARACTER: { 
    bg: "bg-amber-500/10", 
    text: "text-amber-600 dark:text-amber-400", 
    border: "border-amber-200 dark:border-amber-800" 
  },
};

export default function CurriculumProgressWidget({ childId, childName, grade }: CurriculumProgressWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: context, isLoading, error } = useQuery<ProgressionContext>({
    queryKey: ['/api/curriculum/progression', childId],
    enabled: !!childId,
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !context) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            {childName}'s Grade {grade} Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Year-end goal tracking will appear once lessons are completed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = context.yearGoalProgress.length > 0
    ? Math.round(context.yearGoalProgress.reduce((sum, g) => sum + g.progressPercent, 0) / context.yearGoalProgress.length)
    : 0;

  const hasNeedsReview = context.needsReviewSkills.length > 0;

  return (
    <Card data-testid={`card-curriculum-progress-${childId}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Grade {grade} Year-End Goals
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-testid={`button-expand-curriculum-${childId}`}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {hasNeedsReview && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">
                <AlertCircle className="w-4 h-4" />
                Skills Needing Review
              </div>
              <div className="flex flex-wrap gap-1">
                {context.needsReviewSkills.slice(0, 3).map(skill => (
                  <Badge 
                    key={skill.id} 
                    variant="outline" 
                    className="text-xs border-orange-200 dark:border-orange-800"
                  >
                    {skill.name.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {context.needsReviewSkills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{context.needsReviewSkills.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <CollapsibleContent>
            <div className="space-y-4 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Year-End Goals by Subject</h4>
              
              {context.yearGoalProgress.map((goal, i) => {
                const Icon = subjectIcons[goal.subject] || Target;
                const colors = subjectColors[goal.subject] || subjectColors.CHARACTER;
                const isComplete = goal.progressPercent >= 100;

                return (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Icon className={`w-4 h-4 mt-0.5 ${colors.text}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${colors.text}`}>
                            {goal.subject}
                          </span>
                          {isComplete && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {goal.goalTitle}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {isComplete ? "Complete!" : `${goal.skillsRemaining} skills remaining`}
                        </span>
                        <span className="font-medium">{goal.progressPercent}%</span>
                      </div>
                      <Progress 
                        value={goal.progressPercent} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                );
              })}

              {context.currentStrands.length > 0 && (
                <>
                  <h4 className="text-sm font-medium text-muted-foreground mt-4">Current Learning Focus</h4>
                  <div className="flex flex-wrap gap-2">
                    {context.currentStrands.map(strand => {
                      const Icon = subjectIcons[strand.subject] || Target;
                      const colors = subjectColors[strand.subject] || subjectColors.CHARACTER;
                      
                      return (
                        <div 
                          key={strand.strandId}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${colors.bg} ${colors.text} ${colors.border} border`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{strand.strandName.replace(/_/g, ' ')}</span>
                          <span className="opacity-60">({strand.progressPercent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {context.readySkills.length > 0 && (
                <>
                  <h4 className="text-sm font-medium text-muted-foreground mt-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Ready to Learn
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {context.readySkills
                      .filter(s => s.masteryLevel === "NOT_STARTED")
                      .slice(0, 5)
                      .map(skill => {
                        const colors = subjectColors[skill.subject] || subjectColors.CHARACTER;
                        return (
                          <Badge 
                            key={skill.id} 
                            variant="outline"
                            className={`text-xs ${colors.border}`}
                          >
                            {skill.name.replace(/_/g, ' ')}
                          </Badge>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
