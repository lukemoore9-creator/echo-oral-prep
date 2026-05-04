"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getTicketName } from "@/lib/tickets";
import { SettingsDrawer } from "@/components/layout/SettingsDrawer";

interface Session {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  topics_covered: string[];
  overall_score: number;
  ai_summary: string;
  exchanges_count: number;
  session_type: string;
}

interface Props {
  student: {
    full_name: string;
    ticket_type: string;
    total_sessions: number;
    total_minutes: number;
    overall_readiness: number;
  };
  sessions: Session[];
  topicScores: Record<string, number>;
  daysToExam: number | null;
}

function getBarColor(score: number): string {
  if (score >= 70) return "var(--color-chart-green)";
  if (score >= 40) return "#93B0A4";
  return "var(--color-rule-strong)";
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function LogbookClient({
  student,
  sessions,
  topicScores,
  daysToExam,
}: Props) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const surname = student.full_name.split(" ").slice(-1)[0] || student.full_name;
  const ticketName = getTicketName(student.ticket_type);

  const chartData = Object.entries(topicScores).map(([topic, score]) => ({
    topic,
    score: Math.round(score),
  }));

  const weakAreas = Object.entries(topicScores)
    .filter(([, score]) => score < 50)
    .sort((a, b) => a[1] - b[1]);

  const stats = [
    { label: "Sittings", value: String(student.total_sessions) },
    { label: "Time at the Chair", value: formatDuration(student.total_minutes) },
    { label: "Days to Oral", value: daysToExam !== null ? String(daysToExam) : "\u2014" },
    { label: "Readiness", value: `${student.overall_readiness}%` },
  ];

  return (
    <>
      <div className="min-h-screen bg-paper">
        <div className="mx-auto max-w-[880px] px-6 py-12">
          {/* Headline */}
          <div>
            <p
              className="font-mono text-[10px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.16em" }}
            >
              Folio 03 &middot; Logbook
            </p>
            <h1 className="mt-3 font-serif text-[26px] sm:text-[36px] text-ink" style={{ fontWeight: 400 }}>
              Logbook
            </h1>
            <p
              className="mt-2 font-mono text-[12px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.12em" }}
            >
              Candidate {surname} &middot;{" "}
              <button
                onClick={() => setDrawerOpen(true)}
                className="underline decoration-rule underline-offset-2 transition-colors hover:text-ink hover:decoration-ink"
              >
                {ticketName}
              </button>
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-12 flex flex-col gap-0 sm:flex-row sm:gap-0">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex-1 py-4 sm:py-0 ${
                  i < stats.length - 1
                    ? "border-b border-rule sm:border-b-0 sm:border-r sm:pr-6"
                    : ""
                } ${i > 0 ? "sm:pl-6" : ""}`}
              >
                <p
                  className="font-mono text-[10px] uppercase text-ink-muted"
                  style={{ letterSpacing: "0.12em" }}
                >
                  {stat.label}
                </p>
                <p className="mt-2 font-mono text-[24px] sm:text-[32px] font-medium text-ink">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Performance chart */}
          {chartData.length > 0 && (
            <div className="mt-16">
              <h2 className="font-serif text-[24px] text-ink" style={{ fontWeight: 400 }}>
                Performance by topic
              </h2>
              <div className="mt-6" style={{ width: "100%", height: 320, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fontFamily: "var(--font-mono)", fill: "var(--color-ink-muted)" }}
                      axisLine={{ stroke: "var(--color-rule)" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="topic"
                      width={120}
                      tick={{ fontSize: 13, fontFamily: "var(--font-mono)", fill: "var(--color-ink-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Score"]}
                      contentStyle={{
                        border: "1px solid var(--color-rule)",
                        borderRadius: "8px",
                        boxShadow: "none",
                        fontSize: "13px",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Focus areas */}
          <div className="mt-12">
            <h2 className="font-serif text-[24px] text-ink" style={{ fontWeight: 400 }}>
              Areas to revisit
            </h2>
            {weakAreas.length > 0 ? (
              <div className="mt-4">
                {weakAreas.map(([topic, score], i) => (
                  <div
                    key={topic}
                    className={`flex items-center justify-between py-3 ${
                      i < weakAreas.length - 1 ? "border-b border-rule" : ""
                    }`}
                  >
                    <span className="font-serif text-[17px] italic text-ink" style={{ fontWeight: 400 }}>
                      {topic}
                    </span>
                    <div className="flex items-center gap-4">
                      <span
                        className="font-mono text-[11px] uppercase text-marginal"
                        style={{ letterSpacing: "0.08em" }}
                      >
                        Revisit
                      </span>
                      <span className="font-mono text-[13px] text-ink-muted">
                        {Math.round(score)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 font-serif text-[17px] italic text-ink-muted" style={{ fontWeight: 400 }}>
                Looking strong across all topics.
              </p>
            )}
          </div>

          {/* Sittings history */}
          {sessions.length > 0 && (
            <div className="mt-16">
              <h2 className="font-serif text-[24px] text-ink" style={{ fontWeight: 400 }}>
                Sittings
              </h2>
              <div className="mt-6">
                {sessions.map((session) => {
                  const isExpanded = expandedSession === session.id;
                  const date = new Date(session.started_at).toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "short", year: "numeric" }
                  );
                  const duration = Math.floor(session.duration_seconds / 60);
                  const topics = (session.topics_covered || []).slice(0, 3);
                  const isBridge = session.session_type === "bridge" || session.session_type === "wardroom";

                  return (
                    <div key={session.id} className="border-b border-rule">
                      <button
                        onClick={() =>
                          setExpandedSession(isExpanded ? null : session.id)
                        }
                        className="flex w-full items-center gap-4 py-4 text-left"
                      >
                        <span className="shrink-0 font-mono text-[13px] text-ink-soft">
                          {date}
                        </span>
                        <span className="shrink-0 font-mono text-[13px] text-ink-muted">
                          {duration} min
                        </span>
                        <span className="min-w-0 flex-1 truncate font-serif text-[13px] italic text-ink-soft" style={{ fontWeight: 400 }}>
                          {topics.join(" \u00B7 ")}
                        </span>
                        <span
                          className="shrink-0 font-mono text-[11px] uppercase"
                          style={{
                            letterSpacing: "0.06em",
                            color: isBridge ? "var(--color-brass)" : "var(--color-chart-green)",
                          }}
                        >
                          {session.session_type || "examination"}
                        </span>
                        <span className="w-12 shrink-0 text-right font-mono text-[14px] font-medium text-ink">
                          {isBridge ? "\u2014" : session.overall_score}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-ink-muted" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
                        )}
                      </button>
                      {isExpanded && session.ai_summary && (
                        <div className="pb-4">
                          <p
                            className="max-w-[640px] font-serif text-[17px] italic leading-relaxed text-ink-soft"
                            style={{ fontWeight: 400 }}
                          >
                            {session.ai_summary}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="mt-20 text-center">
              <p className="font-serif text-[22px] italic text-ink-soft" style={{ fontWeight: 400 }}>
                No sittings yet.
              </p>
              <p className="mt-3 text-sm text-ink-muted">
                Your record begins with the first chair.
              </p>
              <div className="mt-8">
                <Link
                  href="/examination"
                  className="group relative font-serif text-[17px] italic text-ink transition-colors hover:text-ink"
                  style={{ fontWeight: 400 }}
                >
                  Take the chair &rarr;
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
                </Link>
              </div>
            </div>
          )}

          {/* Bottom actions */}
          {sessions.length > 0 && (
            <div className="mt-20">
              <div className="border-t border-rule" />
              <div className="mt-8 flex flex-col items-center gap-2">
                <Link
                  href="/examination"
                  className="group relative font-serif text-[17px] italic text-ink transition-colors"
                  style={{ fontWeight: 400 }}
                >
                  Take the chair &rarr;
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
                </Link>
                <Link
                  href="/drill"
                  className="font-mono text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  Or run a 10-minute drill &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Bottom margin */}
          <div className="h-24" />
        </div>
      </div>

      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
