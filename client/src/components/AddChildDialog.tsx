import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookHeart, Sparkles, Scale } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertChild } from "@shared/schema";

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddChildDialog({ open, onOpenChange }: AddChildDialogProps) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [faithMode, setFaithMode] = useState<"FAITH_FORWARD" | "FULL_DISCIPLESHIP" | "VALUES_ONLY">("FAITH_FORWARD");
  const [learningStyle, setLearningStyle] = useState<"HANDS_ON_MONTESSORI" | "BALANCED" | "DIGITAL_LIGHT">("HANDS_ON_MONTESSORI");
  const { toast } = useToast();

  const createChildMutation = useMutation({
    mutationFn: async (data: InsertChild) => {
      return apiRequest("/api/children", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children/progress-summary'] });
      toast({
        title: "Child added!",
        description: `${name} has been added to your dashboard.`,
      });
      setName("");
      setGrade("");
      setUsername("");
      setPin("");
      setFaithMode("FAITH_FORWARD");
      setLearningStyle("HANDS_ON_MONTESSORI");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add child. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChildMutation.mutate({
      name,
      grade,
      username,
      pin,
      faithMode,
      learningStyle,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Child</DialogTitle>
          <DialogDescription>
            Set up a new child profile with personalized learning preferences
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Child's Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Emma"
                required
                data-testid="input-child-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select value={grade} onValueChange={setGrade} required>
                <SelectTrigger id="grade" data-testid="select-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="K">Kindergarten</SelectItem>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="emma2024"
                required
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">4-Digit PIN</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="1234"
                required
                data-testid="input-pin"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Faith Integration Level</Label>
            <RadioGroup value={faithMode} onValueChange={(value) => setFaithMode(value as typeof faithMode)}>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate">
                  <RadioGroupItem value="FULL_DISCIPLESHIP" id="full" data-testid="radio-faith-full" />
                  <div className="flex items-start gap-3 flex-1">
                    <BookHeart className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <Label htmlFor="full" className="font-medium cursor-pointer">Full Discipleship</Label>
                      <p className="text-sm text-muted-foreground">Frequent Scripture and Jesus-centered connections</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate">
                  <RadioGroupItem value="FAITH_FORWARD" id="forward" data-testid="radio-faith-forward" />
                  <div className="flex items-start gap-3 flex-1">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <Label htmlFor="forward" className="font-medium cursor-pointer">Faith Forward</Label>
                      <p className="text-sm text-muted-foreground">Regular Scripture tie-ins, balanced approach</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate">
                  <RadioGroupItem value="VALUES_ONLY" id="values" data-testid="radio-faith-values" />
                  <div className="flex items-start gap-3 flex-1">
                    <Scale className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <Label htmlFor="values" className="font-medium cursor-pointer">Values Only</Label>
                      <p className="text-sm text-muted-foreground">Focus on Christian values with minimal Scripture</p>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Learning Style</Label>
            <RadioGroup value={learningStyle} onValueChange={(value) => setLearningStyle(value as typeof learningStyle)}>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate">
                  <RadioGroupItem value="HANDS_ON_MONTESSORI" id="montessori" data-testid="radio-style-montessori" />
                  <Label htmlFor="montessori" className="font-medium cursor-pointer flex-1">Hands-on / Montessori</Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate">
                  <RadioGroupItem value="BALANCED" id="balanced" data-testid="radio-style-balanced" />
                  <Label htmlFor="balanced" className="font-medium cursor-pointer flex-1">Balanced</Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate">
                  <RadioGroupItem value="DIGITAL_LIGHT" id="digital" data-testid="radio-style-digital" />
                  <Label htmlFor="digital" className="font-medium cursor-pointer flex-1">Digital Light</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={createChildMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createChildMutation.isPending}
              data-testid="button-save-child"
            >
              {createChildMutation.isPending ? "Saving..." : "Save Child"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
