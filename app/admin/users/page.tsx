"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Loader2,
  Users,
  Crown,
  TrendingUp,
  BookOpen,
  PenLine,
  Brain,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  createdAt: string;
  lastLoginDate: string | null;
  currentStreak: number;
  collectionsCount: number;
  wordsCount: number;
  writingAttemptsCount: number;
  cefrLearnedCount: number;
  activeSubscription: {
    name: string;
    status: string;
    provider: string;
  } | null;
  aiUsagesToday: number;
}

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      return data.data;
    },
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.displayName ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const premiumCount = users?.filter((u) => u.activeSubscription).length ?? 0;
  const totalWords = users?.reduce((sum, u) => sum + u.wordsCount, 0) ?? 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users?.length ?? 0} total users · {premiumCount} premium
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Total Users
          </p>
          <p className="text-2xl font-bold">{users?.length ?? 0}</p>
        </div>
        <div className="border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-yellow-500" /> Premium
          </p>
          <p className="text-2xl font-bold">{premiumCount}</p>
        </div>
        <div className="border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Total Words
          </p>
          <p className="text-2xl font-bold">{totalWords.toLocaleString()}</p>
        </div>
        <div className="border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <PenLine className="h-3.5 w-3.5" /> Writing Attempts
          </p>
          <p className="text-2xl font-bold">
            {users?.reduce((sum, u) => sum + u.writingAttemptsCount, 0) ?? 0}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-center">
                <BookOpen className="h-3.5 w-3.5 inline mr-1" />
                Words
              </TableHead>
              <TableHead className="text-center">
                <PenLine className="h-3.5 w-3.5 inline mr-1" />
                Writing
              </TableHead>
              <TableHead className="text-center">
                <Brain className="h-3.5 w-3.5 inline mr-1" />
                CEFR
              </TableHead>
              <TableHead className="text-center">
                <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
                Streak
              </TableHead>
              <TableHead className="text-center">Plan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-muted-foreground"
                >
                  {search ? `No users matching "${search}".` : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((user, idx) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <TableCell className="text-muted-foreground text-xs">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {user.displayName || user.username || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(user.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {user.lastLoginDate
                      ? format(new Date(user.lastLoginDate), "dd/MM/yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium">
                    {user.wordsCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {user.writingAttemptsCount}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {user.cefrLearnedCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {user.currentStreak > 0 ? (
                      <span className="text-orange-500 font-semibold">
                        🔥 {user.currentStreak}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.activeSubscription ? (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-xs"
                      >
                        Free
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
            {search ? "results" : "users"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                ),
              )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
