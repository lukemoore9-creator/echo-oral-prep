'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SessionState, TranscriptEntry } from '@/lib/types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useAudioPlayer } from './useAudioPlayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseVoiceSessionReturn {
  state: SessionState;
  transcript: TranscriptEntry[];
  interimTranscript: string;
  startSession: (ticketType: string, firstName?: string, totalSessions?: number) => void;
  endSession: () => void;
  toggleMic: () => void;
  analyserNode: AnalyserNode | null;
  micLevel: number;
  browserSupported: boolean;
  lastError: string | null;
}

// ---------------------------------------------------------------------------
// Topic detection
// ---------------------------------------------------------------------------

const TOPIC_KEYWORDS: Record<string, string> = {
  'colreg': 'colregs', 'rule ': 'colregs', 'collision': 'colregs',
  'navigation': 'navigation', 'passage plan': 'navigation', 'chart': 'navigation',
  'safety': 'safety', 'fire': 'safety', 'man overboard': 'safety', 'mob': 'safety', 'abandon': 'safety',
  'solas': 'solas',
  'meteorolog': 'meteorology', 'weather': 'meteorology', 'synoptic': 'meteorology',
  'stability': 'stability', 'gm': 'stability', 'gz': 'stability',
  'marpol': 'marpol', 'pollution': 'marpol',
  'stcw': 'stcw', 'watchkeep': 'stcw',
  'cargo': 'cargo',
  'gmdss': 'gmdss', 'distress': 'gmdss', 'vhf': 'gmdss',
  'radar': 'bridge-equipment', 'ecdis': 'bridge-equipment', 'ais': 'bridge-equipment', 'bridge': 'bridge-equipment',
  'maritime law': 'maritime-law', 'ism': 'maritime-law', 'mlc': 'maritime-law',
};

function detectTopic(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, topic] of Object.entries(TOPIC_KEYWORDS)) {
    if (lower.includes(keyword)) return topic;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractSentences(text: string): { sentences: string[]; remainder: string } {
  const sentences: string[] = [];
  const regex = /[^.!?]*[.!?]+["')\s]*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    sentences.push(match[0].trim());
    lastIndex = regex.lastIndex;
  }
  return { sentences, remainder: text.slice(lastIndex) };
}

async function readStreamAndSplit(
  response: Response,
  onSentence: (sentence: string, isFirst: boolean) => void
): Promise<string> {
  if (!response.body) {
    throw new Error('Stream response body is null');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let sentenceCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    fullText += chunk;

    const { sentences, remainder } = extractSentences(buffer);
    buffer = remainder;

    for (const sentence of sentences) {
      if (sentence.trim()) {
        onSentence(sentence, sentenceCount === 0);
        sentenceCount++;
      }
    }
  }

  if (buffer.trim()) {
    onSentence(buffer.trim(), sentenceCount === 0);
  }

  return fullText;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const messagesRef = useRef<Message[]>([]);
  const ticketTypeRef = useRef<string>('oow-unlimited');
  const currentTopicRef = useRef<string | null>(null);
  const stateRef = useRef<SessionState>('idle');
  const isSessionActiveRef = useRef(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const audioPlayer = useAudioPlayer();

  const playTTS = useCallback(
    async (text: string): Promise<void> => {
      try {
        await audioPlayer.play(text);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown TTS error';
        setLastError(`Voice playback failed: ${errorMsg}`);
      }
    },
    [audioPlayer]
  );

  // Mic metering
  const startMicMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      micContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setMicLevel(sum / dataArray.length / 255);
        micRafRef.current = requestAnimationFrame(tick);
      };
      micRafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('[VoiceSession] Mic metering failed:', err);
    }
  }, []);

  const stopMicMeter = useCallback(() => {
    if (micRafRef.current !== null) { cancelAnimationFrame(micRafRef.current); micRafRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
    if (micContextRef.current && micContextRef.current.state !== 'closed') { micContextRef.current.close().catch(() => {}); micContextRef.current = null; }
    micAnalyserRef.current = null;
    setMicLevel(0);
  }, []);

  // Stream + speak pipeline
  const streamAndSpeak = useCallback(
    async (chatRes: Response): Promise<string> => {
      const sentenceQueue: string[] = [];
      let playing = false;
      let resolveDone: () => void;
      const donePromise = new Promise<void>((r) => { resolveDone = r; });
      let streamFinished = false;

      const playNext = async () => {
        if (playing) return;
        const next = sentenceQueue.shift();
        if (!next) { if (streamFinished) resolveDone(); return; }
        playing = true;
        setState('speaking');
        await playTTS(next);
        playing = false;
        await playNext();
      };

      const fullText = await readStreamAndSplit(chatRes, (sentence, isFirst) => {
        sentenceQueue.push(sentence);
        if (isFirst) playNext();
      });

      streamFinished = true;
      if (!playing && sentenceQueue.length === 0) resolveDone!();
      else if (!playing) playNext();

      await donePromise;
      return fullText;
    },
    [playTTS]
  );

  // Process user speech
  const processUserSpeechRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    processUserSpeechRef.current = async (userText: string) => {
      if (!userText.trim() || !isSessionActiveRef.current) return;

      setState('processing');
      setLastError(null);
      stopMicMeter();

      const userMsg: Message = { role: 'user', content: userText.trim() };
      messagesRef.current = [...messagesRef.current, userMsg];

      setTranscript((prev) => [
        ...prev,
        { speaker: 'candidate', text: userText.trim(), timestamp: Date.now() },
      ]);

      try {
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesRef.current,
            ticketType: ticketTypeRef.current,
            currentTopic: currentTopicRef.current,
          }),
        });

        if (!chatRes.ok) throw new Error(`Chat API returned ${chatRes.status}`);

        const assistantText = await streamAndSpeak(chatRes);

        const detected = detectTopic(assistantText);
        if (detected) currentTopicRef.current = detected;

        messagesRef.current = [...messagesRef.current, { role: 'assistant', content: assistantText }];

        setTranscript((prev) => [
          ...prev,
          { speaker: 'examiner', text: assistantText, timestamp: Date.now() },
        ]);

        if (isSessionActiveRef.current) {
          setState('listening');
          speechRecognition.startListening();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setLastError(errorMsg);

        const errorText = 'Sorry, there was a technical issue. Could you repeat that?';
        setTranscript((prev) => [...prev, { speaker: 'examiner', text: errorText, timestamp: Date.now() }]);
        setState('speaking');
        await playTTS(errorText);

        if (isSessionActiveRef.current) {
          setState('listening');
          speechRecognition.startListening();
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playTTS, stopMicMeter, streamAndSpeak]);

  const handleSpeechComplete = useCallback((text: string) => {
    processUserSpeechRef.current(text);
  }, []);

  const speechRecognition = useSpeechRecognition({
    onSpeechComplete: handleSpeechComplete,
    onListeningStart: startMicMeter,
    lang: 'en-GB',
    silenceTimeout: 1200,
  });

  // ------------------------------------------------------------------
  // START SESSION — HARDCODED GREETING, NO CLAUDE CALL
  // ------------------------------------------------------------------

  const startSession = useCallback(
    async (ticketType: string, firstName?: string, totalSessions?: number) => {
      messagesRef.current = [];
      ticketTypeRef.current = ticketType;
      currentTopicRef.current = null;
      isSessionActiveRef.current = true;
      setTranscript([]);
      setLastError(null);
      setState('speaking');

      // Warm up audio on user gesture
      try {
        if ('warmUp' in audioPlayer) {
          await (audioPlayer as { warmUp: () => Promise<void> }).warmUp();
        }
      } catch (err) {
        console.error('[VoiceSession] AudioContext warmup failed:', err);
      }

      // Build greeting — NO Claude API call, just send straight to TTS
      const name = firstName || 'there';
      const isReturning = (totalSessions || 0) > 0;

      const greetingText = isReturning
        ? `Welcome back ${name}. Want to pick up where we left off, or is there a topic you want to focus on today?`
        : `Hi ${name}, welcome to Echo. Shall I fire some questions at you to find your weak spots, or is there a specific topic you want to work on?`;

      console.log('[VoiceSession] Playing hardcoded greeting (no Claude call):', greetingText);

      // Add to transcript immediately
      setTranscript([{ speaker: 'examiner', text: greetingText, timestamp: Date.now() }]);

      // Seed the message history so Claude has context for the next real exchange
      messagesRef.current = [{ role: 'assistant', content: greetingText }];

      try {
        // Send ONLY to TTS — skip Claude entirely
        await playTTS(greetingText);
        console.log('[VoiceSession] Greeting playback complete, listening...');

        if (isSessionActiveRef.current) {
          setState('listening');
          speechRecognition.startListening();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[VoiceSession] Greeting playback error:', errorMsg);
        setLastError(errorMsg);

        // Even if audio fails, still start listening
        if (isSessionActiveRef.current) {
          setState('listening');
          speechRecognition.startListening();
        }
      }
    },
    [playTTS, speechRecognition, audioPlayer]
  );

  const endSession = useCallback(() => {
    isSessionActiveRef.current = false;
    speechRecognition.stopListening();
    stopMicMeter();
    audioPlayer.stop();
    setState('idle');
  }, [speechRecognition, stopMicMeter, audioPlayer]);

  const toggleMic = useCallback(() => {
    if (stateRef.current === 'listening') {
      speechRecognition.stopListening();
      stopMicMeter();
    } else if (stateRef.current === 'idle' && isSessionActiveRef.current) {
      setState('listening');
      speechRecognition.startListening();
    }
  }, [speechRecognition, stopMicMeter]);

  useEffect(() => {
    return () => { isSessionActiveRef.current = false; stopMicMeter(); };
  }, [stopMicMeter]);

  return {
    state,
    transcript,
    interimTranscript: speechRecognition.interimTranscript,
    startSession,
    endSession,
    toggleMic,
    analyserNode: audioPlayer.analyserNode,
    micLevel,
    browserSupported: speechRecognition.browserSupported,
    lastError,
  };
}
