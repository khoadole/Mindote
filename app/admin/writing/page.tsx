"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import {
  useAdminWritingPassages,
  useAdminDeletePassage,
  useAdminUpdatePassage,
} from "@/hooks/use-writing";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A2: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  C2: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminWritingPage() {
  const router = useRouter();
  const { data: passages, isLoading } = useAdminWritingPassages();
  const deleteMutation = useAdminDeletePassage();
  const updateMutation = useAdminUpdatePassage();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Writing Passages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {passages?.length ?? 0} passages total
          </p>
        </div>
        <Button onClick={() => router.push("/admin/writing/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Passage
        </Button>
      </div>

      {/* Table */}
      {!passages || passages.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No passages yet</p>
          <p className="text-sm mb-6">Create your first writing passage to get started.</p>
          <Button onClick={() => router.push("/admin/writing/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Passage
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passages.map((passage, idx) => (
                <TableRow key={passage.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{passage.title}</p>
                      {passage.titleEn && (
                        <p className="text-xs text-muted-foreground">
                          {passage.titleEn}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${LEVEL_COLORS[passage.level] ?? ""}`}
                    >
                      {passage.level}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {passage.topic}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {(passage as { _count?: { attempts: number } })._count
                      ?.attempts ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          id: passage.id,
                          isPublished: !passage.isPublished,
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs"
                      title={passage.isPublished ? "Click to unpublish" : "Click to publish"}
                    >
                      {passage.isPublished ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 cursor-pointer gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground cursor-pointer gap-1">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          router.push(`/admin/writing/${passage.id}`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete passage?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{passage.title}&quot; and all
                              associated user attempts. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(passage.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
