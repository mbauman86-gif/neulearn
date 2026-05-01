import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, Calculator, Heart, Loader2, Sparkles } from "lucide-react";

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
}

const SUBJECTS = [
  { value: "READING", label: "Reading", icon: BookOpen, color: "text-blue-500" },
  { value: "MATH", label: "Math", icon: Calculator, color: "text-green-500" },
  { value: "CHARACTER", label: "Character", icon: Heart, color: "text-pink-500" },
];

const MODES = [
  { value: "hands_on", label: "Hands-On Activities" },
  { value: "visual", label: "Visual Learning" },
  { value: "story", label: "Story-Based" },
];

const SESSION_LENGTHS = [
  { value: "5", label: "5 minutes (Quick)" },
  { value: "10", label: "10 minutes (Standard)" },
  { value: "15", label: "15 minutes (Extended)" },
  { value: "20", label: "20 minutes (Deep Dive)" },
];

export default function CreateLessonDialog({
  open,
  onOpenChange,
  childId,
  childName,
}: CreateLessonDialogProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState<string>("");
  const [parentNotes, setParentNotes] = useState("");
  const [preferredMode, setPreferredMode] = useState<string>("");
  const [sessionLength, setSessionLength] = useState("10");

  const createLessonMutation = useMutation({
    mutationFn: async (data: {
      childId: string;
      subject: string;
      parentNotes?: string;
      preferredMode?: string;
      sessionLengthMinutes?: number;
    }) => {
      const res = await apiRequest("POST", "/api/parent/lessons", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.lessonInstance) {
        toast({
          title: "Lesson Created!",
          description: `${childName}'s lesson is ready to go.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/adaptive/lessons/all", childId] });
        queryClient.invalidateQueries({ queryKey: ["/api/parent/lessons", childId] });
        onOpenChange(false);
        resetForm();
      } else if (data.error) {
        toast({
          title: "Lesson Queued",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lesson",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSubject("");
    setParentNotes("");
    setPreferredMode("");
    setSessionLength("10");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      toast({
        title: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    createLessonMutation.mutate({
      childId,
      subject,
      parentNotes: parentNotes || undefined,
      preferredMode: preferredMode || undefined,
      sessionLengthMinutes: parseInt(sessionLength),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create a Lesson for {childName}
          </DialogTitle>
          <DialogDescription>
            Tell us what you'd like {childName} to learn, and we'll create a personalized lesson.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Subject *</Label>
            <div className="grid grid-cols-3 gap-3">
              {SUBJECTS.map((s) => {
                const Icon = s.icon;
                const isSelected = subject === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSubject(s.value)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-muted hover:border-primary/50"
                      }
                    `}
                    data-testid={`button-subject-${s.value.toLowerCase()}`}
                  >
                    <Icon className={`w-8 h-8 ${s.color}`} />
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentNotes">What would you like the lesson to focus on?</Label>
            <Textarea
              id="parentNotes"
              value={parentNotes}
              onChange={(e) => setParentNotes(e.target.value)}
              placeholder="e.g., Practice counting to 20, Learn the letter 'B' sound, Talk about sharing with siblings..."
              className="min-h-[100px]"
              data-testid="input-parent-notes"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add specific topics, skills, or interests to personalize the lesson.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Learning Style</Label>
              <Select value={preferredMode} onValueChange={setPreferredMode}>
                <SelectTrigger data-testid="select-learning-mode">
                  <SelectValue placeholder="Any style" />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Session Length</Label>
              <Select value={sessionLength} onValueChange={setSessionLength}>
                <SelectTrigger data-testid="select-session-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_LENGTHS.map((len) => (
                    <SelectItem key={len.value} value={len.value}>
                      {len.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createLessonMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!subject || createLessonMutation.isPending}
              data-testid="button-submit-lesson"
            >
              {createLessonMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Lesson
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
