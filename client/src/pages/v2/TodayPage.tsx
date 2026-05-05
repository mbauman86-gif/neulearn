/**
 * TodayPage (v2) — production wiring of the TodayCub component.
 *
 * Lives at /v2/child/today (see App.tsx). Fetches the kid's daily queue from the
 * existing `/api/daily-queue/:childId` endpoint and renders the v2 Today screen.
 *
 * Currently routes EVERY logged-in child through the Cub register because that's the
 * register we've shipped first. When the Wise register lands, switch on grade.
 *
 * TODO: faith mode + currency totals come from settings + reward_state — fetch those
 * once the new endpoints are wired through. For now we show sensible defaults so the
 * son-test alpha can run.
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { TodayCub, DEFAULT_QUEUE_ICONS, type TodayQueueItem } from "@/components/v2/TodayCub";
import { TodayCompleteState } from "@/components/v2/primitives/TodayCompleteState";
import { apiRequest } from "@/lib/queryClient";
import type { QueueSection } from "@/components/v2/primitives/QueueCard";

interface DailyQueueItem {
  id: string;
  section: "CORE_LEARNING" | "SPIRAL_REVIEW" | "APPLY" | "DEVOTIONAL";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  skillName: string;
  lessonInstanceId: string | null;
  estimatedMinutes: number;
  title: string;
  subtitle?: string;
}

interface DailyQueueResponse {
  id: string;
  childId: string;
  date: string;
  items: DailyQueueItem[];
}

const SECTION_MAP: Record<DailyQueueItem["section"], QueueSection> = {
  CORE_LEARNING: "core",
  SPIRAL_REVIEW: "review",
  APPLY: "apply",
  DEVOTIONAL: "devotional",
};

export default function TodayPage() {
  const { child, isImpersonating } = useAuth();
  const [, navigate] = useLocation();
  const childId = child?.id;
  const queryClient = useQueryClient();

  const { data: queueData, isLoading } = useQuery<DailyQueueResponse>({
    queryKey: ["/api/daily-queue", childId],
    enabled: !!childId,
  });

  // Parent-only: regenerate the daily queue when everything's done. Hits the
  // existing /api/daily-queue/:childId/regenerate endpoint (parent session only —
  // it'll reject if a kid session somehow tries it).
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!childId) throw new Error("no child");
      const res = await apiRequest("POST", `/api/daily-queue/${childId}/regenerate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-queue"] });
    },
  });

  const queue: TodayQueueItem[] = useMemo(() => {
    if (!queueData) return [];
    return queueData.items
      .filter((item) => item.status !== "COMPLETED" && item.status !== "SKIPPED")
      .map((item): TodayQueueItem => {
        const section = SECTION_MAP[item.section];
        return {
          id: item.id,
          section,
          title: item.title || friendlyTitleForSkill(item.skillName),
          subtitle: item.subtitle ?? subtitleForSection(section, item.skillName),
          minutes: item.estimatedMinutes ?? 10,
          icon: DEFAULT_QUEUE_ICONS[section],
          hasAudio: true,
        };
      });
  }, [queueData]);

  if (!child) {
    // useAuth + ProtectedChildRoute handle the redirect; render nothing while it does.
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-nl-canvas min-h-[100dvh] flex items-center justify-center">
        <p className="font-nl-display italic text-[20px] text-nl-ink-secondary">Loading today's path…</p>
      </div>
    );
  }

  const handleQueueItemClick = (id: string) => {
    const item = queueData?.items.find((q) => q.id === id);
    if (item?.lessonInstanceId) {
      navigate(`/v2/child/lesson/${item.lessonInstanceId}`);
    } else if (item) {
      // Devotional or skill-based items without a precomputed lesson instance need to
      // generate one on the fly. The legacy /generate endpoint handles that.
      generateAndOpenLesson(item, navigate).catch((err) => {
        console.error("Failed to generate lesson:", err);
      });
    }
  };

  const handleSaveForLater = (queueItemId: string) => {
    if (!queueData) return;
    apiRequest("PATCH", `/api/daily-queue/${queueData.id}/items/${queueItemId}`, {
      status: "SKIPPED",
      skipReason: "saved_for_later",
    }).catch((err) => console.error("Failed to save for later:", err));
  };

  const handleStuck = () => {
    // No active lesson on Today — best we can do is offer a break.
    alert("Need help? Open any card and tap 'I'm stuck' inside the lesson.");
  };

  const handleBreak = () => {
    navigate("/child/login");
  };

  // queue is already filtered to non-completed/non-skipped items; if it's empty,
  // the kid finished everything for today (or the queue never had anything).
  // Render a celebratory closure state instead of an empty card grid.
  const emptyState = (
    <TodayCompleteState
      parentMode={isImpersonating}
      onRegenerate={() => regenerateMutation.mutate()}
      regenerating={regenerateMutation.isPending}
    />
  );

  return (
    <TodayCub
      childName={child.name ?? "friend"}
      currencies={{ depth: 0, explore: 0, comeback: 0 }}
      queue={queue}
      laterShelf={[]}
      swapsRemaining={3}
      faithLens={{
        scripture: "Train up a child in the way he should go.",
        tieIn: "Each small step today is a kind of training. Learning is a long, kind shape.",
      }}
      faithMode="subtle"
      onQueueItemClick={handleQueueItemClick}
      onSaveForLater={handleSaveForLater}
      onStuck={handleStuck}
      onBreak={handleBreak}
      emptyState={emptyState}
    />
  );
}

function friendlyTitleForSkill(skillName: string): string {
  // Convert "digraph_sh" → "Sounds in words: sh"
  if (skillName.startsWith("digraph_")) {
    const d = skillName.replace("digraph_", "");
    return `Sounds in words: ${d}`;
  }
  if (skillName === "sight_words_first_25") return "Sight words you'll see everywhere";
  return skillName.replace(/_/g, " ");
}

function subtitleForSection(section: QueueSection, skillName: string): string {
  switch (section) {
    case "core":
      return skillName.startsWith("digraph_") ? "Listen for these letter pairs" : "A new skill today";
    case "review":
      return "Quick warm-up — you've got this";
    case "apply":
      return "Try this in real life";
    case "devotional":
      return "A short scripture and a quiet question";
  }
}

async function generateAndOpenLesson(
  item: DailyQueueItem,
  navigate: (path: string) => void,
): Promise<void> {
  const res = await apiRequest("POST", "/api/adaptive/lessons/generate", {
    skillName: item.skillName,
  });
  const lesson = await res.json();
  if (lesson?.id) {
    navigate(`/v2/child/lesson/${lesson.id}`);
  }
}
