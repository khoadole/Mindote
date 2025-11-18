"use client";

import type React from "react";

import { useState } from "react";
import { useCreateCollection } from "@/hooks/use-collections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/difficulty-levels";

const colorOptions = [
  { name: "Primary", value: "bg-primary" },
  { name: "Accent", value: "bg-accent" },
  { name: "Chart 1", value: "bg-chart-1" },
  { name: "Chart 2", value: "bg-chart-2" },
  { name: "Chart 3", value: "bg-chart-3" },
  { name: "Chart 4", value: "bg-chart-4" },
  { name: "Chart 5", value: "bg-chart-5" },
];

interface CreateCollectionModalProps {
  trigger?: React.ReactNode;
}

export function CreateCollectionModal({ trigger }: CreateCollectionModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-primary");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("");

  const createCollectionMutation = useCreateCollection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    createCollectionMutation.mutate(
      {
        name: name.trim(),
        color: selectedColor,
        difficultyLevel: difficultyLevel || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setName("");
          setSelectedColor("bg-primary");
          setDifficultyLevel("");
          setOpen(false);
        },
      }
    );
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      className="flex items-center gap-2 rounded-2xl border-2 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-transparent dark:to-transparent border-transparent dark:border-border text-white dark:text-foreground hover:from-blue-600 hover:to-cyan-600 dark:hover:border-primary dark:hover:bg-primary/5 transition-all hover:scale-105 shadow-lg dark:shadow-sm font-semibold"
    >
      <Plus className="h-4 w-4" />
      New Collection
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder="e.g., Business English"
              required
              maxLength={80}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/80 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-10 rounded-md border-2 transition-all ${
                    color.value
                  } ${
                    selectedColor === color.value
                      ? "border-foreground scale-105"
                      : "border-border"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level (Optional)</Label>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {level.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Helps organize your collections by learning level
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createCollectionMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCollectionMutation.isPending}>
              {createCollectionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Collection"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
