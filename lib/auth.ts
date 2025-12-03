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
  signInWithGoogle: (options?: { nonce?: string }) => Promise<any>;
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

    console.log('[useAuth] 🔄 Initializing auth hook');

    // Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      
      console.log('[useAuth] 📊 getSession result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.session?.user,
        userId: data.session?.user?.id,
        error: error?.message 
      });

      if (error) {
        console.error("[useAuth] ❌ Failed to fetch auth session", error);
        setUser(null);
        setSession(null);
      } else {
        console.log('[useAuth] ✅ Session loaded:', {
          userId: data.session?.user?.id,
          email: data.session?.user?.email,
          provider: data.session?.user?.app_metadata?.provider
        });
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
      
      console.log('[useAuth] 🔔 Auth state changed:', {
        event: _event,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id
      });
      
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

  const signInWithGoogle = useCallback(async (options?: { nonce?: string }) => {
    const supabase = createClient();

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        ...(options?.nonce && { nonce: options.nonce }),
      },
    });
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
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
  };
}
