'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TranscriptEntry {
  speaker: 'examiner' | 'candidate';
  text: string;
  timestamp: number;
}

// Browser SpeechRecognition types (not in standard TS lib)
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

interface UseVoiceSessionReturn {
  /** Current state machine position */
  state: SessionState;
  /** Full transcript for UI display */
  transcript: TranscriptEntry[];
  /** Interim (gray) transcript while user is still speaking */
  interimTranscript: string;
  /** Start a new exam session */
  startSession: (ticketType: string) => void;
  /** End the current session */
  endSession: () => void;
  /** Manually toggle the microphone on/off */
  toggleMic: () => void;
  /** AnalyserNode for the TTS output — feed to Orb during SPEAKING */
  analyserNode: AnalyserNode | null;
  /** Microphone input level 0-1 — feed to Orb during LISTENING */
  micLevel: number;
  /** Whether the browser supports SpeechRecognition */
  browserSupported: boolean;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useVoiceSession(): UseVoiceSessionReturn {
  // ---- State ----
  const [state, setState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [browserSupported, setBrowserSupported] = useState(true);

  // ---- Refs (stable across renders) ----
  const messagesRef = useRef<Message[]>([]);
  const ticketTypeRef = useRef<string>('oow-unlimited');
  const stateRef = useRef<SessionState>('idle');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);
  const isSessionActiveRef = useRef(false);
  const finalTranscriptAccumRef = useRef('');

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setBrowserSupported(supported);
  }, []);

  // ------------------------------------------------------------------
  // Microphone level metering (for Orb animation during LISTENING)
  // ------------------------------------------------------------------

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
        // RMS-ish level normalised to 0-1
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        setMicLevel(avg);
        micRafRef.current = requestAnimationFrame(tick);
      };

      micRafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('Could not access microphone for metering:', err);
    }
  }, []);

  const stopMicMeter = useCallback(() => {
    if (micRafRef.current !== null) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (micContextRef.current && micContextRef.current.state !== 'closed') {
      micContextRef.current.close().catch(() => {});
      micContextRef.current = null;
    }
    micAnalyserRef.current = null;
    setMicLevel(0);
  }, []);

  // ------------------------------------------------------------------
  // TTS playback via Web Audio API (gives us an AnalyserNode)
  // ------------------------------------------------------------------

  const playTTS = useCallback(async (text: string): Promise<void> => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`TTS response ${res.status}`);
      }

      const arrayBuf = await res.arrayBuffer();

      // Create / reuse AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));

      // Create nodes
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      sourceNodeRef.current = source;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      // Return a promise that resolves when playback finishes
      return new Promise<void>((resolve) => {
        source.onended = () => {
          sourceNodeRef.current = null;
          analyserRef.current = null;
          setAnalyserNode(null);
          resolve();
        };
        source.start(0);
      });
    } catch (err) {
      console.error('TTS playback failed, falling back to speechSynthesis:', err);

      // Fallback: browser speechSynthesis
      return new Promise<void>((resolve) => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-GB';
          utterance.rate = 1;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      });
    }
  }, []);

  // ------------------------------------------------------------------
  // Send transcript to Claude, get response, play TTS
  // ------------------------------------------------------------------

  const processUserSpeech = useCallback(
    async (userText: string) => {
      if (!userText.trim() || !isSessionActiveRef.current) return;

      // Transition to PROCESSING
      setState('processing');

      // Add user message to the conversation
      const userMsg: Message = { role: 'user', content: userText.trim() };
      messagesRef.current = [...messagesRef.current, userMsg];

      // Add to transcript
      setTranscript((prev) => [
        ...prev,
        { speaker: 'candidate', text: userText.trim(), timestamp: Date.now() },
      ]);
      setInterimTranscript('');

      try {
        // Call Claude
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesRef.current,
            ticketType: ticketTypeRef.current,
          }),
        });

        if (!chatRes.ok) {
          throw new Error(`Chat API ${chatRes.status}`);
        }

        const { text: assistantText } = await chatRes.json();

        // Add assistant message to conversation
        const assistantMsg: Message = { role: 'assistant', content: assistantText };
        messagesRef.current = [...messagesRef.current, assistantMsg];

        // Add to transcript
        setTranscript((prev) => [
          ...prev,
          { speaker: 'examiner', text: assistantText, timestamp: Date.now() },
        ]);

        // Transition to SPEAKING and play TTS
        setState('speaking');
        stopMicMeter();
        await playTTS(assistantText);

        // After audio finishes, auto-transition back to LISTENING
        if (isSessionActiveRef.current) {
          setState('listening');
          startListeningInternal();
        }
      } catch (err) {
        console.error('processUserSpeech error:', err);

        // Add error message to transcript
        const errorText =
          'I apologise, there seems to be a technical issue. Could you repeat that?';
        setTranscript((prev) => [
          ...prev,
          { speaker: 'examiner', text: errorText, timestamp: Date.now() },
        ]);

        // Try to speak the error via fallback
        setState('speaking');
        await playTTS(errorText);

        if (isSessionActiveRef.current) {
          setState('listening');
          startListeningInternal();
        }
      }
    },
    [playTTS, stopMicMeter]
  );

  // ------------------------------------------------------------------
  // Speech Recognition
  // ------------------------------------------------------------------

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // We define startListeningInternal as a ref-based function so it can be
  // called from within processUserSpeech without circular dependency issues.
  const startListeningInternalRef = useRef<() => void>(() => {});

  const startListeningInternal = useCallback(() => {
    startListeningInternalRef.current();
  }, []);

  // Initialise the actual implementation
  useEffect(() => {
    startListeningInternalRef.current = () => {
      if (!browserSupported) return;

      // Reset accumulated final transcript for this listening round
      finalTranscriptAccumRef.current = '';
      setInterimTranscript('');

      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-GB';

      recognition.onstart = () => {
        startMicMeter();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;

          if (result.isFinal) {
            finalChunk += text;
          } else {
            interim += text;
          }
        }

        if (finalChunk) {
          finalTranscriptAccumRef.current += finalChunk;
        }

        // Show current interim + accumulated final as the gray text
        const display = finalTranscriptAccumRef.current + interim;
        setInterimTranscript(display);

        // Reset silence timer on any speech activity
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          // Silence detected — stop recognition
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 2000);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'aborted' and 'no-speech' are expected when stopping
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }
        console.error('SpeechRecognition error:', event.error);
      };

      recognition.onend = () => {
        clearSilenceTimer();
        stopMicMeter();

        const finalText = finalTranscriptAccumRef.current.trim();
        recognitionRef.current = null;

        if (finalText && isSessionActiveRef.current) {
          processUserSpeech(finalText);
        } else if (isSessionActiveRef.current && stateRef.current === 'listening') {
          // No speech detected — restart recognition
          startListeningInternalRef.current();
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start SpeechRecognition:', err);
      }
    };
  }, [browserSupported, clearSilenceTimer, startMicMeter, stopMicMeter, processUserSpeech]);

  const stopListeningInternal = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    stopMicMeter();
    setInterimTranscript('');
  }, [clearSilenceTimer, stopMicMeter]);

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  const startSession = useCallback(
    async (ticketType: string) => {
      // Reset state
      messagesRef.current = [];
      ticketTypeRef.current = ticketType;
      isSessionActiveRef.current = true;
      setTranscript([]);
      setInterimTranscript('');
      setState('processing');

      try {
        // Get the opening question — send an initial user message to satisfy
        // the API's requirement for at least one user message
        const initialMessages: Message[] = [
          {
            role: 'user',
            content:
              'Begin the oral examination. Introduce yourself and ask your first question.',
          },
        ];

        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: initialMessages,
            ticketType,
          }),
        });

        if (!chatRes.ok) {
          throw new Error(`Chat API ${chatRes.status}`);
        }

        const { text: openingText } = await chatRes.json();

        // Store the initial exchange in messages
        messagesRef.current = [
          ...initialMessages,
          { role: 'assistant', content: openingText },
        ];

        // Add to transcript
        setTranscript([
          { speaker: 'examiner', text: openingText, timestamp: Date.now() },
        ]);

        // Speak the opening question
        setState('speaking');
        await playTTS(openingText);

        // After speaking, start listening
        if (isSessionActiveRef.current) {
          setState('listening');
          startListeningInternal();
        }
      } catch (err) {
        console.error('startSession error:', err);
        setState('idle');
        isSessionActiveRef.current = false;

        const errorText =
          'I apologise, there was a technical issue starting the examination. Please try again.';
        setTranscript([
          { speaker: 'examiner', text: errorText, timestamp: Date.now() },
        ]);
      }
    },
    [playTTS, startListeningInternal]
  );

  const endSession = useCallback(() => {
    isSessionActiveRef.current = false;

    // Stop everything
    stopListeningInternal();

    // Stop any playing audio
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // already stopped
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Cancel speech synthesis fallback if running
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setAnalyserNode(null);
    setState('idle');
  }, [stopListeningInternal]);

  const toggleMic = useCallback(() => {
    if (stateRef.current === 'listening') {
      // Stop listening and process whatever we have
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop(); // will trigger onend -> processUserSpeech
      }
    } else if (stateRef.current === 'idle' && isSessionActiveRef.current) {
      setState('listening');
      startListeningInternal();
    }
  }, [clearSilenceTimer, startListeningInternal]);

  // ------------------------------------------------------------------
  // Cleanup on unmount
  // ------------------------------------------------------------------

  useEffect(() => {
    return () => {
      isSessionActiveRef.current = false;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch {
          // already stopped
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      stopMicMeter();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopMicMeter]);

  // ------------------------------------------------------------------
  // Return
  // ------------------------------------------------------------------

  return {
    state,
    transcript,
    interimTranscript,
    startSession,
    endSession,
    toggleMic,
    analyserNode,
    micLevel,
    browserSupported,
  };
}
