import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrentTheme } from "@/lib/gospelThemes";
import NeuLearnLogo from "./NeuLearnLogo";
import ThemeInfoBubble from "./ThemeInfoBubble";

export default function ChildLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const { loginChild } = useAuth();
  const { toast } = useToast();
  const currentTheme = useCurrentTheme();

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginChild(username, pin.join(""));
      toast({
        title: "Welcome back!",
        description: `Let's start learning, ${username}!`,
      });
      setLocation("/child/home");
    } catch (error: any) {
      toast({
        title: "Oops!",
        description: error.message || "Wrong username or PIN. Try again!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 font-child relative"
      style={{
        backgroundImage: `url(${currentTheme.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="mb-6">
          <NeuLearnLogo size="lg" variant="horizontal" />
        </div>
        <Card className="w-full max-w-md shadow-xl border-2 border-white/20 bg-white/95 dark:bg-black/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-[var(--neulearn-text-primary)]">
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-xl font-semibold">Your Name</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-16 text-xl"
                data-testid="input-child-username"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xl font-semibold">Your PIN</Label>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, index) => (
                  <Input
                    key={index}
                    id={`pin-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    className="w-16 h-16 text-center text-2xl font-bold"
                    required
                    data-testid={`input-child-pin-${index}`}
                  />
                ))}
              </div>
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-16 text-xl font-semibold rounded-2xl" 
              disabled={isLoading}
              data-testid="button-child-login"
            >
              {isLoading ? "Loading..." : "Let's Learn!"}
            </Button>
            <div className="text-center mt-4">
              <Link href="/parent/login">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:underline text-sm"
                  data-testid="button-switch-to-parent"
                >
                  ← Parent Login
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
