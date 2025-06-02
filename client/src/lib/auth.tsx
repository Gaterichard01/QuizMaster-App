import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "./queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  const { data: userData, isLoading: userLoading } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [userData]);

  useEffect(() => {
    setIsLoading(userLoading);
  }, [userLoading]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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
