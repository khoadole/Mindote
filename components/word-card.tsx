"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import type { Word } from "@/lib/types"
import { Edit, Trash2, Volume2 } from "lucide-react"

interface WordCardProps {
  word: Word
  onEdit?: () => void
  onDelete?: () => void
}

export function WordCard({ word, onEdit, onDelete }: WordCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { collections } = useAppStore()

  const collection = collections.find((c) => c.id === word.collectionId)

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetails(true)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{word.term}</h3>
                {word.phonetic && <span className="text-sm text-muted-foreground">{word.phonetic}</span>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{word.definition}</p>
              {collection && (
                <Badge variant="secondary" className="text-xs">
                  {collection.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {word.term}
              {word.phonetic && <span className="text-sm font-normal text-muted-foreground">{word.phonetic}</span>}
              <Button size="sm" variant="ghost">
                <Volume2 className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Definition</h4>
              <p className="text-muted-foreground">{word.definition}</p>
            </div>

            {word.example && (
              <div>
                <h4 className="font-medium mb-2">Example</h4>
                <p className="text-muted-foreground italic">"{word.example}"</p>
              </div>
            )}

            {collection && (
              <div>
                <h4 className="font-medium mb-2">Collection</h4>
                <Badge variant="secondary">{collection.name}</Badge>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
