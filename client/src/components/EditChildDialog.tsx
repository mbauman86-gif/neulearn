import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Loader2, Camera, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Child, ChildSettings } from "@shared/schema";

interface ChildWithSettings extends Child {
  settings?: ChildSettings;
  rewardState?: { points: number; badges: string[] };
}

interface EditChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ChildWithSettings;
}

const editChildFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  grade: z.enum(["K", "1", "2", "3", "4", "5"]),
  username: z.string().min(3, "Username must be at least 3 characters"),
  pin: z.string().optional().refine((val) => !val || /^\d{4}$/.test(val), {
    message: "PIN must be 4 digits",
  }),
  faithMode: z.enum(["FULL_DISCIPLESHIP", "FAITH_FORWARD", "VALUES_ONLY"]),
  learningStyle: z.enum(["HANDS_ON_MONTESSORI", "BALANCED", "DIGITAL_LIGHT"]),
  avatarUrl: z.string().nullable().optional(),
  dyslexiaSupport: z.boolean(),
  devotionalCadence: z.enum(["daily", "weekly"]),
  readingStage: z.enum(["pre_reader", "emerging", "fluent_for_grade"]).optional(),
  mathStage: z.enum(["within_5", "within_10", "within_20"]).optional(),
  preferredMode: z.enum(["hands_on", "visual", "story"]).optional(),
  sessionLengthMinutes: z.number().min(5).max(30).optional(),
});

type EditChildFormData = z.infer<typeof editChildFormSchema>;

export function EditChildDialog({
  open,
  onOpenChange,
  child,
}: EditChildDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(child.avatarUrl || null);

  const form = useForm<EditChildFormData>({
    resolver: zodResolver(editChildFormSchema),
    defaultValues: {
      name: child.name,
      grade: child.grade as "K" | "1" | "2",
      username: child.username,
      pin: "",
      faithMode: (child.settings?.faithMode || "FAITH_FORWARD") as EditChildFormData["faithMode"],
      learningStyle: (child.settings?.learningStyle || "HANDS_ON_MONTESSORI") as EditChildFormData["learningStyle"],
      avatarUrl: child.avatarUrl || null,
      dyslexiaSupport: child.settings?.dyslexiaSupport || false,
      devotionalCadence: (child.settings?.devotionalCadence || "daily") as EditChildFormData["devotionalCadence"],
      readingStage: (child.settings?.readingStage || "pre_reader") as EditChildFormData["readingStage"],
      mathStage: (child.settings?.mathStage || "within_5") as EditChildFormData["mathStage"],
      preferredMode: ((child.settings?.preferredModes as string[] | null)?.[0] || "hands_on") as EditChildFormData["preferredMode"],
      sessionLengthMinutes: child.settings?.sessionLengthMinutes || 10,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: child.name,
        grade: child.grade as "K" | "1" | "2",
        username: child.username,
        pin: "",
        faithMode: (child.settings?.faithMode || "FAITH_FORWARD") as EditChildFormData["faithMode"],
        learningStyle: (child.settings?.learningStyle || "HANDS_ON_MONTESSORI") as EditChildFormData["learningStyle"],
        avatarUrl: child.avatarUrl || null,
        dyslexiaSupport: child.settings?.dyslexiaSupport || false,
        devotionalCadence: (child.settings?.devotionalCadence || "daily") as EditChildFormData["devotionalCadence"],
        readingStage: (child.settings?.readingStage || "pre_reader") as EditChildFormData["readingStage"],
        mathStage: (child.settings?.mathStage || "within_5") as EditChildFormData["mathStage"],
        preferredMode: ((child.settings?.preferredModes as string[] | null)?.[0] || "hands_on") as EditChildFormData["preferredMode"],
        sessionLengthMinutes: child.settings?.sessionLengthMinutes || 10,
      });
      setPreviewUrl(child.avatarUrl || null);
    }
  }, [open, child, form]);

  const updateChildMutation = useMutation({
    mutationFn: async (data: EditChildFormData) => {
      const payload: any = {};
      if (data.name !== child.name) payload.name = data.name;
      if (data.grade !== child.grade) payload.grade = data.grade;
      if (data.username !== child.username) payload.username = data.username;
      if (data.pin && data.pin.length === 4) payload.pin = data.pin;
      if (data.avatarUrl !== child.avatarUrl) payload.avatarUrl = data.avatarUrl;
      if (data.faithMode !== child.settings?.faithMode) payload.faithMode = data.faithMode;
      if (data.learningStyle !== child.settings?.learningStyle) payload.learningStyle = data.learningStyle;
      if (data.dyslexiaSupport !== child.settings?.dyslexiaSupport) payload.dyslexiaSupport = data.dyslexiaSupport;
      if (data.devotionalCadence !== child.settings?.devotionalCadence) payload.devotionalCadence = data.devotionalCadence;
      if (data.readingStage !== child.settings?.readingStage) payload.readingStage = data.readingStage;
      if (data.mathStage !== child.settings?.mathStage) payload.mathStage = data.mathStage;
      const currentMode = (child.settings?.preferredModes as string[] | null)?.[0];
      if (data.preferredMode !== currentMode) payload.preferredModes = [data.preferredMode];
      if (data.sessionLengthMinutes !== child.settings?.sessionLengthMinutes) payload.sessionLengthMinutes = data.sessionLengthMinutes;

      if (Object.keys(payload).length === 0) {
        return child;
      }

      return apiRequest("PATCH", `/api/children/${child.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Profile Updated",
        description: `${child.name}'s profile has been saved.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please choose an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await apiRequest("POST", `/api/children/${child.id}/avatar/upload-url`);
      const data = await response.json() as { uploadUrl: string; avatarPath: string };
      const { uploadUrl, avatarPath } = data;

      if (!uploadUrl || !avatarPath) {
        throw new Error("No upload URL received");
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
        mode: "cors",
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => "Unknown error");
        console.error("Upload failed:", uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Use the normalized avatarPath from the server response
      form.setValue("avatarUrl", avatarPath);
      setPreviewUrl(URL.createObjectURL(file));

      toast({
        title: "Photo Uploaded",
        description: "Click Save to keep this photo.",
      });
    } catch (error: any) {
      console.error("Upload error:", error?.message || error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Could not upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: EditChildFormData) => {
    updateChildMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form id="edit-child-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto flex-1 pr-2">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt={child.name} />
                  ) : null}
                  <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                    {getInitials(form.watch("name"))}
                  </AvatarFallback>
                </Avatar>
                <label
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover-elevate"
                  data-testid="button-upload-avatar"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                    data-testid="input-avatar-upload"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-child-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-grade">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="K">Kindergarten</SelectItem>
                        <SelectItem value="1">1st Grade</SelectItem>
                        <SelectItem value="2">2nd Grade</SelectItem>
                        <SelectItem value="3">3rd Grade</SelectItem>
                        <SelectItem value="4">4th Grade</SelectItem>
                        <SelectItem value="5">5th Grade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New PIN (leave blank to keep current)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        data-testid="input-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="faithMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faith Integration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-faith-mode">
                        <SelectValue placeholder="Select faith integration level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FULL_DISCIPLESHIP">
                        Full Discipleship (Scripture in every lesson)
                      </SelectItem>
                      <SelectItem value="FAITH_FORWARD">
                        Faith Forward (Regular faith integration)
                      </SelectItem>
                      <SelectItem value="VALUES_ONLY">
                        Values Only (Character-focused)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="devotionalCadence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bible Verse Schedule</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-devotional-cadence">
                        <SelectValue placeholder="How often to change Bible verse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">
                        Daily (New verse every day)
                      </SelectItem>
                      <SelectItem value="weekly">
                        Weekly (Same verse all week)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="learningStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Style</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-learning-style">
                        <SelectValue placeholder="Select learning style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HANDS_ON_MONTESSORI">
                        Hands-On Montessori (Tactile, exploratory)
                      </SelectItem>
                      <SelectItem value="BALANCED">
                        Balanced (Mix of activities)
                      </SelectItem>
                      <SelectItem value="DIGITAL_LIGHT">
                        Digital Light (Minimal screen time)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dyslexiaSupport"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base font-medium">
                        Dyslexia Support
                      </FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px]">
                          <p>When enabled, lessons will be adapted with:</p>
                          <ul className="list-disc pl-4 mt-1 text-sm space-y-1">
                            <li>Multisensory learning activities</li>
                            <li>Shorter text with larger fonts</li>
                            <li>Audio and visual emphasis</li>
                            <li>Phonics-based reading approach</li>
                            <li>Extra time for reading tasks</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adapts curriculum for dyslexia-friendly learning
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-dyslexia-support"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-2">
              <h3 className="text-base font-semibold mb-3">Adaptive Learning Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fine-tune how lessons adapt to your child's current abilities
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="readingStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-reading-stage">
                            <SelectValue placeholder="Select reading level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pre_reader">Pre-Reader (Letters & Sounds)</SelectItem>
                          <SelectItem value="emerging">Emerging (Simple Words)</SelectItem>
                          <SelectItem value="fluent_for_grade">Fluent for Grade</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mathStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Math Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-math-stage">
                            <SelectValue placeholder="Select math level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="within_5">Numbers 0-5</SelectItem>
                          <SelectItem value="within_10">Numbers 0-10</SelectItem>
                          <SelectItem value="within_20">Numbers 0-20</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <FormField
                  control={form.control}
                  name="preferredMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-preferred-mode">
                            <SelectValue placeholder="Select preferred mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hands_on">Hands-On (Tactile)</SelectItem>
                          <SelectItem value="visual">Visual (Pictures & Diagrams)</SelectItem>
                          <SelectItem value="story">Story-Based (Narrative)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sessionLengthMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Length (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={30}
                          {...field}
                          value={field.value || 10}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                          data-testid="input-session-length"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

          </form>
        </Form>
        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-child-form"
            disabled={updateChildMutation.isPending}
            data-testid="button-save-child"
          >
            {updateChildMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
