import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/components/ui/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

interface RegisterData {
  username: string;
  password: string;
  name: string;
  userType: "farmer" | "buyer";
  location?: string | null;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  message?: string;
  error?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);
AuthContext.displayName = "AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/user", {
          method: "GET",
          credentials: "include",
        });
        return response.user;
      } catch (error) {
        if ((error as Error).message.includes("Not authenticated") || 
            (error as Error).message.includes("Unauthorized")) {
          return null;
        }
        throw error;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }) as AuthResponse;

      if (!response.success) {
        throw new Error(response.message || response.error || "Login failed");
      }

      return response.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }) as AuthResponse;

      if (!response.success) {
        throw new Error(response.message || response.error || "Registration failed");
      }

      return response.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Registered successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/auth/logout", {
        method: "POST",
      }) as AuthResponse;

      if (!response.success) {
        throw new Error(response.message || response.error || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
