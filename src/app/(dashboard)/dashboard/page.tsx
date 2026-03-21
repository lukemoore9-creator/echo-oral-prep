import Link from "next/link";
import { Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentSessions } from "@/components/dashboard/RecentSessions";
import { TopicProgress } from "@/components/dashboard/TopicProgress";
import type { Session } from "@/types";

export const metadata = {
  title: "Dashboard | Helm AI",
  description: "Your maritime oral exam preparation overview",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Fetch completed sessions with ticket type info ──
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, ticket_type:ticket_types(*)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(50);

  const completedSessions = (sessions as Session[] | null) ?? [];

  // ── Compute stats ──
  const sessionsCompleted = completedSessions.length;

  const totalSeconds = completedSessions.reduce(
    (sum, s) => sum + (s.duration_seconds ?? 0),
    0
  );
  const totalHours = totalSeconds / 3600;

  const scoredSessions = completedSessions.filter(
    (s) => s.overall_score != null
  );
  const averageScore =
    scoredSessions.length > 0
      ? scoredSessions.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) /
        scoredSessions.length
      : 0;

  // ── Compute streak (consecutive days with at least one session) ──
  let currentStreak = 0;
  if (completedSessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDates = new Set(
      completedSessions.map((s) => {
        const d = new Date(s.started_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    const checkDate = new Date(today);
    // Check if there's a session today; if not, start from yesterday
    if (!sessionDates.has(checkDate.getTime())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (sessionDates.has(checkDate.getTime())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // ── Recent sessions (last 5) ──
  const recentSessions = completedSessions.slice(0, 5);

  // ── Topic progress (aggregate scores by topic from topic_scores) ──
  const topicMap = new Map<
    string,
    { totalScore: number; count: number }
  >();

  for (const session of completedSessions) {
    if (session.topic_scores) {
      for (const [topicName, score] of Object.entries(session.topic_scores)) {
        const existing = topicMap.get(topicName) ?? {
          totalScore: 0,
          count: 0,
        };
        existing.totalScore += score as number;
        existing.count += 1;
        topicMap.set(topicName, existing);
      }
    }
  }

  const topicProgressItems = Array.from(topicMap.entries())
    .map(([topicName, data]) => ({
      topicName,
      masteryPercentage: data.totalScore / data.count,
      sessionsCount: data.count,
    }))
    .sort((a, b) => a.topicName.localeCompare(b.topicName));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Quick start ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="text-sm text-[#E8ECF1]/50">
            Pick up where you left off or start a new session.
          </p>
        </div>
        <Link href="/tickets">
          <Button className="gap-2 bg-[#D4A843] text-[#0C1B33] hover:bg-[#D4A843]/90">
            <Anchor className="size-4" />
            Start Session
          </Button>
        </Link>
      </div>

      {/* ── Stats ── */}
      <StatsCards
        sessionsCompleted={sessionsCompleted}
        totalHours={totalHours}
        averageScore={averageScore}
        currentStreak={currentStreak}
      />

      {/* ── Content grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSessions sessions={recentSessions} />
        <TopicProgress topics={topicProgressItems} />
      </div>
    </div>
  );
}
