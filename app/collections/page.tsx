"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { useAppContext } from "@/lib/app-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddWordModal } from "@/components/modals/add-word-modal"
import { CreateCollectionModal } from "@/components/modals/create-collection-modal"
import { Search, Filter } from "lucide-react"

export default function CollectionsPage() {
  const { mounted } = useAppContext()
  const { collections, words } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")

  if (!mounted) {
    return null
  }

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getWordCount = (collectionId: string) => {
    return words.filter((word) => word.collectionId === collectionId).length
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Collections</h1>
                <p className="text-muted-foreground">Organize your vocabulary by topics</p>
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
                    {searchQuery ? "Try adjusting your search terms" : "Create your first collection to get started"}
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
                            <div className={`h-3 w-3 rounded-full ${collection.color}`} />
                            <CardTitle className="text-lg">{collection.name}</CardTitle>
                          </div>
                          <Badge variant="secondary">{getWordCount(collection.id)} words</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Created {new Date(collection.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            Study
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
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
        </main>
      </div>
    </div>
  )
}
