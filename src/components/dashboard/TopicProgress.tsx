"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopicProgressItem {
  topicName: string;
  masteryPercentage: number;
  sessionsCount: number;
}

interface TopicProgressProps {
  topics: TopicProgressItem[];
}

function getProgressColor(percentage: number): string {
  if (percentage >= 70) return "bg-[#22C55E]";
  if (percentage >= 40) return "bg-[#F59E0B]";
  return "bg-[#EF4444]";
}

function getProgressLabel(percentage: number): string {
  if (percentage >= 70) return "Strong";
  if (percentage >= 40) return "Moderate";
  return "Needs Work";
}

function getProgressTextColor(percentage: number): string {
  if (percentage >= 70) return "text-[#22C55E]";
  if (percentage >= 40) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

export function TopicProgress({ topics }: TopicProgressProps) {
  return (
    <Card className="border-none bg-[#212D3B] ring-white/5">
      <CardHeader>
        <CardTitle className="text-white">Topic Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-[#E8ECF1]/50">
              No topic data yet
            </p>
            <p className="mt-1 text-xs text-[#E8ECF1]/30">
              Complete a few sessions to see your progress across topics
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.topicName}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#E8ECF1]">
                    {topic.topicName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${getProgressTextColor(
                        topic.masteryPercentage
                      )}`}
                    >
                      {getProgressLabel(topic.masteryPercentage)}
                    </span>
                    <span className="text-xs tabular-nums text-[#E8ECF1]/40">
                      {Math.round(topic.masteryPercentage)}%
                    </span>
                  </div>
                </div>

                {/* ── Progress bar ── */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#1A2332]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      topic.masteryPercentage
                    )}`}
                    style={{ width: `${Math.min(topic.masteryPercentage, 100)}%` }}
                  />
                </div>

                <p className="mt-1 text-[11px] text-[#E8ECF1]/30">
                  {topic.sessionsCount} session
                  {topic.sessionsCount !== 1 ? "s" : ""} practiced
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
