"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

export default function TestTTSPage() {
  const [text, setText] = useState("");
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech({
    lang: "en-US",
    rate: 0.9,
  });

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const exampleWords = [
    { term: "Hello", definition: "A greeting", phonetic: "/həˈloʊ/" },
    {
      term: "Beautiful",
      definition: "Pleasing to the senses",
      phonetic: "/ˈbjuːtɪfəl/",
    },
    {
      term: "Knowledge",
      definition: "Information and skills acquired",
      phonetic: "/ˈnɒlɪdʒ/",
    },
    {
      term: "Technology",
      definition: "Application of scientific knowledge",
      phonetic: "/tekˈnɒlədʒi/",
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔊 Text-to-Speech Demo</h1>
        <p className="text-muted-foreground">
          Test the speech synthesis feature with custom text or example words
        </p>
      </div>

      {!isSupported && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              ❌ Your browser doesn't support Text-to-Speech
            </p>
          </CardContent>
        </Card>
      )}

      {/* Custom Text Input */}
      <Card>
        <CardHeader>
          <CardTitle>Try Custom Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter any text to speak..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  handleSpeak();
                }
              }}
              className="text-lg"
            />
          </div>

          <Button
            onClick={handleSpeak}
            disabled={!text.trim() || !isSupported}
            className="w-full"
            size="lg"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="mr-2 h-5 w-5 animate-pulse" />
                Stop Speaking
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-5 w-5" />
                Speak Text
              </>
            )}
          </Button>

          {isSpeaking && (
            <div className="text-center">
              <Badge variant="secondary" className="animate-pulse">
                🎤 Speaking...
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Words */}
      <Card>
        <CardHeader>
          <CardTitle>Example Vocabulary Words</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleWords.map((word, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {word.term}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {word.phonetic}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {word.definition}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => speak(word.term)}
                      disabled={!isSupported}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>Browser Support:</strong>{" "}
              {isSupported ? "✅ Supported" : "❌ Not Supported"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {isSpeaking ? "🎤 Speaking..." : "⏸️ Ready"}
            </p>
            <p className="text-muted-foreground">
              💡 Tip: Press Enter to speak the custom text
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
