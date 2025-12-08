"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Candy as Cards,
  CheckCircle,
  Youtube,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "mindote_onboarding_completed";

interface OnboardingFeature {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  titleKey: string;
  descriptionKey: string;
}

const features: OnboardingFeature[] = [
  {
    icon: Layers,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    titleKey: "collections",
    descriptionKey: "collectionsDesc",
  },
  {
    icon: Cards,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    titleKey: "flashcards",
    descriptionKey: "flashcardsDesc",
  },
  {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    titleKey: "quiz",
    descriptionKey: "quizDesc",
  },
  {
    icon: FileText,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    titleKey: "reading",
    descriptionKey: "readingDesc",
  },
  {
    icon: Youtube,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    titleKey: "youtube",
    descriptionKey: "youtubeDesc",
  },
  {
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    titleKey: "aiExtract",
    descriptionKey: "aiExtractDesc",
  },
];

interface OnboardingModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  forceOpen?: boolean;
}

export function OnboardingModal({
  open: controlledOpen,
  onOpenChange,
  forceOpen = false,
}: OnboardingModalProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    // Check if this is the first time user
    if (!forceOpen && typeof window !== "undefined") {
      const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
      if (!hasCompleted) {
        setInternalOpen(true);
      }
    }
  }, [forceOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }

    // Mark as completed when closing
    if (!newOpen && typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
  };

  const handleNext = () => {
    if (currentSlide < features.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleOpenChange(false);
  };

  const currentFeature = features[currentSlide];
  const Icon = currentFeature.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            {t("onboarding.welcome")}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Feature Card */}
          <div
            className={cn(
              "p-6 rounded-xl text-center transition-all duration-300",
              currentFeature.bgColor
            )}
          >
            <div
              className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                currentFeature.bgColor
              )}
            >
              <Icon className={cn("h-8 w-8", currentFeature.color)} />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t(`onboarding.features.${currentFeature.titleKey}`)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(`onboarding.features.${currentFeature.descriptionKey}`)}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentSlide
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            {t("onboarding.skip")}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("onboarding.previous")}
            </Button>

            <Button size="sm" onClick={handleNext}>
              {currentSlide === features.length - 1 ? (
                t("onboarding.finish")
              ) : (
                <>
                  {t("onboarding.next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
