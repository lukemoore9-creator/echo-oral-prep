'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConversationMessage } from '@/types';

interface TranscriptPanelProps {
  /** Conversation messages to display */
  messages: ConversationMessage[];
  /** Optional CSS class name */
  className?: string;
}

function ScoreBadge({ score }: { score: number }) {
  let color: string;
  let label: string;

  if (score >= 9) {
    color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    label = 'Excellent';
  } else if (score >= 7) {
    color = 'bg-green-500/20 text-green-400 border-green-500/30';
    label = 'Good';
  } else if (score >= 5) {
    color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    label = 'Adequate';
  } else if (score >= 3) {
    color = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    label = 'Weak';
  } else {
    color = 'bg-red-500/20 text-red-400 border-red-500/30';
    label = 'Poor';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
    >
      <span>{score}/10</span>
      <span className="opacity-70">({label})</span>
    </span>
  );
}

function KeyPointsList({
  points,
  type,
}: {
  points: string[];
  type: 'hit' | 'missed';
}) {
  if (!points.length) return null;

  const icon = type === 'hit' ? '✓' : '✗';
  const color =
    type === 'hit'
      ? 'text-emerald-400/80'
      : 'text-red-400/80';

  return (
    <ul className="mt-1.5 space-y-0.5">
      {points.map((point, i) => (
        <li key={i} className={`flex items-start gap-1.5 text-xs ${color}`}>
          <span className="mt-0.5 shrink-0 font-bold">{icon}</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

function TopicLabel({ topic }: { topic: string }) {
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: 'rgba(212, 168, 67, 0.12)',
        color: '#D4A843',
      }}
    >
      {topic}
    </span>
  );
}

export function TranscriptPanel({ messages, className = '' }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl p-8 ${className}`}
        style={{ backgroundColor: '#212D3B' }}
      >
        <p className="text-sm" style={{ color: '#E8ECF1', opacity: 0.4 }}>
          Your examination transcript will appear here...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto rounded-xl ${className}`}
      style={{
        backgroundColor: '#212D3B',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(212, 168, 67, 0.2) transparent',
      }}
    >
      <div className="space-y-3 p-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const isExaminer = msg.role === 'examiner';
            const examinerData = msg.examinerData;

            return (
              <motion.div
                key={`${msg.timestamp}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex ${isExaminer ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    isExaminer ? 'rounded-tl-sm' : 'rounded-tr-sm'
                  }`}
                  style={{
                    backgroundColor: isExaminer
                      ? 'rgba(12, 27, 51, 0.6)'
                      : 'rgba(212, 168, 67, 0.12)',
                    border: `1px solid ${
                      isExaminer
                        ? 'rgba(212, 168, 67, 0.15)'
                        : 'rgba(212, 168, 67, 0.25)'
                    }`,
                  }}
                >
                  {/* Role label */}
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: isExaminer ? '#D4A843' : '#E8ECF1',
                        opacity: 0.6,
                      }}
                    >
                      {isExaminer ? 'Examiner' : 'You'}
                    </span>
                    {examinerData?.topic && (
                      <TopicLabel topic={examinerData.topic} />
                    )}
                    {examinerData?.score !== null &&
                      examinerData?.score !== undefined && (
                        <ScoreBadge score={examinerData.score} />
                      )}
                  </div>

                  {/* Message text */}
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#E8ECF1' }}
                  >
                    {msg.content}
                  </p>

                  {/* Key points (only on feedback messages) */}
                  {examinerData && examinerData.type === 'feedback' && (
                    <div className="mt-2 border-t border-white/5 pt-2">
                      <KeyPointsList
                        points={examinerData.key_points_hit}
                        type="hit"
                      />
                      <KeyPointsList
                        points={examinerData.key_points_missed}
                        type="missed"
                      />
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className="mt-1.5 text-right text-[10px]"
                    style={{ color: '#E8ECF1', opacity: 0.25 }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
