"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import type { WritingPassage } from "@/lib/types";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const TOPICS = [
  "Daily Life",
  "Travel",
  "Food & Cooking",
  "Family & Relationships",
  "Education",
  "Work & Career",
  "Technology",
  "Environment",
  "Health & Fitness",
  "Culture & Traditions",
  "Sports",
  "Entertainment",
  "Society & Community",
  "Economics",
  "Science",
];

interface PassageFormProps {
  initialValues?: Partial<WritingPassage>;
  onSubmit: (data: Partial<WritingPassage>) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PassageForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = "Save Passage",
}: PassageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [titleEn, setTitleEn] = useState(initialValues?.titleEn ?? "");
  const [sourceText, setSourceText] = useState(
    initialValues?.sourceText ?? "",
  );
  const [referenceText, setReferenceText] = useState(
    initialValues?.referenceText ?? "",
  );
  const [level, setLevel] = useState(initialValues?.level ?? "B1");
  const [topic, setTopic] = useState(initialValues?.topic ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [targetWordCount, setTargetWordCount] = useState(
    initialValues?.targetWordCount ?? 100,
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialValues?.estimatedMinutes ?? 10,
  );
  const [isPublished, setIsPublished] = useState(
    initialValues?.isPublished ?? true,
  );
  const [order, setOrder] = useState(initialValues?.order ?? 0);
  const [grammarFocus, setGrammarFocus] = useState(
    initialValues?.grammarFocus ?? "",
  );

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title,
      titleEn: titleEn || undefined,
      sourceText,
      referenceText: referenceText || undefined,
      level: level as WritingPassage["level"],
      topic,
      tags,
      targetWordCount,
      estimatedMinutes,
      isPublished,
      order,
      grammarFocus: grammarFocus || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title (Vietnamese) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cuộc sống ở thành phố"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="titleEn">Title (English, for admin reference)</Label>
          <Input
            id="titleEn"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Life in the city"
          />
        </div>
      </div>

      {/* Source Text */}
      <div className="space-y-1.5">
        <Label htmlFor="sourceText">
          Source Text (Vietnamese prompt){" "}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="sourceText"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Thành phố nơi tôi sống rất sầm uất..."
          rows={6}
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {sourceText.split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      {/* Reference Text */}
      <div className="space-y-1.5">
        <Label htmlFor="referenceText">
          Reference Answer (English sample — shown to users)
        </Label>
        <Textarea
          id="referenceText"
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder="The city where I live is very vibrant..."
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {referenceText.split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      {/* Level + Topic */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            CEFR Level <span className="text-red-500">*</span>
          </Label>
          <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CEFR_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Topic <span className="text-red-500">*</span>
          </Label>
          <Select value={topic} onValueChange={setTopic} required>
            <SelectTrigger>
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Target word count + Estimated minutes + Order */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="targetWordCount">Target Word Count</Label>
          <Input
            id="targetWordCount"
            type="number"
            min={20}
            max={600}
            value={targetWordCount}
            onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 100)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
          <Input
            id="estimatedMinutes"
            type="number"
            min={1}
            max={60}
            value={estimatedMinutes}
            onChange={(e) =>
              setEstimatedMinutes(parseInt(e.target.value) || 10)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Grammar Focus */}
      <div className="space-y-1.5">
        <Label htmlFor="grammarFocus">
          Grammar Focus{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="grammarFocus"
          value={grammarFocus}
          onChange={(e) => setGrammarFocus(e.target.value)}
          placeholder="e.g. Past Perfect, Conditionals, Passive Voice"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag + Enter"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="isPublished"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
        <Label htmlFor="isPublished" className="cursor-pointer">
          Published (visible to users)
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/writing")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
