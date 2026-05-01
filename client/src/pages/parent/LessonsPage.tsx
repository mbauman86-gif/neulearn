import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, Calculator, Heart, Filter, CheckCircle2, Clock, AlertCircle, SkipForward, Calendar, ChevronDown, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LessonInstance, Child } from "@shared/schema";

type LessonWithChild = LessonInstance & { childName: string };

const SUBJECTS = [
  { value: "READING", label: "Reading", icon: BookOpen, color: "text-blue-500" },
  { value: "MATH", label: "Math", icon: Calculator, color: "text-green-500" },
  { value: "CHARACTER", label: "Character", icon: Heart, color: "text-pink-500" },
];

const STATUS_CONFIG = {
  READY: { label: "Ready", icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  IN_PROGRESS: { label: "In Progress", icon: Play, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  SKIPPED: { label: "Skipped", icon: SkipForward, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
};

function getSubjectInfo(subject: string) {
  return SUBJECTS.find(s => s.value === subject) || SUBJECTS[0];
}

function getStatusInfo(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.READY;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function LessonCard({ lesson, onResume }: { lesson: LessonWithChild; onResume?: (id: string) => void }) {
  const subjectInfo = getSubjectInfo(lesson.subject);
  const statusInfo = getStatusInfo(lesson.status);
  const SubjectIcon = subjectInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="hover-elevate" data-testid={`card-lesson-${lesson.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-muted`}>
              <SubjectIcon className={`w-5 h-5 ${subjectInfo.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-medium">{lesson.title}</CardTitle>
              <CardDescription className="text-sm">{lesson.childName}</CardDescription>
            </div>
          </div>
          <Badge className={statusInfo.color} variant="secondary">
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{lesson.objective}</p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(lesson.date)}
          </span>
          {lesson.targetSkillName && (
            <span className="truncate">{lesson.targetSkillName.replace(/_/g, ' ')}</span>
          )}
        </div>

        {lesson.status === "COMPLETED" && lesson.pointsEarned && (
          <div className="text-sm text-green-600 font-medium">
            +{lesson.pointsEarned} XP earned
          </div>
        )}

        {lesson.status === "SKIPPED" && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-orange-600">
              {lesson.skipReason === "wanted_different" && "Wanted a different lesson"}
              {lesson.skipReason === "too_hard" && "Lesson was too difficult"}
              {lesson.skipReason === "not_interested" && "Not interested in topic"}
              {!lesson.skipReason && "Skipped for later"}
            </span>
            {onResume && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onResume(lesson.id)}
                data-testid={`button-resume-${lesson.id}`}
              >
                Resume
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LessonSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function LessonsPage() {
  const { toast } = useToast();
  const [childFilter, setChildFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [skippedOpen, setSkippedOpen] = useState(true);

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (childFilter !== "all") params.set("childId", childFilter);
    if (subjectFilter !== "all") params.set("subject", subjectFilter);
    if (activeTab !== "all" && activeTab !== "skipped") params.set("status", activeTab.toUpperCase());
    return params.toString();
  };

  const { data: lessons = [], isLoading } = useQuery<LessonWithChild[]>({
    queryKey: ["/api/parent/lesson-instances", childFilter, subjectFilter, activeTab],
    queryFn: async () => {
      const queryStr = buildQueryParams();
      const res = await fetch(`/api/parent/lesson-instances${queryStr ? `?${queryStr}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json();
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await apiRequest("POST", `/api/adaptive/lessons/${lessonId}/resume`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Lesson resumed", description: "The lesson is now ready to be completed." });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/lesson-instances"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredLessons = activeTab === "skipped" 
    ? lessons.filter(l => l.status === "SKIPPED")
    : lessons;

  const skippedLessons = lessons.filter(l => l.status === "SKIPPED");
  const activeLessons = filteredLessons.filter(l => l.status !== "SKIPPED");

  const stats = {
    total: lessons.length,
    completed: lessons.filter(l => l.status === "COMPLETED").length,
    inProgress: lessons.filter(l => l.status === "IN_PROGRESS").length,
    ready: lessons.filter(l => l.status === "READY").length,
    skipped: skippedLessons.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Lessons</h1>
        <p className="text-muted-foreground">
          View and manage your children's learning progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.ready}</div>
          <div className="text-sm text-muted-foreground">Ready</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.skipped}</div>
          <div className="text-sm text-muted-foreground">Skipped</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by:</span>
        </div>
        
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-child-filter">
            <SelectValue placeholder="All children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-subject-filter">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {SUBJECTS.map((subject) => (
              <SelectItem key={subject.value} value={subject.value}>{subject.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Skipped Lessons Section */}
      {skippedLessons.length > 0 && activeTab !== "skipped" && (
        <Collapsible open={skippedOpen} onOpenChange={setSkippedOpen} className="mb-6">
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover-elevate" data-testid="collapsible-skipped-toggle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Come Back To These</CardTitle>
                      <CardDescription>
                        {skippedLessons.length} lesson{skippedLessons.length !== 1 ? "s" : ""} need to be completed for mastery badges
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${skippedOpen ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skippedLessons.map((lesson) => (
                    <LessonCard 
                      key={lesson.id} 
                      lesson={lesson} 
                      onResume={(id) => resumeMutation.mutate(id)}
                    />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList data-testid="tabs-lesson-status">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="ready" data-testid="tab-ready">Ready</TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="skipped" data-testid="tab-skipped">
            Skipped
            {stats.skipped > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                {stats.skipped}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <LessonSkeleton key={i} />
              ))}
            </div>
          ) : activeLessons.length === 0 && skippedLessons.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle>No Lessons Found</CardTitle>
                <CardDescription>
                  {childFilter !== "all" || subjectFilter !== "all" 
                    ? "Try adjusting your filters to see more lessons."
                    : "Your children haven't started any lessons yet. Create a lesson from the Home page!"}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === "skipped" ? skippedLessons : activeLessons).map((lesson) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson}
                  onResume={lesson.status === "SKIPPED" ? (id) => resumeMutation.mutate(id) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
