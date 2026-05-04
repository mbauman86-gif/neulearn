/**
 * TodayCubDemo — preview route for the Cub-register Today screen.
 *
 * Mounted at `/v2/preview/today-cub`. Wires TodayCub up with mock data so we can
 * iterate on visual fidelity before the server-side daily-queue integration lands.
 *
 * No authentication required so it's easy to share for alpha review.
 */
import { useState } from "react";
import { TodayCub, DEFAULT_QUEUE_ICONS } from "@/components/v2/TodayCub";
import { Music, Brush } from "lucide-react";
import type { TodayQueueItem } from "@/components/v2/TodayCub";

const initialQueue: TodayQueueItem[] = [
  {
    id: "core-sh-digraph",
    section: "core",
    title: "Sounds in words",
    subtitle: "Listen for /sh/ in real words",
    minutes: 10,
    icon: DEFAULT_QUEUE_ICONS.core,
  },
  {
    id: "review-counting",
    section: "review",
    title: "Counting by tens",
    subtitle: "Quick warm-up — you've got this",
    minutes: 8,
    icon: DEFAULT_QUEUE_ICONS.review,
  },
  {
    id: "apply-leaves",
    section: "apply",
    title: "Take 3 leaves outside",
    subtitle: "Find the smallest one and bring it back",
    minutes: 15,
    icon: DEFAULT_QUEUE_ICONS.apply,
  },
  {
    id: "devotional-wonder",
    section: "devotional",
    title: "Today's wonder",
    subtitle: "A short scripture and a quiet question",
    minutes: 5,
    icon: DEFAULT_QUEUE_ICONS.devotional,
  },
];

export default function TodayCubDemo() {
  const [queue, setQueue] = useState(initialQueue);
  const [later, setLater] = useState([
    { id: "later-hymn", title: "Morning Hymn", icon: Music },
    { id: "later-paint", title: "Finger Painting", icon: Brush },
  ]);
  const [swapsRemaining, setSwapsRemaining] = useState(3);

  return (
    <TodayCub
      childName="Mateo"
      currencies={{ depth: 12, explore: 5, comeback: 3 }}
      queue={queue}
      laterShelf={later}
      swapsRemaining={swapsRemaining}
      faithLens={{
        scripture:
          "Train up a child in the way he should go; even when he is old he will not depart from it.",
        tieIn:
          "Each small step today is a kind of training. The Bible treats learning as a slow, lifelong shape — not a sprint.",
      }}
      faithMode="subtle"
      onQueueItemClick={(id) => alert(`[demo] open lesson ${id}`)}
      onSaveForLater={(id) => {
        const item = queue.find((q) => q.id === id);
        if (!item) return;
        setQueue((q) => q.filter((x) => x.id !== id));
        setLater((l) => [...l, { id: item.id, title: item.title, icon: item.icon }]);
      }}
      onLaterItemClick={(id) => alert(`[demo] resume saved item ${id}`)}
      onSaveNew={() => alert("[demo] open library to add new item")}
      onStuck={() => alert("[demo] intervention engine kicks in")}
      onBreak={() => {
        setSwapsRemaining((n) => Math.max(0, n - 1));
        alert("[demo] paused; one swap consumed");
      }}
    />
  );
}
