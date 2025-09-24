"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import type { Word } from "@/lib/types"
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, CheckCircle, X } from "lucide-react"

interface FlashcardPlayerProps {
  words: Word[]
  onComplete: (results: { correct: number; again: number }) => void
  onExit: () => void
}

export function FlashcardPlayer({ words, onComplete, onExit }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<{ correct: number; again: number }>({ correct: 0, again: 0 })
  const [showSummary, setShowSummary] = useState(false)
  const [shuffledWords, setShuffledWords] = useState<Word[]>([])
  const { updateWord } = useAppStore()

  useEffect(() => {
    // Shuffle words on mount
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    setShuffledWords(shuffled)
  }, [words])

  if (shuffledWords.length === 0) return null

  const currentWord = shuffledWords[currentIndex]
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100

  const handleNext = () => {
    setIsFlipped(false)
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setShowSummary(true)
    }
  }

  const handlePrevious = () => {
    setIsFlipped(false)
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleAnswer = (correct: boolean) => {
    const newResults = {
      correct: results.correct + (correct ? 1 : 0),
      again: results.again + (correct ? 0 : 1),
    }
    setResults(newResults)

    // Update word score
    const newScore = (currentWord.score || 0) + (correct ? 1 : -1)
    updateWord(currentWord.id, { score: Math.max(0, newScore) })

    handleNext()
  }

  const handleComplete = () => {
    onComplete(results)
    setShowSummary(false)
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Card {currentIndex + 1} of {shuffledWords.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="relative">
          <Card
            className="min-h-[400px] cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <CardContent className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
              {!isFlipped ? (
                // Front of card
                <div className="space-y-4">
                  <Badge variant="secondary" className="mb-4">
                    Term
                  </Badge>
                  <h2 className="text-4xl font-bold mb-4">{currentWord.term}</h2>
                  {currentWord.phonetic && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg text-muted-foreground">{currentWord.phonetic}</span>
                      <Button size="sm" variant="ghost">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-muted-foreground mt-8">Click to reveal definition</p>
                </div>
              ) : (
                // Back of card
                <div className="space-y-4">
                  <Badge variant="secondary" className="mb-4">
                    Definition
                  </Badge>
                  <h3 className="text-2xl font-semibold mb-4">{currentWord.term}</h3>
                  <p className="text-lg mb-4">{currentWord.definition}</p>
                  {currentWord.example && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Example:</p>
                      <p className="italic">"{currentWord.example}"</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flip indicator */}
          <div className="absolute top-4 right-4">
            <Button size="sm" variant="ghost" onClick={() => setIsFlipped(!isFlipped)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {isFlipped && (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => handleAnswer(false)} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Again
              </Button>
              <Button onClick={() => handleAnswer(true)} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Got it
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === shuffledWords.length - 1 && !isFlipped}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Exit button */}
        <div className="text-center">
          <Button variant="ghost" onClick={onExit}>
            Exit Study Session
          </Button>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Study Session Complete!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">{results.correct}</div>
              <p className="text-sm text-muted-foreground">Words you got right</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-semibold text-green-500">{results.correct}</div>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div>
                <div className="text-xl font-semibold text-orange-500">{results.again}</div>
                <p className="text-xs text-muted-foreground">Need Review</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onExit} className="flex-1 bg-transparent">
                Done
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                Study Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
