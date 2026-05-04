"use client";

import { Mic, MicOff, Pause, Play, CornerDownLeft } from "lucide-react";
import type { SessionState } from "@/lib/types";

interface VoiceControlsProps {
  state: SessionState;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMic: () => void;
  onTogglePause: () => void;
  onInterrupt: () => void;
}

export function VoiceControls({
  state,
  isMuted,
  isPaused,
  onToggleMic,
  onTogglePause,
  onInterrupt,
}: VoiceControlsProps) {
  const interruptDisabled = state !== "speaking";

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Mute / Unmute */}
      <div className="group relative flex flex-col items-center">
        <button
          onClick={onToggleMic}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
          style={{
            border: `1px solid var(${isMuted ? "--color-refer" : "--color-rule"})`,
            color: `var(${isMuted ? "--color-refer" : "--color-ink"})`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-paper-warm)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <span
          className="pointer-events-none absolute -bottom-5 font-mono text-[10px] uppercase tracking-[0.12em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ color: "var(--color-ink-muted)" }}
        >
          {isMuted ? "Unmute" : "Mute"}
        </span>
      </div>

      {/* Pause / Resume */}
      <div className="group relative flex flex-col items-center">
        <button
          onClick={onTogglePause}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
          style={{
            border: `1px solid var(${isPaused ? "--color-marginal" : "--color-rule"})`,
            color: `var(${isPaused ? "--color-marginal" : "--color-ink"})`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-paper-warm)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <span
          className="pointer-events-none absolute -bottom-5 font-mono text-[10px] uppercase tracking-[0.12em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ color: "var(--color-ink-muted)" }}
        >
          {isPaused ? "Resume" : "Pause"}
        </span>
      </div>

      {/* Interrupt */}
      <div className="group relative flex flex-col items-center">
        <button
          onClick={onInterrupt}
          disabled={interruptDisabled}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
          style={{
            border: "1px solid var(--color-rule)",
            color: "var(--color-ink)",
            opacity: interruptDisabled ? 0.5 : 1,
            cursor: interruptDisabled ? "default" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!interruptDisabled) {
              e.currentTarget.style.backgroundColor = "var(--color-paper-warm)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
        <span
          className="pointer-events-none absolute -bottom-5 font-mono text-[10px] uppercase tracking-[0.12em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ color: "var(--color-ink-muted)" }}
        >
          Interrupt
        </span>
      </div>
    </div>
  );
}
