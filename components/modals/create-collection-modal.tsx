"use client";

import type React from "react";

import { useState } from "react";
import { useCreateCollection } from "@/hooks/use-collections";
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
import { Plus, Loader2 } from "lucide-react";
import { DIFFICULTY_LEVELS } from "@/lib/difficulty-levels";
import { IconPicker } from "@/components/ui/icon-picker";

const colorOptions = [
  { name: "Fresh Green", value: "#34D399" }, // Bright mint green (like "Mới" card)
  { name: "Sunny Yellow", value: "#FBBF24" }, // Vibrant yellow (like "Đang học" card)
  { name: "Coral Orange", value: "#FB923C" }, // Coral orange (like "Quen thuộc" card)
  { name: "Soft Purple", value: "#A78BFA" }, // Soft purple (like "Thành thạo" card)
  { name: "Sky Blue", value: "#60A5FA" }, // Bright blue
  { name: "Hot Pink", value: "#F472B6" }, // Vibrant pink
  { name: "Lime", value: "#A3E635" }, // Bright lime green
];

interface CreateCollectionModalProps {
  trigger?: React.ReactNode;
}

export function CreateCollectionModal({ trigger }: CreateCollectionModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  const [selectedIcon, setSelectedIcon] = useState("Layers");
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
        icon: selectedIcon,
        difficultyLevel: difficultyLevel || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setName("");
          setSelectedColor(colorOptions[0].value);
          setSelectedIcon("Layers");
          setDifficultyLevel("");
          setOpen(false);
        },
      }
    );
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      className="flex items-center gap-2 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-all hover:scale-105 font-semibold"
    >
      <Plus className="h-4 w-4" />
      {t("collections.newCollection")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t("collections.createNewCollection")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("collections.collectionNameLabel")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder={t("collections.collectionNamePlaceholder")}
              required
              maxLength={80}
              className="break-all"
              style={{ wordBreak: "break-all" }}
            />
            <p className="text-xs text-muted-foreground">
              {t("collections.charactersLabel", { count: name.length })}
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
            <p className="text-xs text-muted-foreground">
              {t("collections.helpsOrganize")}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createCollectionMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createCollectionMutation.isPending}>
              {createCollectionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("collections.creating")}
                </>
              ) : (
                t("collections.createCollection")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
