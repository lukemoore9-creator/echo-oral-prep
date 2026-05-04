"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { isBetaUser } from "@/lib/beta-access";
import { getTicketName } from "@/lib/tickets";
import { SettingsDrawer } from "@/components/layout/SettingsDrawer";

interface StudentData {
  id: string;
  full_name: string;
  email: string | null;
  ticket_type: string;
  total_sessions: number;
  total_minutes: number;
  onboarding_complete: boolean;
}

interface Chapter {
  numeral: string;
  title: string;
  description: string;
  cta: string;
  href: string;
}

const CHAPTERS: Chapter[] = [
  {
    numeral: "I",
    title: "The Examination Room",
    description:
      "A formal sitting. Eighteen questions, approximately twenty-five minutes. Verdict at the end.",
    cta: "Take the chair",
    href: "/examination",
  },
  {
    numeral: "II",
    title: "The Bridge",
    description:
      "Conversational. Echo as a senior officer with the ticket you are studying for. Stay as long as you like. No verdict \u2014 just questions and answers.",
    cta: "Step onto the bridge",
    href: "/bridge",
  },
  {
    numeral: "III",
    title: "The Mess",
    description:
      "Ten minutes. Single topic. Rapid-fire. For when you have ten minutes between watches.",
    cta: "Grab a bite",
    href: "/drill",
  },
  {
    numeral: "IV",
    title: "The Logbook",
    description:
      "A record of every sitting. Strengths, weaknesses, and where to revisit.",
    cta: "Open the logbook",
    href: "/logbook",
  },
];

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getSurname(fullName: string | undefined): string {
  if (!fullName) return "Candidate";
  const parts = fullName.trim().split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

export default function HomePage() {
  const router = useRouter();
  const { signOut } = useClerk();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [leavingTo, setLeavingTo] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/student")
      .then((res) => res.json())
      .then((data) => {
        if (data.error === "Student not found" || !data.student) {
          router.replace("/onboarding");
          return;
        }
        if (!data.student.onboarding_complete) {
          router.replace("/onboarding");
          return;
        }
        setStudent(data.student);
      })
      .catch(() => router.replace("/onboarding"))
      .finally(() => setLoading(false));
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (leaving) return;

      const key = e.key;
      if (key === "1") navigateTo("/examination");
      if (key === "2") navigateTo("/bridge");
      if (key === "3") navigateTo("/drill");
      if (key === "4") navigateTo("/logbook");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const navigateTo = useCallback(
    (href: string) => {
      if (leaving) return;
      setLeaving(true);
      setLeavingTo(href);
      setTimeout(() => {
        router.push(href);
      }, 1000);
    },
    [leaving, router]
  );

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="fixed inset-0 bg-paper" />;
  }

  // Beta gate
  if (student && !isBetaUser(student.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <span className="font-serif text-2xl text-ink" style={{ fontWeight: 400 }}>Echo</span>
        <h1 className="mt-10 font-serif text-xl text-ink" style={{ fontWeight: 400 }}>Private Beta</h1>
        <p className="mt-3 max-w-md text-center text-[15px] leading-relaxed text-ink-muted">
          Echo is currently in private beta. We&apos;ll be opening up soon.
        </p>
      </div>
    );
  }

  const ticketName = student ? getTicketName(student.ticket_type) : "";
  const surname = getSurname(student?.full_name);
  const totalSessions = student?.total_sessions || 0;
  const totalMinutes = student?.total_minutes || 0;

  const statsLine =
    totalSessions > 0
      ? `${ticketName} \u00B7 ${totalSessions} sitting${totalSessions !== 1 ? "s" : ""} \u00B7 ${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""} at the chair`
      : `${ticketName} \u00B7 New Candidate`;

  return (
    <>
      {/* Black overlay for entry and exit */}
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ backgroundColor: "#0E1A24" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: leaving ? 1 : 0 }}
        transition={{
          duration: leaving ? 0.6 : 0.8,
          delay: leaving ? 0.4 : 0.2,
          ease: "easeOut",
        }}
      />

      <div className="relative min-h-screen bg-paper">
        <div className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6">
          {/* Top margin */}
          <div className="h-[8vh] sm:h-[12vh]" />

          {/* Header mark */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: leaving ? 0 : 1, y: leaving ? -4 : 0 }}
            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
          >
            <p
              className="font-mono text-[10px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.16em" }}
            >
              Folio 00 &middot; Reading Room
            </p>
            <p className="mt-2 font-serif text-[24px] sm:text-[32px] text-ink" style={{ fontWeight: 400 }}>
              Echo
            </p>
          </motion.div>

          {/* Gap */}
          <div className="h-10 sm:h-16" />

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: leaving ? 0 : 1, y: leaving ? -4 : 0 }}
            transition={{ duration: 0.4, delay: 0.9, ease: "easeOut" }}
          >
            <p className="font-serif text-[18px] sm:text-[22px] italic text-ink" style={{ fontWeight: 400 }}>
              Good {getTimeOfDay()}, Candidate {surname}.
            </p>
            <p
              className="mt-1.5 font-mono text-[12px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.1em" }}
            >
              {statsLine.toUpperCase()}
            </p>
          </motion.div>

          {/* Gap */}
          <div className="h-14 sm:h-24" />

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: leaving ? 0 : 1 }}
            transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
          >
            {CHAPTERS.map((ch, i) => (
              <div key={ch.numeral}>
                <div className="flex items-baseline">
                  <span
                    className="inline-block w-[40px] sm:w-[60px] shrink-0 font-serif text-[20px] sm:text-[28px] text-ink-muted"
                    style={{ fontWeight: 400 }}
                  >
                    {ch.numeral}
                  </span>
                  <span
                    className="font-serif text-[20px] sm:text-[28px] italic text-ink"
                    style={{ fontWeight: 400 }}
                  >
                    {ch.title}
                  </span>
                </div>
                <div className="ml-[40px] sm:ml-[60px] mt-1 max-w-[480px]">
                  <p className="font-serif text-[17px] text-ink-soft" style={{ fontWeight: 400 }}>
                    {ch.description}
                  </p>
                  <button
                    onClick={() => navigateTo(ch.href)}
                    className="group relative mt-4 font-serif text-[17px] italic text-ink transition-colors hover:text-ink"
                    style={{ fontWeight: 400 }}
                    disabled={leaving}
                  >
                    {ch.cta} &rarr;
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
                  </button>
                </div>
                {i < CHAPTERS.length - 1 && (
                  <>
                    <div className="my-5 sm:my-8 border-t border-rule" />
                  </>
                )}
              </div>
            ))}
          </motion.div>

          {/* Gap */}
          <div className="h-16" />

          {/* Footer line */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: leaving ? 0 : 1 }}
            transition={{ duration: 0.4, delay: 1.5, ease: "easeOut" }}
          >
            <p className="font-mono text-[13px] text-ink-muted">
              <button
                onClick={() => setDrawerOpen(true)}
                className="transition-colors hover:text-ink"
              >
                Settings
              </button>
              {" \u00B7 "}
              <button
                onClick={handleSignOut}
                className="transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </p>
          </motion.div>

          {/* Gap */}
          <div className="h-8" />

          {/* Keyboard hint */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: leaving ? 0 : 1 }}
            transition={{ duration: 0.4, delay: 1.6, ease: "easeOut" }}
          >
            <p
              className="font-mono text-[10px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.2em" }}
            >
              Press 1 &middot; 2 &middot; 3 &middot; 4
            </p>
          </motion.div>

          {/* Bottom margin */}
          <div style={{ height: "16vh" }} />
        </div>

        {/* Corner marks */}
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 hidden items-center justify-between px-6 sm:flex">
          <span
            className="font-mono text-[10px] uppercase text-ink-muted"
            style={{ letterSpacing: "0.16em" }}
          >
            Folio 00 &middot; Reading Room
          </span>
          <span
            className="font-mono text-[10px] uppercase text-ink-muted"
            style={{ letterSpacing: "0.16em" }}
          >
            Echo &middot; MMXXVI
          </span>
        </div>
      </div>

      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
