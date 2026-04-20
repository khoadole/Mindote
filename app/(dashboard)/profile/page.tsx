"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useUserStats } from "@/hooks/use-settings";
import {
  cn,
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/utils";
import {
  Activity,
  BookOpen,
  Flame,
  Layers,
  Loader2,
  Pencil,
  Trophy,
} from "lucide-react";

interface CalendarDay {
  date: string;
  totalEvents: number;
}

interface CalendarResponse {
  days: CalendarDay[];
  monthStats: {
    totalEvents: number;
  };
}

interface ContributionCell {
  dateKey: string;
  totalEvents: number;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getContributionLevel(totalEvents: number): number {
  if (totalEvents <= 0) return 0;
  if (totalEvents <= 1) return 1;
  if (totalEvents <= 3) return 2;
  if (totalEvents <= 6) return 3;
  return 4;
}

function getContributionClass(level: number): string {
  switch (level) {
    case 0:
      return "bg-slate-200 dark:bg-slate-800";
    case 1:
      return "bg-green-200 dark:bg-green-900/55";
    case 2:
      return "bg-green-300 dark:bg-green-700/70";
    case 3:
      return "bg-green-500 dark:bg-green-500/85";
    default:
      return "bg-green-600 dark:bg-green-400";
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { toast } = useToast();

  const [contributionMap, setContributionMap] = useState<Record<string, number>>(
    {},
  );
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const currentDisplayName = useMemo(() => getUserDisplayName(user), [user]);

  const currentDescription =
    user?.user_metadata?.description || user?.user_metadata?.bio || "";

  const description = currentDescription || "No description added yet.";

  const joinDateLabel = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : "Recently";

  const last12Months = useMemo(() => {
    const now = new Date();
    const months: string[] = [];

    for (let index = 11; index >= 0; index -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
      months.push(getMonthKey(monthDate));
    }

    return months;
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchCalendarData = async () => {
      setCalendarLoading(true);

      try {
        const responses = await Promise.all(
          last12Months.map(async (month) => {
            const response = await fetch(`/api/streak/calendar?month=${month}`);
            if (!response.ok) {
              return null;
            }
            const data = (await response.json()) as CalendarResponse;
            return data;
          }),
        );

        if (!mounted) {
          return;
        }

        const nextMap: Record<string, number> = {};

        responses.forEach((result) => {
          if (!result?.days?.length) {
            return;
          }

          result.days.forEach((day) => {
            nextMap[day.date] = (nextMap[day.date] || 0) + day.totalEvents;
          });
        });

        setContributionMap(nextMap);
      } catch {
        if (mounted) {
          setContributionMap({});
        }
      } finally {
        if (mounted) {
          setCalendarLoading(false);
        }
      }
    };

    fetchCalendarData();

    return () => {
      mounted = false;
    };
  }, [last12Months]);

  const contributionDays = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setDate(start.getDate() - 364);

    const result: ContributionCell[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      result.push({
        dateKey: key,
        totalEvents: contributionMap[key] || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [contributionMap]);

  const weeklyGrid = useMemo(() => {
    if (contributionDays.length === 0) {
      return [] as Array<Array<ContributionCell | null>>;
    }

    const firstDay = new Date(`${contributionDays[0].dateKey}T00:00:00`);
    const leadingEmpty = firstDay.getDay();

    const cells: Array<ContributionCell | null> = [
      ...Array.from({ length: leadingEmpty }, () => null),
      ...contributionDays,
    ];

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: Array<Array<ContributionCell | null>> = [];

    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return weeks;
  }, [contributionDays]);

  const monthLabels = useMemo(() => {
    const labels: string[] = [];
    let previousMonth = "";

    weeklyGrid.forEach((week) => {
      const firstRealCell = week.find((cell) => cell !== null);

      if (!firstRealCell) {
        labels.push("");
        return;
      }

      const date = new Date(`${firstRealCell.dateKey}T00:00:00`);
      const month = date.toLocaleDateString("en-US", { month: "short" });

      if (month !== previousMonth) {
        labels.push(month);
        previousMonth = month;
      } else {
        labels.push("");
      }
    });

    return labels;
  }, [weeklyGrid]);

  const totalWords = stats?.totalWords || 0;
  const masteredWords = stats?.masteredWords || 0;
  const masteryProgress = totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;

  useEffect(() => {
    setEditDisplayName(currentDisplayName);
    setEditDescription(currentDescription);
  }, [currentDescription, currentDisplayName]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);

    try {
      const supabase = createClient();
      const nextDisplayName = editDisplayName.trim();
      const nextDescription = editDescription.trim();

      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          display_name: nextDisplayName,
          description: nextDescription,
          bio: nextDescription,
        },
      });

      if (error) {
        throw error;
      }

      setIsEditOpen(false);
      toast({
        title: "Profile updated",
        description: "Your name and description were saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-full bg-background px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="self-start xl:sticky xl:top-6">
            <CardContent className="pt-6">
              <div className="space-y-5">
                <Avatar className="h-32 w-32 border-4 border-border/60">
                  <AvatarImage
                    src={getUserAvatarUrl(user) || undefined}
                    alt={getUserDisplayName(user)}
                  />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-2xl font-bold text-foreground leading-tight">
                    {currentDisplayName}
                  </h2>
                  <p className="text-muted-foreground mt-1">{user?.email}</p>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">{description}</p>

                <Button
                  onClick={() => setIsEditOpen(true)}
                  variant="outline"
                  className="w-full justify-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </Button>

                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium text-foreground mt-1">{joinDateLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Learning progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Total words
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : totalWords}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      Mastered
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : masteredWords}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      Collections
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.totalCollections || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Avg score
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : `${stats?.avgScore || 0}%`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mastery progress</span>
                    <span className="font-semibold text-foreground">{Math.round(masteryProgress)}%</span>
                  </div>
                  <Progress value={masteryProgress} className="h-2.5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Activity overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-dashed border-border bg-muted/15 p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Activity section will be added here.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-xl">Streak</CardTitle>
                <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted/20 px-3 py-1.5 text-sm">
                  <span className="inline-flex items-center gap-1 text-orange-500 font-semibold">
                    <Flame className="h-4 w-4" /> {stats?.currentStreak || 0} days
                  </span>
                  <span className="text-muted-foreground">Best: {stats?.longestStreak || 0}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[780px]">
                    <div className="ml-8 grid grid-flow-col auto-cols-[12px] gap-1 text-[10px] text-muted-foreground">
                      {monthLabels.map((label, index) => (
                        <div key={`month-${index}`} className="h-4">
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <div className="grid grid-rows-7 gap-1 text-[10px] text-muted-foreground">
                        <span className="h-3" />
                        <span className="h-3">Mon</span>
                        <span className="h-3" />
                        <span className="h-3">Wed</span>
                        <span className="h-3" />
                        <span className="h-3">Fri</span>
                        <span className="h-3" />
                      </div>

                      <div className="grid grid-flow-col auto-cols-[12px] grid-rows-7 gap-1">
                        {weeklyGrid.map((week, weekIndex) =>
                          week.map((cell, dayIndex) => {
                            if (!cell) {
                              return (
                                <div
                                  key={`empty-${weekIndex}-${dayIndex}`}
                                  className="h-3 w-3 rounded-[2px] bg-transparent"
                                />
                              );
                            }

                            const level = getContributionLevel(cell.totalEvents);
                            return (
                              <div
                                key={cell.dateKey}
                                title={`${cell.dateKey}: ${cell.totalEvents} activities`}
                                className={cn(
                                  "h-3 w-3 rounded-[2px] ring-1 ring-black/5 dark:ring-white/10",
                                  getContributionClass(level),
                                )}
                              />
                            );
                          }),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {calendarLoading && (
                  <p className="text-xs text-muted-foreground">Loading streak heatmap...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your display name and short description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={editDisplayName}
                onChange={(event) => setEditDisplayName(event.target.value)}
                maxLength={60}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={4}
                maxLength={180}
                placeholder="Tell everyone what you are learning."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
