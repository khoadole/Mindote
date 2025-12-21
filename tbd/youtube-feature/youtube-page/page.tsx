"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { YouTubeHistory } from "@/components/youtube-history";
import { useToast } from "@/hooks/use-toast";
import {
  saveYouTubeHistoryAction,
  getYouTubeHistoryAction,
  deleteYouTubeHistoryAction,
  clearYouTubeHistoryAction,
} from "@/app/actions/youtube-history";
import { Youtube, ArrowLeft, Play, FileText, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n-provider";
import {
  fetchTranscriptClientSide,
  canFetchClientSide,
} from "@/lib/youtube-transcript-client";

export default function YouTubePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const result = await getYouTubeHistoryAction();
    if (result.success && result.data) {
      setHistory(result.data);
    }
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const handleGetTranscript = async () => {
    if (!url.trim()) {
      toast({
        title: t("youtube.urlRequired"),
        description: t("youtube.enterYouTubeUrl"),
        variant: "destructive",
      });
      return;
    }

    const vidId = extractVideoId(url);
    if (!vidId) {
      toast({
        title: t("youtube.invalidUrl"),
        description: t("youtube.enterValidUrl"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    let transcriptData: { transcript: string; title: string; videoId: string } | null = null;
    let lastError: string = "";

    // Method 1: Try client-side fetch first (uses user's IP via CORS proxy)
    if (canFetchClientSide()) {
      try {
        console.log("[YouTube] Trying client-side fetch...");
        const clientResult = await fetchTranscriptClientSide(url);

        if (clientResult.success && clientResult.transcript) {
          console.log("[YouTube] Client-side fetch successful!");
          transcriptData = {
            transcript: clientResult.transcript,
            title: clientResult.title || "Unknown Title",
            videoId: clientResult.videoId || vidId,
          };
        } else {
          lastError = clientResult.error || "Client-side fetch failed";
          console.log("[YouTube] Client-side fetch failed:", lastError);
        }
      } catch (error: any) {
        lastError = error.message || "Client-side fetch error";
        console.log("[YouTube] Client-side fetch error:", lastError);
      }
    }

    // Method 2: Fallback to server-side API
    if (!transcriptData) {
      try {
        console.log("[YouTube] Trying server-side API fallback...");
        const response = await fetch("/api/youtube/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.data?.transcript) {
          console.log("[YouTube] Server-side API successful!");
          transcriptData = {
            transcript: data.data.transcript,
            title: data.data.title || "Unknown Title",
            videoId: data.data.videoId || vidId,
          };
        } else {
          lastError = data.error || "Server-side API failed";
          console.log("[YouTube] Server-side API failed:", lastError);
        }
      } catch (error: any) {
        lastError = error.message || "Server-side API error";
        console.log("[YouTube] Server-side API error:", lastError);
      }
    }

    // Method 3: Try innertube API as last resort
    if (!transcriptData) {
      try {
        console.log("[YouTube] Trying innertube API as last resort...");
        const response = await fetch("/api/youtube/innertube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.data?.transcript) {
          console.log("[YouTube] Innertube API successful!");
          transcriptData = {
            transcript: data.data.transcript,
            title: "Unknown Title", // Innertube doesn't return title
            videoId: data.data.videoId || vidId,
          };
        } else {
          lastError = data.error || "Innertube API failed";
          console.log("[YouTube] Innertube API failed:", lastError);
        }
      } catch (error: any) {
        lastError = error.message || "Innertube API error";
        console.log("[YouTube] Innertube API error:", lastError);
      }
    }

    // Process result
    if (transcriptData) {
      setTranscript(transcriptData.transcript);
      setVideoTitle(transcriptData.title);
      setVideoId(transcriptData.videoId);
      setHasTranscript(true);

      // Save to history
      await saveYouTubeHistoryAction({
        url,
        title: transcriptData.title,
        videoId: transcriptData.videoId,
      });

      // Reload history
      await loadHistory();

      toast({
        title: t("youtube.transcriptLoaded"),
        description: t("youtube.selectTextToSave"),
      });
    } else {
      toast({
        title: t("toast.error"),
        description: lastError || t("youtube.failedToFetchTranscript"),
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    setUrl("");
    setTranscript("");
    setVideoTitle("");
    setVideoId("");
    setHasTranscript(false);
  };

  const handleSelectFromHistory = (historyUrl: string) => {
    setUrl(historyUrl);
    // Don't auto-fetch, just paste the URL
  };

  const handleDeleteHistory = async (id: string) => {
    const result = await deleteYouTubeHistoryAction(id);
    if (result.success) {
      await loadHistory();
      toast({
        title: t("youtube.deleted"),
        description: t("youtube.videoRemoved"),
      });
    }
  };

  const handleClearHistory = async () => {
    if (
      confirm(
        t("youtube.clearHistoryConfirm")
      )
    ) {
      const result = await clearYouTubeHistoryAction();
      if (result.success) {
        await loadHistory();
        toast({
          title: t("youtube.historyCleared"),
          description: t("youtube.allVideosRemoved"),
        });
      }
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-background relative overflow-hidden">
      {/* Minimal gradient background - Light mode only - REMOVED for pure white */}
      {/* <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" /> */}
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            <h1 className="text-3xl font-bold">{t("youtube.title")}</h1>
          </div>
        </div>

        {!hasTranscript ? (
          /* URL Input */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: "100ms" }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    {t("youtube.getVideoTranscript")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">{t("youtube.youtubeUrl")}</Label>
                    <Input
                      id="youtube-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && url.trim() && !isLoading) {
                          handleGetTranscript();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGetTranscript}
                      disabled={isLoading || !url.trim()}
                      className="flex-1 hover:scale-105 transition-transform"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          {t("youtube.gettingTranscript")}
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          {t("youtube.getTranscript")}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Info Card */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">{t("youtube.howItWorks")}</p>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>{t("youtube.pasteAnyUrl")}</li>
                            <li>{t("youtube.getTranscriptAuto")}</li>
                            <li>{t("youtube.selectTextToSaveWords")}</li>
                            <li>{t("youtube.buildVocabulary")}</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Example URLs */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t("youtube.tryExamples")}
                    </p>
                    <div className="space-y-1">
                      {[
                        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "https://youtu.be/jNQXAC9IVRw",
                        "https://www.youtube.com/watch?v=9bZkp7q19f0",
                      ].map((exampleUrl, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => setUrl(exampleUrl)}
                          className="text-xs text-left justify-start h-auto p-2 font-mono"
                        >
                          {exampleUrl}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* History Sidebar */}
            <div
              className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
              style={{ animationDelay: "200ms" }}
            >
              <YouTubeHistory
                history={history}
                onSelectUrl={handleSelectFromHistory}
                onDelete={handleDeleteHistory}
                onClearAll={handleClearHistory}
              />
            </div>
          </div>
        ) : (
          /* Transcript Viewer */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {t("youtube.transcriptLoadedMsg")}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                className="hover:scale-105 transition-transform"
              >
                {t("youtube.loadDifferentVideo")}
              </Button>
            </div>

            <TranscriptViewer transcript={transcript} videoTitle={videoTitle} />
          </div>
        )}
      </div>
    </div>
  );
}
