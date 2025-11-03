"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus } from "lucide-react";
import { AddWordModal } from "@/components/modals/add-word-modal";

interface CapturedItem {
  id: string;
  type: "word" | "sentence";
  text: string;
  context?: string;
  timestamp?: string;
}

interface TranscriptViewerProps {
  transcript: string;
  videoTitle?: string;
}

export function TranscriptViewer({
  transcript,
  videoTitle,
}: TranscriptViewerProps) {
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [showAddButton, setShowAddButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [openAddWordModal, setOpenAddWordModal] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const removeCapturedItem = (id: string) => {
    setCapturedItems((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const updateButtonPosition = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (
        text &&
        text.length > 0 &&
        transcriptRef.current &&
        transcriptRef.current.contains(selection?.anchorNode || null)
      ) {
        const range = selection?.getRangeAt(0);
        if (range) {
          // Clone range để không ảnh hưởng selection gốc
          const endRange = range.cloneRange();
          endRange.collapse(false); // Collapse đến end của range (focus point)

          // Lấy rects của collapsed range
          const rects = endRange.getClientRects();
          if (rects.length > 0) {
            const endRect = rects[0]; // Rect đầu (và duy nhất) của collapsed range
            const containerRect = transcriptRef.current!.getBoundingClientRect();
            
            // Tính vị trí tương đối với container (không phải window)
            setSelectedText(text);
            setButtonPosition({
              x: endRect.right - containerRect.left + transcriptRef.current!.scrollLeft,
              y: endRect.bottom - containerRect.top + transcriptRef.current!.scrollTop,
            });
            setShowAddButton(true);
          }
        }
      } else {
        setShowAddButton(false);
      }
    };

    const handleSelection = () => {
      updateButtonPosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showAddButton &&
        !(e.target as HTMLElement).closest(".add-word-button")
      ) {
        setShowAddButton(false);
      }
    };

    const handleScroll = () => {
      // Update button position when scrolling instead of hiding
      if (showAddButton) {
        updateButtonPosition();
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("mousedown", handleClickOutside);
    
    // Listen to scroll on the transcript container
    const transcriptContainer = transcriptRef.current;
    if (transcriptContainer) {
      transcriptContainer.addEventListener("scroll", handleScroll);
    }
    // Also listen to window scroll
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("mousedown", handleClickOutside);
      if (transcriptContainer) {
        transcriptContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showAddButton]);

  const handleAddWord = () => {
    setOpenAddWordModal(true);
    setShowAddButton(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* Add Word Button - Floating at selection end */}
      {showAddButton && (
        <Button
          size="sm"
          className="add-word-button absolute z-50 shadow-lg animate-in fade-in zoom-in duration-200"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            transform: "translate(4px, 4px)",
          }}
          onClick={handleAddWord}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Word
        </Button>
      )}

      {/* Add Word Modal */}
      <AddWordModal
        open={openAddWordModal}
        onOpenChange={setOpenAddWordModal}
        defaultTerm={selectedText}
        defaultDefinition=""
        defaultExample=""
      />

      {/* Transcript */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Transcript
              {videoTitle && (
                <Badge variant="secondary" className="ml-2">
                  {videoTitle}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={transcriptRef}
              className="prose prose-sm max-w-none text-foreground leading-relaxed select-text cursor-text p-4 bg-muted/30 rounded-lg min-h-[400px] relative"
              style={{ userSelect: "text" }}
            >
              {transcript.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Captured Items */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Captured Items</CardTitle>
          </CardHeader>
          <CardContent>
            {capturedItems.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select text from the transcript to capture words and sentences
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {capturedItems.map((item) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={item.type === "word" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {item.type}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCapturedItem(item.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-sm mb-2 line-clamp-3">{item.text}</p>
                    {item.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
