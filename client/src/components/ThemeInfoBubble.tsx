import { useState } from "react";
import { Info, BookOpen, MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { GospelTheme } from "@/lib/gospelThemes";

interface ThemeInfoBubbleProps {
  theme: GospelTheme;
}

export default function ThemeInfoBubble({ theme }: ThemeInfoBubbleProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="space-y-5 font-child">
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
          {theme.scriptureReference}
        </p>
        <p className="text-lg italic text-foreground leading-relaxed">
          "{theme.scripture}"
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--neulearn-teal)]" />
          <h4 className="text-lg font-bold">The Story</h4>
        </div>
        <p className="text-base text-foreground leading-relaxed">
          {theme.summary}
        </p>
      </div>

      <div className="space-y-2 bg-[var(--neulearn-teal)]/10 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[var(--neulearn-teal)]" />
          <h4 className="text-lg font-bold">Talk About It</h4>
        </div>
        <p className="text-base text-foreground">
          {theme.discussionPrompt}
        </p>
      </div>
    </div>
  );

  const ThoughtBubbleButton = () => {
    // Minimized state - just show a small info icon
    if (minimized) {
      return (
        <div className="fixed right-4 bottom-4 z-50">
          <button
            onClick={() => setMinimized(false)}
            data-testid="button-theme-info-expand"
            aria-label="Show theme info"
            className="w-10 h-10 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm 
                       shadow-lg border-2 border-[var(--neulearn-teal)]/40
                       hover:border-[var(--neulearn-teal)] hover:shadow-xl hover:scale-110
                       transition-all duration-200
                       flex items-center justify-center"
          >
            <Info className="w-5 h-5 text-[var(--neulearn-teal)]" />
          </button>
        </div>
      );
    }

    // Full bubble with minimize button
    return (
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-1">
        {/* Thought bubble dots - smaller circles trailing up */}
        <div className="flex flex-col items-end gap-1 mr-2 mb-[-4px]">
          <div className="w-2 h-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md" />
          <div className="w-3 h-3 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md" />
        </div>
        
        {/* Main thought bubble */}
        <div className="relative">
          {/* Minimize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(true);
            }}
            data-testid="button-theme-info-minimize"
            aria-label="Minimize theme info"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700
                       hover:bg-gray-300 dark:hover:bg-gray-600
                       shadow-md border border-gray-300 dark:border-gray-600
                       flex items-center justify-center
                       transition-colors duration-150 z-10"
          >
            <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <button
            onClick={() => setOpen(true)}
            data-testid="button-theme-info"
            aria-label="Learn about this theme"
            className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm 
                       rounded-[28px] px-4 py-3 shadow-lg border-2 border-[var(--neulearn-teal)]/40
                       hover:border-[var(--neulearn-teal)] hover:shadow-xl
                       transition-all duration-200 hover:scale-105
                       flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--neulearn-teal)]/20 flex items-center justify-center
                            group-hover:bg-[var(--neulearn-teal)]/30 transition-colors">
              <Info className="w-5 h-5 text-[var(--neulearn-teal)]" />
            </div>
            <span className="font-medium text-sm text-foreground pr-1">
              Learn about this theme
            </span>
          </button>
        </div>
      </div>
    );
  };

  if (isDesktop) {
    return (
      <>
        <ThoughtBubbleButton />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md font-child" aria-describedby="theme-description">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--neulearn-teal)] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                {theme.title}
              </DialogTitle>
            </DialogHeader>
            <div id="theme-description">
              {content}
            </div>
            <Button
              variant="default"
              size="lg"
              className="w-full h-12 text-lg font-semibold mt-2"
              onClick={() => setOpen(false)}
              data-testid="button-close-theme-info"
            >
              Got It!
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <ThoughtBubbleButton />

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="font-child" aria-describedby="theme-description-drawer">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--neulearn-teal)] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              {theme.title}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                aria-label="Close theme info"
              >
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4 pb-6" id="theme-description-drawer">
            {content}
            <Button
              variant="default"
              size="lg"
              className="w-full h-12 text-lg font-semibold mt-4"
              onClick={() => setOpen(false)}
              data-testid="button-close-theme-info"
            >
              Got It!
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
