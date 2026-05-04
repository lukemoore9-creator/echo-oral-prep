'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Orb } from '@/components/voice/Orb';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { TranscriptPanel } from '@/components/voice/TranscriptPanel';
import { useVoiceSession } from '@/lib/hooks/useVoiceSession';
import { getTicketName } from '@/lib/tickets';
import { getTopicName } from '@/lib/topics';
import { TopicPicker } from '@/components/topics/TopicPicker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudentProfile {
  student: {
    id: string;
    full_name: string;
    email: string | null;
    ticket_type: string;
    total_sessions: number;
  };
}

interface DrillReport {
  overallScore: number;
  verdict: 'pass' | 'marginal' | 'refer';
  examinerJudgement: string;
  confidence: 'high' | 'medium' | 'low';
  keyMoments: Array<{
    question: string;
    studentResponse: string;
    verdict: string;
    verdictTone: 'good' | 'ok' | 'bad';
    modelAnswer: string;
  }>;
  topThreeDrills: Array<{
    topicSlug: string;
    topicName: string;
    reason: string;
  }>;
}

type DrillPhase = 'picking' | 'mode' | 'drilling' | 'ending' | 'report';
type DrillMode = 'examination' | 'bridge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VERDICT_COLOURS: Record<string, string> = {
  pass: 'var(--color-chart-green)',
  marginal: 'var(--color-brass)',
  refer: 'var(--color-refer)',
};

function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function computeVerdict(score: number): 'pass' | 'marginal' | 'refer' {
  if (score >= 75) return 'pass';
  if (score >= 60) return 'marginal';
  return 'refer';
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function DrillInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTopic = searchParams.get('topic');

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
    questionsAskedInSection,
  } = useVoiceSession();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<DrillPhase>(urlTopic ? 'mode' : 'picking');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(urlTopic);
  const [drillMode, setDrillMode] = useState<DrillMode>('examination');
  const [timeLeft, setTimeLeft] = useState(600);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [drillReport, setDrillReport] = useState<DrillReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [micError, setMicError] = useState(false);
  const [fadeToBlack, setFadeToBlack] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasEndedRef = useRef(false);
  const transcriptRef = useRef(transcript);
  const sessionIdRef = useRef<string | null>(null);
  const timeLeftRef = useRef(600);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  useEffect(() => {
    fetch('/api/student')
      .then((res) => res.json())
      .then((data) => { if (data.student) setProfile(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ticketSlug = profile?.student?.ticket_type || 'oow-unlimited';
  const ticketName = getTicketName(ticketSlug);
  const topicName = selectedTopic ? getTopicName(selectedTopic) : '';

  // Keyboard shortcuts during active drill
  useEffect(() => {
    if (phase !== 'drilling') return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "m" || e.key === "M") { toggleMic(); return; }
      if (e.key === "p" || e.key === "P") { isPaused ? resumeSession() : pauseSession(); return; }
      if (e.key === " ") { e.preventDefault(); interrupt(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, toggleMic, isPaused, resumeSession, pauseSession, interrupt]);

  // End drill
  const handleDrillEnd = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    endSession();
    setPhase('ending');

    const currentTranscript = transcriptRef.current;
    const currentSessionId = sessionIdRef.current;
    const duration = 600 - timeLeftRef.current;

    if (currentSessionId) {
      try {
        await fetch('/api/session/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            durationSeconds: duration,
            transcript: currentTranscript,
          }),
        });
      } catch (err) {
        console.error('Failed to end drill session:', err);
      }
    }

    // For bridge drills, route to bridge summary
    if (drillMode === 'bridge') {
      sessionStorage.setItem('echo-bridge-transcript', JSON.stringify(currentTranscript));
      router.push('/bridge/summary?id=drill');
      return;
    }

    // For examination drills, generate report
    setReportLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: currentTranscript, ticketType: ticketName }),
      });
      if (!res.ok) throw new Error(`Report failed (${res.status})`);
      const data = await res.json();
      setDrillReport(data);
    } catch (err) {
      console.error('Drill report error:', err);
      setReportError('Failed to generate report.');
    } finally {
      setReportLoading(false);
      setPhase('report');
    }
  }, [endSession, ticketName, drillMode, router]);

  const handleDrillEndRef = useRef(handleDrillEnd);
  useEffect(() => { handleDrillEndRef.current = handleDrillEnd; }, [handleDrillEnd]);

  // Timer
  useEffect(() => {
    if (phase !== 'drilling') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            handleDrillEndRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Start drill
  const handleStart = async (mode?: DrillMode) => {
    if (!selectedTopic) return;
    const effectiveMode = mode || drillMode;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError(true);
      return;
    }

    setFadeToBlack(true);
    setTimeout(() => {
      setTimeLeft(600);
      hasEndedRef.current = false;
      setPhase('drilling');

      fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketType: ticketSlug, sessionType: 'drill' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sessionId) {
            setSessionId(data.sessionId);
            sessionIdRef.current = data.sessionId;
          }
        })
        .catch(console.error);

      const firstName = profile?.student?.full_name?.split(' ')[0];
      const totalSessions = profile?.student?.total_sessions || 0;
      startSession(ticketSlug, firstName, totalSessions, {
        drillTopic: selectedTopic,
        drillTopicName: topicName,
        ...(effectiveMode === 'bridge' ? { bridge: true } : {}),
      });
      setFadeToBlack(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-8 w-8 animate-spin text-chart-green" />
      </div>
    );
  }

  // Phase: Topic Picker
  if (phase === 'picking') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
        <motion.div
          className="mx-auto max-w-[720px] px-6 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-mono text-[10px] uppercase text-ink-muted" style={{ letterSpacing: "0.16em" }}>
            Folio 03 &middot; Mess
          </p>

          <h1 className="mt-8 font-serif text-[24px] sm:text-[32px] text-ink" style={{ fontWeight: 400 }}>
            10-minute drill
          </h1>
          <p className="mt-2 font-serif text-[17px] text-ink-soft" style={{ fontWeight: 400 }}>
            Pick a topic. Rapid-fire questions for 10 minutes.
          </p>
          <span className="mt-3 inline-block font-mono text-[12px] uppercase text-ink-muted" style={{ letterSpacing: "0.1em" }}>
            {ticketName}
          </span>

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

          <div className="mt-8">
            <TopicPicker
              selected={selectedTopic}
              onSelect={(slug) => {
                setSelectedTopic(slug);
                setPhase('mode');
              }}
            />
          </div>

          <div className="mt-8">
            <Link href="/home" className="text-sm text-ink-muted transition-colors hover:text-ink">
              &larr; Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Phase: Mode picker (examination vs bridge drill)
  if (phase === 'mode' && !fadeToBlack) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
        <motion.div
          className="mx-auto max-w-[720px] px-6 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-mono text-[10px] uppercase text-ink-muted" style={{ letterSpacing: "0.16em" }}>
            Folio 03 &middot; Mess
          </p>

          <h1 className="mt-8 font-serif text-[24px] sm:text-[32px] text-ink" style={{ fontWeight: 400 }}>
            {topicName}
          </h1>
          <p className="mt-2 font-mono text-[12px] uppercase text-ink-muted" style={{ letterSpacing: "0.1em" }}>
            10-minute drill &middot; {ticketName}
          </p>

          <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:gap-8">
            <button
              onClick={() => { setDrillMode('examination'); handleStart('examination'); }}
              className="group flex-1"
            >
              <span className="block font-serif text-[22px] italic text-ink" style={{ fontWeight: 400 }}>
                Run with examiner Echo
              </span>
              <span className="mt-2 block font-serif text-[15px] text-ink-soft" style={{ fontWeight: 400 }}>
                Formal. Rapid-fire. Verdict at the end.
              </span>
              <span className="relative mt-3 inline-block font-serif text-[15px] italic text-ink" style={{ fontWeight: 400 }}>
                Take the chair &rarr;
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
              </span>
            </button>

            <div className="hidden border-l border-rule sm:block" />

            <button
              onClick={() => { setDrillMode('bridge'); handleStart('bridge'); }}
              className="group flex-1"
            >
              <span className="block font-serif text-[22px] italic text-ink" style={{ fontWeight: 400 }}>
                Run with bridge Echo
              </span>
              <span className="mt-2 block font-serif text-[15px] text-ink-soft" style={{ fontWeight: 400 }}>
                Friendly. Same pace, warmer tone. No verdict.
              </span>
              <span className="relative mt-3 inline-block font-serif text-[15px] italic text-ink" style={{ fontWeight: 400 }}>
                Step onto the bridge &rarr;
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
              </span>
            </button>
          </div>

          <div className="mt-12">
            <button
              onClick={() => { setSelectedTopic(null); setPhase('picking'); }}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              &larr; Choose different topic
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fade to black overlay (between mode selection and drilling)
  if (fadeToBlack) {
    return (
      <motion.div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "#0E1A24" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
    );
  }

  // Phase: Active Drill
  if (phase === 'drilling') {
    const bgClass = drillMode === 'bridge' ? 'bg-paper-warm' : 'bg-paper';

    return (
      <div className={`fixed inset-0 z-50 flex flex-col ${bgClass}`}>
        <header className="shrink-0 border-b border-rule px-6 py-3">
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-lg font-medium tabular-nums ${
                timeLeft <= 60 ? 'text-refer' : 'text-ink'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="font-mono text-[13px] text-ink-muted">
              {topicName} &middot; Q{questionsAskedInSection + 1}
            </span>
            <button
              onClick={() => {
                if (!hasEndedRef.current) {
                  hasEndedRef.current = true;
                  handleDrillEnd();
                }
              }}
              className="text-xs font-medium text-ink-muted transition-colors hover:text-refer"
            >
              Stand down
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center">
          <Orb state={state} analyserNode={analyserNode} micLevel={micLevel} size={240} />
          <div className="mt-4">
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
          {lastError && (
            <div className="mt-6 flex max-w-md items-start gap-3 rounded-lg border border-rule bg-paper px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-refer" />
              <p className="text-sm text-refer">{lastError}</p>
            </div>
          )}
        </main>

        <TranscriptPanel transcript={transcript} interimTranscript={interimTranscript} />
      </div>
    );
  }

  // Phase: Ending / Loading
  if (phase === 'ending' || reportLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <Loader2 className="h-8 w-8 animate-spin text-chart-green" />
        <p className="mt-4 text-[15px] text-ink-muted">
          Time. Putting your results together...
        </p>
      </div>
    );
  }

  // Phase: Report Error
  if (reportError || !drillReport) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
        <AlertTriangle className="h-8 w-8 text-brass" />
        <p className="mt-4 text-[15px] text-ink">
          {reportError || 'Something went wrong'}
        </p>
        <Link
          href="/drill"
          className="group relative mt-6 font-serif text-[17px] italic text-ink"
          style={{ fontWeight: 400 }}
        >
          Try again &rarr;
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
        </Link>
      </div>
    );
  }

  // Phase: Drill Report
  const verdict = computeVerdict(drillReport.overallScore);
  const verdictColour = VERDICT_COLOURS[verdict];

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-[880px] px-6 py-12 space-y-12">
        {/* Verdict Banner */}
        <div className="flex h-24 items-center justify-between border-b border-rule px-2">
          <span
            className="font-serif text-[48px] uppercase leading-none"
            style={{ color: verdictColour, fontWeight: 400 }}
          >
            {verdict}
          </span>
          <p className="mx-8 flex-1 text-center font-serif text-[17px] italic text-ink" style={{ fontWeight: 400 }}>
            {drillReport.examinerJudgement}
          </p>
          <div className="shrink-0 text-right">
            <span className="font-mono text-[32px] font-medium leading-none text-ink">
              {drillReport.overallScore}{' '}
              <span className="text-[20px] font-normal text-ink-muted">/ 100</span>
            </span>
            <p className="mt-1 font-mono text-[13px] text-ink-muted">
              {topicName} drill
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-3 pb-8">
          <Link
            href={`/drill?topic=${selectedTopic}`}
            className="group relative font-serif text-[17px] italic text-ink"
            style={{ fontWeight: 400 }}
          >
            Drill again &rarr;
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
          </Link>
          <Link href="/drill" className="text-sm text-ink-muted transition-colors hover:text-ink">
            Different topic
          </Link>
          <Link href="/home" className="mt-1 text-sm text-ink-muted transition-colors hover:text-ink">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function DrillPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper">
          <Loader2 className="h-8 w-8 animate-spin text-chart-green" />
        </div>
      }
    >
      <DrillInner />
    </Suspense>
  );
}
