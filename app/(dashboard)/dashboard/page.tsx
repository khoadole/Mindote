"use client";

import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useCollections } from "@/hooks/use-collections";
import { useUserStats } from "@/hooks/use-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddWordModal } from "@/components/modals/add-word-modal";
import { CreateCollectionModal } from "@/components/modals/create-collection-modal";
import {
  BookOpen,
  Layers,
  Plus,
  Candy as Cards,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: stats, isLoading: statsLoading } = useUserStats();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const totalWords = stats?.totalWords || 0;
  const totalCollections = stats?.totalCollections || 0;
  const dueToday = Math.floor(totalWords * 0.3); // Mock calculation

  const recentCollections = (collections || []).slice(0, 5);

  const isLoading = collectionsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <CreateCollectionModal />
          <Link href="/flashcards">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Cards className="h-4 w-4" />
              Start Flashcards
            </Button>
          </Link>
          <Link href="/quiz">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <CheckCircle className="h-4 w-4" />
              Start Quiz
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWords}</div>
              <p className="text-xs text-muted-foreground">
                Keep building your vocabulary
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCollections}</div>
              <p className="text-xs text-muted-foreground">
                Organized learning topics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dueToday}</div>
              <p className="text-xs text-muted-foreground">
                Words ready for review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Collections */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Collections</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCollections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No collections yet. Create your first collection to get
                  started!
                </p>
                <CreateCollectionModal />
              </div>
            ) : (
              <div className="space-y-4">
                {recentCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          collection.color || "bg-primary"
                        }`}
                      />
                      <div>
                        <h3 className="font-medium">{collection.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {collection.wordCount || 0} words
                        </p>
                      </div>
                    </div>
                    <Link href={`/collections/${collection.id}`}>
                      <Button size="sm" variant="outline">
                        Study
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
