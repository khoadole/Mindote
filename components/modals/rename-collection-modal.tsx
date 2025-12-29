"use client";

import { useState } from "react";
import { useUpdateCollection } from "@/hooks/use-collections";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Loader2 } from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import { DIFFICULTY_LEVELS } from "@/lib/difficulty-levels";

const colorOptions = [
  { name: "Mint Green", value: "#10B981" }, // Emerald 500
  { name: "Sunny Yellow", value: "#F59E0B" }, // Amber 500
  { name: "Coral Peach", value: "#F97316" }, // Orange 500
  { name: "Lavender", value: "#8B5CF6" }, // Violet 500
  { name: "Sky Blue", value: "#3B82F6" }, // Blue 500
  { name: "Soft Pink", value: "#EC4899" }, // Pink 500
  { name: "Lime Green", value: "#84CC16" }, // Lime 500
];

interface RenameCollectionModalProps {
  collectionId: string;
  currentName: string;
  currentColor?: string;
  currentIcon?: string;
  currentLevel?: string;
  trigger?: React.ReactNode;
}

export function RenameCollectionModal({
  collectionId,
  currentName,
  currentColor,
  currentIcon,
  currentLevel,
  trigger,
}: RenameCollectionModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [selectedColor, setSelectedColor] = useState(currentColor || colorOptions[0].value);
  const [selectedIcon, setSelectedIcon] = useState(currentIcon || "Layers");
  const [difficultyLevel, setDifficultyLevel] = useState<string>(currentLevel || "");
  const updateCollectionMutation = useUpdateCollection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    // Check if anything changed
    if (name.trim() === currentName && selectedColor === currentColor && selectedIcon === currentIcon && difficultyLevel === (currentLevel || "")) {
      setOpen(false);
      return;
    }

    updateCollectionMutation.mutate(
      {
        collectionId,
        data: { 
          name: name.trim(),
          color: selectedColor,
          icon: selectedIcon,
          difficultyLevel: difficultyLevel || undefined
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full border-0"
    >
      <Edit className="h-4 w-4 mr-2" />
      {t("collections.rename")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t("collections.editCollection")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("collections.collectionNameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder={t("collections.enterCollectionName")}
              required
              disabled={updateCollectionMutation.isPending}
              autoFocus
              maxLength={80}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {t("collections.charactersCount", { count: name.length })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("collections.iconLabel")}</Label>
            <IconPicker
              value={selectedIcon}
              onChange={setSelectedIcon}
              color={selectedColor}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("collections.colorLabel")}</Label>
            <div className="grid grid-cols-7 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? "border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ring-foreground/20"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">{t("collections.difficultyLevelLabel")}</Label>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <SelectTrigger>
                <SelectValue placeholder={t("collections.difficultyLevelPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div className="font-medium">{t(level.labelKey)}</div>
                      <div className="text-xs text-muted-foreground">
                        {t(level.descriptionKey)}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateCollectionMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateCollectionMutation.isPending}>
              {updateCollectionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
