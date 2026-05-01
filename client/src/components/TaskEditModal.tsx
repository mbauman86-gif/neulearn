import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, FileText, BookOpen, Heart, StickyNote, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";

const editTaskFormSchema = z.object({
  objective: z.string().min(1, "Learning objective is required"),
  instructionsForChild: z.string().min(1, "Instructions for child are required"),
  instructionsForParent: z.string().optional().nullable(),
  materialsNeeded: z.string().optional(),
  scriptureReference: z.string().optional().nullable(),
  scriptureText: z.string().optional().nullable(),
  parentNotes: z.string().optional().nullable(),
});

type EditTaskFormData = z.infer<typeof editTaskFormSchema>;

interface TaskEditModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
}

const subjectColors: Record<string, string> = {
  READING: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  MATH: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  SCIENCE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  CHARACTER: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
};

export default function TaskEditModal({ task, open, onOpenChange, childId }: TaskEditModalProps) {
  const { toast } = useToast();

  const form = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: {
      objective: "",
      instructionsForChild: "",
      instructionsForParent: "",
      materialsNeeded: "",
      scriptureReference: "",
      scriptureText: "",
      parentNotes: "",
    },
  });

  useEffect(() => {
    if (task && open) {
      form.reset({
        objective: task.objective || "",
        instructionsForChild: task.instructionsForChild || "",
        instructionsForParent: task.instructionsForParent || "",
        materialsNeeded: task.materialsNeeded?.join(", ") || "",
        scriptureReference: task.scriptureReference || "",
        scriptureText: task.scriptureText || "",
        parentNotes: task.parentNotes || "",
      });
    }
  }, [task, open, form]);

  const updateTaskMutation = useMutation({
    mutationFn: async (data: EditTaskFormData) => {
      const payload = {
        objective: data.objective,
        instructionsForChild: data.instructionsForChild,
        instructionsForParent: data.instructionsForParent || null,
        materialsNeeded: data.materialsNeeded 
          ? data.materialsNeeded.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        scriptureReference: data.scriptureReference || null,
        scriptureText: data.scriptureText || null,
        parentNotes: data.parentNotes || null,
      };
      return apiRequest(`/api/tasks/${task?.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'tasks'] });
      toast({
        title: "Task updated",
        description: "Your changes have been saved.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditTaskFormData) => {
    updateTaskMutation.mutate(data);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Edit Lesson</span>
            <Badge className={subjectColors[task.subject]}>{task.subject}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {task.activityType} • {new Date(task.date).toLocaleDateString()}
                </p>
              </div>

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Learning Objective
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What should the child learn from this lesson?"
                        className="min-h-[80px]"
                        data-testid="input-task-objective"
                      />
                    </FormControl>
                    <FormDescription>
                      The main goal of this lesson - what your child should understand or be able to do after completing it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="instructionsForChild"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Instructions for Child
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Instructions the child will follow..."
                        className="min-h-[100px]"
                        data-testid="input-child-instructions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructionsForParent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-500" />
                      Instructions for Parent (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Guidance for you when teaching this lesson..."
                        className="min-h-[80px]"
                        data-testid="input-parent-instructions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialsNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      Materials Needed
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Crayons, paper, scissors (comma separated)"
                        data-testid="input-materials"
                      />
                    </FormControl>
                    <FormDescription>
                      List materials separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-4 p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Faith Integration (Optional)
                </h4>

                <FormField
                  control={form.control}
                  name="scriptureReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scripture Reference</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g., Proverbs 3:5-6"
                          data-testid="input-scripture-reference"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scriptureText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scripture Text</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="The verse text..."
                          className="min-h-[60px]"
                          data-testid="input-scripture-text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <FormField
                  control={form.control}
                  name="parentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-amber-600" />
                        Your Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Add your observations about this lesson... How did it go? What worked well? What would you change next time?"
                          className="min-h-[100px] bg-white dark:bg-background"
                          data-testid="input-parent-notes"
                        />
                      </FormControl>
                      <FormDescription>
                        These notes will help personalize future lessons. They're only visible to you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateTaskMutation.isPending}
            data-testid="button-save-task"
          >
            {updateTaskMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
