import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, BookOpen } from "lucide-react";
import type { Session } from "@/types";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, ticket_type:ticket_types(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  const typedSessions = (sessions as Session[]) || [];

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const modeLabels: Record<string, string> = {
    practice: "Practice",
    mock_exam: "Mock Exam",
    topic_drill: "Topic Drill",
  };

  const modeColors: Record<string, string> = {
    practice: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    mock_exam: "bg-gold/10 text-gold border-gold/20",
    topic_drill: "bg-success/10 text-success border-success/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Session History</h1>
        <p className="text-muted-foreground">Review your past exam sessions and track your progress.</p>
      </div>

      {typedSessions.length === 0 ? (
        <Card className="bg-card border-gold/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-heading text-lg font-semibold">No sessions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Start your first practice session to begin tracking your progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {typedSessions.map((session) => (
            <Card key={session.id} className="bg-card border-gold/10 hover:border-gold/20 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{session.ticket_type?.icon || "⚓"}</span>
                    <div>
                      <CardTitle className="text-base font-heading">
                        {session.ticket_type?.name || "Unknown Ticket"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session.started_at)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={modeColors[session.mode] || ""}
                  >
                    {modeLabels[session.mode] || session.mode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(session.duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gold" />
                    <span className="font-mono font-semibold text-gold">
                      {session.overall_score != null
                        ? `${Math.round(session.overall_score * 10)}/10`
                        : "—"}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      session.status === "completed"
                        ? "bg-success/10 text-success border-success/20"
                        : session.status === "abandoned"
                        ? "bg-danger/10 text-danger border-danger/20"
                        : "bg-gold/10 text-gold border-gold/20"
                    }
                  >
                    {session.status}
                  </Badge>
                </div>

                {session.topic_scores && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(session.topic_scores).map(([topic, score]) => (
                      <div
                        key={topic}
                        className="flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs"
                      >
                        <span className="text-muted-foreground">{topic}:</span>
                        <span
                          className={`font-mono font-semibold ${
                            score >= 0.7
                              ? "text-success"
                              : score >= 0.4
                              ? "text-warning"
                              : "text-danger"
                          }`}
                        >
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
