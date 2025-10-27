"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Word } from "@/lib/types";
import { Edit, Trash2, Volume2, VolumeX } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

interface WordCardProps {
  word: Word & {
    collection?: {
      id: string;
      name: string;
      color: string;
    } | null;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WordCard({ word, onEdit, onDelete }: WordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const collection = word.collection;
  const { speak, isSpeaking, stop } = useTextToSpeech({
    lang: "en-US",
    rate: 0.9,
  });

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stop();
    } else {
      // Only speak the term (vocabulary word)
      speak(word.term);
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        onClick={() => setShowDetails(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{word.term}</h3>
                {word.phonetic && (
                  <span className="text-sm text-muted-foreground shrink-0">
                    {word.phonetic}
                  </span>
                )}
                {word.partOfSpeech && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {word.partOfSpeech}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">
                {word.definition}
              </p>
              {collection && (
                <Badge
                  variant="secondary"
                  className="text-xs truncate max-w-full"
                >
                  {collection.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
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
                    e.stopPropagation();
                    onDelete();
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
            <DialogTitle className="flex items-start gap-2 pr-8">
              <span className="break-all" style={{ wordBreak: "break-all" }}>
                {word.term}
              </span>
              {word.phonetic && (
                <span
                  className="text-sm font-normal text-muted-foreground shrink-0 break-all"
                  style={{ wordBreak: "break-all" }}
                >
                  {word.phonetic}
                </span>
              )}
              {word.partOfSpeech && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {word.partOfSpeech}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSpeak}
                className="shrink-0"
                title={isSpeaking ? "Stop speaking" : "Speak word"}
              >
                {isSpeaking ? (
                  <VolumeX className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Definition</h4>
              <p
                className="text-muted-foreground break-all"
                style={{ wordBreak: "break-all" }}
              >
                {word.definition}
              </p>
            </div>

            {word.example && (
              <div>
                <h4 className="font-medium mb-2">Example</h4>
                <p
                  className="text-muted-foreground italic break-all"
                  style={{ wordBreak: "break-all" }}
                >
                  "{word.example}"
                </p>
              </div>
            )}

            {word.partOfSpeech && (
              <div>
                <h4 className="font-medium mb-2">Part of Speech</h4>
                <Badge variant="outline" className="inline-block">
                  {word.partOfSpeech}
                </Badge>
              </div>
            )}

            {collection && (
              <div>
                <h4 className="font-medium mb-2">Collection</h4>
                <div className="break-all" style={{ wordBreak: "break-all" }}>
                  <Badge variant="secondary" className="inline-block">
                    {collection.name}
                  </Badge>
                </div>
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
  );
}
