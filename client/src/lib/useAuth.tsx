import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./api";

interface User {
  id: string;
  email: string;
  role: string;
}

interface Child {
  id: string;
  name: string;
  grade: string;
  parentId: string;
}

interface AuthContextType {
  user: User | null;
  child: Child | null;
  isLoading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginChild: (username: string, pin: string) => Promise<void>;
  impersonateChild: (childId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await apiRequest("/api/auth/me");
        if (data.role === "PARENT") {
          setUser(data);
          setChild(null);
          setIsImpersonating(false);
        } else if (data.role === "CHILD") {
          setChild(data);
          setUser(null);
          setIsImpersonating(!!data.impersonatedByParentId);
        }
      } catch (error) {
        setUser(null);
        setChild(null);
        setIsImpersonating(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setChild(null);
    setIsImpersonating(false);
  };

  const signup = async (email: string, password: string) => {
    const data = await apiRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setChild(null);
    setIsImpersonating(false);
  };

  const loginChild = async (username: string, pin: string) => {
    const data = await apiRequest("/api/auth/child/login", {
      method: "POST",
      body: JSON.stringify({ username, pin }),
    });
    setChild(data.child);
    setUser(null);
    setIsImpersonating(false);
  };

  const impersonateChild = async (childId: string) => {
    const data = await apiRequest(`/api/parent/impersonate/${childId}`, {
      method: "POST",
    });
    setChild(data.child);
    setUser(null);
    setIsImpersonating(true);
  };

  const stopImpersonation = async () => {
    const data = await apiRequest("/api/parent/impersonation/stop", {
      method: "POST",
    });
    setUser(data.user);
    setChild(null);
    setIsImpersonating(false);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
    }
    setUser(null);
    setChild(null);
    setIsImpersonating(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      child, 
      isLoading, 
      isImpersonating,
      login, 
      signup, 
      loginChild, 
      impersonateChild,
      stopImpersonation,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
