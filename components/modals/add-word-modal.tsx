"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface AddWordModalProps {
  trigger?: React.ReactNode
  defaultTerm?: string
  defaultDefinition?: string
  defaultExample?: string
}

export function AddWordModal({
  trigger,
  defaultTerm = "",
  defaultDefinition = "",
  defaultExample = "",
}: AddWordModalProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState(defaultTerm)
  const [definition, setDefinition] = useState(defaultDefinition)
  const [example, setExample] = useState(defaultExample)
  const [phonetic, setPhonetic] = useState("")
  const [selectedCollection, setSelectedCollection] = useState<string>("")
  const [suggestedCollection, setSuggestedCollection] = useState<string>("")

  const { collections, addWord, addCollection, suggestCollection } = useAppStore()
  const { toast } = useToast()

  const handleTermChange = (value: string) => {
    setTerm(value)
    if (value.trim() && !selectedCollection) {
      const suggested = suggestCollection(value)
      if (suggested) {
        setSuggestedCollection(suggested.id)
      } else {
        // Suggest creating a new collection based on the term
        const words = value.toLowerCase().split(" ")
        const suggestedName =
          words.length > 1
            ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
            : value.charAt(0).toUpperCase() + value.slice(1)
        setSuggestedCollection(`create:${suggestedName}`)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!term.trim() || !definition.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide both term and definition.",
        variant: "destructive",
      })
      return
    }

    let collectionId = selectedCollection || suggestedCollection

    // Handle creating new collection
    if (collectionId.startsWith("create:")) {
      const newCollectionName = collectionId.replace("create:", "")
      const colors = ["bg-primary", "bg-accent", "bg-chart-1", "bg-chart-2", "bg-chart-3"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      addCollection({
        name: newCollectionName,
        color: randomColor,
      })

      // Get the newly created collection
      const newCollection = collections[collections.length - 1]
      collectionId = newCollection?.id || ""
    }

    addWord({
      term: term.trim(),
      definition: definition.trim(),
      example: example.trim() || undefined,
      phonetic: phonetic.trim() || undefined,
      collectionId: collectionId || undefined,
      score: 0,
    })

    toast({
      title: "Word added successfully!",
      description: `"${term}" has been added to your vocabulary.`,
    })

    // Reset form
    setTerm("")
    setDefinition("")
    setExample("")
    setPhonetic("")
    setSelectedCollection("")
    setSuggestedCollection("")
    setOpen(false)
  }

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add Word
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term">Term *</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => handleTermChange(e.target.value)}
              placeholder="Enter the word or phrase"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="definition">Definition *</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter the definition"
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="example">Example</Label>
            <Textarea
              id="example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Enter an example sentence"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phonetic">Phonetic (optional)</Label>
            <Input
              id="phonetic"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder="e.g., /ˈæpəl/"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    suggestedCollection.startsWith("create:")
                      ? `Create "${suggestedCollection.replace("create:", "")}"`
                      : suggestedCollection
                        ? collections.find((c) => c.id === suggestedCollection)?.name || "Auto-suggested"
                        : "Select or auto-suggest collection"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {suggestedCollection && !suggestedCollection.startsWith("create:") && (
                  <SelectItem value={suggestedCollection}>
                    ✨ {collections.find((c) => c.id === suggestedCollection)?.name} (suggested)
                  </SelectItem>
                )}
                {suggestedCollection.startsWith("create:") && (
                  <SelectItem value={suggestedCollection}>
                    ✨ Create "{suggestedCollection.replace("create:", "")}"
                  </SelectItem>
                )}
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Word</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
