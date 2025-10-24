"use client";

import type React from "react";

import { useState } from "react";
import { useCreateWord } from "@/hooks/use-words";
import { useCollections } from "@/hooks/use-collections";
import { useToast } from "@/hooks/use-toast";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

// Common parts of speech
const PARTS_OF_SPEECH = [
  { value: "noun", label: "Noun" },
  { value: "pronoun", label: "Pronoun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conjunction" },
  { value: "interjection", label: "Interjection" },
];

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
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>(
    collectionId || ""
  );

  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const createWordMutation = useCreateWord();
  const { toast } = useToast();

  // Check if user has any collections
  const hasCollections = collections && collections.length > 0;

  // Handle dialog open - check for collections first
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !collectionId && !hasCollections && !collectionsLoading) {
      // User is trying to add word but has no collections
      toast({
        title: "No Collections Available",
        description: "Please create a collection first before adding words.",
        variant: "destructive",
      });
      return; // Don't open the dialog
    }
    setOpen(newOpen);
  };

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
        partOfSpeech: partOfSpeech.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setTerm("");
          setDefinition("");
          setExample("");
          setPhonetic("");
          setPartOfSpeech("");
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
        </DialogHeader>

        {/* Warning if no collections available when dialog is open */}
        {!collectionId && !hasCollections && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to create a collection first.{" "}
              <Link
                href="/collections"
                className="underline font-medium"
                onClick={() => setOpen(false)}
              >
                Go to Collections
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value.slice(0, 80))}
              placeholder="Enter the word or phrase"
              required
              disabled={createWordMutation.isPending}
              maxLength={80}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {term.length}/80 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="definition">Definition</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter the definition"
              required
              rows={3}
              className="resize-none break-all"
              style={{ wordBreak: "break-all" }}
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
              className="resize-none break-all"
              style={{ wordBreak: "break-all" }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phonetic">Phonetic</Label>
            <Input
              id="phonetic"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value.slice(0, 80))}
              placeholder="e.g., /ˈæpəl/"
              maxLength={80}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {phonetic.length}/80 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partOfSpeech">Part of Speech (Optional)</Label>
            <div className="flex gap-2">
              <Select
                value={
                  PARTS_OF_SPEECH.find((pos) => pos.value === partOfSpeech)
                    ?.value || "custom"
                }
                onValueChange={(value) => {
                  if (value === "custom") {
                    setPartOfSpeech("");
                  } else {
                    setPartOfSpeech(value);
                  }
                }}
                disabled={createWordMutation.isPending}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PARTS_OF_SPEECH.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="partOfSpeech"
                value={
                  PARTS_OF_SPEECH.find((pos) => pos.value === partOfSpeech)
                    ? ""
                    : partOfSpeech
                }
                onChange={(e) => setPartOfSpeech(e.target.value.slice(0, 50))}
                placeholder="Or type custom part of speech"
                maxLength={50}
                disabled={
                  createWordMutation.isPending ||
                  PARTS_OF_SPEECH.some((pos) => pos.value === partOfSpeech)
                }
                className="flex-1"
              />
            </div>
            {partOfSpeech && (
              <p className="text-xs text-muted-foreground">
                {PARTS_OF_SPEECH.find((pos) => pos.value === partOfSpeech)
                  ? `Selected: ${
                      PARTS_OF_SPEECH.find((pos) => pos.value === partOfSpeech)
                        ?.label
                    }`
                  : `Custom: ${partOfSpeech} (${partOfSpeech.length}/50)`}
              </p>
            )}
          </div>

          {!collectionId && (
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
                disabled={createWordMutation.isPending || !hasCollections}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !hasCollections
                        ? "No collections available"
                        : "Select a collection"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(collections || []).map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!hasCollections && (
                <p className="text-xs text-destructive">
                  Please create a collection first
                </p>
              )}
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
            <Button
              type="submit"
              disabled={
                createWordMutation.isPending ||
                (!collectionId && !hasCollections)
              }
            >
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
