import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import readingIcon from "@assets/generated_images/reading_subject_icon.png";
import mathIcon from "@assets/generated_images/math_subject_icon.png";
import scienceIcon from "@assets/generated_images/science_subject_icon.png";
import characterIcon from "@assets/generated_images/character_subject_icon.png";

type Subject = "READING" | "MATH" | "SCIENCE" | "CHARACTER";

interface TaskCardProps {
  subject: Subject;
  title: string;
  status: "PENDING" | "COMPLETED";
  onClick: () => void;
}

const subjectConfig: Record<Subject, { icon: string; color: string; label: string }> = {
  READING: { icon: readingIcon, color: "bg-orange-100 dark:bg-orange-950", label: "Reading" },
  MATH: { icon: mathIcon, color: "bg-blue-100 dark:bg-blue-950", label: "Math" },
  SCIENCE: { icon: scienceIcon, color: "bg-green-100 dark:bg-green-950", label: "Science" },
  CHARACTER: { icon: characterIcon, color: "bg-pink-100 dark:bg-pink-950", label: "Character" },
};

export default function TaskCard({ subject, title, status, onClick }: TaskCardProps) {
  const config = subjectConfig[subject];
  const isCompleted = status === "COMPLETED";

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover-elevate active-elevate-2 font-child"
      data-testid={`card-task-${title}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
            <img src={config.icon} alt={config.label} className="w-10 h-10" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-2">{config.label}</Badge>
            <h3 className="text-xl font-semibold line-clamp-2">{title}</h3>
          </div>
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" data-testid="icon-task-complete" />
            ) : (
              <Circle className="w-8 h-8 text-muted-foreground" data-testid="icon-task-pending" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
