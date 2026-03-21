"use client";

import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/types";

interface RecentSessionsProps {
  sessions: Session[];
}

const modeLabels: Record<Session["mode"], string> = {
  practice: "Practice",
  mock_exam: "Mock Exam",
  topic_drill: "Topic Drill",
};

const modeStyles: Record<Session["mode"], string> = {
  practice: "bg-[#22C55E]/15 text-[#22C55E]",
  mock_exam: "bg-[#D4A843]/15 text-[#D4A843]",
  topic_drill: "bg-[#3B82F6]/15 text-[#3B82F6]",
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card className="border-none bg-[#212D3B] ring-white/5">
      <CardHeader>
        <CardTitle className="text-white">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#1A2332]">
              <Clock className="size-6 text-[#E8ECF1]/30" />
            </div>
            <p className="mt-3 text-sm font-medium text-[#E8ECF1]/50">
              No sessions yet
            </p>
            <p className="mt-1 text-xs text-[#E8ECF1]/30">
              Start your first practice session to see your history here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
              >
                {/* ── Ticket type name ── */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#E8ECF1]">
                    {session.ticket_type?.name || "Unknown Ticket"}
                  </p>
                  <p className="text-xs text-[#E8ECF1]/40">
                    {formatDate(session.started_at)}
                    {session.duration_seconds != null &&
                      ` \u00B7 ${formatDuration(session.duration_seconds)}`}
                  </p>
                </div>

                {/* ── Mode badge ── */}
                <Badge
                  variant="secondary"
                  className={`shrink-0 border-none text-[10px] ${
                    modeStyles[session.mode]
                  }`}
                >
                  {modeLabels[session.mode]}
                </Badge>

                {/* ── Score ── */}
                {session.overall_score != null && (
                  <span
                    className={`min-w-[3rem] text-right text-sm font-semibold tabular-nums ${
                      session.overall_score >= 70
                        ? "text-[#22C55E]"
                        : session.overall_score >= 50
                          ? "text-[#F59E0B]"
                          : "text-[#EF4444]"
                    }`}
                  >
                    {Math.round(session.overall_score)}%
                  </span>
                )}

                <ChevronRight className="size-4 shrink-0 text-[#E8ECF1]/20 transition-colors group-hover:text-[#E8ECF1]/50" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
