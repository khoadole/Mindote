"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useUpdateWord } from "@/hooks/use-words";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from "lucide-react";

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

interface EditWordModalProps {
  word: {
    id: string;
    term: string;
    definition: string;
    example?: string | null;
    phonetic?: string | null;
    partOfSpeech?: string | null;
    score?: number;
    createdAt?: string;
    collectionId?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWordModal({
  word,
  open,
  onOpenChange,
}: EditWordModalProps) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");

  const updateWordMutation = useUpdateWord();
  const { toast } = useToast();

  // Update form fields when word changes
  useEffect(() => {
    if (word && open) {
      setTerm(word.term);
      setDefinition(word.definition);
      setExample(word.example || "");
      setPhonetic(word.phonetic || "");
      setPartOfSpeech(word.partOfSpeech || "");
    }
  }, [word, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!word || !term.trim() || !definition.trim()) {
      return;
    }

    updateWordMutation.mutate(
      {
        wordId: word.id,
        data: {
          term: term.trim(),
          definition: definition.trim(),
          example: example.trim() || undefined,
          phonetic: phonetic.trim() || undefined,
          partOfSpeech: partOfSpeech.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form to original values
    if (word) {
      setTerm(word.term);
      setDefinition(word.definition);
      setExample(word.example || "");
      setPhonetic(word.phonetic || "");
      setPartOfSpeech(word.partOfSpeech || "");
    }
  };

  if (!word) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Word</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-term">Term</Label>
            <Input
              id="edit-term"
              value={term}
              onChange={(e) => setTerm(e.target.value.slice(0, 80))}
              placeholder="Enter the word or phrase"
              required
              disabled={updateWordMutation.isPending}
              maxLength={80}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {term.length}/80 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-definition">Definition</Label>
            <Textarea
              id="edit-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter the definition"
              required
              rows={3}
              disabled={updateWordMutation.isPending}
              className="resize-none break-all"
              style={{ wordBreak: "break-all" }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-example">Example</Label>
            <Textarea
              id="edit-example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Enter an example sentence"
              rows={2}
              disabled={updateWordMutation.isPending}
              className="resize-none break-all"
              style={{ wordBreak: "break-all" }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phonetic">Phonetic</Label>
            <Input
              id="edit-phonetic"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value.slice(0, 80))}
              placeholder="e.g., /ˈæpəl/"
              maxLength={80}
              disabled={updateWordMutation.isPending}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {phonetic.length}/80 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-partOfSpeech">Part of Speech (Optional)</Label>
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
                disabled={updateWordMutation.isPending}
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
                id="edit-partOfSpeech"
                value={
                  PARTS_OF_SPEECH.find((pos) => pos.value === partOfSpeech)
                    ? ""
                    : partOfSpeech
                }
                onChange={(e) => setPartOfSpeech(e.target.value.slice(0, 50))}
                placeholder="Or type custom part of speech"
                maxLength={50}
                disabled={
                  updateWordMutation.isPending ||
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateWordMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateWordMutation.isPending}>
              {updateWordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
