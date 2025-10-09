"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AuthHookReturn = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => ReturnType<typeof supabase.auth.signInWithPassword>;
  signUp: (
    email: string,
    password: string,
    username?: string
  ) => ReturnType<typeof supabase.auth.signUp>;
  resetPassword: (
    email: string,
    options?: { redirectTo?: string }
  ) => ReturnType<typeof supabase.auth.resetPasswordForEmail>;
  updatePassword: (
    password: string
  ) => ReturnType<typeof supabase.auth.updateUser>;
  signOut: () => ReturnType<typeof supabase.auth.signOut>;
};

export function useAuth(): AuthHookReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

  const signIn = useCallback<AuthHookReturn["signIn"]>(
    (email, password) =>
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
    []
  );

  const signUp = useCallback<AuthHookReturn["signUp"]>(
    (email, password, username) => {
      const userMetadata = username ? { username } : undefined;

      return supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
        },
      });
    },
    []
  );

  const resetPassword = useCallback<AuthHookReturn["resetPassword"]>(
    (email, options) => supabase.auth.resetPasswordForEmail(email, options),
    []
  );

  const updatePassword = useCallback<AuthHookReturn["updatePassword"]>(
    (password) =>
      supabase.auth.updateUser({
        password,
      }),
    []
  );

  const signOut = useCallback<AuthHookReturn["signOut"]>(
    () => supabase.auth.signOut(),
    []
  );

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
