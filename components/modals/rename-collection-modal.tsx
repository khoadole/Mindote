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
import { Edit, Loader2 } from "lucide-react";

interface RenameCollectionModalProps {
  collectionId: string;
  currentName: string;
  trigger?: React.ReactNode;
}

export function RenameCollectionModal({
  collectionId,
  currentName,
  trigger,
}: RenameCollectionModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const updateCollectionMutation = useUpdateCollection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim() === currentName) {
      return;
    }

    updateCollectionMutation.mutate(
      {
        collectionId,
        data: { name: name.trim() },
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      {t("collections.rename")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t("collections.renameCollection")}</DialogTitle>
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
                  {t("collections.saving")}
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
