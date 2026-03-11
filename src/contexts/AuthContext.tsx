"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { user: userData } = await api.getMe();

      // Only allow admin and superadmin roles
      if (userData.role !== "admin" && userData.role !== "superadmin") {
        api.setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error("Failed to load user:", error);
      api.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { accessToken, user: userData } = await api.login(email, password);

    // Only allow admin and superadmin roles
    if (userData.role !== "admin" && userData.role !== "superadmin") {
      throw new Error("Access denied. Admin privileges required.");
    }

    api.setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && (user.role === "admin" || user.role === "superadmin"),
        login,
        logout,
        changePassword,
      }}
    >
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
