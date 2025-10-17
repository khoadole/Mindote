"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useCreateWord } from "@/hooks/use-words";
import { useCollections } from "@/hooks/use-collections";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudSaveIndicator } from "@/components/ui/cloud-save-indicator";
import { Plus, Loader2 } from "lucide-react";

interface AddWordModalProps {
  collectionId?: string;
  trigger?: React.ReactNode;
  defaultTerm?: string;
  defaultDefinition?: string;
  defaultExample?: string;
}

export function AddWordModal({
  collectionId,
  trigger,
  defaultTerm = "",
  defaultDefinition = "",
  defaultExample = "",
}: AddWordModalProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState(defaultTerm);
  const [definition, setDefinition] = useState(defaultDefinition);
  const [example, setExample] = useState(defaultExample);
  const [phonetic, setPhonetic] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>(
    collectionId || ""
  );
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  );
  const [lastSaved, setLastSaved] = useState<Date>();

  const { data: collections } = useCollections();
  const createWordMutation = useCreateWord();

  // Track mutation status for cloud save indicator
  useEffect(() => {
    if (createWordMutation.isPending) {
      setSaveStatus("saving");
    } else if (createWordMutation.isSuccess) {
      setSaveStatus("saved");
      setLastSaved(new Date());
    } else if (createWordMutation.isError) {
      setSaveStatus("error");
    }
  }, [
    createWordMutation.isPending,
    createWordMutation.isSuccess,
    createWordMutation.isError,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!term.trim() || !definition.trim() || !selectedCollection) {
      return;
    }

    createWordMutation.mutate(
      {
        collectionId: selectedCollection,
        term: term.trim(),
        definition: definition.trim(),
        example: example.trim() || undefined,
        phonetic: phonetic.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setTerm("");
          setDefinition("");
          setExample("");
          setPhonetic("");
          if (!collectionId) {
            setSelectedCollection("");
          }
          setOpen(false);
        },
      }
    );
  };

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Add Word
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Word</DialogTitle>
            {createWordMutation.isPending && (
              <CloudSaveIndicator
                status={saveStatus}
                lastSaved={lastSaved}
                showText={false}
              />
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term">Term *</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Enter the word or phrase"
              required
              disabled={createWordMutation.isPending}
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

          {!collectionId && (
            <div className="space-y-2">
              <Label htmlFor="collection">Collection *</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
                disabled={createWordMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {(collections || []).map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createWordMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createWordMutation.isPending}>
              {createWordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Word"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
