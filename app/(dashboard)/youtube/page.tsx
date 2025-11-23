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

    try {
      const response = await fetch("/api/youtube/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }

      setTranscript(data.data.transcript);
      setVideoTitle(data.data.title);
      setVideoId(data.data.videoId);
      setHasTranscript(true);

      // Save to history
      await saveYouTubeHistoryAction({
        url,
        title: data.data.title,
        videoId: data.data.videoId,
      });

      // Reload history
      await loadHistory();

      toast({
        title: t("youtube.transcriptLoaded"),
        description: t("youtube.selectTextToSave"),
      });
    } catch (error: any) {
      toast({
        title: t("toast.error"),
        description: error.message || t("youtube.failedToFetchTranscript"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        title: "Deleted",
        description: "Video removed from history",
      });
    }
  };

  const handleClearHistory = async () => {
    if (
      confirm(
        "Are you sure you want to clear all history? This action cannot be undone."
      )
    ) {
      const result = await clearYouTubeHistoryAction();
      if (result.success) {
        await loadHistory();
        toast({
          title: "History cleared",
          description: "All videos have been removed from history",
        });
      }
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            <h1 className="text-3xl font-bold">YouTube Notes</h1>
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
                    Get Video Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube URL</Label>
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
                          Getting Transcript...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Get Transcript
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
                          <p className="font-medium">How it works:</p>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Paste any YouTube URL (≤ 60 minutes)</li>
                            <li>• Get the video transcript automatically</li>
                            <li>• Select text to save words or sentences</li>
                            <li>• Build your vocabulary from real content</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Example URLs */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Try these example URLs:
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
                  Transcript loaded
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                className="hover:scale-105 transition-transform"
              >
                Load Different Video
              </Button>
            </div>

            <TranscriptViewer transcript={transcript} videoTitle={videoTitle} />
          </div>
        )}
      </div>
    </div>
  );
}
