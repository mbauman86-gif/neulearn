import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, Palette, Shirt, Eye, Smile, Scissors, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AvatarRenderer } from "./AvatarRenderer";
import { AvatarTraitOptions, type AvatarTraits, defaultAvatarTraits, avatarTraitsSchema } from "@shared/schema";

interface AvatarBuilderDialogProps {
  childId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons: Record<string, typeof Palette> = {
  skinTone: Palette,
  hair: Scissors,
  eyes: Eye,
  mouth: Smile,
  top: Shirt,
  bottom: Shirt,
  shoes: Star,
  accessory: Star,
};

const categoryLabels: Record<string, string> = {
  skinTone: "Skin",
  hair: "Hair",
  eyes: "Eyes",
  mouth: "Mouth",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Extras",
};

const colorSwatches: Record<string, string> = {
  light: "#FFE4D0",
  fair: "#F5D4B8",
  medium: "#DEB887",
  tan: "#C4A67C",
  brown: "#A67B5B",
  dark: "#8B5A2B",
  blonde: "#F0D58C",
  black: "#1C1C1C",
  red: "#E74C3C",
  auburn: "#922724",
  gray: "#9E9E9E",
  blue: "#3498DB",
  pink: "#FF69B4",
  purple: "#9B59B6",
  green: "#27AE60",
  yellow: "#F1C40F",
  orange: "#E67E22",
  white: "#ECF0F1",
  hazel: "#8E7618",
  amber: "#FF8C00",
  rainbow: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)",
};

function OptionButton({ 
  selected, 
  onClick, 
  label, 
  color 
}: { 
  selected: boolean; 
  onClick: () => void; 
  label: string; 
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`option-${label.toLowerCase().replace(/\s/g, '-')}`}
      className={`
        relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all
        ${selected 
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
          : 'border-border hover-elevate bg-card'
        }
      `}
    >
      {color ? (
        <div 
          className="w-8 h-8 rounded-full border border-border"
          style={{ background: colorSwatches[color] || color }}
        />
      ) : (
        <span className="text-sm font-medium capitalize">{label}</span>
      )}
      {color && <span className="text-xs text-muted-foreground capitalize">{label}</span>}
      {selected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

export function AvatarBuilderDialog({ childId, open, onOpenChange }: AvatarBuilderDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("skinTone");
  const [traits, setTraits] = useState<AvatarTraits>(defaultAvatarTraits);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: avatarData, isLoading } = useQuery<{ traits: AvatarTraits }>({
    queryKey: ['/api/children', childId, 'avatar', 'traits'],
    enabled: open && !!childId,
  });

  useEffect(() => {
    if (avatarData?.traits) {
      setTraits(avatarData.traits);
      setHasChanges(false);
    }
  }, [avatarData]);

  const saveMutation = useMutation({
    mutationFn: async (newTraits: AvatarTraits) => {
      return apiRequest('PATCH', `/api/children/${childId}/avatar/traits`, newTraits);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'avatar', 'traits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children', childId, 'progression'] });
      toast({
        title: "Avatar saved!",
        description: "Your new look is ready!",
      });
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: error.message || "Couldn't save avatar. Try again!",
        variant: "destructive",
      });
    },
  });

  const updateTrait = <K extends keyof AvatarTraits>(key: K, value: AvatarTraits[K]) => {
    setTraits(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate traits before sending to ensure schema compliance
    const validationResult = avatarTraitsSchema.safeParse(traits);
    if (!validationResult.success) {
      toast({
        title: "Oops!",
        description: "Please make sure all options are selected.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(validationResult.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] h-[600px] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="text-xl font-bold text-center">
            Build Your Character
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row min-h-0 flex-1 overflow-hidden">
          <div className="w-full md:w-1/3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r shrink-0">
            {isLoading ? (
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            ) : (
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 rounded-full blur-xl" />
                <AvatarRenderer traits={traits} size={140} className="relative z-10" />
              </div>
            )}
            <p className="mt-3 text-sm text-muted-foreground text-center">
              This is you!
            </p>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="border-b px-2 shrink-0">
                <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-2">
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const Icon = categoryIcons[key] || Star;
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        data-testid={`tab-${key}`}
                        className="flex items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4">
                <TabsContent value="skinTone" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your skin color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.skinTone.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.skinTone === option}
                        onClick={() => updateTrait('skinTone', option)}
                        label={option}
                        color={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="hair" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your hair style:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AvatarTraitOptions.hairStyle.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.hairStyle === option}
                        onClick={() => updateTrait('hairStyle', option)}
                        label={option}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Pick your hair color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.hairColor.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.hairColor === option}
                        onClick={() => updateTrait('hairColor', option)}
                        label={option}
                        color={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="eyes" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your eye style:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.eyeStyle.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.eyeStyle === option}
                        onClick={() => updateTrait('eyeStyle', option)}
                        label={option}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Pick your eye color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.eyeColor.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.eyeColor === option}
                        onClick={() => updateTrait('eyeColor', option)}
                        label={option}
                        color={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="mouth" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your smile:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.mouthStyle.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.mouthStyle === option}
                        onClick={() => updateTrait('mouthStyle', option)}
                        label={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="top" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your top:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.topStyle.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.topStyle === option}
                        onClick={() => updateTrait('topStyle', option)}
                        label={option.replace('_', ' ')}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Pick your top color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.topColor.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.topColor === option}
                        onClick={() => updateTrait('topColor', option)}
                        label={option}
                        color={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="bottom" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your bottoms:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.bottomStyle.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.bottomStyle === option}
                        onClick={() => updateTrait('bottomStyle', option)}
                        label={option}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Pick your bottom color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.bottomColor.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.bottomColor === option}
                        onClick={() => updateTrait('bottomColor', option)}
                        label={option}
                        color={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="shoes" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Pick your shoes:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.shoeStyle.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.shoeStyle === option}
                        onClick={() => updateTrait('shoeStyle', option)}
                        label={option.replace('_', ' ')}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Pick your shoe color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {AvatarTraitOptions.shoeColor.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.shoeColor === option}
                        onClick={() => updateTrait('shoeColor', option)}
                        label={option}
                        color={option}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="accessory" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">Add something special:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AvatarTraitOptions.accessory.map(option => (
                      <OptionButton
                        key={option}
                        selected={traits.accessory === option}
                        onClick={() => updateTrait('accessory', option)}
                        label={option}
                      />
                    ))}
                  </div>
                </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-avatar"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            data-testid="button-save-avatar"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save My Look"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
