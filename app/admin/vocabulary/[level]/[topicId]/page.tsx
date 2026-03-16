"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Word {
  id: string
  order: number
  term: string
  pos: string
  phonetic: string
  definition: string
  example: string
}

interface WordFormData {
  term: string
  pos: string
  phonetic: string
  definition: string
  example: string
  order: number
}

const EMPTY_FORM: WordFormData = {
  term: "",
  pos: "noun",
  phonetic: "",
  definition: "",
  example: "",
  order: 0,
}

const POS_OPTIONS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "phrase",
  "other",
]

const POS_COLORS: Record<string, string> = {
  noun: "bg-blue-100 text-blue-800",
  verb: "bg-green-100 text-green-800",
  adjective: "bg-purple-100 text-purple-800",
  adverb: "bg-yellow-100 text-yellow-800",
  preposition: "bg-orange-100 text-orange-800",
  conjunction: "bg-pink-100 text-pink-800",
  pronoun: "bg-teal-100 text-teal-800",
  phrase: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-700",
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
}

export default function AdminWordsPage() {
  const params = useParams()
  const level = (params.level as string).toUpperCase()
  const topicId = params.topicId as string

  const [words, setWords] = useState<Word[]>([])
  const [topicName, setTopicName] = useState("")
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [form, setForm] = useState<WordFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [wordsRes, topicsRes] = await Promise.all([
        fetch(`/api/admin/cefr/topics/${topicId}/words`),
        fetch(`/api/admin/cefr/topics?level=${level}`),
      ])
      const wordsData = await wordsRes.json()
      const topicsData = await topicsRes.json()
      setWords(wordsData.words ?? [])
      const topic = topicsData.topics?.find((t: any) => t.id === topicId)
      setTopicName(topic?.name ?? topicId)
      setLoading(false)
    }
    load()
  }, [topicId, level])

  function openAdd() {
    setEditingWord(null)
    setForm({ ...EMPTY_FORM, order: words.length + 1 })
    setDialogOpen(true)
  }

  function openEdit(word: Word) {
    setEditingWord(word)
    setForm({
      term: word.term,
      pos: word.pos,
      phonetic: word.phonetic,
      definition: word.definition,
      example: word.example,
      order: word.order,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.term.trim() || !form.definition.trim()) return
    setSaving(true)
    try {
      if (editingWord) {
        const res = await fetch(
          `/api/admin/cefr/topics/${topicId}/words/${editingWord.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        )
        const data = await res.json()
        setWords((prev) =>
          prev
            .map((w) => (w.id === editingWord.id ? data.word : w))
            .sort((a, b) => a.order - b.order)
        )
      } else {
        const res = await fetch(`/api/admin/cefr/topics/${topicId}/words`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        setWords((prev) =>
          [...prev, data.word].sort((a, b) => a.order - b.order)
        )
      }
      setDialogOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(wordId: string) {
    await fetch(`/api/admin/cefr/topics/${topicId}/words/${wordId}`, {
      method: "DELETE",
    })
    setWords((prev) => prev.filter((w) => w.id !== wordId))
  }

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/vocabulary" className="hover:text-foreground transition-colors">
            Vocabulary
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/admin/vocabulary/${level}`}
            className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-700"}`}
          >
            {level}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{topicName}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{topicName}</h1>
            <p className="text-sm text-muted-foreground">
              {words.length} words · {level} level
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Word
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-32">Term</TableHead>
                  <TableHead className="w-24">POS</TableHead>
                  <TableHead className="w-32">Phonetic</TableHead>
                  <TableHead>Definition</TableHead>
                  <TableHead>Example</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No words yet. Add the first word.
                    </TableCell>
                  </TableRow>
                ) : (
                  words.map((word, index) => (
                    <TableRow key={word.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-semibold">{word.term}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${POS_COLORS[word.pos] ?? POS_COLORS.other}`}
                        >
                          {word.pos}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {word.phonetic}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="text-sm text-left max-w-[180px] truncate block">
                            {word.definition}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {word.definition}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="text-sm text-left max-w-[180px] truncate block text-muted-foreground italic">
                            {word.example}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {word.example}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(word)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete &ldquo;{word.term}&rdquo;?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This word will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(word.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingWord ? "Edit Word" : "Add Word"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Term *</Label>
                  <Input
                    value={form.term}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, term: e.target.value }))
                    }
                    placeholder="e.g. generate"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Part of Speech</Label>
                  <Select
                    value={form.pos}
                    onValueChange={(v) => setForm((f) => ({ ...f, pos: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POS_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phonetic</Label>
                <Input
                  value={form.phonetic}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phonetic: e.target.value }))
                  }
                  placeholder="e.g. /ˈdʒenəreɪt/"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Definition *</Label>
                <Textarea
                  value={form.definition}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, definition: e.target.value }))
                  }
                  placeholder="Meaning of the word..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Example Sentence</Label>
                <Textarea
                  value={form.example}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, example: e.target.value }))
                  }
                  placeholder="An example sentence using the word..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.term.trim() || !form.definition.trim()}
              >
                {saving
                  ? "Saving..."
                  : editingWord
                    ? "Save Changes"
                    : "Add Word"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
