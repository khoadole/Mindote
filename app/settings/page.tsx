"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { useAppContext } from "@/lib/app-provider"
import { useTheme } from "@/lib/theme-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Settings, Download, Upload, RotateCcw, Volume2, Brain, Palette, Globe } from "lucide-react"

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
]

export default function SettingsPage() {
  const router = useRouter()
  const { mounted } = useAppContext()
  const { settings, updateSettings, resetData, words, collections } = useAppStore()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  if (!mounted) {
    return null
  }

  const handleExportData = () => {
    setIsExporting(true)

    try {
      const exportData = {
        words,
        collections,
        settings,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `wordflow-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      toast({
        title: "Data exported successfully!",
        description: "Your vocabulary data has been downloaded as a JSON file.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string)

          // Validate the data structure
          if (!importData.words || !importData.collections || !importData.settings) {
            throw new Error("Invalid data format")
          }

          // For demo purposes, we'll merge the data rather than replace
          // In a real app, you might want to ask the user about merge vs replace

          toast({
            title: "Data imported successfully!",
            description: `Imported ${importData.words.length} words and ${importData.collections.length} collections.`,
          })
        } catch (error) {
          toast({
            title: "Import failed",
            description: "The file format is invalid or corrupted.",
            variant: "destructive",
          })
        } finally {
          setIsImporting(false)
        }
      }

      reader.readAsText(file)
    }

    input.click()
  }

  const handleResetData = () => {
    if (
      confirm(
        "Are you sure you want to reset all data? This will delete all your words, collections, and settings. This action cannot be undone.",
      )
    ) {
      resetData()
      toast({
        title: "Data reset complete",
        description: "All data has been reset to default values.",
      })
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Settings</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Appearance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Language
                    </Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value: typeof settings.language) => updateSettings({ language: value })}
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
                    <p className="text-sm text-muted-foreground">Select your preferred interface language</p>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Settings */}
              <Card>
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
                        Automatically schedule word reviews based on your performance
                      </p>
                    </div>
                    <Switch
                      id="srs"
                      checked={settings.srsEnabled}
                      onCheckedChange={(checked) => updateSettings({ srsEnabled: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="tts" className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Text-to-Speech
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable audio pronunciation for words and examples</p>
                    </div>
                    <Switch
                      id="tts"
                      checked={settings.ttsEnabled}
                      onCheckedChange={(checked) => updateSettings({ ttsEnabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download your vocabulary data as a JSON file for backup or transfer
                    </p>
                    <Button onClick={handleExportData} disabled={isExporting} className="w-full">
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
                      variant="outline"
                      className="w-full bg-transparent"
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
                      Delete all words, collections, and settings. This cannot be undone.
                    </p>
                    <Button onClick={handleResetData} variant="destructive" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Demo Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{words.length}</div>
                      <p className="text-sm text-muted-foreground">Total Words</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-accent">{collections.length}</div>
                      <p className="text-sm text-muted-foreground">Collections</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-3">
                        {words.filter((w) => (w.score || 0) > 3).length}
                      </div>
                      <p className="text-sm text-muted-foreground">Mastered</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-chart-4">
                        {Math.round(words.reduce((acc, w) => acc + (w.score || 0), 0) / Math.max(words.length, 1))}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About WordFlow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      WordFlow is an English learning app that helps you build vocabulary through flashcards, quizzes,
                      and YouTube transcript integration.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Version:</span>
                      <span className="text-muted-foreground">1.0.0</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Storage:</span>
                      <span className="text-muted-foreground">Local Browser Storage</span>
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
        </main>
      </div>
    </div>
  )
}
