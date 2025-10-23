"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { useToast } from "@/hooks/use-toast";
import {
  generateMockTranscript,
  getVideoTitle,
  extractVideoId,
} from "@/lib/mock-transcript";
import { Youtube, ArrowLeft, Play, FileText, AlertCircle } from "lucide-react";

export default function YouTubePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);

  const handleGetTranscript = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const mockTranscript = generateMockTranscript(url);
      const title = getVideoTitle(url);

      setTranscript(mockTranscript);
      setVideoTitle(title);
      setHasTranscript(true);
      setIsLoading(false);

      toast({
        title: "Transcript loaded!",
        description: "You can now select text to save words and sentences.",
      });
    }, 1500);
  };

  const handleReset = () => {
    setUrl("");
    setTranscript("");
    setVideoTitle("");
    setHasTranscript(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
          <div
            className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
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
                  <p className="text-sm font-medium">Try these example URLs:</p>
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
