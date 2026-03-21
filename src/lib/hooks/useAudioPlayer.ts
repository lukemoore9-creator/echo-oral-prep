'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  /** Called when audio playback finishes */
  onEnd?: () => void;
}

interface UseAudioPlayerReturn {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Play audio from an ArrayBuffer or Blob */
  play: (audio: ArrayBuffer | Blob) => Promise<void>;
  /** Stop audio playback immediately */
  stop: () => void;
  /** The underlying AudioContext (null until first play) */
  audioContext: AudioContext | null;
}

export function useAudioPlayer(
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn {
  const { onEnd } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Already stopped — safe to ignore
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    async (audio: ArrayBuffer | Blob): Promise<void> => {
      // Stop any currently playing audio
      stop();

      const ctx = getAudioContext();

      // Resume context if it was suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Convert Blob to ArrayBuffer if needed
      let buffer: ArrayBuffer;
      if (audio instanceof Blob) {
        buffer = await audio.arrayBuffer();
      } else {
        buffer = audio;
      }

      // Decode the audio data
      const audioBuffer = await ctx.decodeAudioData(buffer.slice(0));

      // Create and connect the source node
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
        onEndRef.current?.();
      };

      sourceNodeRef.current = source;
      setIsPlaying(true);
      source.start(0);
    },
    [stop, getAudioContext]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // Already stopped
        }
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors on unmount
        });
      }
    };
  }, []);

  return {
    isPlaying,
    play,
    stop,
    audioContext: audioContextRef.current,
  };
}
