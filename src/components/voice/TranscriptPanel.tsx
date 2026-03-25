"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptPanelProps {
  transcript: Array<{
    speaker: "examiner" | "candidate";
    text: string;
    timestamp: number;
  }>;
  interimTranscript?: string;
}

export function TranscriptPanel({
  transcript,
  interimTranscript,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
        maxHeight: 280,
        scrollbarWidth: "thin",
        scrollbarColor: "#D1D5DB transparent",
      }}
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-5">
        {transcript.length === 0 && !interimTranscript && (
          <p className="py-6 text-center text-sm text-[#9CA3AF]">
            Your conversation will appear here...
          </p>
        )}

        <AnimatePresence mode="popLayout">
          {transcript.map((msg, index) => {
            const isExaminer = msg.speaker === "examiner";

            return (
              <motion.div
                key={`${msg.timestamp}-${index}`}
                className={`rounded-lg px-4 py-3 ${
                  isExaminer ? "bg-[#F7F8FA]" : "bg-white"
                }`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span
                  className={`mb-1 block text-xs font-medium ${
                    isExaminer ? "text-[#111111]" : "text-[#6B7280]"
                  }`}
                >
                  {isExaminer ? "Examiner" : "You"}
                </span>
                <p
                  className={`text-[15px] leading-[1.6] ${
                    isExaminer ? "text-[#111111]" : "text-[#374151]"
                  }`}
                >
                  {msg.text}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {interimTranscript && (
          <motion.div
            className="rounded-lg bg-white px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="mb-1 block text-xs font-medium text-[#9CA3AF]">
              You
            </span>
            <p className="text-[15px] leading-[1.6] italic text-[#9CA3AF]">
              {interimTranscript}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
