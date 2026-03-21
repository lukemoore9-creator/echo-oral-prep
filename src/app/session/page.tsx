'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  ArrowLeft,
  Anchor,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Orb } from '@/components/voice/Orb';
import { useVoiceSession } from '@/hooks/useVoiceSession';

// ---------------------------------------------------------------------------
// Ticket name lookup (demo — no DB)
// ---------------------------------------------------------------------------

const TICKET_NAMES: Record<string, string> = {
  'oow-unlimited': 'OOW Unlimited',
  'oow-nearcoastal': 'OOW Near Coastal',
  'master-200gt': 'Master <200GT',
  'master-500gt': 'Master <500GT',
  'master-3000gt': 'Master <3000GT',
  'master-unlimited': 'Master Unlimited',
  'ym-offshore': 'Yacht Master Offshore',
  'ym-ocean': 'Yacht Master Ocean',
  'mate-200gt-yacht': 'Mate <200GT Yacht',
  'master-200gt-yacht': 'Master <200GT Yacht',
  'master-500gt-yacht': 'Master <500GT Yacht',
  'master-3000gt-yacht': 'Master <3000GT Yacht',
  'engineer-oow': 'Engineer OOW',
  eto: 'ETO',
};

// ---------------------------------------------------------------------------
// State label / colors
// ---------------------------------------------------------------------------

const STATE_LABELS: Record<string, string> = {
  idle: 'Ready',
  listening: 'Listening...',
  processing: 'Thinking...',
  speaking: 'Examiner Speaking',
};

// ---------------------------------------------------------------------------
// Session Page (inner — needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function SessionInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketSlug = searchParams.get('ticket') || 'oow-unlimited';
  const ticketName = TICKET_NAMES[ticketSlug] || ticketSlug;

  const {
    state,
    transcript,
    interimTranscript,
    startSession,
    endSession,
    toggleMic,
    analyserNode,
    micLevel,
    browserSupported,
  } = useVoiceSession();

  const [hasStarted, setHasStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Timer
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

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimTranscript]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setHasStarted(true);
    startSession(ticketSlug);
  };

  const handleEnd = () => {
    endSession();
    router.push('/select');
  };

  // ── Not started yet — show the "begin" screen ──
  if (!hasStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        {/* Idle orb preview */}
        <div className="mb-8">
          <Orb state="idle" />
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {ticketName}
        </h1>
        <p className="mt-2 text-center text-muted-foreground max-w-md">
          Your AI examiner will ask questions relevant to this certificate.
          Speak clearly and answer as you would in a real exam.
        </p>

        {!browserSupported && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200 max-w-md">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
            <div>
              <p className="font-medium">Browser not supported</p>
              <p className="mt-1 text-yellow-200/70">
                Speech recognition requires Chrome, Edge, or Safari. Please
                switch browsers to use voice input.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          className="mt-8 flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-base font-semibold text-navy transition-all hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98]"
        >
          <Mic className="h-5 w-5" />
          Begin Examination
        </button>

        <Link
          href="/select"
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Choose a different exam
        </Link>
      </div>
    );
  }

  // ── Active session ──
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between border-b border-gold/10 bg-background/80 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5">
            <Anchor className="h-4 w-4 text-gold/60" />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-foreground/80">
            {ticketName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {formatTime(elapsed)}
          </span>

          {/* State indicator */}
          <div className="flex items-center gap-1.5">
            <motion.div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  state === 'listening'
                    ? '#4ade80'
                    : state === 'speaking'
                      ? '#D4A843'
                      : state === 'processing'
                        ? '#60a5fa'
                        : '#6b7280',
              }}
              animate={
                state === 'listening' || state === 'speaking'
                  ? { opacity: [1, 0.4, 1] }
                  : { opacity: 1 }
              }
              transition={
                state === 'listening' || state === 'speaking'
                  ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : {}
              }
            />
            <span className="text-xs text-muted-foreground">
              {STATE_LABELS[state]}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content — Orb center, transcript below ── */}
      <main className="flex flex-1 flex-col items-center overflow-hidden">
        {/* Orb section */}
        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:py-12">
          <Orb
            state={state}
            analyserNode={analyserNode}
            micLevel={micLevel}
          />
        </div>

        {/* Transcript panel */}
        <div className="w-full border-t border-gold/10 bg-surface/30 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
            {/* Transcript entries */}
            <div className="max-h-48 overflow-y-auto space-y-3 scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {transcript.map((entry, i) => (
                  <motion.div
                    key={`${entry.timestamp}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 text-sm ${
                      entry.speaker === 'examiner'
                        ? 'text-foreground/90'
                        : 'text-foreground/60'
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-wider ${
                        entry.speaker === 'examiner'
                          ? 'text-gold/70'
                          : 'text-emerald-400/70'
                      }`}
                    >
                      {entry.speaker === 'examiner' ? 'Examiner' : 'You'}
                    </span>
                    <p className="leading-relaxed">{entry.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Interim (gray) transcript */}
              {interimTranscript && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 text-sm"
                >
                  <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-400/40">
                    You
                  </span>
                  <p className="leading-relaxed text-foreground/30 italic">
                    {interimTranscript}
                  </p>
                </motion.div>
              )}

              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom controls ── */}
      <div className="border-t border-gold/10 bg-background/80 backdrop-blur-xl px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-md items-center justify-center gap-4">
          {/* End session */}
          <button
            onClick={handleEnd}
            className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <Square className="h-3.5 w-3.5" />
            End
          </button>

          {/* Mic toggle — only active during listening */}
          <button
            onClick={toggleMic}
            disabled={state === 'processing' || state === 'speaking'}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
              state === 'listening'
                ? 'bg-gold text-navy shadow-lg shadow-gold/30 hover:bg-gold/90 scale-110'
                : 'bg-surface border border-white/10 text-muted-foreground hover:text-foreground hover:bg-surface/80'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {state === 'listening' ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          {/* Back to select */}
          <button
            onClick={() => router.push('/select')}
            className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrapper with Suspense (required for useSearchParams in Next.js)
// ---------------------------------------------------------------------------

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <Anchor className="mx-auto h-8 w-8 text-gold animate-pulse" />
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SessionInner />
    </Suspense>
  );
}
