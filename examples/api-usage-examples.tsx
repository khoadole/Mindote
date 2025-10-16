/**
 * Example: How to use the new API routes in your components
 *
 * This file demonstrates how to replace Zustand local state
 * with API calls to the backend.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type Collection = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  words?: Word[];
};

type Word = {
  id: string;
  term: string;
  definition: string;
  example?: string;
  phonetic?: string;
  score: number;
  createdAt: string;
  collectionId: string;
};

type Settings = {
  id: string;
  userId: string;
  srsEnabled: boolean;
  ttsEnabled: boolean;
  theme: string;
  createdAt: string;
};

// =====================================================
// EXAMPLE 1: Fetch Collections
// =====================================================

export function CollectionsExample() {
  const { user, loading: authLoading } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    fetchCollections();
  }, [user, authLoading]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/collections");

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please login first");
          return;
        }
        throw new Error("Failed to fetch collections");
      }

      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (name: string, color: string) => {
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        throw new Error("Failed to create collection");
      }

      const newCollection = await response.json();
      setCollections([...collections, newCollection]);
      toast.success("Collection created!");

      return newCollection;
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
      throw error;
    }
  };

  const updateCollection = async (
    id: string,
    updates: { name?: string; color?: string }
  ) => {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update collection");
      }

      const updatedCollection = await response.json();
      setCollections(
        collections.map((c) => (c.id === id ? updatedCollection : c))
      );
      toast.success("Collection updated!");

      return updatedCollection;
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
      throw error;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete collection");
      }

      setCollections(collections.filter((c) => c.id !== id));
      toast.success("Collection deleted!");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
      throw error;
    }
  };

  // Render UI...
  return (
    <div>
      {/* Your UI here */}
      <button onClick={() => createCollection("New Collection", "#FF5733")}>
        Create Collection
      </button>
    </div>
  );
}

// =====================================================
// EXAMPLE 2: Using SWR (Recommended)
// =====================================================

/**
 * Install SWR first:
 * pnpm add swr
 *
 * SWR provides:
 * - Automatic caching
 * - Revalidation
 * - Loading states
 * - Error handling
 */

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CollectionsWithSWR() {
  const { user } = useAuth();

  // Auto-fetch and cache collections
  const {
    data: collections,
    error,
    isLoading,
  } = useSWR<Collection[]>(user ? "/api/collections" : null, fetcher);

  const createCollection = async (name: string, color: string) => {
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) throw new Error("Failed to create");

      const newCollection = await response.json();

      // Revalidate cache
      mutate("/api/collections");

      toast.success("Collection created!");
      return newCollection;
    } catch (error) {
      toast.error("Failed to create collection");
      throw error;
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading collections</div>;

  return (
    <div>
      <h2>Collections ({collections?.length || 0})</h2>
      {/* Render collections */}
    </div>
  );
}

// =====================================================
// EXAMPLE 3: Using React Query (Recommended)
// =====================================================

/**
 * Install React Query first:
 * pnpm add @tanstack/react-query
 *
 * React Query provides:
 * - Better TypeScript support
 * - Mutations with optimistic updates
 * - DevTools
 * - Query invalidation
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function CollectionsWithReactQuery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch collections
  const {
    data: collections,
    isLoading,
    error,
  } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user, // Only fetch when user is logged in
  });

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created!");
    },
    onError: () => {
      toast.error("Failed to create collection");
    },
  });

  // Update collection mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      color?: string;
    }) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection updated!");
    },
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted!");
    },
  });

  return (
    <div>
      <button
        onClick={() =>
          createMutation.mutate({ name: "New Collection", color: "#FF5733" })
        }
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Creating..." : "Create Collection"}
      </button>

      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}

      <div>
        {collections?.map((collection) => (
          <div key={collection.id}>
            <h3>{collection.name}</h3>
            <button
              onClick={() =>
                updateMutation.mutate({
                  id: collection.id,
                  name: "Updated Name",
                })
              }
            >
              Update
            </button>
            <button onClick={() => deleteMutation.mutate(collection.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 4: Custom Hook Pattern
// =====================================================

export function useCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCollections(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (name: string, color: string) => {
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error("Failed to create");
    const newCollection = await res.json();
    setCollections([...collections, newCollection]);
    return newCollection;
  };

  const updateCollection = async (
    id: string,
    updates: { name?: string; color?: string }
  ) => {
    const res = await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update");
    const updated = await res.json();
    setCollections(collections.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCollection = async (id: string) => {
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    setCollections(collections.filter((c) => c.id !== id));
  };

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch: fetchCollections,
  };
}

// Usage in component:
export function MyComponent() {
  const {
    collections,
    loading,
    createCollection,
    updateCollection,
    deleteCollection,
  } = useCollections();

  // Use the hook...
}

// =====================================================
// RECOMMENDED APPROACH
// =====================================================

/**
 * Tôi đề xuất dùng React Query vì:
 *
 * 1. ✅ Automatic caching và revalidation
 * 2. ✅ Better TypeScript support
 * 3. ✅ Mutations với optimistic updates
 * 4. ✅ DevTools để debug
 * 5. ✅ Loading và error states tự động
 * 6. ✅ Request deduplication
 * 7. ✅ Background refetching
 *
 * Setup React Query:
 *
 * 1. Install:
 *    pnpm add @tanstack/react-query
 *
 * 2. Wrap app với QueryClientProvider:
 *
 *    // app/layout.tsx
 *    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 *
 *    const queryClient = new QueryClient();
 *
 *    export default function RootLayout({ children }) {
 *      return (
 *        <QueryClientProvider client={queryClient}>
 *          {children}
 *        </QueryClientProvider>
 *      );
 *    }
 *
 * 3. Use hooks như example trên!
 */
