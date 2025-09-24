"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddWordModal } from "@/components/modals/add-word-modal"
import { useAppStore } from "@/lib/store"
import { BookOpen, Plus } from "lucide-react"

interface CapturedItem {
  id: string
  type: "word" | "sentence"
  text: string
  context?: string
  timestamp?: string
}

interface TranscriptViewerProps {
  transcript: string
  videoTitle?: string
}

export function TranscriptViewer({ transcript, videoTitle }: TranscriptViewerProps) {
  const [selectedText, setSelectedText] = useState("")
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([])
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [wordToAdd, setWordToAdd] = useState({ term: "", definition: "", example: "" })
  const transcriptRef = useRef<HTMLDivElement>(null)
  const { words } = useAppStore()

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setSelectedText("")
      setSelectionPosition(null)
      return
    }

    const selectedText = selection.toString().trim()
    if (!selectedText) {
      setSelectionPosition(null)
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setSelectedText(selectedText)
    setSelectionPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
  }

  const handleSaveAsWord = () => {
    const cleanText = selectedText.replace(/[^\w\s]/g, "").toLowerCase()
    setWordToAdd({
      term: cleanText,
      definition: "",
      example: selectedText,
    })
    setShowAddWordModal(true)
    clearSelection()
  }

  const handleSaveAsSentence = () => {
    // Find existing words that might match
    const wordsInSelection = words.filter((word) => selectedText.toLowerCase().includes(word.term.toLowerCase()))

    if (wordsInSelection.length > 0) {
      // For demo, use the first matching word
      const matchingWord = wordsInSelection[0]
      setWordToAdd({
        term: matchingWord.term,
        definition: matchingWord.definition,
        example: selectedText,
      })
      setShowAddWordModal(true)
    } else {
      // Create a new captured item for later processing
      const newItem: CapturedItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: "sentence",
        text: selectedText,
        context: videoTitle,
        timestamp: new Date().toLocaleTimeString(),
      }
      setCapturedItems((prev) => [...prev, newItem])
    }
    clearSelection()
  }

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges()
    setSelectedText("")
    setSelectionPosition(null)
  }

  const removeCapturedItem = (id: string) => {
    setCapturedItems((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (transcriptRef.current && !transcriptRef.current.contains(event.target as Node)) {
        clearSelection()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              onMouseUp={handleTextSelection}
              style={{ userSelect: "text" }}
            >
              {transcript.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Selection Toolbar */}
            {selectedText && selectionPosition && (
              <div
                className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1"
                style={{
                  left: selectionPosition.x - 100,
                  top: selectionPosition.y - 60,
                  transform: "translateX(-50%)",
                }}
              >
                <Button size="sm" onClick={handleSaveAsWord} className="text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Save as Word
                </Button>
                <Button size="sm" variant="outline" onClick={handleSaveAsSentence} className="text-xs bg-transparent">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Save Sentence
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection} className="text-xs">
                  ×
                </Button>
              </div>
            )}
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
                      <Badge variant={item.type === "word" ? "default" : "secondary"} className="text-xs">
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
                    {item.timestamp && <p className="text-xs text-muted-foreground">{item.timestamp}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Word Modal */}
      <AddWordModal
        trigger={null}
        defaultTerm={wordToAdd.term}
        defaultDefinition={wordToAdd.definition}
        defaultExample={wordToAdd.example}
      />

      {showAddWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <AddWordModal
              trigger={<Button className="w-full">Add "{wordToAdd.term}" to Vocabulary</Button>}
              defaultTerm={wordToAdd.term}
              defaultDefinition={wordToAdd.definition}
              defaultExample={wordToAdd.example}
            />
            <Button variant="ghost" onClick={() => setShowAddWordModal(false)} className="w-full mt-2">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
