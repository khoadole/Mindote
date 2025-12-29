import {
  Library,
  FolderHeart,
  Layers,
  BookOpen,
  Bookmark,
  List,
  Archive,
  Tags,
  Globe,
  Briefcase,
  Plane,
  Utensils,
  HeartPulse,
  GraduationCap,
  Leaf,
  Cpu,
  Music,
  Smile,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface CollectionIcon {
  name: string;
  component: LucideIcon;
  category: "management" | "topics" | "status";
}

export const COLLECTION_ICONS: CollectionIcon[] = [
  // Management & List Icons
  { name: "Library", component: Library, category: "management" },
  { name: "FolderHeart", component: FolderHeart, category: "management" },
  { name: "Layers", component: Layers, category: "management" },
  { name: "BookOpen", component: BookOpen, category: "management" },
  { name: "Bookmark", component: Bookmark, category: "management" },
  { name: "List", component: List, category: "management" },
  { name: "Archive", component: Archive, category: "management" },
  { name: "Tags", component: Tags, category: "management" },
  
  // Topics Icons
  { name: "Briefcase", component: Briefcase, category: "topics" },
  { name: "Plane", component: Plane, category: "topics" },
  { name: "Utensils", component: Utensils, category: "topics" },
  { name: "HeartPulse", component: HeartPulse, category: "topics" },
  { name: "GraduationCap", component: GraduationCap, category: "topics" },
  { name: "Leaf", component: Leaf, category: "topics" },
  { name: "Globe", component: Globe, category: "topics" },
  { name: "Cpu", component: Cpu, category: "topics" },
  { name: "Music", component: Music, category: "topics" },
  { name: "Smile", component: Smile, category: "topics" },
  
  // Status Icons
  { name: "Sparkles", component: Sparkles, category: "status" },
  { name: "Trophy", component: Trophy, category: "status" },
];

// Create a map for quick lookup
export const ICON_MAP = new Map<string, LucideIcon>(
  COLLECTION_ICONS.map((icon) => [icon.name, icon.component])
);

// Helper function to get icon component by name
export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP.get(iconName) || Layers; // Default to Layers if not found
}

// Helper function to get icons by category
export function getIconsByCategory(category: CollectionIcon["category"]) {
  return COLLECTION_ICONS.filter((icon) => icon.category === category);
}
