'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Browser SpeechRecognition type declarations.
 * The Web Speech API is not yet in the standard TypeScript DOM lib,
 * so we declare the minimal interface we need.
 */
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

interface UseSpeechRecognitionOptions {
  /** Language for recognition (default: 'en-GB') */
  lang?: string;
  /** Auto-stop after this many ms of silence (default: 2000) */
  silenceTimeout?: number;
  /** Called whenever the transcript updates (including interim results) */
  onTranscriptUpdate?: (transcript: string) => void;
  /** Called when recognition ends with a final transcript */
  onFinalTranscript?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  /** The current transcript text (includes interim results) */
  transcript: string;
  /** The finalized transcript from the last recognition session */
  finalTranscript: string;
  /** Whether the recognizer is currently listening */
  isListening: boolean;
  /** Start listening for speech */
  startListening: () => void;
  /** Stop listening for speech */
  stopListening: () => void;
  /** Clear the transcript */
  resetTranscript: () => void;
  /** Whether the browser supports the Web Speech API */
  browserSupported: boolean;
  /** The last error message, if any */
  error: string | null;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'en-GB',
    silenceTimeout = 2000,
    onTranscriptUpdate,
    onFinalTranscript,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppingRef = useRef(false);

  // Store callbacks in refs to avoid re-creating recognition on callback changes
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  onTranscriptUpdateRef.current = onTranscriptUpdate;
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setBrowserSupported(supported);
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after silence
      if (recognitionRef.current && !isStoppingRef.current) {
        isStoppingRef.current = true;
        recognitionRef.current.stop();
      }
    }, silenceTimeout);
  }, [clearSilenceTimer, silenceTimeout]);

  const startListening = useCallback(() => {
    if (!browserSupported) {
      setError(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    setError(null);
    isStoppingRef.current = false;

    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      resetSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      // Reset silence timer on any speech activity
      resetSilenceTimer();

      const currentTranscript = finalText || interimText;
      setTranscript(currentTranscript);
      onTranscriptUpdateRef.current?.(currentTranscript);

      if (finalText) {
        setFinalTranscript(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' and 'no-speech' are expected when stopping
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return;
      }

      const errorMessages: Record<string, string> = {
        'not-allowed':
          'Microphone access denied. Please allow microphone permissions.',
        'network': 'Network error. Speech recognition requires an internet connection.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'service-not-allowed': 'Speech recognition service is not allowed.',
      };

      setError(errorMessages[event.error] ?? `Speech recognition error: ${event.error}`);
      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();

      // Deliver the final transcript
      const current = finalTranscript || transcript;
      if (current && onFinalTranscriptRef.current) {
        onFinalTranscriptRef.current(current);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError(
        `Failed to start speech recognition: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [
    browserSupported,
    lang,
    resetSilenceTimer,
    clearSilenceTimer,
    finalTranscript,
    transcript,
  ]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    isStoppingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  return {
    transcript,
    finalTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupported,
    error,
  };
}
