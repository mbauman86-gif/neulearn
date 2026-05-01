import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import ChildCard from "./ChildCard";
import AddChildDialog from "./AddChildDialog";
import { EditChildDialog } from "./EditChildDialog";
import CreateLessonDialog from "./CreateLessonDialog";
import ProgressOverviewWidget from "./ProgressOverviewWidget";
import SkillMasteryWidget from "./SkillMasteryWidget";
import { BuddyApprovalSection } from "./BuddyApprovalSection";
import NeuLearnLogo from "./NeuLearnLogo";
import { useAuth } from "@/lib/useAuth";
import type { Child, RewardState, ChildSettings, AvatarTraits } from "@shared/schema";

interface ChildWithSettings extends Child {
  settings?: ChildSettings;
  rewardState?: RewardState;
  avatarTraits?: AvatarTraits;
}

export default function ParentDashboard() {
  const [, setLocation] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildWithSettings | null>(null);
  const [creatingLessonFor, setCreatingLessonFor] = useState<ChildWithSettings | null>(null);
  const { logout, impersonateChild } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    setLocation("/parent/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neulearn-surface-light)]">
      <header className="border-b sticky top-0 bg-white z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <NeuLearnLogo size="sm" />
          <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {children.length > 0 && <ProgressOverviewWidget />}

        <BuddyApprovalSection />

        {children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Learning Progress</h2>
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

        <div className="flex items-center justify-between mb-6">
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
      </main>

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
