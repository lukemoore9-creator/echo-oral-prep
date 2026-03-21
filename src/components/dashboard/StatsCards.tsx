"use client";

import {
  BookOpen,
  Clock,
  Target,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  sessionsCompleted: number;
  totalHours: number;
  averageScore: number;
  currentStreak: number;
}

const formatHours = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
};

export function StatsCards({
  sessionsCompleted,
  totalHours,
  averageScore,
  currentStreak,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Sessions Completed",
      value: sessionsCompleted.toString(),
      icon: BookOpen,
      accent: false,
    },
    {
      label: "Total Practice Time",
      value: formatHours(totalHours),
      icon: Clock,
      accent: false,
    },
    {
      label: "Average Score",
      value: averageScore > 0 ? `${Math.round(averageScore)}%` : "--",
      icon: Target,
      accent: true,
    },
    {
      label: "Current Streak",
      value: `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`,
      icon: Flame,
      accent: currentStreak > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-none bg-[#212D3B] ring-white/5"
        >
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1A2332]">
              <stat.icon
                className={`size-5 ${
                  stat.accent ? "text-[#D4A843]" : "text-[#E8ECF1]/50"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#E8ECF1]/50">
                {stat.label}
              </p>
              <p
                className={`text-xl font-bold tracking-tight ${
                  stat.accent ? "text-[#D4A843]" : "text-white"
                }`}
              >
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
