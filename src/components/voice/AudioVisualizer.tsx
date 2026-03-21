'use client';

import { motion, type Variants } from 'framer-motion';
import type { VoiceSessionState } from '@/types';

interface AudioVisualizerProps {
  /** Current voice session state */
  voiceState: VoiceSessionState;
  /** Optional CSS class name */
  className?: string;
}

const COLORS = {
  idle: {
    primary: 'rgba(212, 168, 67, 0.3)',
    glow: 'rgba(212, 168, 67, 0.1)',
    ring: 'rgba(212, 168, 67, 0.15)',
  },
  listening: {
    primary: 'rgba(212, 168, 67, 0.8)',
    glow: 'rgba(212, 168, 67, 0.3)',
    ring: 'rgba(212, 168, 67, 0.4)',
  },
  processing: {
    primary: 'rgba(212, 168, 67, 0.5)',
    glow: 'rgba(212, 168, 67, 0.2)',
    ring: 'rgba(212, 168, 67, 0.25)',
  },
  speaking: {
    primary: 'rgba(212, 168, 67, 0.7)',
    glow: 'rgba(212, 168, 67, 0.25)',
    ring: 'rgba(212, 168, 67, 0.35)',
  },
  paused: {
    primary: 'rgba(212, 168, 67, 0.2)',
    glow: 'rgba(212, 168, 67, 0.05)',
    ring: 'rgba(212, 168, 67, 0.1)',
  },
};

/** Core orb animation variants by state */
const orbVariants: Variants = {
  idle: {
    scale: [1, 1.05, 1],
    opacity: [0.4, 0.6, 0.4],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  listening: {
    scale: [1, 1.15, 1.05, 1.2, 1],
    opacity: [0.7, 1, 0.8, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  processing: {
    scale: [1, 1.08, 1],
    opacity: [0.5, 0.7, 0.5],
    rotate: [0, 360],
    transition: {
      scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
    },
  },
  speaking: {
    scale: [1, 1.12, 1.03, 1.1, 1],
    opacity: [0.6, 0.9, 0.7, 0.85, 0.6],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  paused: {
    scale: 1,
    opacity: 0.3,
    transition: {
      duration: 0.5,
    },
  },
};

/** Outer glow ring variants */
const glowRingVariants: Variants = {
  idle: {
    scale: [1, 1.2, 1],
    opacity: [0.1, 0.2, 0.1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  listening: {
    scale: [1, 1.4, 1.1, 1.5, 1],
    opacity: [0.2, 0.4, 0.25, 0.45, 0.2],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  processing: {
    scale: [1, 1.15, 1],
    opacity: [0.15, 0.3, 0.15],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  speaking: {
    scale: [1, 1.3, 1.1, 1.25, 1],
    opacity: [0.15, 0.35, 0.2, 0.3, 0.15],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  paused: {
    scale: 1,
    opacity: 0.05,
    transition: { duration: 0.5 },
  },
};

/** Inner pulse ring variants */
const innerRingVariants: Variants = {
  idle: {
    scale: [0.85, 0.95, 0.85],
    opacity: [0.2, 0.35, 0.2],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: 0.3,
    },
  },
  listening: {
    scale: [0.9, 1.1, 0.95, 1.05, 0.9],
    opacity: [0.3, 0.6, 0.4, 0.55, 0.3],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  processing: {
    scale: [0.9, 1, 0.9],
    opacity: [0.2, 0.4, 0.2],
    rotate: [0, -360],
    transition: {
      scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      opacity: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
    },
  },
  speaking: {
    scale: [0.9, 1.08, 0.95, 1.05, 0.9],
    opacity: [0.25, 0.5, 0.3, 0.45, 0.25],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  paused: {
    scale: 0.9,
    opacity: 0.1,
    transition: { duration: 0.5 },
  },
};

function getStateLabel(state: VoiceSessionState): string {
  switch (state) {
    case 'idle':
      return 'Ready';
    case 'listening':
      return 'Listening...';
    case 'processing':
      return 'Thinking...';
    case 'speaking':
      return 'Examiner Speaking';
    case 'paused':
      return 'Paused';
    default:
      return '';
  }
}

export function AudioVisualizer({ voiceState, className = '' }: AudioVisualizerProps) {
  const colors = COLORS[voiceState];

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${className}`}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 220,
          height: 220,
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
        variants={glowRingVariants}
        animate={voiceState}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full border"
        style={{
          width: 180,
          height: 180,
          borderColor: colors.ring,
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 60%)`,
        }}
        variants={innerRingVariants}
        animate={voiceState}
      />

      {/* Core orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle at 35% 35%, ${colors.primary}, rgba(12, 27, 51, 0.8))`,
          boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}, inset 0 0 30px ${colors.glow}`,
        }}
        variants={orbVariants}
        animate={voiceState}
      />

      {/* Waveform bars (visible during listening and speaking) */}
      {(voiceState === 'listening' || voiceState === 'speaking') && (
        <div className="absolute flex items-center gap-1" style={{ bottom: -8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 3,
                backgroundColor: '#D4A843',
              }}
              animate={{
                height: [8, 20 + Math.random() * 16, 8],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 0.4 + Math.random() * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.08,
              }}
            />
          ))}
        </div>
      )}

      {/* Processing spinner dots */}
      {voiceState === 'processing' && (
        <div className="absolute flex items-center gap-2" style={{ bottom: -8 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: '#D4A843',
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* State label */}
      <motion.p
        className="absolute text-xs font-medium tracking-wider uppercase"
        style={{
          bottom: -32,
          color: '#D4A843',
          opacity: 0.7,
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {getStateLabel(voiceState)}
      </motion.p>
    </div>
  );
}
