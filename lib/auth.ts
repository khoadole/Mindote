"use client";

import { useCallback, useEffect, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthHookReturn = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    data: { user: User | null; session: Session | null };
    error: any;
  }>;
  signUp: (email: string, password: string, username?: string) => Promise<any>;
  resetPassword: (
    email: string,
    options?: { redirectTo?: string }
  ) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  signOut: () => Promise<any>;
};

export function useAuth(): AuthHookReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error("Failed to fetch auth session", error);
        setUser(null);
        setSession(null);
      } else {
        setUser(data.session?.user ?? null);
        setSession(data.session ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setUser(nextSession?.user ?? null);
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username?: string) => {
      const supabase = createClient();
      const userMetadata = username ? { username } : undefined;

      return supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // username: username, // Lưu vào metadata
            // full_name: username, // Lưu vào display name
            display_name: username,
          },
        },
      });
    },
    []
  );

  const resetPassword = useCallback(
    async (email: string, options?: { redirectTo?: string }) => {
      const supabase = createClient();
      return supabase.auth.resetPasswordForEmail(email, options);
    },
    []
  );

  const updatePassword = useCallback(async (password: string) => {
    const supabase = createClient();
    return supabase.auth.updateUser({ password });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    return supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
  };
}
