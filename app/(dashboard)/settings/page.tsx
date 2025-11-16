"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import {
  useSettings,
  useUpdateSettings,
  useUserStats,
} from "@/hooks/use-settings";
import { useTheme } from "@/lib/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Brain,
  Palette,
  Globe,
  Loader2,
} from "lucide-react";

// Language options
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const updateSettingsMutation = useUpdateSettings();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // ✅ FIX: Show loading only while actually loading settings
  // Don't block the UI if settings is just disabled (user not logged in)
  if (settingsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  // ✅ FIX: Use default settings if not available
  const currentSettings = settings || { theme: "dark", language: "en" };

  const handleExportData = () => {
    toast({
      title: "Coming soon",
      description:
        "Export feature will be available soon with database integration.",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Coming soon",
      description:
        "Import feature will be available soon with database integration.",
    });
  };

  const handleResetData = () => {
    toast({
      title: "Coming soon",
      description: "This feature will be available soon.",
    });
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none dark:hidden">
        {/* Modern mesh gradient - very trendy in 2024/2025 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
        radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 0%, rgba(236, 72, 153, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(251, 146, 60, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.15) 0px, transparent 50%)
      `,
          }}
        />

        {/* Subtle animated orbs */}
        <div
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-blue-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "7s", animationDelay: "1s" }}
        />
      </div>
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-pink-200/20 dark:from-primary dark:to-primary rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-blue-200/20 dark:from-accent dark:to-accent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <Card
            className="animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both hover:shadow-md transition-shadow"
            style={{ animationDelay: "100ms" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(value: "light" | "dark" | "system") => {
                    setTheme(value);
                    // Save to database
                    updateSettingsMutation.mutate({ theme: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <Select
                  value={currentSettings.language}
                  onValueChange={(value: string) =>
                    updateSettingsMutation.mutate({ language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select your preferred interface language
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Settings */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Learning Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="srs">Spaced Repetition System (SRS)</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically schedule word reviews based on your
                    performance
                  </p>
                </div>
                <Switch
                  id="srs"
                  checked={settings.srsEnabled}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ srsEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tts" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Text-to-Speech
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable audio pronunciation for words and examples
                  </p>
                </div>
                <Switch
                  id="tts"
                  checked={settings.ttsEnabled}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ ttsEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card> */}

          {/* Data Management */}
          {/* <Card
            className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both hover:shadow-md transition-shadow"
            style={{ animationDelay: "200ms" }}
          >
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download your vocabulary data as a JSON file for backup or
                  transfer
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full hover:scale-105 transition-transform"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a previously exported JSON file to restore your data
                </p>
                <Button
                  onClick={handleImportData}
                  disabled={isImporting}
                  variant="ghost"
                  className="w-full bg-transparent hover:scale-105 transition-transform"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Reset All Data</h4>
                <p className="text-sm text-muted-foreground">
                  Delete all words, collections, and settings. This cannot be
                  undone.
                </p>
                <Button
                  onClick={handleResetData}
                  variant="destructive"
                  className="w-full hover:scale-105 transition-transform"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Default Data
                </Button>
              </div>
            </CardContent>
          </Card> */}

          {/* Statistics */}
          {/* <Card
            className="animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both hover:shadow-md transition-shadow"
            style={{ animationDelay: "300ms" }}
          >
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="text-center p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="h-8 w-16 bg-muted animate-pulse rounded mx-auto mb-2" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded mx-auto" />
                    </div>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {stats.totalWords}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Words</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="text-2xl font-bold text-accent">
                      {stats.totalCollections}
                    </div>
                    <p className="text-sm text-muted-foreground">Collections</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="text-2xl font-bold text-chart-3">
                      {stats.masteredWords}
                    </div>
                    <p className="text-sm text-muted-foreground">Mastered</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="text-2xl font-bold text-chart-4">
                      {stats.avgScore.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* About */}
          <Card
            className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both hover:shadow-md transition-shadow"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader>
              <CardTitle>About Mindote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Mindote is an English learning app that helps you build
                  vocabulary through flashcards, quizzes, and YouTube transcript
                  integration.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Version:</span>
                  <span className="text-muted-foreground">1.0.0</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Storage:</span>
                  <span className="text-muted-foreground">
                    Local Browser Storage
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Keyboard Shortcuts</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Add Word</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Flashcards</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Quiz</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Q</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Search</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
