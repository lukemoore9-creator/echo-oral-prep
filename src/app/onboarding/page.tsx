"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { STUDENT_TICKETS } from "@/lib/tickets";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExamDate, setHasExamDate] = useState(false);
  const [ticketType, setTicketType] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          ticketType,
          hasExamDate,
          examDate: hasExamDate ? formData.get("examDate") : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      await user?.reload();
      router.push("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError("Request failed: " + msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Card className="w-full max-w-[480px] border border-rule shadow-none">
        <CardContent className="px-8 py-10">
          <div className="mb-10">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              Echo
            </span>
          </div>

          <h1 className="font-serif text-xl font-bold tracking-tight text-ink">
            Let&apos;s get you set up
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
            Tell us about your exam so we can personalise your prep.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-ink"
              >
                Full name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                defaultValue={user?.fullName || ""}
                className="h-[44px] rounded-lg border-rule bg-paper px-4 text-[15px] text-ink transition-colors focus-visible:border-chart-green focus-visible:ring-chart-green/20"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-ink">
                What exam are you preparing for?
              </Label>
              <Select
                value={ticketType}
                onValueChange={(value) => setTicketType(value ?? "")}
              >
                <SelectTrigger className="h-[44px] w-full rounded-lg border-rule bg-paper px-4 text-[15px] text-ink transition-colors focus-visible:border-chart-green focus-visible:ring-chart-green/20">
                  <SelectValue placeholder="Select your exam" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_TICKETS.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={hasExamDate}
                onCheckedChange={(checked) =>
                  setHasExamDate(checked === true)
                }
                className="size-4 rounded border-rule data-checked:border-chart-green data-checked:bg-chart-green"
              />
              <Label className="cursor-pointer text-sm font-medium text-ink">
                I have an exam date
              </Label>
            </div>

            {hasExamDate && (
              <div className="space-y-2">
                <Label
                  htmlFor="examDate"
                  className="text-sm font-medium text-ink"
                >
                  Exam date
                </Label>
                <Input
                  id="examDate"
                  name="examDate"
                  type="date"
                  className="h-[44px] rounded-lg border-rule bg-paper px-4 text-[15px] text-ink transition-colors focus-visible:border-chart-green focus-visible:ring-chart-green/20"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-refer">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !ticketType}
              className="h-[44px] w-full rounded-lg bg-chart-green text-[15px] font-medium text-paper hover:bg-ink disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
