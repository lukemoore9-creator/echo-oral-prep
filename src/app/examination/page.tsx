"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Orb } from "@/components/voice/Orb";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { TranscriptPanel } from "@/components/voice/TranscriptPanel";
import { useVoiceSession } from "@/lib/hooks/useVoiceSession";
import { getTicketName } from "@/lib/tickets";
import { isBetaUser } from "@/lib/beta-access";
import { getStructureForTicket } from "@/lib/exam-structure";

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

function toRoman(n: number) {
  return ROMAN[n - 1] || String(n);
}

interface StudentProfile {
  student: {
    id: string;
    full_name: string;
    email: string | null;
    ticket_type: string;
    exam_date: string | null;
    has_exam_date: boolean;
    total_sessions: number;
    overall_readiness: number;
  };
  lastSession: {
    topics_covered: string[];
    ai_summary: string;
    weak_areas: string[];
    strong_areas: string[];
  } | null;
  weakAreas: string[];
  strongAreas: string[];
}

export default function ExaminationPage() {
  const router = useRouter();
  const {
    state,
    transcript,
    interimTranscript,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    toggleMic,
    interrupt,
    isMuted,
    isPaused,
    analyserNode,
    micLevel,
    browserSupported,
    lastError,
    currentSectionIndex,
    questionsAskedInSection,
  } = useVoiceSession();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Fade-to-black state for session start
  const [fadeToBlack, setFadeToBlack] = useState(false);

  useEffect(() => {
    fetch("/api/student")
      .then((res) => res.json())
      .then((data) => {
        if (data.student) setProfile(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  const ticketSlug = profile?.student?.ticket_type || "oow-unlimited";
  const ticketName = getTicketName(ticketSlug);
  const examStructure = getStructureForTicket(ticketSlug);
  const totalQuestions = examStructure.reduce((a, s) => a + s.questionCount, 0);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError(true);
      return;
    }

    // Fade to black
    setFadeToBlack(true);

    // After fade completes, start session
    setTimeout(() => {
      fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketType: ticketSlug, sessionType: "examination" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sessionId) setSessionId(data.sessionId);
        })
        .catch((err) => console.error("Failed to create session:", err));

      setHasStarted(true);
      const firstName = profile?.student?.full_name?.split(" ")[0];
      const totalSessions = profile?.student?.total_sessions || 0;
      startSession(ticketSlug, firstName, totalSessions);
    }, 800);
  }, [ticketSlug, profile, startSession]);

  // Spacebar / Enter to start from pre-session
  useEffect(() => {
    if (hasStarted || fadeToBlack || loading) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasStarted, fadeToBlack, loading, handleStart]);

  // Keyboard shortcuts during active session
  useEffect(() => {
    if (!hasStarted) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "m" || e.key === "M") { toggleMic(); return; }
      if (e.key === "p" || e.key === "P") { isPaused ? resumeSession() : pauseSession(); return; }
      if (e.key === " ") { e.preventDefault(); interrupt(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasStarted, toggleMic, isPaused, resumeSession, pauseSession, interrupt]);

  const handleEnd = useCallback(async () => {
    // Save transcript for report page
    if (transcript.length > 0) {
      sessionStorage.setItem("echo-transcript", JSON.stringify(transcript));
    }

    endSession();

    if (sessionId) {
      try {
        await fetch("/api/session/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationSeconds: elapsed,
            transcript,
          }),
        });
      } catch (err) {
        console.error("Failed to end session:", err);
      }
    }

    router.push(`/report?ticket=${ticketSlug}`);
  }, [endSession, sessionId, elapsed, transcript, router, ticketSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink-muted">Loading...</p>
      </div>
    );
  }

  // Beta access gate
  if (profile && !isBetaUser(profile.student.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <span className="font-serif text-2xl tracking-tight text-ink" style={{ fontWeight: 400 }}>Echo</span>
        <h1 className="mt-10 font-serif text-xl tracking-tight text-ink" style={{ fontWeight: 400 }}>Private Beta</h1>
        <p className="mt-3 max-w-md text-center text-[15px] leading-relaxed text-ink-muted">
          Echo is currently in private beta. We&apos;ll be opening up soon.
        </p>
        <p className="mt-6 text-sm text-ink-muted">
          If you&apos;ve been invited, make sure you&apos;re signed in with the correct email.
        </p>
      </div>
    );
  }

  // Active session view
  if (hasStarted) {
    const currentSection = examStructure[currentSectionIndex] || examStructure[examStructure.length - 1];
    const lastExaminerMessage = [...transcript].reverse().find((t) => t.speaker === "examiner");

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-paper">
        {/* 40px hairline header */}
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-rule px-6">
          <Link href="/home" className="font-serif text-sm text-ink" style={{ fontWeight: 400 }}>Echo</Link>
          <span className="font-mono text-xs text-ink-muted">{ticketName}</span>
          <button
            onClick={handleEnd}
            className="text-xs font-medium text-ink-muted transition-colors hover:text-refer"
          >
            Stand down
          </button>
        </header>

        {/* Centre -- Orb + question */}
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          {lastError && (
            <div className="mb-6 flex max-w-md items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
              <p className="text-sm text-refer">{lastError}</p>
            </div>
          )}

          <Orb state={state} analyserNode={analyserNode} micLevel={micLevel} size={240} />

          <div className="mt-6">
            <VoiceControls
              state={state}
              isMuted={isMuted}
              isPaused={isPaused}
              onToggleMic={toggleMic}
              onTogglePause={() => (isPaused ? resumeSession() : pauseSession())}
              onInterrupt={interrupt}
            />
            <p
              className="mt-3 whitespace-nowrap text-center font-mono text-[10px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.12em" }}
            >
              M&ensp;Mute&ensp;&middot;&ensp;P&ensp;Pause&ensp;&middot;&ensp;Space&ensp;Interrupt
            </p>
          </div>

          <p className="mt-6 max-w-lg text-center font-serif text-[22px] leading-snug text-ink" style={{ fontWeight: 400 }}>
            {lastExaminerMessage?.text || "The examiner is preparing your first question\u2026"}
          </p>

          {state === "listening" && (
            <p className="mt-4 font-mono text-xs tracking-wider text-ink-muted">
              Listening
            </p>
          )}
        </main>

        {/* Transcript drawer */}
        <AnimatePresence>
          {transcriptOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-x-0 bottom-10 z-40 border-t border-rule bg-paper"
              style={{ maxHeight: "50vh" }}
            >
              <TranscriptPanel transcript={transcript} interimTranscript={interimTranscript} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 40px hairline footer */}
        <footer className="flex h-10 shrink-0 items-center justify-between border-t border-rule px-6">
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {formatTime(elapsed)}
          </span>
          <span className="font-mono text-xs text-ink-muted">
            {toRoman(currentSectionIndex + 1)}. of {toRoman(examStructure.length)}
          </span>
          <button
            onClick={() => setTranscriptOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Transcript
            {transcriptOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
        </footer>
      </div>
    );
  }

  // Pre-session: simple fade-up (no 4-beat intro)
  const surname = profile?.student?.full_name?.split(" ").slice(-1)[0] || "Candidate";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-paper">
      {/* Fade to black overlay for session start */}
      <AnimatePresence>
        {fadeToBlack && (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ backgroundColor: "#0E1A24" }}
          />
        )}
      </AnimatePresence>

      {/* Content fades up on mount */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col items-center px-6 pt-20 pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="w-full max-w-[720px] pt-8">
          {/* Folio mark */}
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            Folio 01 &middot; Examination Room
          </p>

          {/* Warnings */}
          {!browserSupported && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              <p className="text-sm text-ink-muted">
                Voice input requires Chrome or Edge. Please switch browsers for the full experience.
              </p>
            </div>
          )}

          {micError && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
              <p className="text-sm text-refer">
                Microphone access is required. Please allow microphone permissions and try again.
              </p>
            </div>
          )}

          {lastError && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
              <p className="text-sm text-refer">{lastError}</p>
            </div>
          )}

          {/* Exam schedule */}
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted">
              Oral examination &middot; {ticketName}
            </p>

            <h1 className="mt-6 font-serif text-[26px] sm:text-[36px] leading-tight text-ink" style={{ fontWeight: 400 }}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {surname}.
            </h1>

            {/* Syllabus */}
            <div className="mt-10 border-t border-rule">
              {examStructure.map((section, i) => (
                <div
                  key={section.id}
                  className={`flex items-baseline gap-3 py-3 ${
                    i < examStructure.length - 1 ? "border-b border-rule" : ""
                  }`}
                >
                  <span className="w-6 shrink-0 font-mono text-sm text-ink-muted">
                    {toRoman(i + 1)}.
                  </span>
                  <span className="min-w-0 flex-1 overflow-hidden text-[15px] text-ink">
                    {section.name}
                    <span className="text-rule-strong">
                      {" "}{"·".repeat(80)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ink-muted">
                    {section.questionCount}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 font-mono text-xs text-ink-muted">
              {totalQuestions} questions &middot; ~25 minutes
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center">
            <button
              onClick={handleStart}
              className="group relative font-serif text-lg italic text-ink transition-colors hover:text-chart-green"
              style={{ fontWeight: 400 }}
            >
              When you&apos;re ready, take the chair &rarr;
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
            </button>
            <p
              className="mt-4 font-mono text-[10px] uppercase text-ink-muted"
              style={{ letterSpacing: "0.2em" }}
            >
              Press Space or Click
            </p>
            <Link
              href="/drill"
              className="mt-6 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Ten minutes in the mess instead
            </Link>
            <Link
              href="/home"
              className="mt-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              &larr; Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
