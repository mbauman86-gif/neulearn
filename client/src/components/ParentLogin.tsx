import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrentTheme } from "@/lib/gospelThemes";
import NeuLearnLogo from "./NeuLearnLogo";
import ThemeInfoBubble from "./ThemeInfoBubble";

export default function ParentLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const currentTheme = useCurrentTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signup(email, password);
        toast({
          title: "Account created!",
          description: "Welcome to your homeschool dashboard.",
        });
        setLocation("/parent/dashboard");
      } else {
        await login(email, password);
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        setLocation("/parent/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${currentTheme.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="mb-8">
          <NeuLearnLogo size="lg" variant="horizontal" />
        </div>
        <Card className="w-full max-w-md shadow-xl border-2 border-white/20 bg-white/95 dark:bg-black/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-heading font-semibold text-[var(--neulearn-text-primary)]">
              {isSignUp ? "Create Parent Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Start your homeschool journey with AI-powered curriculum"
                : "Sign in to access your family's learning dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-parent-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-parent-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-parent-submit"
              >
                {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
              </Button>
              <div className="text-center text-sm space-y-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline block mx-auto"
                  data-testid="button-toggle-signup"
                >
                  {isSignUp
                    ? "Already have an account? Log in"
                    : "Need an account? Sign up"}
                </button>
                <Link href="/child/login">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground hover:underline block mx-auto"
                    data-testid="button-switch-to-child"
                  >
                    Child Login →
                  </button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <ThemeInfoBubble theme={currentTheme} />
    </div>
  );
}
