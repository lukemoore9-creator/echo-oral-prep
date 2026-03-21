'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square, AlertTriangle } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { TranscriptPanel } from './TranscriptPanel';
import { useVoiceSession } from '@/lib/hooks/useVoiceSession';
import type { Session } from '@/types';

interface VoiceSessionProps {
  /** Session data from Supabase */
  session: Session;
  /** Optional topic to focus on */
  topicFocus?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function ScoreSummaryBar({
  overallScore,
  exchangeCount,
}: {
  overallScore: number | null;
  exchangeCount: number;
}) {
  if (overallScore === null) return null;

  const rounded = Math.round(overallScore * 10) / 10;
  const percentage = (overallScore / 10) * 100;

  let color: string;
  if (overallScore >= 7) color = '#10b981';
  else if (overallScore >= 5) color = '#eab308';
  else color = '#ef4444';

  return (
    <div
      className="flex items-center gap-4 rounded-lg px-4 py-2"
      style={{ backgroundColor: 'rgba(33, 45, 59, 0.8)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: '#E8ECF1', opacity: 0.6 }}>
          Score
        </span>
        <span className="text-lg font-bold" style={{ color }}>
          {rounded}
        </span>
        <span className="text-xs" style={{ color: '#E8ECF1', opacity: 0.4 }}>
          /10
        </span>
      </div>

      {/* Score bar */}
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: '#E8ECF1', opacity: 0.4 }}>
          Questions:
        </span>
        <span className="text-xs font-medium" style={{ color: '#E8ECF1', opacity: 0.7 }}>
          {exchangeCount}
        </span>
      </div>
    </div>
  );
}

export function VoiceSession({ session, topicFocus }: VoiceSessionProps) {
  const [elapsed, setElapsed] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  const {
    voiceState,
    messages,
    startSession,
    endSession,
    toggleListening,
    overallScore,
    currentTopic,
    isSessionActive,
    browserSupported,
    speechError,
    exchangeCount,
  } = useVoiceSession({
    onSessionEnd: () => {
      setSessionStarted(false);
    },
  });

  // Session timer
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleStartSession = useCallback(() => {
    const ticketSlug = session.ticket_type?.slug ?? 'oow-unlimited';
    startSession(session.id, ticketSlug, topicFocus);
    setSessionStarted(true);
    setElapsed(0);
  }, [session, topicFocus, startSession]);

  const handleEndSession = useCallback(() => {
    endSession();
  }, [endSession]);

  // Browser compatibility warning
  if (!browserSupported) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-8"
        style={{ backgroundColor: '#0C1B33' }}
      >
        <div
          className="max-w-md rounded-xl p-8 text-center"
          style={{ backgroundColor: '#212D3B' }}
        >
          <AlertTriangle
            className="mx-auto mb-4"
            size={48}
            style={{ color: '#D4A843' }}
          />
          <h2
            className="mb-2 text-xl font-bold"
            style={{ color: '#E8ECF1' }}
          >
            Browser Not Supported
          </h2>
          <p className="mb-4 text-sm" style={{ color: '#E8ECF1', opacity: 0.6 }}>
            Voice sessions require the Web Speech API, which is currently only
            fully supported in Google Chrome and Microsoft Edge. Please switch
            to one of these browsers for the best experience.
          </p>
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#D4A843',
              color: '#0C1B33',
            }}
          >
            Download Chrome
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: '#0C1B33' }}
    >
      {/* Header bar */}
      <header
        className="flex items-center justify-between border-b px-6 py-3"
        style={{
          backgroundColor: '#1A2332',
          borderColor: 'rgba(212, 168, 67, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: '#D4A843' }}
          >
            Helm AI
          </h1>
          <span
            className="text-xs"
            style={{ color: '#E8ECF1', opacity: 0.4 }}
          >
            Oral Examination
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {sessionStarted && (
            <span
              className="font-mono text-sm tabular-nums"
              style={{ color: '#E8ECF1', opacity: 0.6 }}
            >
              {formatDuration(elapsed)}
            </span>
          )}

          {/* Current topic */}
          {currentTopic && (
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: 'rgba(212, 168, 67, 0.12)',
                color: '#D4A843',
              }}
            >
              {currentTopic}
            </span>
          )}

          {/* Ticket type */}
          <span
            className="text-xs font-medium"
            style={{ color: '#E8ECF1', opacity: 0.5 }}
          >
            {session.ticket_type?.name ?? 'Maritime Exam'}
          </span>
        </div>
      </header>

      {/* Score summary */}
      {sessionStarted && (
        <div className="px-6 pt-3">
          <ScoreSummaryBar
            overallScore={overallScore}
            exchangeCount={exchangeCount}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col items-center gap-6 px-6 py-8 lg:flex-row lg:items-stretch">
        {/* Left: Visualizer + Controls */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {/* Audio Visualizer */}
          <AudioVisualizer voiceState={voiceState} className="h-64 w-64" />

          {/* Error message */}
          {speechError && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-sm rounded-lg px-4 py-2 text-center text-xs"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {speechError}
            </motion.p>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!sessionStarted ? (
              <button
                onClick={handleStartSession}
                className="rounded-full px-8 py-3 text-sm font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                style={{
                  backgroundColor: '#D4A843',
                  color: '#0C1B33',
                  boxShadow: '0 0 20px rgba(212, 168, 67, 0.3)',
                }}
              >
                Begin Examination
              </button>
            ) : (
              <>
                {/* Mic toggle button */}
                <button
                  onClick={toggleListening}
                  disabled={
                    voiceState === 'processing' || voiceState === 'speaking'
                  }
                  className="group flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    backgroundColor:
                      voiceState === 'listening'
                        ? '#D4A843'
                        : 'rgba(212, 168, 67, 0.15)',
                    border: `2px solid ${
                      voiceState === 'listening'
                        ? '#D4A843'
                        : 'rgba(212, 168, 67, 0.3)'
                    }`,
                  }}
                  title={
                    voiceState === 'listening' ? 'Stop listening' : 'Start listening'
                  }
                >
                  {voiceState === 'listening' ? (
                    <MicOff
                      size={22}
                      style={{ color: '#0C1B33' }}
                    />
                  ) : (
                    <Mic
                      size={22}
                      style={{ color: '#D4A843' }}
                    />
                  )}
                </button>

                {/* End session button */}
                <button
                  onClick={handleEndSession}
                  className="flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                  }}
                  title="End session"
                >
                  <Square size={18} style={{ color: '#ef4444' }} />
                </button>
              </>
            )}
          </div>

          {/* Hint text */}
          {sessionStarted && voiceState === 'idle' && (
            <p
              className="text-xs"
              style={{ color: '#E8ECF1', opacity: 0.3 }}
            >
              Press the microphone button to respond
            </p>
          )}
          {sessionStarted && voiceState === 'listening' && (
            <p
              className="text-xs"
              style={{ color: '#D4A843', opacity: 0.6 }}
            >
              Speak your answer clearly -- listening will stop after a pause
            </p>
          )}
        </div>

        {/* Right: Transcript panel */}
        <TranscriptPanel
          messages={messages}
          className="w-full max-w-xl flex-1 lg:max-h-[calc(100vh-200px)]"
        />
      </div>

      {/* Session ended overlay */}
      {sessionStarted === false && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(12, 27, 51, 0.9)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="max-w-md rounded-xl p-8 text-center"
            style={{ backgroundColor: '#212D3B' }}
          >
            <h2
              className="mb-2 text-2xl font-bold"
              style={{ color: '#E8ECF1' }}
            >
              Examination Complete
            </h2>

            {overallScore !== null && (
              <div className="mb-4">
                <span
                  className="text-5xl font-bold"
                  style={{
                    color:
                      overallScore >= 7
                        ? '#10b981'
                        : overallScore >= 5
                          ? '#eab308'
                          : '#ef4444',
                  }}
                >
                  {Math.round(overallScore * 10) / 10}
                </span>
                <span
                  className="text-lg"
                  style={{ color: '#E8ECF1', opacity: 0.4 }}
                >
                  /10
                </span>
              </div>
            )}

            <p
              className="mb-2 text-sm"
              style={{ color: '#E8ECF1', opacity: 0.6 }}
            >
              Duration: {formatDuration(elapsed)} | Questions: {exchangeCount}
            </p>

            <a
              href={`/dashboard`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#D4A843',
                color: '#0C1B33',
              }}
            >
              Return to Dashboard
            </a>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
