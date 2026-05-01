import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ChildCard from "@/components/ChildCard";
import AddChildDialog from "@/components/AddChildDialog";
import { EditChildDialog } from "@/components/EditChildDialog";
import CreateLessonDialog from "@/components/CreateLessonDialog";
import ProgressOverviewWidget from "@/components/ProgressOverviewWidget";
import SkillMasteryWidget from "@/components/SkillMasteryWidget";
import { BuddyApprovalSection } from "@/components/BuddyApprovalSection";
import JourneyPreviewCard from "@/components/JourneyPreviewCard";
import CurriculumProgressWidget from "@/components/CurriculumProgressWidget";
import { useAuth } from "@/lib/useAuth";
import type { Child, RewardState, ChildSettings, AvatarTraits } from "@shared/schema";

interface ChildWithSettings extends Child {
  settings?: ChildSettings;
  rewardState?: RewardState;
  avatarTraits?: AvatarTraits;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildWithSettings | null>(null);
  const [creatingLessonFor, setCreatingLessonFor] = useState<ChildWithSettings | null>(null);
  const { impersonateChild } = useAuth();

  const handleViewAsChild = async (childId: string) => {
    try {
      await impersonateChild(childId);
      setLocation("/child/home");
    } catch (error) {
      console.error("Failed to switch to child view:", error);
    }
  };

  const { data: children = [], isLoading } = useQuery<ChildWithSettings[]>({
    queryKey: ['/api/children'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {children.length > 0 && <ProgressOverviewWidget />}

      {children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Today's Learning Journey</h2>
          <p className="text-muted-foreground mb-4">
            See what your children are working on and what's coming up next
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {children.map((child) => (
              <JourneyPreviewCard
                key={child.id}
                childId={child.id}
                childName={child.name}
              />
            ))}
          </div>
        </div>
      )}

      <BuddyApprovalSection />

      {children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Curriculum Goals</h2>
          <p className="text-muted-foreground mb-4">
            Track progress toward year-end learning objectives
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {children.map((child) => (
              <CurriculumProgressWidget
                key={child.id}
                childId={child.id}
                childName={child.name}
                grade={child.grade}
              />
            ))}
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Skill Mastery</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {children.map((child) => (
              <SkillMasteryWidget
                key={child.id}
                childId={child.id}
                childName={child.name}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-3xl font-semibold mb-2">My Children</h2>
          <p className="text-muted-foreground">
            Manage your children's learning journey
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          size="lg"
          data-testid="button-add-child"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Child
        </Button>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground mb-4">
            No children added yet
          </p>
          <Button onClick={() => setShowAddDialog(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Child
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              name={child.name}
              grade={child.grade as "K" | "1" | "2"}
              completionPercent={0}
              points={child.rewardState?.points || 0}
              avatarTraits={child.avatarTraits}
              onViewPlans={() => setLocation(`/parent/child/${child.id}/plans`)}
              onEditChild={() => setEditingChild(child)}
              onViewAsChild={() => handleViewAsChild(child.id)}
              onCreateLesson={() => setCreatingLessonFor(child)}
            />
          ))}
        </div>
      )}

      <AddChildDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      {editingChild && (
        <EditChildDialog
          open={!!editingChild}
          onOpenChange={(open) => !open && setEditingChild(null)}
          child={editingChild}
        />
      )}

      {creatingLessonFor && (
        <CreateLessonDialog
          open={!!creatingLessonFor}
          onOpenChange={(open) => !open && setCreatingLessonFor(null)}
          childId={creatingLessonFor.id}
          childName={creatingLessonFor.name}
        />
      )}
    </div>
  );
}
