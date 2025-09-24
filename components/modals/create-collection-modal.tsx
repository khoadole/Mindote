"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

const colorOptions = [
  { name: "Primary", value: "bg-primary" },
  { name: "Accent", value: "bg-accent" },
  { name: "Chart 1", value: "bg-chart-1" },
  { name: "Chart 2", value: "bg-chart-2" },
  { name: "Chart 3", value: "bg-chart-3" },
  { name: "Chart 4", value: "bg-chart-4" },
  { name: "Chart 5", value: "bg-chart-5" },
]

interface CreateCollectionModalProps {
  trigger?: React.ReactNode
}

export function CreateCollectionModal({ trigger }: CreateCollectionModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [selectedColor, setSelectedColor] = useState("bg-primary")

  const { addCollection } = useAppStore()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Missing collection name",
        description: "Please provide a name for the collection.",
        variant: "destructive",
      })
      return
    }

    addCollection({
      name: name.trim(),
      color: selectedColor,
    })

    toast({
      title: "Collection created!",
      description: `"${name}" collection has been created.`,
    })

    // Reset form
    setName("")
    setSelectedColor("bg-primary")
    setOpen(false)
  }

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
      <Plus className="h-4 w-4" />
      New Collection
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Business English"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-10 rounded-md border-2 transition-all ${color.value} ${
                    selectedColor === color.value ? "border-foreground scale-105" : "border-border"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Collection</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
