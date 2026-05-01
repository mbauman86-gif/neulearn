import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { ChildSettings } from "@shared/schema";

interface DyslexiaContextType {
  dyslexiaMode: boolean;
  isLoading: boolean;
}

const DyslexiaContext = createContext<DyslexiaContextType>({ 
  dyslexiaMode: false, 
  isLoading: true 
});

export function DyslexiaProvider({ children }: { children: ReactNode }) {
  const { child } = useAuth();

  const { data: settings, isLoading } = useQuery<ChildSettings | null>({
    queryKey: ['/api/children', child?.id, 'settings'],
    queryFn: async () => {
      if (!child?.id) return null;
      try {
        const response = await fetch(`/api/children/${child.id}/settings`, {
          credentials: 'include',
        });
        if (!response.ok) {
          // Return default settings on error to ensure portal still renders
          console.warn('Failed to fetch dyslexia settings, using defaults');
          return {
            faithMode: "FAITH_FORWARD",
            learningStyle: "HANDS_ON_MONTESSORI",
            subjectsEnabled: ["READING", "MATH", "SCIENCE", "CHARACTER"],
            dyslexiaSupport: false,
          };
        }
        return response.json();
      } catch (error) {
        console.warn('Error fetching dyslexia settings:', error);
        return {
          faithMode: "FAITH_FORWARD",
          learningStyle: "HANDS_ON_MONTESSORI",
          subjectsEnabled: ["READING", "MATH", "SCIENCE", "CHARACTER"],
          dyslexiaSupport: false,
        };
      }
    },
    enabled: !!child?.id,
  });

  const dyslexiaMode = settings?.dyslexiaSupport || false;

  return (
    <DyslexiaContext.Provider value={{ dyslexiaMode, isLoading }}>
      <div className={dyslexiaMode ? 'dyslexia-mode' : ''}>
        {children}
      </div>
    </DyslexiaContext.Provider>
  );
}

export function useDyslexiaMode() {
  return useContext(DyslexiaContext);
}
