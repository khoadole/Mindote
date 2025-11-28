"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useCreateWord } from "@/hooks/use-words";
import { useCollections } from "@/hooks/use-collections";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { useAIFill } from "@/hooks/use-ai-fill";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { useTranslation } from "@/lib/i18n-provider";
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
import { Plus, Loader2, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

// Common parts of speech
// Common parts of speech
// Moved inside component for translation

interface AddWordModalProps {
  collectionId?: string;
  trigger?: React.ReactNode;
  defaultTerm?: string;
  defaultDefinition?: string;
  defaultExample?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddWordModal({
  collectionId,
  trigger,
  defaultTerm = "",
  defaultDefinition = "",
  defaultExample = "",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddWordModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>(
    collectionId || ""
  );

  // Language selections
  const [termLanguage, setTermLanguage] = useState(DEFAULT_LANGUAGE);
  const [definitionLanguage, setDefinitionLanguage] =
    useState(DEFAULT_LANGUAGE);
  const [exampleLanguage, setExampleLanguage] = useState(DEFAULT_LANGUAGE);

  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: settings } = useSettings();
  const createWordMutation = useCreateWord();
  const { toast } = useToast();
  const { t } = useTranslation();
  const {
    fillWord,
    isLoading: isAILoading,
    usageInfo,
    fetchUsageInfo,
  } = useAIFill();

  const PARTS_OF_SPEECH = [
    { value: "noun", label: t("components.addWordModal.partsOfSpeech.noun") },
    { value: "pronoun", label: t("components.addWordModal.partsOfSpeech.pronoun") },
    { value: "verb", label: t("components.addWordModal.partsOfSpeech.verb") },
    { value: "adjective", label: t("components.addWordModal.partsOfSpeech.adjective") },
    { value: "adverb", label: t("components.addWordModal.partsOfSpeech.adverb") },
    { value: "preposition", label: t("components.addWordModal.partsOfSpeech.preposition") },
    { value: "conjunction", label: t("components.addWordModal.partsOfSpeech.conjunction") },
    { value: "interjection", label: t("components.addWordModal.partsOfSpeech.interjection") },
  ];

  // Update form fields when defaults change (when modal opens with new data)
  useEffect(() => {
    if (open) {
      setTerm(defaultTerm);
      setDefinition(defaultDefinition);
      setExample(defaultExample);

      // Set default languages from user settings
      const defaultLang = settings?.learningLanguage || DEFAULT_LANGUAGE;
      setTermLanguage(defaultLang);
      setDefinitionLanguage(defaultLang);
      setExampleLanguage(defaultLang);

      // Fetch AI usage info when modal opens
      fetchUsageInfo();
    }
  }, [open, defaultTerm, defaultDefinition, defaultExample, settings]);

  // Check if user has any collections
  const hasCollections = collections && collections.length > 0;

  // Handle dialog open - check for collections first
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !collectionId && !hasCollections && !collectionsLoading) {
      // User is trying to add word but has no collections
      // User is trying to add word but has no collections
      toast({
        title: t("components.addWordModal.noCollectionsAvailable"),
        description: t("components.addWordModal.noCollectionsDesc"),
        variant: "destructive",
      });
      return; // Don't open the dialog
    }
    setOpen(newOpen);
  };

  const handleAIFill = async () => {
    if (!term.trim()) {
      toast({
        title: t("components.addWordModal.enterTermFirst"),
        description: t("components.addWordModal.enterTermDesc"),
        variant: "destructive",
      });
      return;
    }

    const result = await fillWord(term, {
      termLanguage,
      definitionLanguage,
      exampleLanguage,
    });
    if (result) {
      // Fill the form with AI generated data
      setTerm(result.term);
      setDefinition(result.definition);
      setExample(result.example);
      setPhonetic(result.phonetic);
      setPartOfSpeech(result.partOfSpeech);
    }
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
        termLanguage,
        definitionLanguage,
        exampleLanguage,
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
          // Reset languages to default
          const defaultLang = settings?.learningLanguage || DEFAULT_LANGUAGE;
          setTermLanguage(defaultLang);
          setDefinitionLanguage(defaultLang);
          setExampleLanguage(defaultLang);
          setOpen(false);
        },
      }
    );
  };

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      {t("components.addWordModal.addWord")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Only render trigger if provided - for controlled modals, no trigger needed */}
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {/* Fallback trigger for uncontrolled usage */}
      {!trigger && controlledOpen === undefined && (
        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t("components.addWordModal.title")}</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAIFill}
              disabled={
                isAILoading || !term.trim() || createWordMutation.isPending
              }
              className="flex items-center gap-2"
            >
              {isAILoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("components.addWordModal.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("components.addWordModal.aiAutoFill")}
                  {usageInfo && (
                    <span className="text-xs opacity-70">
                      ({usageInfo.remainingUses}/3)
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
          {usageInfo && usageInfo.remainingUses === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t("components.addWordModal.dailyLimitReached")}
            </p>
          )}
        </DialogHeader>

        {/* Warning if no collections available when dialog is open */}
        {!collectionId && !hasCollections && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("components.addWordModal.pleaseCreateCollection")}{" "}
              <Link
                href="/collections"
                className="underline font-medium"
                onClick={() => setOpen(false)}
              >
                {t("components.addWordModal.goToCollections")}
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term">{t("components.addWordModal.term")}</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value.slice(0, 80))}
              placeholder={t("components.addWordModal.termPlaceholder")}
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
            <Label htmlFor="definition">{t("components.addWordModal.definition")}</Label>
            <div className="flex gap-2">
              <Textarea
                id="definition"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder={t("components.addWordModal.definitionPlaceholder")}
                required
                rows={3}
                className="resize-none break-all flex-1"
                style={{ wordBreak: "break-all" }}
              />
              <Select
                value={definitionLanguage}
                onValueChange={setDefinitionLanguage}
                disabled={createWordMutation.isPending}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="example">{t("components.addWordModal.example")}</Label>
            <div className="flex gap-2">
              <Textarea
                id="example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder={t("components.addWordModal.examplePlaceholder")}
                rows={2}
                className="resize-none break-all flex-1"
                style={{ wordBreak: "break-all" }}
              />
              <Select
                value={exampleLanguage}
                onValueChange={setExampleLanguage}
                disabled={createWordMutation.isPending}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phonetic">{t("components.addWordModal.phonetic")}</Label>
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
            <Label htmlFor="partOfSpeech">{t("components.addWordModal.partOfSpeech")}</Label>
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
                  <SelectValue placeholder={t("components.addWordModal.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {PARTS_OF_SPEECH.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t("components.addWordModal.custom")}</SelectItem>
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
                placeholder={t("components.addWordModal.customPlaceholder")}
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
              <Label htmlFor="collection">{t("components.addWordModal.collection")}</Label>
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
                disabled={createWordMutation.isPending || !hasCollections}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !hasCollections
                        ? t("components.addWordModal.noCollectionsAvailable")
                        : t("components.addWordModal.selectCollection")
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
                  {t("components.addWordModal.pleaseCreateCollection")}
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
              {t("components.addWordModal.cancel")}
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
                  {t("components.addWordModal.adding")}
                </>
              ) : (
                t("components.addWordModal.addWord")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
