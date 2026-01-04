"use client";

import { COLLECTION_ICONS } from "@/lib/collection-icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color = "#3B82F6" }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {COLLECTION_ICONS.map((icon) => {
        const Icon = icon.component;
        const isSelected = value === icon.name;
        
        return (
          <button
            key={icon.name}
            type="button"
            onClick={() => onChange(icon.name)}
            className={cn(
              "h-10 w-10 rounded-lg border-2 transition-all flex items-center justify-center",
              isSelected
                ? "border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ring-foreground/20"
                : "border-transparent hover:scale-105 hover:border-foreground/20"
            )}
            style={{ 
              backgroundColor: isSelected ? `${color}20` : "transparent"
            }}
            title={icon.name}
          >
            <Icon 
              className="h-5 w-5" 
              style={{ color: isSelected ? color : "currentColor" }}
            />
          </button>
        );
      })}
    </div>
  );
}
