'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrbProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  analyserNode?: AnalyserNode | null;
  micLevel?: number; // 0-1
}

// ---------------------------------------------------------------------------
// Noise — sine-combination 2D noise (no external deps)
// ---------------------------------------------------------------------------

/** Fast pseudo-noise via layered sine waves. Returns -1..1 */
function noise2D(x: number, y: number): number {
  return (
    (Math.sin(x * 1.49 + y * 0.71) +
      Math.sin(x * 0.78 - y * 1.32) +
      Math.sin(x * 2.11 + y * 1.07) +
      Math.sin(x * 0.53 + y * 2.41) +
      Math.sin(x * 1.87 - y * 0.63)) /
    5
  );
}

/** Higher-octave noise for finer detail */
function detailNoise(x: number, y: number): number {
  return (
    (Math.sin(x * 3.17 + y * 1.91) +
      Math.sin(x * 2.63 - y * 3.47) +
      Math.sin(x * 4.09 + y * 2.23)) /
    3
  );
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const GOLD = { r: 212, g: 168, b: 67 };
const GOLD_LIGHT = { r: 244, g: 220, b: 148 };
const GOLD_WHITE = { r: 255, g: 248, b: 220 };

function rgba(
  c: { r: number; g: number; b: number },
  a: number,
): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

// ---------------------------------------------------------------------------
// Layer configuration per state
// ---------------------------------------------------------------------------

interface LayerConfig {
  /** Radius multiplier (fraction of base radius) */
  radiusMul: number;
  /** Base opacity */
  opacity: number;
  /** Noise amplitude (pixels of distortion) */
  noiseAmp: number;
  /** Audio reactivity multiplier */
  audioMul: number;
  /** Noise speed multiplier */
  noiseSpeed: number;
  /** Color */
  color: { r: number; g: number; b: number };
  /** Stroke vs fill */
  stroke: boolean;
  /** Line width if stroke */
  lineWidth: number;
  /** Frequency band: 'bass' | 'mid' | 'high' | 'all' */
  band: 'bass' | 'mid' | 'high' | 'all';
}

interface StateConfig {
  layers: LayerConfig[];
  /** Overall brightness boost 0..1 */
  brightness: number;
  /** Glow intensity */
  glowIntensity: number;
  /** Rotation speed (radians/sec) */
  rotationSpeed: number;
  /** Number of vertices per blob */
  vertices: number;
}

const STATE_CONFIGS: Record<OrbProps['state'], StateConfig> = {
  idle: {
    brightness: 0.4,
    glowIntensity: 0.25,
    rotationSpeed: 0.08,
    vertices: 80,
    layers: [
      // Outer haze
      {
        radiusMul: 1.25,
        opacity: 0.06,
        noiseAmp: 12,
        audioMul: 0,
        noiseSpeed: 0.3,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Main body
      {
        radiusMul: 1.0,
        opacity: 0.22,
        noiseAmp: 8,
        audioMul: 0,
        noiseSpeed: 0.4,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Inner glow
      {
        radiusMul: 0.7,
        opacity: 0.35,
        noiseAmp: 5,
        audioMul: 0,
        noiseSpeed: 0.5,
        color: GOLD_LIGHT,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Bright core
      {
        radiusMul: 0.35,
        opacity: 0.5,
        noiseAmp: 3,
        audioMul: 0,
        noiseSpeed: 0.6,
        color: GOLD_WHITE,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
    ],
  },

  listening: {
    brightness: 0.6,
    glowIntensity: 0.45,
    rotationSpeed: 0.15,
    vertices: 96,
    layers: [
      // Aura ring — responds to mic
      {
        radiusMul: 1.45,
        opacity: 0.08,
        noiseAmp: 18,
        audioMul: 30,
        noiseSpeed: 0.6,
        color: GOLD,
        stroke: true,
        lineWidth: 1.5,
        band: 'all',
      },
      // Outer body
      {
        radiusMul: 1.15,
        opacity: 0.12,
        noiseAmp: 14,
        audioMul: 18,
        noiseSpeed: 0.5,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Main body
      {
        radiusMul: 1.0,
        opacity: 0.3,
        noiseAmp: 10,
        audioMul: 12,
        noiseSpeed: 0.55,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Inner
      {
        radiusMul: 0.65,
        opacity: 0.45,
        noiseAmp: 6,
        audioMul: 5,
        noiseSpeed: 0.65,
        color: GOLD_LIGHT,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Core
      {
        radiusMul: 0.3,
        opacity: 0.6,
        noiseAmp: 3,
        audioMul: 2,
        noiseSpeed: 0.7,
        color: GOLD_WHITE,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
    ],
  },

  processing: {
    brightness: 0.5,
    glowIntensity: 0.35,
    rotationSpeed: 0.8,
    vertices: 80,
    layers: [
      // Spinning outer
      {
        radiusMul: 1.2,
        opacity: 0.08,
        noiseAmp: 10,
        audioMul: 0,
        noiseSpeed: 1.2,
        color: GOLD,
        stroke: true,
        lineWidth: 1,
        band: 'all',
      },
      // Main body
      {
        radiusMul: 1.0,
        opacity: 0.25,
        noiseAmp: 8,
        audioMul: 0,
        noiseSpeed: 0.9,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Inner shimmer
      {
        radiusMul: 0.7,
        opacity: 0.4,
        noiseAmp: 6,
        audioMul: 0,
        noiseSpeed: 1.4,
        color: GOLD_LIGHT,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
      // Core
      {
        radiusMul: 0.35,
        opacity: 0.55,
        noiseAmp: 3,
        audioMul: 0,
        noiseSpeed: 1.6,
        color: GOLD_WHITE,
        stroke: false,
        lineWidth: 0,
        band: 'all',
      },
    ],
  },

  speaking: {
    brightness: 0.75,
    glowIntensity: 0.65,
    rotationSpeed: 0.2,
    vertices: 128,
    layers: [
      // Outer bass halo
      {
        radiusMul: 1.5,
        opacity: 0.06,
        noiseAmp: 10,
        audioMul: 55,
        noiseSpeed: 0.35,
        color: GOLD,
        stroke: true,
        lineWidth: 1.5,
        band: 'bass',
      },
      // Bass body
      {
        radiusMul: 1.25,
        opacity: 0.1,
        noiseAmp: 12,
        audioMul: 45,
        noiseSpeed: 0.4,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'bass',
      },
      // Mid outer
      {
        radiusMul: 1.05,
        opacity: 0.2,
        noiseAmp: 10,
        audioMul: 35,
        noiseSpeed: 0.6,
        color: GOLD,
        stroke: false,
        lineWidth: 0,
        band: 'mid',
      },
      // Mid inner
      {
        radiusMul: 0.8,
        opacity: 0.35,
        noiseAmp: 7,
        audioMul: 25,
        noiseSpeed: 0.8,
        color: GOLD_LIGHT,
        stroke: false,
        lineWidth: 0,
        band: 'mid',
      },
      // High frequencies
      {
        radiusMul: 0.55,
        opacity: 0.5,
        noiseAmp: 5,
        audioMul: 18,
        noiseSpeed: 1.2,
        color: GOLD_LIGHT,
        stroke: false,
        lineWidth: 0,
        band: 'high',
      },
      // Bright core
      {
        radiusMul: 0.3,
        opacity: 0.7,
        noiseAmp: 3,
        audioMul: 8,
        noiseSpeed: 1.5,
        color: GOLD_WHITE,
        stroke: false,
        lineWidth: 0,
        band: 'high',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Audio data extraction helpers
// ---------------------------------------------------------------------------

interface AudioBands {
  bass: number; // 0-1
  mid: number; // 0-1
  high: number; // 0-1
  overall: number; // 0-1
}

function getAudioBands(analyser: AnalyserNode | null | undefined): AudioBands {
  if (!analyser) return { bass: 0, mid: 0, high: 0, overall: 0 };

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // Split into 3 bands
  const third = Math.floor(bufferLength / 3);

  let bassSum = 0;
  let midSum = 0;
  let highSum = 0;

  for (let i = 0; i < third; i++) {
    bassSum += dataArray[i];
  }
  for (let i = third; i < third * 2; i++) {
    midSum += dataArray[i];
  }
  for (let i = third * 2; i < bufferLength; i++) {
    highSum += dataArray[i];
  }

  const bass = bassSum / (third * 255);
  const mid = midSum / (third * 255);
  const high = highSum / ((bufferLength - third * 2) * 255);
  const overall = (bass + mid + high) / 3;

  return { bass, mid, high, overall };
}

function getBandValue(bands: AudioBands, band: LayerConfig['band']): number {
  switch (band) {
    case 'bass':
      return bands.bass;
    case 'mid':
      return bands.mid;
    case 'high':
      return bands.high;
    case 'all':
      return bands.overall;
  }
}

// ---------------------------------------------------------------------------
// Smooth interpolation helpers
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Draw a single blob layer
// ---------------------------------------------------------------------------

function drawBlobLayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  layer: LayerConfig,
  time: number,
  audioValue: number,
  rotationOffset: number,
  vertices: number,
) {
  const r = baseRadius * layer.radiusMul;
  const points: { x: number; y: number }[] = [];
  const step = (Math.PI * 2) / vertices;

  for (let i = 0; i < vertices; i++) {
    const angle = i * step + rotationOffset;

    // Noise coordinates — use angle and layer radius for variation
    const nx = Math.cos(angle) * 2 + time * layer.noiseSpeed;
    const ny = Math.sin(angle) * 2 + time * layer.noiseSpeed * 0.7;

    // Multi-octave noise displacement
    const n1 = noise2D(nx, ny) * layer.noiseAmp;
    const n2 = detailNoise(nx * 1.5, ny * 1.5) * layer.noiseAmp * 0.3;

    // Audio displacement
    const audioDisp = audioValue * layer.audioMul;

    // Per-vertex audio variation (so the blob doesn't expand uniformly)
    const audioVariation =
      1 + 0.4 * Math.sin(angle * 3 + time * 2) +
      0.2 * Math.sin(angle * 7 - time * 3);

    const displacement = n1 + n2 + audioDisp * audioVariation;
    const finalR = r + displacement;

    points.push({
      x: cx + Math.cos(angle) * finalR,
      y: cy + Math.sin(angle) * finalR,
    });
  }

  // Draw smooth closed curve using quadratic bezier through midpoints
  ctx.beginPath();
  const first = points[0];
  const last = points[points.length - 1];

  // Move to midpoint between last and first
  ctx.moveTo(
    (last.x + first.x) / 2,
    (last.y + first.y) / 2,
  );

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  ctx.closePath();

  if (layer.stroke) {
    ctx.strokeStyle = rgba(layer.color, layer.opacity);
    ctx.lineWidth = layer.lineWidth;
    ctx.stroke();
  } else {
    // Radial gradient fill for depth
    const gradient = ctx.createRadialGradient(
      cx - r * 0.15,
      cy - r * 0.15,
      0,
      cx,
      cy,
      r * 1.3,
    );
    gradient.addColorStop(0, rgba(layer.color, layer.opacity * 1.2));
    gradient.addColorStop(0.5, rgba(layer.color, layer.opacity * 0.8));
    gradient.addColorStop(1, rgba(layer.color, layer.opacity * 0.1));

    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Processing shimmer overlay
// ---------------------------------------------------------------------------

function drawShimmer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
) {
  // Sweeping arc of light
  const shimmerAngle = (time * 1.5) % (Math.PI * 2);
  const shimmerWidth = 0.6;

  const gradient = ctx.createConicGradient(shimmerAngle, cx, cy);
  gradient.addColorStop(0, 'rgba(255, 248, 220, 0)');
  gradient.addColorStop(shimmerWidth * 0.3, 'rgba(255, 248, 220, 0.12)');
  gradient.addColorStop(shimmerWidth * 0.5, 'rgba(255, 248, 220, 0.2)');
  gradient.addColorStop(shimmerWidth * 0.7, 'rgba(255, 248, 220, 0.12)');
  gradient.addColorStop(shimmerWidth, 'rgba(255, 248, 220, 0)');
  gradient.addColorStop(1, 'rgba(255, 248, 220, 0)');

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius * 1.2, cy - radius * 1.2, radius * 2.4, radius * 2.4);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Orb({ state, analyserNode, micLevel = 0 }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Smoothed values to prevent jarring transitions
  const smoothedRef = useRef({
    bass: 0,
    mid: 0,
    high: 0,
    overall: 0,
    micLevel: 0,
    brightness: 0.4,
    glowIntensity: 0.25,
  });

  // Track current state for transition interpolation
  const stateRef = useRef(state);
  const prevStateRef = useRef(state);
  const transitionProgress = useRef(1); // 1 = fully transitioned

  // Update state tracking
  useEffect(() => {
    if (state !== stateRef.current) {
      prevStateRef.current = stateRef.current;
      stateRef.current = state;
      transitionProgress.current = 0;
    }
  }, [state]);

  // Memoize container glow styles per state
  const glowStyles = useMemo(() => {
    const base = '0 0 ';
    switch (state) {
      case 'idle':
        return {
          boxShadow: `${base}60px rgba(212,168,67,0.15), ${base}120px rgba(212,168,67,0.08)`,
        };
      case 'listening':
        return {
          boxShadow: `${base}80px rgba(212,168,67,0.25), ${base}160px rgba(212,168,67,0.12)`,
        };
      case 'processing':
        return {
          boxShadow: `${base}70px rgba(212,168,67,0.2), ${base}140px rgba(212,168,67,0.1)`,
        };
      case 'speaking':
        return {
          boxShadow: `${base}100px rgba(212,168,67,0.35), ${base}200px rgba(212,168,67,0.15), ${base}300px rgba(212,168,67,0.06)`,
        };
    }
  }, [state]);

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Ensure canvas buffer matches display size
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    const currentState = stateRef.current;
    const config = STATE_CONFIGS[currentState];

    // Advance transition
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(1, transitionProgress.current + 0.02);
    }

    // Get audio data
    const audioBands = getAudioBands(analyserNode);

    // Smoothing factor — tighter for speaking, looser for idle
    const smoothFactor = currentState === 'speaking' ? 0.25 : 0.12;

    const s = smoothedRef.current;
    s.bass = lerp(s.bass, audioBands.bass, smoothFactor);
    s.mid = lerp(s.mid, audioBands.mid, smoothFactor);
    s.high = lerp(s.high, audioBands.high, smoothFactor);
    s.overall = lerp(s.overall, audioBands.overall, smoothFactor);
    s.micLevel = lerp(s.micLevel, micLevel, 0.15);
    s.brightness = lerp(s.brightness, config.brightness, 0.06);
    s.glowIntensity = lerp(s.glowIntensity, config.glowIntensity, 0.06);

    // Build smoothed bands object
    const smoothBands: AudioBands = {
      bass: s.bass,
      mid: s.mid,
      high: s.high,
      overall: s.overall,
    };

    // For listening state, use micLevel as the audio driver
    if (currentState === 'listening') {
      smoothBands.bass = s.micLevel;
      smoothBands.mid = s.micLevel;
      smoothBands.high = s.micLevel;
      smoothBands.overall = s.micLevel;
    }

    const time = performance.now() / 1000;
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.28;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background radial glow
    const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 2.2);
    const glowAlpha = s.glowIntensity * (1 + s.overall * 0.5);
    bgGlow.addColorStop(0, rgba(GOLD, glowAlpha * 0.3));
    bgGlow.addColorStop(0.4, rgba(GOLD, glowAlpha * 0.12));
    bgGlow.addColorStop(0.7, rgba(GOLD, glowAlpha * 0.04));
    bgGlow.addColorStop(1, 'rgba(212,168,67,0)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, w, h);

    // Rotation offset per state
    const rotationOffset = time * config.rotationSpeed;

    // Draw each layer (outer to inner)
    for (let i = 0; i < config.layers.length; i++) {
      const layer = config.layers[i];

      // Each layer gets a slightly different rotation for organic feel
      const layerRotation =
        rotationOffset * (1 + i * 0.15) +
        (i * Math.PI) / config.layers.length;

      const audioVal = getBandValue(smoothBands, layer.band);

      drawBlobLayer(
        ctx,
        cx,
        cy,
        baseRadius,
        layer,
        time,
        audioVal,
        layerRotation,
        config.vertices,
      );
    }

    // Processing shimmer effect
    if (currentState === 'processing') {
      drawShimmer(ctx, cx, cy, baseRadius, time);
    }

    // Speaking shimmer (subtler)
    if (currentState === 'speaking' && s.overall > 0.1) {
      ctx.globalAlpha = s.overall * 0.4;
      drawShimmer(ctx, cx, cy, baseRadius * 0.9, time * 0.7);
      ctx.globalAlpha = 1;
    }

    // Central bright spot
    const coreGlow = ctx.createRadialGradient(
      cx - baseRadius * 0.05,
      cy - baseRadius * 0.05,
      0,
      cx,
      cy,
      baseRadius * 0.4,
    );
    const coreAlpha = s.brightness * (1 + s.overall * 0.3);
    coreGlow.addColorStop(0, rgba(GOLD_WHITE, coreAlpha * 0.5));
    coreGlow.addColorStop(0.3, rgba(GOLD_LIGHT, coreAlpha * 0.2));
    coreGlow.addColorStop(1, 'rgba(255,248,220,0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Particle dust when speaking (subtle sparkles)
    if (currentState === 'speaking' && s.overall > 0.15) {
      const particleCount = Math.floor(s.overall * 12);
      for (let i = 0; i < particleCount; i++) {
        const pAngle = noise2D(i * 3.7, time * 0.8) * Math.PI * 2;
        const pDist =
          baseRadius * (0.8 + noise2D(i * 2.1, time * 0.5) * 0.7);
        const px = cx + Math.cos(pAngle + time * 0.3) * pDist;
        const py = cy + Math.sin(pAngle + time * 0.3) * pDist;
        const pAlpha =
          (0.3 + 0.4 * Math.sin(time * 4 + i * 1.7)) * s.overall;
        const pSize = 1 + Math.sin(time * 3 + i) * 0.5;

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = rgba(GOLD_WHITE, pAlpha);
        ctx.fill();
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [analyserNode, micLevel]);

  // Start/stop animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Handle resize — update canvas dimensions on container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // The animate loop handles actual resizing via rect measurement
      // This just ensures a re-render cycle triggers if needed
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: '100%',
        maxWidth: 340,
        aspectRatio: '1 / 1',
      }}
    >
      {/* Ambient glow layer — behind canvas, animated with framer-motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          ref={containerRef}
          className="absolute inset-0 rounded-full"
          style={{
            ...glowStyles,
            background: `radial-gradient(circle at 45% 45%, ${rgba(GOLD, 0.06)}, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Pulsing glow ring — visible in listening and speaking */}
      {(state === 'listening' || state === 'speaking') && (
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: -20,
            border: `1px solid ${rgba(GOLD, 0.12)}`,
            background: `radial-gradient(circle, ${rgba(GOLD, 0.04)}, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: state === 'speaking' ? 1.2 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Secondary outer ring for speaking */}
      {state === 'speaking' && (
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: -40,
            border: `1px solid ${rgba(GOLD, 0.06)}`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />
      )}

      {/* The canvas — this is where the magic happens */}
      <canvas
        ref={canvasRef}
        className="relative z-10"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Processing dots indicator */}
      {state === 'processing' && (
        <motion.div
          className="absolute z-20 flex items-center gap-1.5"
          style={{ bottom: '15%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 4,
                height: 4,
                backgroundColor: rgba(GOLD_LIGHT, 0.7),
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
