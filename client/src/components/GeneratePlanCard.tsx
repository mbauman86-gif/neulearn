import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays } from "lucide-react";

interface GeneratePlanCardProps {
  onGenerateDaily: () => void;
  onGenerateWeekly: () => void;
  isGenerating?: boolean;
}

export default function GeneratePlanCard({
  onGenerateDaily,
  onGenerateWeekly,
  isGenerating = false,
}: GeneratePlanCardProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="hover-elevate">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Daily Plan</CardTitle>
          <CardDescription>
            Generate today's lessons and activities tailored to your child's needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onGenerateDaily}
            disabled={isGenerating}
            className="w-full"
            size="lg"
            data-testid="button-generate-daily"
          >
            {isGenerating ? "Generating..." : "Generate Today's Plan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Weekly Plan</CardTitle>
          <CardDescription>
            Generate a full week of structured learning activities and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onGenerateWeekly}
            disabled={isGenerating}
            className="w-full"
            size="lg"
            data-testid="button-generate-weekly"
          >
            {isGenerating ? "Generating..." : "Generate This Week's Plan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
