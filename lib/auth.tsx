"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demoData";

export interface User {
  usernameOrEmail: string;
  userNumber?: string;
  fullName: string;
  role: "driver" | "site_manager" | "admin";
  avatarUrl?: string | null;
  orgName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (usernameOrEmail: string, userNumber: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    usernameOrEmail: "thandi@fleet.co",
    userNumber: "03",
    fullName: "Thandi Khumalo",
    role: "site_manager",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    orgName: "Demo Fleet Co",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      // 1. If in Demo Mode, fetch session from local storage
      if (isDemoMode()) {
        const stored = localStorage.getItem("ops_gate_user");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {
            localStorage.removeItem("ops_gate_user");
          }
        }
        setIsLoading(false);
        return;
      }

      // 2. Otherwise, fetch session from Supabase Client
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, organisations(name)")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser({
            usernameOrEmail: session.user.email ?? "",
            userNumber: profile.user_number ?? "",
            fullName: profile.full_name ?? "Operator",
            role: (profile.role as any) || "driver",
            avatarUrl: profile.avatar_url,
            orgName: profile.organisations?.name ?? "Demo Fleet Co",
          });
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Simple route gating (disabled for direct access/building)
  /*
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
  */

  const login = async (
    usernameOrEmail: string,
    userNumber: string,
    password?: string
  ): Promise<boolean> => {
    setIsLoading(true);

    // 1. Fallback for Demo Mode
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      let fullName = "Demo Operator";
      let role: "driver" | "site_manager" | "admin" = "driver";
      let avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";

      const cleanInput = usernameOrEmail.toLowerCase();
      if (cleanInput.includes("thandi") || userNumber === "03" || cleanInput.includes("manager")) {
        fullName = "Thandi Khumalo";
        role = "site_manager";
        avatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80";
      } else if (cleanInput.includes("sipho") || userNumber === "01") {
        fullName = "Sipho Ndlovu";
        role = "driver";
        avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";
      } else if (cleanInput.includes("ben") || userNumber === "02") {
        fullName = "Ben van der Merwe";
        role = "driver";
        avatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80";
      } else if (cleanInput.includes("admin")) {
        fullName = "Compliance Officer";
        role = "admin";
        avatarUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80";
      }

      const loggedUser: User = {
        usernameOrEmail,
        userNumber: userNumber || "EMP-001",
        fullName,
        role,
        avatarUrl,
        orgName: "Demo Fleet Co",
      };

      localStorage.setItem("ops_gate_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      setIsLoading(false);
      return true;
    }

    // 2. Real Supabase Auth Flow
    try {
      const supabase = createClient();
      let email = usernameOrEmail;

      // Resolve login identifier to email address
      const identifier = usernameOrEmail || userNumber;
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
        "resolve_login_email",
        { identifier }
      );

      if (!rpcError && resolvedEmail) {
        email = resolvedEmail;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || "",
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Invalid credentials.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*, organisations(name)")
        .eq("id", authData.user.id)
        .single();

      if (!profile) {
        throw new Error("No corresponding operator profile found.");
      }

      const loggedUser: User = {
        usernameOrEmail: email,
        userNumber: profile.user_number ?? "",
        fullName: profile.full_name ?? "Operator",
        role: (profile.role as any) || "driver",
        avatarUrl: profile.avatar_url,
        orgName: profile.organisations?.name ?? "Demo Fleet Co",
      };

      setUser(loggedUser);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    if (isDemoMode()) {
      localStorage.removeItem("ops_gate_user");
      setUser(null);
      router.push("/login");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
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
