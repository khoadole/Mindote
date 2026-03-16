"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

interface Topic {
  id: string;
  level: string;
  order: number;
  name: string;
  isFree: boolean;
  wordCount: number;
}

export default function AdminVocabularyLevelPage() {
  const params = useParams();
  const level = (params.level as string).toUpperCase();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Add topic dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadTopics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cefr/topics?level=${level}`);
      if (!res.ok) throw new Error("Failed to fetch topics");
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  async function handleToggleFree(topic: Topic) {
    setSaving(topic.id);
    // Optimistic update
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topic.id ? { ...t, isFree: !t.isFree } : t,
      ),
    );
    try {
      const res = await fetch(`/api/admin/cefr/topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFree: !topic.isFree }),
      });
      if (!res.ok) throw new Error("Failed to update topic");
    } catch (err) {
      console.error(err);
      // Revert on error
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id ? { ...t, isFree: topic.isFree } : t,
        ),
      );
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveName(topic: Topic) {
    if (!editName.trim() || editName.trim() === topic.name) {
      setEditingId(null);
      return;
    }
    setSaving(topic.id);
    try {
      const res = await fetch(`/api/admin/cefr/topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update topic name");
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id ? { ...t, name: editName.trim() } : t,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setEditingId(null);
      setSaving(null);
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/cefr/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create topic");
      const data = await res.json();
      setTopics((prev) => [...prev, { ...data.topic, wordCount: 0 }]);
      setNewName("");
      setAddOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(topicId: string) {
    try {
      const res = await fetch(`/api/admin/cefr/topics/${topicId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete topic");
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
    } catch (err) {
      console.error(err);
    }
  }

  const totalWords = topics.reduce((sum, t) => sum + t.wordCount, 0);
  const levelColor = LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-800";

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/vocabulary"
          className="hover:text-foreground transition-colors"
        >
          Vocabulary
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold ${levelColor}`}
        >
          {level}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Topics – {level}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {topics.length} topics · {totalWords.toLocaleString()} words
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Topic</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="new-topic-name">Topic Name</Label>
              <Input
                id="new-topic-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Animals"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  setNewName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
              >
                {adding ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Topic Name</TableHead>
                <TableHead className="w-20 text-center">Words</TableHead>
                <TableHead className="w-28 text-center">Free Access</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No topics yet. Click &quot;Add Topic&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                topics.map((topic, index) => (
                  <TableRow key={topic.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      {editingId === topic.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveName(topic);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveName(topic)}
                            disabled={saving === topic.id}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{topic.name}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Link
                        href={`/admin/vocabulary/${level}/${topic.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {topic.wordCount}
                      </Link>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={topic.isFree}
                          onCheckedChange={() => handleToggleFree(topic)}
                          disabled={saving === topic.id}
                        />
                        <span className="text-xs text-muted-foreground">
                          {topic.isFree ? "Free" : "Premium"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(topic.id);
                            setEditName(topic.name);
                          }}
                          disabled={!!editingId}
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
                                Delete &quot;{topic.name}&quot;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the topic and all{" "}
                                {topic.wordCount} words inside it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(topic.id)}
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
    </div>
  );
}
