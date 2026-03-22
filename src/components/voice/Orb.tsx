'use client';

import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrbProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  analyserNode?: AnalyserNode | null;
  micLevel?: number; // 0-1
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Orb({ state, analyserNode, micLevel = 0 }: OrbProps) {
  const rafRef = useRef<number>(0);

  // Audio-reactive motion values for speaking state
  const audioLevel = useMotionValue(0);
  const orbScale = useTransform(audioLevel, [0, 1], [1, 1.08]);
  const speakingRingScale = useTransform(audioLevel, [0, 1], [1.05, 1.18]);
  const speakingRingOpacity = useTransform(audioLevel, [0, 1], [0.1, 0.35]);

  // Mic-reactive values for listening state
  const micMotion = useMotionValue(0);
  const listeningRingScale = useTransform(micMotion, [0, 1], [1.0, 1.15]);
  const listeningRingOpacity = useTransform(micMotion, [0, 1], [0.2, 0.6]);

  // Audio-reactive animation loop for speaking state
  useEffect(() => {
    if (state !== 'speaking' || !analyserNode) {
      audioLevel.set(0);
      return;
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const tick = () => {
      analyserNode.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedVolume = average / 255;
      // Smooth the value
      const current = audioLevel.get();
      audioLevel.set(current + (normalizedVolume - current) * 0.25);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [state, analyserNode, audioLevel]);

  // Mic level tracking for listening state
  useEffect(() => {
    if (state !== 'listening') {
      micMotion.set(0);
      return;
    }

    const current = micMotion.get();
    micMotion.set(current + (micLevel - current) * 0.2);
  }, [state, micLevel, micMotion]);

  // Determine rotation speed based on state
  const rotationDuration = (() => {
    switch (state) {
      case 'idle': return 25;
      case 'listening': return 18;
      case 'processing': return 8;
      case 'speaking': return 15;
    }
  })();

  // Glow color/intensity per state
  const glowColor = (() => {
    switch (state) {
      case 'idle': return 'rgba(6, 182, 212, 0.12)';
      case 'listening': return 'rgba(6, 182, 212, 0.25)';
      case 'processing': return 'rgba(37, 99, 235, 0.2)';
      case 'speaking': return 'rgba(6, 182, 212, 0.3)';
    }
  })();

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 320, height: 320 }}
    >
      {/* ---- Layer 1: Outer glow ---- */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 310,
          height: 310,
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
        }}
        animate={{
          scale: state === 'idle'
            ? [1, 1.05, 1]
            : state === 'speaking'
              ? [1, 1.08, 1]
              : 1.02,
          opacity: state === 'processing' ? [0.6, 1, 0.6] : 1,
        }}
        transition={{
          duration: state === 'idle' ? 4 : state === 'speaking' ? 1.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ---- Layer 2: Main orb with conic-gradient ---- */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: 280,
          height: 280,
          ...(state === 'speaking' ? { scale: orbScale } : {}),
        }}
        animate={
          state === 'speaking'
            ? {} // Driven by motion value
            : state === 'idle'
              ? { scale: [1, 1.02, 1] }
              : state === 'processing'
                ? { scale: 1, opacity: [0.85, 1, 0.85] }
                : { scale: 1 }
        }
        transition={
          state === 'idle'
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : state === 'processing'
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
        }
      >
        {/* Rotating conic gradient background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #06b6d4, #0ea5e9, #2563eb, #0ea5e9, #06b6d4, #67e8f9, #ffffff, #67e8f9, #06b6d4, #0ea5e9, #2563eb, #0ea5e9, #06b6d4)',
            animation: `orbRotate ${rotationDuration}s linear infinite`,
          }}
        />

        {/* ---- Layer 3: Inner highlight overlay (metallic sheen) ---- */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 60%)',
          }}
        />

        {/* Secondary sheen for depth */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 65% 70%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Processing shimmer sweep */}
        {state === 'processing' && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.25) 50%, transparent 60%)',
              animation: 'orbShimmer 2s ease-in-out infinite',
            }}
          />
        )}
      </motion.div>

      {/* ---- Layer 4: Listening ring ---- */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 320,
              height: 320,
              border: '2px solid rgba(6, 182, 212, 0.3)',
              scale: listeningRingScale,
              opacity: listeningRingOpacity,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ---- Layer 5: Speaking ring (audio-reactive) ---- */}
      <AnimatePresence>
        {state === 'speaking' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 320,
              height: 320,
              border: '1.5px solid rgba(6, 182, 212, 0.2)',
              scale: speakingRingScale,
              opacity: speakingRingOpacity,
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)',
            }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ---- Ambient outer ring for speaking (secondary, slower pulse) ---- */}
      <AnimatePresence>
        {state === 'speaking' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 340,
              height: 340,
              border: '1px solid rgba(6, 182, 212, 0.1)',
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.06, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
