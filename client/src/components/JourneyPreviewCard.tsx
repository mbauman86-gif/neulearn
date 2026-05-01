import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, BookOpen, Calculator, Heart, MapPin, Target, Sparkles } from "lucide-react";
import { useState } from "react";

interface JourneyPreview {
  childId: string;
  hasJourney: boolean;
  currentWorld?: {
    name: string;
    slug: string;
    themeColor: string;
  };
  currentTile?: {
    tileNumber: number;
    totalTiles: number;
    subject: string;
    status: string;
  };
  currentLesson?: {
    id: string;
    title: string;
    goal: string | null;
    objective: string;
    subject: string;
    targetSkillName: string;
    faithIntegration?: {
      scripture?: string;
      tieIn?: string;
    } | null;
    status: string;
  };
  upcomingTiles: Array<{
    tileNumber: number;
    subject: string;
  }>;
  progress: {
    tilesCompleted: number;
    totalTiles: number;
    percentComplete: number;
  };
}

interface JourneyPreviewCardProps {
  childId: string;
  childName: string;
}

const subjectIcons: Record<string, typeof BookOpen> = {
  READING: BookOpen,
  MATH: Calculator,
  CHARACTER: Heart,
};

const subjectLabels: Record<string, string> = {
  READING: "Reading",
  MATH: "Math",
  CHARACTER: "Character",
};

const subjectColors: Record<string, string> = {
  READING: "bg-[var(--kid-blue)]/10 text-[var(--kid-blue)] border-[var(--kid-blue)]/30 dark:bg-[var(--kid-blue)]/20 dark:text-[var(--kid-blue)] dark:border-[var(--kid-blue)]/40",
  MATH: "bg-[var(--neulearn-teal)]/10 text-[var(--neulearn-teal)] border-[var(--neulearn-teal)]/30 dark:bg-[var(--neulearn-teal)]/20 dark:text-[var(--neulearn-teal)] dark:border-[var(--neulearn-teal)]/40",
  CHARACTER: "bg-[var(--neulearn-orange-mid)]/10 text-[var(--neulearn-orange-mid)] border-[var(--neulearn-orange-mid)]/30 dark:bg-[var(--neulearn-orange-mid)]/20 dark:text-[var(--neulearn-orange-mid)] dark:border-[var(--neulearn-orange-mid)]/40",
};

export default function JourneyPreviewCard({ childId, childName }: JourneyPreviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: preview, isLoading } = useQuery<JourneyPreview>({
    queryKey: ['/api/parent/children', childId, 'journey-preview'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!preview || !preview.hasJourney) {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {childName}'s Journey
          </CardTitle>
          <CardDescription>
            Journey will start when {childName} begins their first lesson
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const SubjectIcon = preview.currentTile 
    ? subjectIcons[preview.currentTile.subject] || BookOpen
    : BookOpen;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover-elevate rounded-t-xl" data-testid={`journey-preview-${childId}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--neulearn-teal)]" />
                <CardTitle className="text-base">{childName}'s Journey</CardTitle>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {preview.currentWorld && (
                <Badge variant="outline" className="text-xs">
                  {preview.currentWorld.name}
                </Badge>
              )}
              {preview.currentTile && (
                <span className="text-xs text-muted-foreground">
                  Tile {preview.currentTile.tileNumber} of {preview.currentTile.totalTiles}
                </span>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>World Progress</span>
                <span>{preview.progress.percentComplete}%</span>
              </div>
              <Progress value={preview.progress.percentComplete} className="h-2" />
            </div>

            <CollapsibleContent className="space-y-4">
              {preview.currentTile && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[var(--neulearn-teal)]" />
                    <span className="text-sm font-medium">Current Lesson</span>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${subjectColors[preview.currentTile.subject]} border`}>
                        <SubjectIcon className="w-3 h-3 mr-1" />
                        {subjectLabels[preview.currentTile.subject] || preview.currentTile.subject}
                      </Badge>
                      {preview.currentLesson && (
                        <Badge variant="outline" className="text-xs">
                          {preview.currentLesson.status === "READY" ? "Not started" : 
                           preview.currentLesson.status === "IN_PROGRESS" ? "In progress" : 
                           preview.currentLesson.status}
                        </Badge>
                      )}
                    </div>

                    {preview.currentLesson ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{preview.currentLesson.title}</p>
                        {preview.currentLesson.goal && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Goal:</span> {preview.currentLesson.goal}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Skill:</span> {preview.currentLesson.targetSkillName}
                        </div>
                        {preview.currentLesson.faithIntegration?.scripture && (
                          <div className="text-xs text-muted-foreground italic border-l-2 border-[var(--neulearn-teal)] pl-2">
                            {preview.currentLesson.faithIntegration.scripture}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Lesson will be generated when {childName} starts this tile
                      </p>
                    )}
                  </div>
                </div>
              )}

              {preview.upcomingTiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Coming Up</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preview.upcomingTiles.map((tile) => {
                      const TileIcon = subjectIcons[tile.subject] || BookOpen;
                      return (
                        <Badge 
                          key={tile.tileNumber}
                          variant="outline"
                          className={`${subjectColors[tile.subject]} border text-xs`}
                        >
                          <TileIcon className="w-3 h-3 mr-1" />
                          Tile {tile.tileNumber}: {subjectLabels[tile.subject] || tile.subject}
                        </Badge>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subjects are assigned but lesson content is generated when {childName} reaches each tile
                  </p>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
