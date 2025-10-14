"use client";

import { useAppStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
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
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { words, collections } = useAppStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const totalWords = words.length;
  const totalCollections = collections.length;
  const dueToday = Math.floor(totalWords * 0.3); // Mock calculation

  const recentCollections = collections.slice(0, 5);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <AddWordModal
            trigger={
              <Button
                className="flex items-center gap-2"
                data-shortcut="add-word"
              >
                <Plus className="h-4 w-4" />
                Add Word
              </Button>
            }
          />
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
            <div className="space-y-4">
              {recentCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-3 w-3 rounded-full ${collection.color}`}
                    />
                    <div>
                      <h3 className="font-medium">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {
                          words.filter((w) => w.collectionId === collection.id)
                            .length
                        }{" "}
                        words
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
