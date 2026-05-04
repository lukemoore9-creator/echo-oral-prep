"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, PhoneOff, AlertTriangle, Check, Flag } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Orb } from "@/components/voice/Orb";
import { useVoiceSession } from "@/lib/hooks/useVoiceSession";
import { Button } from "@/components/ui/button";
import { TRAINER_TICKETS, getTicketName } from "@/lib/tickets";
import { isTrainer } from "@/lib/access";
import type { TranscriptEntry } from "@/lib/types";

const STATE_LABELS: Record<string, string> = {
  idle: "Standing by",
  listening: "Listening",
  processing: "",
  speaking: "",
};

interface StudentProfile {
  student: {
    id: string;
    full_name: string;
    email: string | null;
    ticket_type: string;
  };
}

// ---------------------------------------------------------------------------
// Correction form inline component
// ---------------------------------------------------------------------------

function CorrectionButtons({
  entry,
  ticketType,
  onSaved,
  onPause,
}: {
  entry: TranscriptEntry;
  ticketType: string;
  onSaved: () => void;
  onPause?: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "correct" | "flag">("idle");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "flagged">("idle");

  const submit = useCallback(
    async (type: "correction" | "flag") => {
      setStatus("saving");
      try {
        await fetch("/api/trainer/correction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examinerSaid: entry.text,
            correctionType: type,
            correction: type === "correction" ? text : undefined,
            flagReason: type === "flag" ? text : undefined,
            ticketType,
          }),
        });
        setStatus(type === "correction" ? "saved" : "flagged");
        setTimeout(() => {
          setStatus("idle");
          setMode("idle");
          setText("");
          onSaved();
        }, 2000);
      } catch {
        setStatus("idle");
      }
    },
    [entry.text, text, ticketType, onSaved]
  );

  if (status === "saved") {
    return (
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-pass">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (status === "flagged") {
    return (
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-refer">
        <Flag className="h-3 w-3" /> Flagged
      </span>
    );
  }

  if (mode === "idle") {
    return (
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => { onPause?.(); setMode("correct"); }}
          className="inline-flex items-center gap-1 rounded border border-chart-green px-2 py-1 text-xs font-medium text-chart-green hover:bg-paper-warm transition-colors"
        >
          <Check className="h-3 w-3" /> Correct
        </button>
        <button
          onClick={() => { onPause?.(); setMode("flag"); }}
          className="inline-flex items-center gap-1 rounded border border-refer px-2 py-1 text-xs font-medium text-refer hover:bg-paper-warm transition-colors"
        >
          <Flag className="h-3 w-3" /> Flag
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === "correct" ? "What should the examiner say instead?" : "What's wrong with this?"}
        className="w-full rounded border border-rule px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-chart-green focus:outline-none"
        rows={2}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit(mode === "correct" ? "correction" : "flag")}
          disabled={!text.trim() || status === "saving"}
          className={`rounded px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-40 ${
            mode === "correct" ? "bg-chart-green hover:bg-ink" : "bg-refer hover:bg-ink"
          }`}
        >
          {status === "saving" ? "Saving..." : mode === "correct" ? "Save Correction" : "Save Flag"}
        </button>
        <button
          onClick={() => { setMode("idle"); setText(""); onSaved(); }}
          className="rounded px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trainer transcript panel with correction buttons
// ---------------------------------------------------------------------------

function TrainerTranscriptPanel({
  transcript,
  interimTranscript,
  ticketType,
  onPause,
  onCorrectionDone,
}: {
  transcript: TranscriptEntry[];
  interimTranscript: string;
  ticketType: string;
  onPause?: () => void;
  onCorrectionDone?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto border-t border-rule"
      style={{ maxHeight: 320, scrollbarWidth: "thin", scrollbarColor: "#B8B2A1 transparent" }}
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-5">
        {transcript.length === 0 && !interimTranscript && (
          <p className="py-6 text-center text-sm text-ink-muted">
            Your conversation will appear here...
          </p>
        )}

        {transcript.map((msg, index) => {
          const isExaminer = msg.speaker === "examiner";
          return (
            <div
              key={`${msg.timestamp}-${index}`}
              className={`rounded-lg px-4 py-3 ${isExaminer ? "bg-paper-warm" : "bg-paper"}`}
            >
              <span className={`mb-1 block text-xs font-medium ${isExaminer ? "text-ink" : "text-ink-muted"}`}>
                {isExaminer ? "Examiner" : "You"}
              </span>
              <p className={`text-[15px] leading-[1.6] ${isExaminer ? "text-ink" : "text-ink-soft"}`}>
                {msg.text}
              </p>
              {isExaminer && (
                <CorrectionButtons entry={msg} ticketType={ticketType} onSaved={() => onCorrectionDone?.()} onPause={onPause} />
              )}
            </div>
          );
        })}

        {interimTranscript && (
          <div className="rounded-lg bg-paper px-4 py-3">
            <span className="mb-1 block text-xs font-medium text-ink-muted">You</span>
            <p className="text-[15px] leading-[1.6] italic text-ink-muted">{interimTranscript}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main trainer page
// ---------------------------------------------------------------------------

export default function TrainerPage() {
  const { user } = useUser();
  const {
    state,
    transcript,
    interimTranscript,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    setTicketType,
    setAiMode: setAiModeHook,
    toggleMic,
    analyserNode,
    micLevel,
    browserSupported,
    lastError,
  } = useVoiceSession();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [currentTicket, setCurrentTicket] = useState("oow-unlimited");
  const [aiMode, setAiMode] = useState<'trainer' | 'tutor' | 'examiner'>('trainer');
  const startTimeRef = useRef<number | null>(null);

  // Default trainer page to trainer AI mode
  useEffect(() => { setAiModeHook('trainer'); }, [setAiModeHook]);

  useEffect(() => {
    fetch("/api/student")
      .then((res) => res.json())
      .then((data) => {
        if (data.student) {
          setProfile(data);
          setCurrentTicket(data.student.ticket_type || "oow-unlimited");
        }
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

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError(true);
      return;
    }
    setHasStarted(true);
    startSession(currentTicket);
  };

  const handleEnd = () => {
    endSession();
    window.location.href = "/home";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink-muted">Loading...</p>
      </div>
    );
  }

  // Access gate
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!isTrainer(email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <h1 className="text-xl font-bold text-ink">Access Denied</h1>
        <p className="mt-3 text-[15px] text-ink-muted">Trainer mode is restricted.</p>
      </div>
    );
  }

  // Pre-start view
  if (!hasStarted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-paper px-6">
        {/* Brass banner */}
        <div
          className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ backgroundColor: "var(--color-brass)", color: "var(--color-paper)" }}
        >
          Internal &middot; Trainer Access &middot; {email}
        </div>

        <div className="mb-8">
          <Orb state="idle" size={240} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Trainer Mode
        </h1>
        <p className="mt-3 max-w-md text-center text-[15px] leading-relaxed text-ink-muted">
          Run a session and correct or flag examiner responses. Your corrections feed back into the AI.
        </p>

        <select
          value={currentTicket}
          onChange={(e) => {
            setCurrentTicket(e.target.value);
            setTicketType(e.target.value);
          }}
          className="mt-5 rounded-lg border border-rule bg-paper px-3 py-1.5 text-sm font-medium text-ink-muted focus:border-chart-green focus:outline-none"
        >
          {TRAINER_TICKETS.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>

        {/* Mode selector */}
        <div className="mt-4 flex items-center gap-1">
          {(['trainer', 'tutor', 'examiner'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setAiMode(m); setAiModeHook(m); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                aiMode === m
                  ? 'bg-chart-green text-white'
                  : 'border border-rule text-ink-muted hover:bg-paper-warm'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {!browserSupported && (
          <div className="mt-8 flex max-w-md items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B3A]" />
            <p className="text-sm text-ink-soft">Voice input requires Chrome or Edge.</p>
          </div>
        )}

        {micError && (
          <div className="mt-8 flex max-w-md items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
            <p className="text-sm text-refer">Microphone access is required.</p>
          </div>
        )}

        <Button
          onClick={handleStart}
          className="mt-10 h-[44px] gap-2 rounded-lg bg-chart-green px-8 text-[15px] font-semibold text-white hover:bg-ink active:scale-[0.98]"
        >
          <Mic className="h-5 w-5" />
          Begin session
        </Button>
      </div>
    );
  }

  // Active session
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/* Brass banner */}
      <div
        className="flex h-8 shrink-0 items-center justify-center font-mono text-[11px] uppercase tracking-[0.14em]"
        style={{ backgroundColor: "var(--color-brass)", color: "var(--color-paper)" }}
      >
        Internal &middot; Trainer Access &middot; {email}
      </div>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-6">
        <span className="text-lg font-serif font-bold tracking-tight text-ink">
          Echo <span className="text-sm font-normal font-sans text-ink-muted">Trainer</span>
        </span>
        <select
          value={currentTicket}
          onChange={(e) => {
            setCurrentTicket(e.target.value);
            setTicketType(e.target.value);
          }}
          className="rounded-lg border border-rule bg-paper px-3 py-1.5 text-sm font-medium text-ink-muted focus:border-chart-green focus:outline-none"
        >
          {TRAINER_TICKETS.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
        <Button
          onClick={handleEnd}
          variant="destructive"
          className="h-9 gap-2 rounded-lg bg-refer px-4 text-sm font-medium text-white hover:bg-ink"
        >
          <PhoneOff className="h-4 w-4" />
          Stand down
        </Button>
      </header>

      {/* -- Mode selector -- */}
      <div className="flex h-10 shrink-0 items-center justify-center gap-1 border-b border-rule">
        {(['trainer', 'tutor', 'examiner'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setAiMode(m); setAiModeHook(m); }}
            className={`rounded-full px-4 py-1 text-xs font-medium transition-colors ${
              aiMode === m
                ? 'bg-chart-green text-white'
                : 'border border-rule text-ink-muted hover:bg-paper-warm'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <main className="flex flex-1 flex-col items-center justify-center">
        <Orb state={sessionPaused ? "idle" : state} analyserNode={analyserNode} micLevel={micLevel} size={240} />
        <p className="mt-8 text-sm text-ink-muted">
          {sessionPaused ? "Session paused — submit your correction to continue" : STATE_LABELS[state]}
        </p>
        <p className="mt-2 font-mono text-sm tabular-nums text-ink-muted">{formatTime(elapsed)}</p>
        {lastError && (
          <div className="mt-6 flex max-w-md items-start gap-3 rounded-lg border border-rule bg-paper-warm px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
            <p className="text-sm text-refer">{lastError}</p>
          </div>
        )}
      </main>

      <TrainerTranscriptPanel
        transcript={transcript}
        interimTranscript={interimTranscript}
        ticketType={currentTicket}
        onPause={() => { pauseSession(); setSessionPaused(true); }}
        onCorrectionDone={() => {}}
      />

      {sessionPaused ? (
        <div className="flex shrink-0 items-center justify-center border-t border-rule px-6 py-4">
          <Button
            onClick={() => { setSessionPaused(false); resumeSession(); }}
            className="h-[44px] w-full max-w-md gap-2 rounded-lg bg-chart-green text-[15px] font-semibold text-white hover:bg-ink active:scale-[0.98]"
          >
            Resume
          </Button>
        </div>
      ) : (
        <div className="flex h-20 shrink-0 items-center justify-center border-t border-rule">
          <button
            onClick={toggleMic}
            disabled={state === "processing" || state === "speaking"}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
              state === "listening"
                ? "bg-chart-green text-white shadow-lg shadow-chart-green/25"
                : "border border-rule bg-paper text-ink-muted hover:bg-paper-warm"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {state === "listening" ? <Mic className="h-6 w-6" /> : <MicOff className="h-5 w-5" />}
          </button>
        </div>
      )}
    </div>
  );
}
