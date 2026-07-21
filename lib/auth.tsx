"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  usernameOrEmail: string;
  userNumber?: string;
  fullName: string;
  role: "driver" | "site_manager" | "admin";
}

interface AuthContextType {
  user: User | null;
  login: (usernameOrEmail: string, userNumber: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load session from localStorage on load
    const stored = localStorage.getItem("ops_gate_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("ops_gate_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Simple route gating
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = pathname === "/login";
      if (!user && !isPublicPath) {
        router.push("/login");
      } else if (user && isPublicPath) {
        router.push("/dashboard");
      }
    }
  }, [user, pathname, isLoading, router]);

  const login = async (
    usernameOrEmail: string,
    userNumber: string,
    password?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API request/delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Determine mock role/details based on input
    let fullName = "Demo Operator";
    let role: "driver" | "site_manager" | "admin" = "driver";

    const cleanInput = usernameOrEmail.toLowerCase();
    if (cleanInput.includes("thandi") || userNumber === "03" || cleanInput.includes("manager")) {
      fullName = "Thandi Khumalo";
      role = "site_manager";
    } else if (cleanInput.includes("sipho") || userNumber === "01") {
      fullName = "Sipho Ndlovu";
      role = "driver";
    } else if (cleanInput.includes("ben") || userNumber === "02") {
      fullName = "Ben van der Merwe";
      role = "driver";
    } else if (cleanInput.includes("admin")) {
      fullName = "Compliance Officer";
      role = "admin";
    }

    const loggedUser: User = {
      usernameOrEmail,
      userNumber: userNumber || "EMP-001",
      fullName,
      role,
    };

    localStorage.setItem("ops_gate_user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("ops_gate_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
