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
import { getTopicName } from "@/lib/topics";
import { TopicPicker } from "@/components/topics/TopicPicker";

interface StudentProfile {
  student: {
    id: string;
    full_name: string;
    email: string | null;
    ticket_type: string;
    total_sessions: number;
  };
}

export default function BridgePage() {
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
    injectUserMessage,
    isMuted,
    isPaused,
    analyserNode,
    micLevel,
    browserSupported,
    lastError,
  } = useVoiceSession();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [leadSelected, setLeadSelected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [micError, setMicError] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");

  const transcriptRef = useRef(transcript);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  useEffect(() => {
    fetch("/api/student")
      .then((res) => res.json())
      .then((data) => { if (data.student) setProfile(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ticketSlug = profile?.student?.ticket_type || "oow-unlimited";
  const ticketName = getTicketName(ticketSlug);
  const firstName = profile?.student?.full_name?.split(" ")[0] || "";

  const topicForSession = leadSelected ? "lead" : selectedTopic;
  const topicDisplay = leadSelected
    ? "Open conversation"
    : selectedTopic
    ? getTopicName(selectedTopic)
    : "";

  const handleStart = useCallback(async () => {
    if (!topicForSession) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError(true);
      return;
    }

    setFadeToBlack(true);

    setTimeout(() => {
      fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketType: ticketSlug, sessionType: "bridge" }),
      })
        .then((res) => res.json())
        .then((data) => { if (data.sessionId) setSessionId(data.sessionId); })
        .catch(console.error);

      setHasStarted(true);
      const totalSessions = profile?.student?.total_sessions || 0;
      // Use bridge mode — Echo persona
      startSession(ticketSlug, firstName, totalSessions, {
        drillTopic: topicForSession === "lead" ? undefined : topicForSession ?? undefined,
        drillTopicName: topicDisplay || undefined,
        bridge: true,
      });
    }, 600);
  }, [topicForSession, topicDisplay, ticketSlug, firstName, profile, startSession]);

  const handleEnd = useCallback(async () => {
    const currentTranscript = transcriptRef.current;

    if (currentTranscript.length > 0) {
      sessionStorage.setItem("echo-bridge-transcript", JSON.stringify(currentTranscript));
    }

    endSession();

    if (sessionId) {
      try {
        await fetch("/api/session/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationSeconds: 0,
            transcript: currentTranscript,
          }),
        });
      } catch (err) {
        console.error("Failed to end bridge session:", err);
      }
    }

    router.push(`/bridge/summary?id=${sessionId || "local"}`);
  }, [endSession, sessionId, router]);

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    injectUserMessage(typedMessage);
    setTypedMessage("");
  };

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper-warm" />;
  }

  // Active bridge session
  if (hasStarted) {
    const lastExaminerMessage = [...transcript].reverse().find((t) => t.speaker === "examiner");

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-paper-warm">
        {/* Header */}
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-rule px-6">
          <Link href="/home" className="font-serif text-sm text-ink" style={{ fontWeight: 400 }}>Echo</Link>
          <span className="font-mono text-xs text-ink-muted">Bridge &middot; {topicDisplay}</span>
          <button
            onClick={handleEnd}
            className="text-xs font-medium text-ink-muted transition-colors hover:text-refer"
          >
            That&apos;ll do
          </button>
        </header>

        {/* Centre */}
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          {lastError && (
            <div className="mb-6 flex max-w-md items-start gap-3 rounded-lg border border-rule bg-paper px-4 py-3">
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
            {lastExaminerMessage?.text || "Echo is settling in\u2026"}
          </p>

          {state === "listening" && (
            <p className="mt-4 font-mono text-xs tracking-wider text-ink-muted">
              Listening
            </p>
          )}

          {/* Typed input */}
          <div className="mt-6 flex flex-col items-center">
            {isMuted && (
              <p
                className="mb-2 font-mono text-[11px] uppercase text-ink-muted"
                style={{ letterSpacing: "0.12em" }}
              >
                Mic muted — type to Echo instead
              </p>
            )}
            <form onSubmit={handleTypedSubmit}>
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Ask Echo anything..."
                className="w-[320px] max-w-full border-b border-rule bg-transparent py-2 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-chart-green"
                style={{ fontFamily: "var(--font-sans)" }}
              />
            </form>
          </div>
        </main>

        {/* Transcript drawer */}
        <AnimatePresence>
          {transcriptOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-x-0 bottom-10 z-40 border-t border-rule bg-paper-warm"
              style={{ maxHeight: "50vh" }}
            >
              <TranscriptPanel transcript={transcript} interimTranscript={interimTranscript} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="flex h-10 shrink-0 items-center justify-between border-t border-rule px-6">
          <span className="font-mono text-[12px] text-ink-muted">Bridge &middot; {topicDisplay}</span>
          <button
            onClick={() => setTranscriptOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Transcript
            {transcriptOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
        </footer>
      </div>
    );
  }

  // Pre-session screen
  const hasTopicSelected = selectedTopic !== null || leadSelected;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <AnimatePresence>
        {fadeToBlack && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ backgroundColor: "#0E1A24" }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="mx-auto max-w-[720px] px-6 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Folio mark */}
        <p className="font-mono text-[10px] uppercase text-ink-muted" style={{ letterSpacing: "0.16em" }}>
          Folio 02 &middot; Bridge
        </p>

        <div className="mt-12">
          <h1 className="font-serif text-[20px] sm:text-[24px] italic text-ink" style={{ fontWeight: 400 }}>
            The bridge.
          </h1>
          <p className="mt-4 max-w-[480px] font-serif text-[17px] text-ink-soft" style={{ fontWeight: 400 }}>
            Step onto the bridge. Echo, on the bridge, holds the {ticketName} ticket and has years at sea. We&apos;ll chat through whatever you need. No verdict, no score &mdash; just two officers talking shop.
          </p>
        </div>

        {/* Warnings */}
        {!browserSupported && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            <p className="text-sm text-ink-muted">Voice input requires Chrome or Edge.</p>
          </div>
        )}
        {micError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
            <p className="text-sm text-refer">Microphone access is required.</p>
          </div>
        )}

        {/* Topic picker */}
        <div className="mt-10">
          <p className="mb-4 font-mono text-[10px] uppercase text-ink-muted" style={{ letterSpacing: "0.12em" }}>
            What do you want to talk about?
          </p>
          <TopicPicker
            selected={selectedTopic}
            onSelect={(slug) => {
              setSelectedTopic(slug);
              setLeadSelected(false);
            }}
            showLeadOption
            onSelectLead={() => {
              setLeadSelected(true);
              setSelectedTopic(null);
            }}
            leadSelected={leadSelected}
          />
        </div>

        {/* CTA */}
        <div className="mt-12">
          <button
            onClick={handleStart}
            disabled={!hasTopicSelected}
            className={`group relative font-serif text-[22px] italic transition-colors ${
              hasTopicSelected ? "text-ink hover:text-chart-green" : "text-ink-muted cursor-not-allowed"
            }`}
            style={{ fontWeight: 400 }}
          >
            Step onto the bridge &rarr;
            {hasTopicSelected && (
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
            )}
          </button>
        </div>

        <div className="mt-6">
          <Link href="/home" className="text-sm text-ink-muted transition-colors hover:text-ink">
            &larr; Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
