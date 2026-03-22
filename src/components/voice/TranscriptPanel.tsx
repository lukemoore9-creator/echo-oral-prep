'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranscriptPanelProps {
  transcript: Array<{
    speaker: 'examiner' | 'candidate';
    text: string;
    timestamp: number;
  }>;
  interimTranscript?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TranscriptPanel({ transcript, interimTranscript }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto border-t border-[#E5E7EB]"
      style={{
        maxHeight: 250,
        scrollbarWidth: 'thin',
        scrollbarColor: '#D1D5DB transparent',
      }}
    >
      <div className="mx-auto max-w-2xl px-6 py-4 space-y-4">
        {transcript.length === 0 && !interimTranscript && (
          <p className="text-sm text-[#9CA3AF] text-center py-4">
            Your conversation will appear here...
          </p>
        )}

        <AnimatePresence mode="popLayout">
          {transcript.map((msg, index) => {
            const isExaminer = msg.speaker === 'examiner';

            return (
              <motion.div
                key={`${msg.timestamp}-${index}`}
                className="flex gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <span
                  className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: isExaminer ? '#111111' : '#6B7280',
                  }}
                >
                  {isExaminer ? 'Examiner' : 'You'}
                </span>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{
                    color: isExaminer ? '#111111' : '#6B7280',
                  }}
                >
                  {msg.text}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Interim transcript (while user is still speaking) */}
        {interimTranscript && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              You
            </span>
            <p className="text-[15px] leading-relaxed italic text-[#9CA3AF]">
              {interimTranscript}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
