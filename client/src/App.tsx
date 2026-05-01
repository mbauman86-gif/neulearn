import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/useAuth";
import { DyslexiaProvider } from "./lib/useDyslexiaMode";
import { Route, Switch, Redirect } from "wouter";
import ParentLogin from "./components/ParentLogin";
import ChildLogin from "./components/ChildLogin";
import ParentLayout from "./components/ParentLayout";
import HomePage from "./pages/parent/HomePage";
import LessonsPage from "./pages/parent/LessonsPage";
import CommunityPage from "./pages/parent/CommunityPage";
import BillingPage from "./pages/parent/settings/BillingPage";
import ProfilePage from "./pages/parent/settings/ProfilePage";
import PlanView from "./components/PlanView";
import ChildHome from "./components/ChildHome";
import TaskDetail from "./components/TaskDetail";
import AdaptiveLessonPage from "./pages/AdaptiveLessonPage";
import SocialHub from "./pages/SocialHub";
import BuddyProfile from "./pages/BuddyProfile";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedParentRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (!user) return <Redirect to="/parent/login" />;
  return <ParentLayout>{children}</ParentLayout>;
}

function ProtectedChildRoute({ children }: { children: React.ReactNode }) {
  const { child, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (!child) return <Redirect to="/child/login" />;
  return <DyslexiaProvider>{children}</DyslexiaProvider>;
}

function Router() {
  return (
    <Switch>
      {/* Root redirect based on auth state */}
      <Route path="/">
        {() => {
          const { user, child, isLoading } = useAuth();
          if (isLoading) return <Loading />;
          if (user) return <Redirect to="/parent/dashboard" />;
          if (child) return <Redirect to="/child/home" />;
          return <Redirect to="/parent/login" />;
        }}
      </Route>

      {/* Parent authentication */}
      <Route path="/parent/login">
        {() => {
          const { user, isLoading } = useAuth();
          if (isLoading) return <Loading />;
          if (user) return <Redirect to="/parent/dashboard" />;
          return <ParentLogin />;
        }}
      </Route>

      {/* Child authentication */}
      <Route path="/child/login">
        {() => {
          const { child, isLoading } = useAuth();
          if (isLoading) return <Loading />;
          if (child) return <Redirect to="/child/home" />;
          return <ChildLogin />;
        }}
      </Route>

      {/* Parent dashboard (protected) */}
      <Route path="/parent/dashboard">
        {() => (
          <ProtectedParentRoute>
            <HomePage />
          </ProtectedParentRoute>
        )}
      </Route>

      {/* Parent Lessons page */}
      <Route path="/parent/lessons">
        {() => (
          <ProtectedParentRoute>
            <LessonsPage />
          </ProtectedParentRoute>
        )}
      </Route>

      {/* Parent Community page */}
      <Route path="/parent/community">
        {() => (
          <ProtectedParentRoute>
            <CommunityPage />
          </ProtectedParentRoute>
        )}
      </Route>

      {/* Parent Settings - Billing */}
      <Route path="/parent/settings/billing">
        {() => (
          <ProtectedParentRoute>
            <BillingPage />
          </ProtectedParentRoute>
        )}
      </Route>

      {/* Parent Settings - Profile */}
      <Route path="/parent/settings/profile">
        {() => (
          <ProtectedParentRoute>
            <ProfilePage />
          </ProtectedParentRoute>
        )}
      </Route>

      {/* Plan view (protected) */}
      <Route path="/parent/child/:childId/plans">
        {() => (
          <ProtectedParentRoute>
            <PlanView />
          </ProtectedParentRoute>
        )}
      </Route>

      {/* Child home (protected) - wrapped with DyslexiaProvider */}
      <Route path="/child/home">
        {() => (
          <ProtectedChildRoute>
            <ChildHome />
          </ProtectedChildRoute>
        )}
      </Route>

      {/* Task detail (protected) - wrapped with DyslexiaProvider */}
      <Route path="/child/task/:taskId">
        {() => (
          <ProtectedChildRoute>
            <TaskDetail />
          </ProtectedChildRoute>
        )}
      </Route>

      {/* Adaptive lesson (protected) - wrapped with DyslexiaProvider */}
      <Route path="/child/lesson/:lessonId">
        {() => (
          <ProtectedChildRoute>
            <AdaptiveLessonPage />
          </ProtectedChildRoute>
        )}
      </Route>

      {/* Social Hub (protected) - wrapped with DyslexiaProvider */}
      <Route path="/child/social">
        {() => (
          <ProtectedChildRoute>
            <SocialHub />
          </ProtectedChildRoute>
        )}
      </Route>

      {/* Buddy Profile (protected) - wrapped with DyslexiaProvider */}
      <Route path="/child/buddy/:childId">
        {() => (
          <ProtectedChildRoute>
            <BuddyProfile />
          </ProtectedChildRoute>
        )}
      </Route>

      {/* Fallback */}
      <Route>
        {() => <Redirect to="/" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
