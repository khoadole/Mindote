"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2 } from "lucide-react";

// ✅ Lazy load modals
const AddWordModal = dynamic(
  () =>
    import("@/components/modals/add-word-modal").then((mod) => ({
      default: mod.AddWordModal,
    })),
  { ssr: false }
);

const CreateCollectionModal = dynamic(
  () =>
    import("@/components/modals/create-collection-modal").then((mod) => ({
      default: mod.CreateCollectionModal,
    })),
  { ssr: false }
);

export default function CollectionsPage() {
  const { data: collections, isLoading } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading collections...</span>
        </div>
      </div>
    );
  }

  const filteredCollections = (collections || []).filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground">
              Organize your vocabulary by topics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddWordModal />
            <CreateCollectionModal />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">No collections found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first collection to get started"}
              </p>
              <CreateCollectionModal />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${collection.color}`}
                        />
                        <CardTitle className="text-lg">
                          {collection.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {collection.wordCount} words
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Created{" "}
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                      >
                        Study
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                      >
                        Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
