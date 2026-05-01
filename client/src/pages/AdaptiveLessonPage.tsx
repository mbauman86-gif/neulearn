import { useRoute } from "wouter";
import AdaptiveLessonPlayer from "@/components/AdaptiveLessonPlayer";

export default function AdaptiveLessonPage() {
  const [, params] = useRoute("/child/lesson/:lessonId");
  
  if (!params?.lessonId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }
  
  return <AdaptiveLessonPlayer lessonId={params.lessonId} />;
}
