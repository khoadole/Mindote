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
import {
  Edit,
  Trash2,
  Volume2,
  VolumeX,
  BookOpen,
  MessageSquare,
  Layers,
} from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useTranslation } from "@/lib/i18n-provider";

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
  const { t } = useTranslation();
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
        className="group cursor-pointer card-hover border-2 border-transparent hover:border-primary/30 transition-all duration-300 content-rounded overflow-hidden relative"
        onClick={() => setShowDetails(true)}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br from-primary via-accent to-primary pointer-events-none" />

        <CardContent className="p-5 relative h-[200px] flex flex-col">
          <div className="flex items-start justify-between gap-3 flex-1">
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-xl truncate group-hover:text-primary transition-colors">
                  {word.term}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSpeak}
                  className="shrink-0 h-7 w-7 p-0 rounded-full hover:bg-primary/10"
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4 text-primary animate-pulse" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[24px]">
                {word.phonetic && (
                  <Badge
                    variant="outline"
                    className="text-xs font-mono shrink-0 rounded-lg truncate max-w-[120px]"
                  >
                    {word.phonetic}
                  </Badge>
                )}
                {word.partOfSpeech && (
                  <Badge className="text-xs shrink-0 rounded-lg bg-primary/10 text-primary border-primary/20 truncate max-w-[100px]">
                    {word.partOfSpeech}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed flex-1">
                {word.definition}
              </p>

              {collection && (
                <div className="flex items-center gap-2 mt-auto">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      collection.color || "bg-primary"
                    }`}
                  />
                  <Badge
                    variant="secondary"
                    className="text-xs rounded-lg truncate max-w-[180px]"
                  >
                    {collection.name}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                >
                  <Edit className="h-4 w-4" />
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
                  className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[550px] content-rounded-lg border-2">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-3 pr-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-2xl font-bold break-all bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                    style={{ wordBreak: "break-all" }}
                  >
                    {word.term}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSpeak}
                    className="shrink-0 h-9 w-9 p-0 rounded-full hover:bg-primary/10"
                    title={isSpeaking ? "Stop speaking" : "Speak word"}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-5 w-5 text-primary animate-pulse" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {word.phonetic && (
                    <Badge variant="outline" className="font-mono rounded-lg">
                      {word.phonetic}
                    </Badge>
                  )}
                  {word.partOfSpeech && (
                    <Badge className="rounded-lg bg-primary/10 text-primary border-primary/20">
                      {word.partOfSpeech}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="p-4 rounded-2xl bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" />
                {t("word.definition")}
              </h4>
              <p
                className="text-foreground leading-relaxed break-all"
                style={{ wordBreak: "break-all" }}
              >
                {word.definition}
              </p>
            </div>

            {word.example && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/10">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-accent">
                  <MessageSquare className="h-4 w-4" />
                  {t("word.example")}
                </h4>
                <p
                  className="text-foreground italic leading-relaxed break-all"
                  style={{ wordBreak: "break-all" }}
                >
                  "{word.example}"
                </p>
              </div>
            )}

            {collection && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-card">
                <div
                  className={`h-8 w-8 rounded-lg ${
                    collection.color || "bg-primary"
                  } flex items-center justify-center`}
                >
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("word.collection")}</p>
                  <p className="font-medium">{collection.name}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    onEdit();
                  }}
                  className="rounded-xl hover:bg-primary/5 hover:border-primary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("word.edit")}
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetails(false);
                    onDelete();
                  }}
                  className="rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("word.delete")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
