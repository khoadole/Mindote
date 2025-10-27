"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Globe } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "vi-VN", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "ja-JP", name: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", name: "한국어", flag: "🇰🇷" },
  { code: "zh-CN", name: "中文", flag: "🇨🇳" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
];

export default function VoiceReaderPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en-US"); // Default to English for vocabulary learning
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech({
    lang: language,
    rate: 0.9,
  });

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else if (text.trim()) {
      speak(text);
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
              <Volume2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">🔊 Voice Reader</h1>
            <p className="text-muted-foreground">
              Text-to-Speech for Vocabulary Learning
            </p>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selectedLang?.flag} {selectedLang?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={
                language === "vi-VN"
                  ? "Nhập từ hoặc câu bất kỳ..."
                  : "Enter any word or sentence..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  handleSpeak();
                }
              }}
              className="text-lg h-12 border-2 focus:ring-2 focus:ring-purple-500 transition-all"
              disabled={!isSupported}
            />
          </div>

          {/* Speak Button */}
          <Button
            onClick={handleSpeak}
            disabled={!text.trim() || !isSupported}
            className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="mr-2 h-5 w-5 animate-pulse" />
                {language === "vi-VN" ? "Dừng lại" : "Stop"}
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-5 w-5" />
                {language === "vi-VN" ? "Đọc lên" : "Speak"}
              </>
            )}
          </Button>

          {/* Status */}
          <div className="text-center space-y-2">
            {isSpeaking && (
              <Badge
                variant="secondary"
                className="animate-pulse bg-purple-100 text-purple-800"
              >
                🎤 {language === "vi-VN" ? "Đang đọc..." : "Speaking..."}
              </Badge>
            )}

            {!isSupported ? (
              <p className="text-sm text-destructive">
                ❌{" "}
                {language === "vi-VN"
                  ? "Trình duyệt không hỗ trợ text-to-speech"
                  : "Browser doesn't support text-to-speech"}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {!isSpeaking &&
                  (language === "vi-VN"
                    ? "✅ Sẵn sàng đọc"
                    : "✅ Ready to speak")}
              </p>
            )}
          </div>

          {/* Quick Examples */}
          {language === "vi-VN" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Thử các ví dụ:</p>
              <div className="flex flex-wrap gap-2">
                {["Xin chào", "Cảm ơn", "Học tiếng Anh", "Từ vựng"].map(
                  (example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setText(example);
                        speak(example);
                      }}
                      disabled={!isSupported || isSpeaking}
                      className="text-xs"
                    >
                      {example}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}

          {language === "en-US" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Try examples:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Hello",
                  "Thank you",
                  "Vocabulary",
                  "Beautiful",
                  "Knowledge",
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setText(example);
                      speak(example);
                    }}
                    disabled={!isSupported || isSpeaking}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <p className="text-xs text-center text-muted-foreground">
            💡{" "}
            {language === "vi-VN"
              ? "Nhấn Enter để đọc nhanh"
              : "Press Enter to speak quickly"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
