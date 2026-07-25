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
import { useTranslation } from "@/lib/i18n-provider";
import { useAuth } from "@/lib/auth";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
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
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const updateSettingsMutation = useUpdateSettings();
  const { theme, setTheme } = useTheme();
  const { t, setLanguage } = useTranslation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // ✅ FIX: Show loading only while actually loading settings
  // Don't block the UI if settings is just disabled (user not logged in)
  if (settingsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-full bg-white dark:bg-background relative overflow-hidden transition-all duration-300">
        <div className="flex items-center gap-2 relative z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("settings.loadingSettings")}</span>
        </div>
      </div>
    );
  }

  // ✅ FIX: Use default settings if not available
  const currentSettings = settings || { theme: "dark", language: "en" };

  const handleExportData = () => {
    toast({
      title: t("settings.comingSoon"),
      description: t("settings.exportFeatureComingSoon"),
    });
  };

  const handleImportData = () => {
    toast({
      title: t("settings.comingSoon"),
      description: t("settings.importFeatureComingSoon"),
    });
  };

  const handleResetData = () => {
    toast({
      title: t("settings.comingSoon"),
      description: t("settings.featureComingSoon"),
    });
  };

  const handleSignOut = async () => {
    try {
      // Await sign out before redirecting
      await signOut();
      // Hard redirect to clear all cache
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-background min-h-full relative overflow-hidden transition-all duration-300">
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
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
                {t("settings.appearance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">{t("settings.theme")}</Label>
                <Select
                  value={theme}
                  onValueChange={(value: "light" | "dark" | "system") => {
                    setTheme(value);
                    // Save to database
                    updateSettingsMutation.mutate({ theme: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectTheme")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.light")}</SelectItem>
                    <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                    <SelectItem value="system">
                      {t("settings.system")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t("settings.themeDescription")}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("settings.language")}
                </Label>
                <Select
                  value={currentSettings.language}
                  onValueChange={(value: string) => {
                    setLanguage(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t("settings.languageDescription")}
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

          <Card
            className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both hover:shadow-md transition-shadow"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader>
              <CardTitle>{t("settings.about")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("settings.aboutDescription")}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{t("settings.version")}</span>
                  <span className="text-muted-foreground">1.0.0</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">
                  {t("settings.keyboardShortcuts")}
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("settings.addWord")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("settings.flashcards")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("settings.quiz")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Q</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("common.search")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full gap-2 hover:scale-105 transition-transform"
                >
                  <LogOut className="h-4 w-4" />
                  {t("topbar.signOut")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
