/**
 * Hook for fetching streak activity data
 * 
 * Fetches activity from the API and provides formatted data for calendar display
 */

import { useEffect, useState } from "react";

interface ActivityDay {
  date: string;
  totalEvents: number;
  hasActivity: boolean;
  types: {
    review: number;
    reading_attempt: number;
    writing_attempt: number;
    cefr_learn: number;
  };
}

interface StreakActivityData {
  data: ActivityDay[] | null;
  loading: boolean;
  error: string | null;
  month: string;
}

/**
 * Hook to fetch streak activity for past 7 days
 * Returns array of day objects with activity status
 */
export function useLastSevenDaysActivity(): StreakActivityData {
  const [data, setData] = useState<ActivityDay[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Get current month in YYYY-MM format
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    setMonth(monthStr);

    fetch(`/api/streak/calendar?month=${monthStr}`)
      .then((res) => res.json())
      .then((response) => {
        if (response.error) {
          setError(response.error);
          setData(null);
          setLoading(false);
          return;
        }

        // Filter to last 7 days only for dashboard display
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // 7 days including today

        const filtered = response.days.filter((day: ActivityDay) => {
          const dayDate = new Date(day.date + "T00:00:00Z");
          return dayDate >= sevenDaysAgo && dayDate <= today;
        });

        setData(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch activity:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error, month };
}

export default useLastSevenDaysActivity;
