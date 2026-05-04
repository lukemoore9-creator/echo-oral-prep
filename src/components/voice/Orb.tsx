'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

interface OrbProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  analyserNode?: AnalyserNode | null;
  micLevel?: number;
  size?: number;
}

export function Orb({ state, analyserNode, micLevel = 0, size = 240 }: OrbProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const effectiveSize = isMobile ? Math.round(size * 0.833) : size; // ~200px from 240px

  const rafRef = useRef<number>(0);

  const audioLevel = useMotionValue(0);
  const orbScale = useTransform(audioLevel, [0, 1], [1, 1.08]);
  const speakingRingScale = useTransform(audioLevel, [0, 1], [1.05, 1.18]);
  const speakingRingOpacity = useTransform(audioLevel, [0, 1], [0.1, 0.35]);

  const micMotion = useMotionValue(0);
  const listeningRingScale = useTransform(micMotion, [0, 1], [1.0, 1.15]);
  const listeningRingOpacity = useTransform(micMotion, [0, 1], [0.2, 0.6]);

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

  useEffect(() => {
    if (state !== 'listening') {
      micMotion.set(0);
      return;
    }

    const current = micMotion.get();
    micMotion.set(current + (micLevel - current) * 0.2);
  }, [state, micLevel, micMotion]);

  // Slowed rotation — 40% slower than original
  const rotationDuration = (() => {
    switch (state) {
      case 'idle': return 35;
      case 'listening': return 25;
      case 'processing': return 11;
      case 'speaking': return 22;
    }
  })();

  // Dark maritime glow
  const glowColor = (() => {
    switch (state) {
      case 'idle': return 'rgba(31, 78, 61, 0.10)';
      case 'listening': return 'rgba(31, 78, 61, 0.20)';
      case 'processing': return 'rgba(14, 26, 36, 0.15)';
      case 'speaking': return 'rgba(31, 78, 61, 0.25)';
    }
  })();

  const innerSize = Math.round(effectiveSize * 0.875);
  const outerGlowSize = Math.round(effectiveSize * 0.97);
  const ringSize = effectiveSize;
  const outerRingSize = Math.round(effectiveSize * 1.06);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: effectiveSize, height: effectiveSize }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: outerGlowSize,
          height: outerGlowSize,
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

      {/* Main orb — dark maritime conic gradient */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: innerSize,
          height: innerSize,
          ...(state === 'speaking' ? { scale: orbScale } : {}),
        }}
        animate={
          state === 'speaking'
            ? {}
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
        {/* Rotating conic gradient — ink / deep-sea / chart-green / abyss */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #0E1A24, #1A2D3D, #1F4E3D, #0A1822, #0E1A24, #1A2D3D, #1F4E3D, #0A1822, #0E1A24)',
            animation: `orbRotate ${rotationDuration}s linear infinite`,
          }}
        />

        {/* Inner highlight — subtle metallic sheen */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 60%)',
          }}
        />

        {/* Secondary depth tint */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 65% 70%, rgba(31, 78, 61, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Processing shimmer */}
        {state === 'processing' && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.12) 50%, transparent 60%)',
              animation: 'orbShimmer 2s ease-in-out infinite',
            }}
          />
        )}
      </motion.div>

      {/* Listening ring */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: ringSize,
              height: ringSize,
              border: '2px solid rgba(31, 78, 61, 0.25)',
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

      {/* Speaking ring (audio-reactive) */}
      <AnimatePresence>
        {state === 'speaking' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: ringSize,
              height: ringSize,
              border: '1.5px solid rgba(31, 78, 61, 0.2)',
              scale: speakingRingScale,
              opacity: speakingRingOpacity,
              boxShadow: '0 0 30px rgba(31, 78, 61, 0.08)',
            }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Ambient outer ring for speaking */}
      <AnimatePresence>
        {state === 'speaking' && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: outerRingSize,
              height: outerRingSize,
              border: '1px solid rgba(31, 78, 61, 0.08)',
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
