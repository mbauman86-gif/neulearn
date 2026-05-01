import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import { defaultAvatarTraits, type AvatarTraits } from "@shared/schema";
import {
  TreePine, Waves, Rocket, Mountain, Check,
  Star, Lightbulb, Palette, Book, Puzzle, Heart, Music, Pencil, Target,
  Calculator, BookOpen, Users
} from "lucide-react";

const THEMES = [
  { id: "forest", label: "Forest", icon: TreePine, gradient: "from-green-400 to-teal-500" },
  { id: "ocean", label: "Ocean", icon: Waves, gradient: "from-blue-400 to-cyan-500" },
  { id: "galaxy", label: "Galaxy", icon: Rocket, gradient: "from-purple-500 to-indigo-500" },
  { id: "desert", label: "Desert", icon: Mountain, gradient: "from-orange-400 to-yellow-500" },
];

const ACCENT_COLORS = [
  { id: "blue", color: "bg-blue-500" },
  { id: "green", color: "bg-green-500" },
  { id: "purple", color: "bg-purple-500" },
  { id: "orange", color: "bg-orange-500" },
  { id: "pink", color: "bg-pink-500" },
  { id: "yellow", color: "bg-yellow-500" },
];

const IDENTITY_TAGS = [
  { id: "Explorer", icon: Rocket },
  { id: "Scientist", icon: Lightbulb },
  { id: "Artist", icon: Palette },
  { id: "Reader", icon: Book },
  { id: "Builder", icon: Puzzle },
  { id: "Leader", icon: Star },
  { id: "Helper", icon: Heart },
  { id: "Musician", icon: Music },
  { id: "Writer", icon: Pencil },
  { id: "Athlete", icon: Target },
];

const LEARNING_STYLES = [
  { id: "Visual Learner", description: "I learn by seeing" },
  { id: "Hands-On Learner", description: "I learn by doing" },
  { id: "Reading Learner", description: "I learn by reading" },
  { id: "Listening Learner", description: "I learn by hearing" },
];

const FUN_FACTS = [
  "I love animals",
  "I like building things",
  "I enjoy stories",
  "I like outdoor adventures",
  "I love music",
  "I like helping others",
  "I enjoy puzzles",
  "I like drawing",
  "I love nature",
  "I enjoy cooking",
];

const SUBJECTS = [
  { id: "Math", icon: Calculator },
  { id: "Reading", icon: BookOpen },
  { id: "Character", icon: Heart },
  { id: "Science", icon: Lightbulb },
];

type BuddyInfo = { id: string; name: string; username: string; avatarTraits?: AvatarTraits };

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    theme: string;
    accentColor: string;
    identityTags: string[];
    learningStyles: string[];
    funFacts: string[];
    favoriteSubjects: string[];
    topBuddyIds: string[];
  };
  childId: string;
}

function getAvatarTraits(child: any): AvatarTraits {
  if (child?.avatarTraits && typeof child.avatarTraits === 'object') {
    return child.avatarTraits as AvatarTraits;
  }
  return defaultAvatarTraits;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  childId,
}: EditProfileDialogProps) {
  const { toast } = useToast();
  const [theme, setTheme] = useState(profile.theme);
  const [accentColor, setAccentColor] = useState(profile.accentColor);
  const [identityTags, setIdentityTags] = useState<string[]>(profile.identityTags);
  const [learningStyles, setLearningStyles] = useState<string[]>(profile.learningStyles);
  const [funFacts, setFunFacts] = useState<string[]>(profile.funFacts);
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>(profile.favoriteSubjects);
  const [topBuddyIds, setTopBuddyIds] = useState<string[]>(profile.topBuddyIds);

  useEffect(() => {
    if (open) {
      setTheme(profile.theme);
      setAccentColor(profile.accentColor);
      setIdentityTags(profile.identityTags);
      setLearningStyles(profile.learningStyles);
      setFunFacts(profile.funFacts);
      setFavoriteSubjects(profile.favoriteSubjects);
      setTopBuddyIds(profile.topBuddyIds);
    }
  }, [open, profile]);

  const { data: buddies } = useQuery<BuddyInfo[]>({
    queryKey: ['/api/social/buddies'],
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/buddy-profile', {
        theme,
        accentColor,
        identityTags,
        learningStyles,
        funFacts,
        favoriteSubjects,
        topBuddyIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buddy-profile', childId] });
      toast({
        title: "Profile saved!",
        description: "Your profile has been updated",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Could not save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleArrayItem = (
    arr: string[],
    setArr: (val: string[]) => void,
    item: string,
    max?: number
  ) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else if (!max || arr.length < max) {
      setArr([...arr, item]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-child">Edit My Profile</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-2">
            <div>
              <Label className="text-base font-semibold font-child mb-3 block">
                Theme
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  const selected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`relative p-3 rounded-lg bg-gradient-to-r ${t.gradient} 
                        text-white flex items-center gap-2 transition-all
                        ${selected ? 'ring-4 ring-offset-2 ring-primary' : 'opacity-80 hover:opacity-100'}`}
                      data-testid={`button-theme-${t.id}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-child font-semibold">{t.label}</span>
                      {selected && (
                        <Check className="h-5 w-5 absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold font-child mb-3 block">
                Accent Color
              </Label>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={`w-10 h-10 rounded-full ${c.color} transition-all
                      ${accentColor === c.id ? 'ring-4 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    data-testid={`button-color-${c.id}`}
                  >
                    {accentColor === c.id && (
                      <Check className="h-5 w-5 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold font-child mb-2 block">
                Who I Am <span className="text-sm text-muted-foreground">(pick up to 3)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {IDENTITY_TAGS.map((tag) => {
                  const Icon = tag.icon;
                  const selected = identityTags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={selected ? "default" : "outline"}
                      className={`cursor-pointer text-base py-1.5 px-3 ${selected ? '' : 'hover:bg-accent'}`}
                      onClick={() => toggleArrayItem(identityTags, setIdentityTags, tag.id, 3)}
                      data-testid={`badge-identity-${tag.id.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {tag.id}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold font-child mb-2 block">
                How I Learn Best
              </Label>
              <div className="space-y-2">
                {LEARNING_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className="flex items-center gap-3"
                  >
                    <Checkbox
                      id={style.id}
                      checked={learningStyles.includes(style.id)}
                      onCheckedChange={() => toggleArrayItem(learningStyles, setLearningStyles, style.id, 2)}
                      data-testid={`checkbox-learning-${style.id.toLowerCase().replace(/\s/g, '-')}`}
                    />
                    <label htmlFor={style.id} className="font-child cursor-pointer">
                      {style.id}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold font-child mb-2 block">
                Fun Facts About Me <span className="text-sm text-muted-foreground">(pick up to 3)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {FUN_FACTS.map((fact) => {
                  const selected = funFacts.includes(fact);
                  return (
                    <Badge
                      key={fact}
                      variant={selected ? "default" : "outline"}
                      className={`cursor-pointer text-sm py-1 px-2 ${selected ? '' : 'hover:bg-accent'}`}
                      onClick={() => toggleArrayItem(funFacts, setFunFacts, fact, 3)}
                      data-testid={`badge-fact-${fact.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {fact}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold font-child mb-2 block">
                Favorite Subjects
              </Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((subject) => {
                  const Icon = subject.icon;
                  const selected = favoriteSubjects.includes(subject.id);
                  return (
                    <Badge
                      key={subject.id}
                      variant={selected ? "default" : "outline"}
                      className={`cursor-pointer text-base py-1.5 px-3 ${selected ? '' : 'hover:bg-accent'}`}
                      onClick={() => toggleArrayItem(favoriteSubjects, setFavoriteSubjects, subject.id)}
                      data-testid={`badge-subject-${subject.id.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {subject.id}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {buddies && buddies.length > 0 && (
              <div>
                <Label className="text-base font-semibold font-child mb-2 block">
                  My Top Buddies <span className="text-sm text-muted-foreground">(pick up to 3)</span>
                </Label>
                <div className="space-y-2">
                  {buddies.map((buddy) => {
                    const selected = topBuddyIds.includes(buddy.id);
                    return (
                      <div
                        key={buddy.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                          ${selected ? 'bg-primary/10 ring-2 ring-primary' : 'bg-gray-50 hover:bg-gray-100'}`}
                        onClick={() => toggleArrayItem(topBuddyIds, setTopBuddyIds, buddy.id, 3)}
                        data-testid={`buddy-select-${buddy.id}`}
                      >
                        <div className="w-10 h-10">
                          <AvatarRenderer 
                            traits={getAvatarTraits(buddy)} 
                            size={40} 
                            className="rounded-full"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-child font-semibold">{buddy.name}</p>
                          <p className="text-sm text-muted-foreground">@{buddy.username}</p>
                        </div>
                        {selected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-profile"
          >
            {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
