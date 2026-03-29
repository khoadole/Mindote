"use client";

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
  useAdminDeleteReadingPractice,
  useAdminReadingPracticeList,
  useAdminUpdateReadingPractice,
} from "@/hooks/use-reading-practice";

export default function AdminReadingPage() {
  const router = useRouter();
  const { data: items, isLoading } = useAdminReadingPracticeList();
  const deleteMutation = useAdminDeleteReadingPractice();
  const updateMutation = useAdminUpdateReadingPractice();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reading Practice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items?.length ?? 0} parts total
          </p>
        </div>
        <Button onClick={() => router.push("/admin/reading/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Part
        </Button>
      </div>

      {!items || items.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No reading practice yet</p>
          <p className="text-sm mb-6">Create your first reading part to get started.</p>
          <Button onClick={() => router.push("/admin/reading/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Part
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Part</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.examTitle}</TableCell>
                  <TableCell className="text-sm">Part {item.partNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{item.title}</div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {item.totalQuestions}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {item._count?.attempts ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          id: item.id,
                          status: item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs"
                    >
                      {item.status === "PUBLISHED" ? (
                        <Badge className="bg-green-100 text-green-800 gap-1">
                          <Eye className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
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
                        onClick={() => router.push(`/admin/reading/${item.id}`)}
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
                            <AlertDialogTitle>Delete this part?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all user latest attempts for this part.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(item.id)}
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
