import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Calculator, 
  Microscope, 
  Heart,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MasterySnapshot {
  childId: string;
  childName: string;
  subjectMastery: {
    subject: string;
    mastered: number;
    developing: number;
    emerging: number;
    totalSkills: number;
    skillsNeedingReinforcement: string[];
  }[];
  strugglingAreas: string[];
  readyToAdvance: string[];
  recentOutcomes: {
    taskTitle: string;
    subject: string;
    wasSuccessful: boolean;
    parentFeedback?: string;
  }[];
}

interface SkillMasteryWidgetProps {
  childId: string;
  childName: string;
}

const subjectIcons: Record<string, typeof BookOpen> = {
  READING: BookOpen,
  MATH: Calculator,
  SCIENCE: Microscope,
  CHARACTER: Heart,
};

const subjectColors: Record<string, string> = {
  READING: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800",
  MATH: "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800",
  SCIENCE: "bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-800",
  CHARACTER: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
};

export default function SkillMasteryWidget({ childId, childName }: SkillMasteryWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: mastery, isLoading, error } = useQuery<MasterySnapshot>({
    queryKey: ['/api/children', childId, 'mastery'],
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

  if (error || !mastery) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {childName}'s Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No learning data yet. Complete some lessons to track skill mastery.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasStrugglingAreas = mastery.strugglingAreas.length > 0;
  const hasReadyToAdvance = mastery.readyToAdvance.length > 0;

  return (
    <Card data-testid={`card-mastery-${childId}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {childName}'s Learning Progress
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-expand-mastery-${childId}`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStrugglingAreas && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Needs Extra Support
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {mastery.strugglingAreas.slice(0, 2).join(', ')}
                {mastery.strugglingAreas.length > 2 && ` +${mastery.strugglingAreas.length - 2} more`}
              </p>
            </div>
          </div>
        )}

        {hasReadyToAdvance && !hasStrugglingAreas && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-200 dark:bg-green-500/10 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Ready for New Skills
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {mastery.readyToAdvance.slice(0, 2).join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {mastery.subjectMastery.map((subject) => {
            const Icon = subjectIcons[subject.subject] || BookOpen;
            const masteryPercent = subject.totalSkills > 0 
              ? Math.round((subject.mastered / subject.totalSkills) * 100)
              : 0;
            const progressPercent = subject.totalSkills > 0
              ? Math.round(((subject.mastered + subject.developing * 0.5) / subject.totalSkills) * 100)
              : 0;

            return (
              <div
                key={subject.subject}
                className={`p-3 rounded-lg border ${subjectColors[subject.subject] || 'bg-muted'}`}
                data-testid={`subject-mastery-${subject.subject.toLowerCase()}-${childId}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">
                    {subject.subject.toLowerCase()}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2 mb-1" />
                <div className="flex justify-between text-xs">
                  <span>{subject.mastered} mastered</span>
                  <span>{subject.developing} learning</span>
                </div>
              </div>
            );
          })}
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            {mastery.strugglingAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Skills Needing Reinforcement
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mastery.strugglingAreas.map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {mastery.readyToAdvance.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Ready to Learn
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mastery.readyToAdvance.map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-green-500/10 border-green-300 text-green-700 dark:text-green-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {mastery.recentOutcomes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {mastery.recentOutcomes.slice(0, 5).map((outcome, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-sm"
                      data-testid={`recent-outcome-${idx}`}
                    >
                      <span className="text-muted-foreground truncate max-w-[70%]">
                        {outcome.taskTitle}
                      </span>
                      {outcome.wasSuccessful ? (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {outcome.parentFeedback || 'Needs Practice'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Subject Details</h4>
              <div className="space-y-2">
                {mastery.subjectMastery.map((subject) => (
                  <div key={subject.subject} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">{subject.subject.toLowerCase()}</span>
                      <span className="text-muted-foreground">
                        {subject.mastered}/{subject.totalSkills} skills mastered
                      </span>
                    </div>
                    {subject.skillsNeedingReinforcement.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Reinforce: {subject.skillsNeedingReinforcement.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
