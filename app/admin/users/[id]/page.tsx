"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Crown,
  BookOpen,
  PenLine,
  Brain,
  TrendingUp,
  Calendar,
  Mail,
  Layers,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";

interface UserDetail {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
    createdAt: string;
    lastLoginDate: string | null;
    currentStreak: number;
    longestStreak: number;
    setting: {
      language: string;
      theme: string;
      learningLanguage: string;
    } | null;
    subscriptions: {
      id: string;
      name: string;
      status: string;
      statusFormatted: string;
      provider: string;
      price: string;
      startsAt: string | null;
      endsAt: string | null;
      renewsAt: string | null;
      createdAt: string;
      plan: { name: string; interval: string | null } | null;
    }[];
  };
  collections: {
    list: { id: string; name: string; color: string; createdAt: string; _count: { words: number } }[];
    totalWords: number;
  };
  writingStats: {
    total: number;
    avgScore: number | null;
    recent: {
      id: string;
      score: number | null;
      completedAt: string;
      userText: string;
      passage: { title: string; level: string };
    }[];
  };
  cefrLearnedCount: number;
  aiStats: {
    usagesToday: number;
    totalCost: number;
    totalTokens: number;
    byFeature: { feature: string; totalTokens: number; cost: number }[];
  };
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();

  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        User not found.
      </div>
    );
  }

  const { user, collections, writingStats, cefrLearnedCount, aiStats } = data;
  const activeSub = user.subscriptions.find((s) => s.status === "active");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Users
      </Button>

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold border shrink-0">
          {user.displayName?.[0]?.toUpperCase() ||
            user.email[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">
              {user.displayName || user.username || "No name"}
            </h1>
            {activeSub ? (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Free
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </p>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {format(new Date(user.createdAt), "dd MMM yyyy")}
            </span>
            {user.lastLoginDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last seen{" "}
                {formatDistanceToNow(new Date(user.lastLoginDate), {
                  addSuffix: true,
                })}
              </span>
            )}
            {user.setting && (
              <span>Language: {user.setting.language.toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={<Layers className="h-4 w-4 text-blue-500" />}
          label="Collections"
          value={collections.list.length}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4 text-green-500" />}
          label="Vocab words"
          value={collections.totalWords.toLocaleString()}
        />
        <StatCard
          icon={<PenLine className="h-4 w-4 text-purple-500" />}
          label="Writing"
          value={writingStats.total}
          sub={
            writingStats.avgScore !== null
              ? `avg ${writingStats.avgScore.toFixed(1)}/10`
              : undefined
          }
        />
        <StatCard
          icon={<Brain className="h-4 w-4 text-indigo-500" />}
          label="CEFR words"
          value={cefrLearnedCount.toLocaleString()}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
          label="Streak"
          value={user.currentStreak > 0 ? `🔥 ${user.currentStreak}` : "0"}
          sub={`best: ${user.longestStreak}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriptions.</p>
            ) : (
              <div className="space-y-3">
                {user.subscriptions.map((sub) => (
                  <div key={sub.id} className="text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{sub.name}</span>
                      <Badge
                        variant={sub.status === "active" ? "default" : "outline"}
                        className={
                          sub.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "text-muted-foreground"
                        }
                      >
                        {sub.statusFormatted}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sub.provider === "payos" ? "PayOS" : "LemonSqueezy"} ·{" "}
                      {sub.price}
                      {sub.plan?.interval ? ` / ${sub.plan.interval}` : ""}
                    </p>
                    {sub.endsAt && (
                      <p className="text-xs text-muted-foreground">
                        Ends: {format(new Date(sub.endsAt), "dd MMM yyyy")}
                      </p>
                    )}
                    {sub.renewsAt && (
                      <p className="text-xs text-muted-foreground">
                        Renews: {format(new Date(sub.renewsAt), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              AI Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Today</span>
              <span className="font-medium">{aiStats.usagesToday} evaluations</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total tokens</span>
              <span className="font-medium">
                {aiStats.totalTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total cost</span>
              <span className="font-medium">
                ${aiStats.totalCost.toFixed(4)}
              </span>
            </div>
            {aiStats.byFeature.length > 0 && (
              <div className="pt-1 border-t space-y-1">
                <p className="text-xs text-muted-foreground mb-1">By feature</p>
                {aiStats.byFeature.map((f) => (
                  <div key={f.feature} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{f.feature}</span>
                    <span>${f.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collections */}
      {collections.list.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              Collections ({collections.list.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {collections.list.map((col) => (
                <div
                  key={col.id}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <p className="font-medium truncate">{col.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {col._count.words} words
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Writing attempts */}
      {writingStats.recent.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PenLine className="h-4 w-4 text-purple-500" />
              Recent Writing Attempts ({writingStats.total} total)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passage</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {writingStats.recent.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium text-sm max-w-32 truncate">
                      {attempt.passage.title}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${LEVEL_COLORS[attempt.passage.level] ?? ""}`}
                      >
                        {attempt.passage.level}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.score !== null ? (
                        <span
                          className={`text-sm font-semibold ${attempt.score >= 7 ? "text-green-600" : attempt.score >= 5 ? "text-amber-600" : "text-red-500"}`}
                        >
                          {attempt.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(attempt.completedAt), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-48">
                      <span className="line-clamp-1">{attempt.userText}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="border rounded-xl p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
