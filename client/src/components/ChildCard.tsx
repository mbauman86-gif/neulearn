import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Settings, TrendingUp, Eye, Plus } from "lucide-react";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import type { AvatarTraits } from "@shared/schema";
import { defaultAvatarTraits } from "@shared/schema";

interface ChildCardProps {
  name: string;
  grade: "K" | "1" | "2" | "3" | "4" | "5";
  completionPercent: number;
  points: number;
  avatarTraits?: AvatarTraits | null;
  onViewPlans: () => void;
  onEditChild: () => void;
  onViewAsChild?: () => void;
  onCreateLesson?: () => void;
}

export default function ChildCard({
  name,
  grade,
  completionPercent,
  points,
  avatarTraits,
  onViewPlans,
  onEditChild,
  onViewAsChild,
  onCreateLesson,
}: ChildCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const traits = avatarTraits || defaultAvatarTraits;

  return (
    <Card className="hover-elevate">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
            <AvatarRenderer traits={traits} size={64} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-lg font-semibold truncate" data-testid={`text-child-name-${name}`}>{name}</h3>
                <Badge variant="secondary" className="mt-1">Grade {grade}</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditChild}
                data-testid={`button-edit-child-${name}`}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Today:</span>
                <span className="font-medium" data-testid={`text-completion-${name}`}>{completionPercent}% complete</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Points:</span>
                <span className="font-medium" data-testid={`text-points-${name}`}>{points}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                <Button
                  onClick={onViewPlans}
                  className="flex-1"
                  data-testid={`button-view-plans-${name}`}
                >
                  View Plans
                </Button>
                {onViewAsChild && (
                  <Button
                    onClick={onViewAsChild}
                    variant="outline"
                    className="flex-1"
                    data-testid={`button-view-as-child-${name}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View as Child
                  </Button>
                )}
              </div>
              {onCreateLesson && (
                <Button
                  onClick={onCreateLesson}
                  variant="secondary"
                  className="w-full"
                  data-testid={`button-create-lesson-${name}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lesson
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
