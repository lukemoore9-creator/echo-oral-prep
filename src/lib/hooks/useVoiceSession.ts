'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SessionState, TranscriptEntry } from '@/lib/types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { getStructureForTicket, type ExamSection } from '@/lib/exam-structure';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StartSessionOptions {
  drillTopic?: string;
  drillTopicName?: string;
  bridge?: boolean;
}

interface UseVoiceSessionReturn {
  state: SessionState;
  transcript: TranscriptEntry[];
  interimTranscript: string;
  startSession: (ticketType: string, firstName?: string, totalSessions?: number, options?: StartSessionOptions) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  setTicketType: (slug: string) => void;
  setAiMode: (mode: string) => void;
  toggleMic: () => void;
  interrupt: () => void;
  injectUserMessage: (text: string) => void;
  isMuted: boolean;
  isPaused: boolean;
  analyserNode: AnalyserNode | null;
  micLevel: number;
  browserSupported: boolean;
  lastError: string | null;
  currentSectionIndex: number;
  questionsAskedInSection: number;
  examComplete: boolean;
}

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
// TTS: fetch /api/tts → blob → bare Audio element
// TIMEOUT INCREASED TO 30s to prevent cutting off long responses
// ---------------------------------------------------------------------------

async function fetchAndPlayAudio(
  text: string,
  log?: (msg: string) => void,
  audioRef?: { current: HTMLAudioElement | null }
): Promise<void> {
  const l = log || (() => {});

  l('fetching /api/tts...');
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TTS returned ${res.status}: ${body.substring(0, 100)}`);
  }

  const blob = await res.blob();
  l(`TTS audio received: ${blob.size} bytes`);

  if (blob.size < 100) {
    throw new Error(`TTS returned tiny audio (${blob.size} bytes)`);
  }

  const blobUrl = URL.createObjectURL(blob);

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(blobUrl);
    audio.volume = 1;
    if (audioRef) audioRef.current = audio;

    // 30-second timeout — long enough for any reasonable response
    const timeout = setTimeout(() => {
      l('audio timed out after 30s');
      audio.pause();
      URL.revokeObjectURL(blobUrl);
      resolve();
    }, 30000);

    audio.onended = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(blobUrl);
      l('audio playback ended naturally');
      resolve();
    };

    audio.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Audio element playback error'));
    };

    audio.play().catch((err) => {
      clearTimeout(timeout);
      URL.revokeObjectURL(blobUrl);
      reject(err);
    });

    l('audio.play() called');
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [questionsAskedInSection, setQuestionsAskedInSection] = useState(0);
  const [examComplete, setExamComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isMutedRef = useRef(false);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const messagesRef = useRef<Message[]>([]);
  const ticketTypeRef = useRef<string>('oow-unlimited');
  const currentTopicRef = useRef<string | null>(null);
  const stateRef = useRef<SessionState>('idle');
  const isSessionActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const aiModeRef = useRef<string>('examiner');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const examStructureRef = useRef<ExamSection[]>([]);
  const currentSectionIndexRef = useRef(0);
  const questionsAskedInSectionRef = useRef(0);
  const examCompleteRef = useRef(false);
  const isDrillRef = useRef(false);
  const drillTopicRef = useRef<string | null>(null);
  const isBridgeRef = useRef(false);
  const firstNameRef = useRef<string>('');

  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

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
      console.warn('[Voice] Mic metering failed:', err);
    }
  }, []);

  const stopMicMeter = useCallback(() => {
    if (micRafRef.current !== null) { cancelAnimationFrame(micRafRef.current); micRafRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
    if (micContextRef.current && micContextRef.current.state !== 'closed') { micContextRef.current.close().catch(() => {}); micContextRef.current = null; }
    micAnalyserRef.current = null;
    setMicLevel(0);
  }, []);

  // ------------------------------------------------------------------
  // Advance question / section tracking
  // ------------------------------------------------------------------

  const advanceQuestion = useCallback(() => {
    const structure = examStructureRef.current;
    if (examCompleteRef.current || structure.length === 0) return;

    const newCount = questionsAskedInSectionRef.current + 1;
    const section = structure[currentSectionIndexRef.current];

    if (newCount >= section.questionCount) {
      const nextIndex = currentSectionIndexRef.current + 1;
      if (nextIndex >= structure.length) {
        examCompleteRef.current = true;
        setExamComplete(true);
        questionsAskedInSectionRef.current = newCount;
        setQuestionsAskedInSection(newCount);
      } else {
        currentSectionIndexRef.current = nextIndex;
        questionsAskedInSectionRef.current = 0;
        setCurrentSectionIndex(nextIndex);
        setQuestionsAskedInSection(0);
      }
    } else {
      questionsAskedInSectionRef.current = newCount;
      setQuestionsAskedInSection(newCount);
    }
  }, []);

  // ------------------------------------------------------------------
  // Process user speech
  // ------------------------------------------------------------------

  const processUserSpeechRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    processUserSpeechRef.current = async (userText: string) => {
      if (!userText.trim() || !isSessionActiveRef.current || isPausedRef.current) return;

      const t0 = Date.now();
      const log = (msg: string) => console.log(`[Voice] +${Date.now() - t0}ms ${msg}`);

      log('speech complete, sending to chat API');
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
        log('fetching /api/chat...');
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesRef.current,
            ticketType: ticketTypeRef.current,
            currentTopic: currentTopicRef.current,
            mode: aiModeRef.current,
            sectionName: examStructureRef.current[currentSectionIndexRef.current]?.name || '',
            sectionQuestionNumber: questionsAskedInSectionRef.current + 1,
            sectionQuestionTotal: examStructureRef.current[currentSectionIndexRef.current]?.questionCount || 0,
            isExamComplete: examCompleteRef.current,
            isDrill: isDrillRef.current,
            drillTopic: drillTopicRef.current,
            isBridge: isBridgeRef.current,
            firstName: firstNameRef.current,
          }),
        });

        log(`chat response received, status: ${chatRes.status}`);
        if (!chatRes.ok) throw new Error(`Chat API returned ${chatRes.status}`);

        const fullText = await chatRes.text();
        log(`full response text received: ${fullText.length} chars`);

        const detected = detectTopic(fullText);
        if (detected) currentTopicRef.current = detected;

        messagesRef.current = [...messagesRef.current, { role: 'assistant', content: fullText }];

        setTranscript((prev) => [
          ...prev,
          { speaker: 'examiner', text: fullText, timestamp: Date.now() },
        ]);

        setState('speaking');
        await fetchAndPlayAudio(fullText, log, currentAudioRef);
        log('TTS playback complete');
        advanceQuestion();

        if (isSessionActiveRef.current && !isPausedRef.current && !isMutedRef.current) {
          setState('listening');
          speechRecognition.startListening();
          log('mic reopened, listening');
        } else if (isMutedRef.current) {
          setState('idle');
          log('mic muted, waiting for unmute');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        log(`ERROR: ${errorMsg}`);
        setLastError(errorMsg);

        setTranscript((prev) => [...prev, {
          speaker: 'examiner',
          text: 'Sorry, there was a technical issue. Could you repeat that?',
          timestamp: Date.now(),
        }]);

        if (isSessionActiveRef.current && !isPausedRef.current && !isMutedRef.current) {
          setState('listening');
          speechRecognition.startListening();
        } else if (isMutedRef.current) {
          setState('idle');
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopMicMeter]);

  const handleSpeechComplete = useCallback((text: string) => {
    processUserSpeechRef.current(text);
  }, []);

  // SILENCE TIMEOUT: 2500ms — gives the user time to think and complete their answer
  // This is a real exam conversation, not a command interface
  const speechRecognition = useSpeechRecognition({
    onSpeechComplete: handleSpeechComplete,
    onListeningStart: startMicMeter,
    lang: 'en-GB',
    silenceTimeout: 2500,
  });

  // ------------------------------------------------------------------
  // START SESSION
  // ------------------------------------------------------------------

  const startSession = useCallback(
    async (ticketType: string, firstName?: string, totalSessions?: number, options?: StartSessionOptions) => {
      const t0 = Date.now();
      const log = (msg: string) => console.log(`[Voice:greeting] +${Date.now() - t0}ms ${msg}`);

      messagesRef.current = [];
      ticketTypeRef.current = ticketType;
      currentTopicRef.current = options?.drillTopic || null;
      isSessionActiveRef.current = true;
      isPausedRef.current = false;
      isDrillRef.current = !!options?.drillTopic;
      drillTopicRef.current = options?.drillTopic || null;
      isBridgeRef.current = !!options?.bridge;
      firstNameRef.current = firstName || '';

      if (options?.drillTopic) {
        examStructureRef.current = [{
          id: options.drillTopic,
          name: options.drillTopicName || options.drillTopic,
          questionCount: 999,
          topics: [options.drillTopic],
        }];
      } else {
        examStructureRef.current = getStructureForTicket(ticketType);
      }

      currentSectionIndexRef.current = 0;
      questionsAskedInSectionRef.current = 0;
      examCompleteRef.current = false;
      setCurrentSectionIndex(0);
      setQuestionsAskedInSection(0);
      setExamComplete(false);
      setTranscript([]);
      setLastError(null);
      setState('speaking');

      const name = firstName || 'there';
      const isReturning = (totalSessions || 0) > 0;
      let greetingText: string;

      if (options?.bridge && options?.drillTopic) {
        const topicDisplay = options.drillTopicName || options.drillTopic;
        greetingText = `Right ${name}, let's rattle through some ${topicDisplay}. Quick fire, ten minutes. Ready when you are.`;
      } else if (options?.bridge) {
        greetingText = `Step onto the bridge, ${name}. What do you want to chat about?`;
      } else if (options?.drillTopic) {
        const topicDisplay = options.drillTopicName || options.drillTopic;
        greetingText = `Right, let's drill ${topicDisplay}. I'll fire questions at you for the next ten minutes. Ready when you are.`;
      } else {
        greetingText = isReturning
          ? `Welcome back ${name}. Want to pick up where we left off, or is there a topic you want to focus on today?`
          : `Hi ${name}, welcome to Echo. Shall I fire some questions at you to find your weak spots, or is there a specific topic you want to work on?`;
      }

      setTranscript([{ speaker: 'examiner', text: greetingText, timestamp: Date.now() }]);
      messagesRef.current = [{ role: 'assistant', content: greetingText }];

      log('greeting text ready, fetching TTS');

      try {
        await fetchAndPlayAudio(greetingText, log, currentAudioRef);
        log('greeting playback complete');
      } catch (err) {
        log('TTS greeting failed: ' + err + ', trying static MP3');
        // TODO: re-record greeting-first.mp3 and greeting-returning.mp3 to use Echo persona consistently.
        try {
          const audioUrl = isReturning ? '/audio/greeting-returning.mp3' : '/audio/greeting-first.mp3';
          const audio = new Audio(audioUrl);
          audio.volume = 1;
          await audio.play();
          await new Promise<void>((resolve) => {
            audio.onended = () => resolve();
            setTimeout(() => { audio.pause(); resolve(); }, 10000);
          });
          log('static fallback complete');
        } catch (fallbackErr) {
          log('static fallback also failed: ' + fallbackErr);
        }
      }

      if (isSessionActiveRef.current && !isPausedRef.current) {
        setState('listening');
        speechRecognition.startListening();
        log('listening started');
      }
    },
    [speechRecognition]
  );

  // ------------------------------------------------------------------
  // PAUSE / RESUME
  // ------------------------------------------------------------------

  const pauseSession = useCallback(() => {
    console.log('[Voice] pauseSession: mic fully stopped');
    isPausedRef.current = true;
    setIsPaused(true);
    speechRecognition.disableAutoRestart();
    speechRecognition.stopListening();
    stopMicMeter();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  }, [speechRecognition, stopMicMeter]);

  const resumeSession = useCallback(() => {
    console.log('[Voice] resumeSession called, isSessionActive:', isSessionActiveRef.current);
    if (!isSessionActiveRef.current) {
      console.warn('[Voice] resumeSession: session not active, cannot resume');
      return;
    }
    isPausedRef.current = false;
    setIsPaused(false);
    speechRecognition.enableAutoRestart();
    setTimeout(() => {
      if (isSessionActiveRef.current && !isPausedRef.current) {
        console.log('[Voice] resumeSession: restarting listening');
        setState('listening');
        startMicMeter();
        speechRecognition.startListening();
      }
    }, 500);
  }, [speechRecognition, startMicMeter]);

  // ------------------------------------------------------------------
  // END / TOGGLE
  // ------------------------------------------------------------------

  const endSession = useCallback(() => {
    isSessionActiveRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsMuted(false);
    isMutedRef.current = false;
    isDrillRef.current = false;
    drillTopicRef.current = null;
    isBridgeRef.current = false;
    firstNameRef.current = '';
    speechRecognition.stopListening();
    stopMicMeter();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  }, [speechRecognition, stopMicMeter]);

  const setTicketType = useCallback((slug: string) => {
    ticketTypeRef.current = slug;
  }, []);

  const setAiMode = useCallback((mode: string) => {
    aiModeRef.current = mode;
  }, []);

  const toggleMic = useCallback(() => {
    const next = !isMutedRef.current;
    setIsMuted(next);
    isMutedRef.current = next;
    if (next) {
      // Going to muted
      speechRecognition.stopListening();
      stopMicMeter();
      if (stateRef.current === 'listening') setState('idle');
    } else {
      // Unmuting
      if (isSessionActiveRef.current && !isPausedRef.current && stateRef.current !== 'speaking' && stateRef.current !== 'processing') {
        setState('listening');
        startMicMeter();
        speechRecognition.startListening();
      }
    }
  }, [speechRecognition, startMicMeter, stopMicMeter]);

  const interrupt = useCallback(() => {
    if (stateRef.current !== 'speaking') return;
    console.log('[Voice] interrupt called');
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (isSessionActiveRef.current && !isPausedRef.current && !isMutedRef.current) {
      setState('listening');
      startMicMeter();
      speechRecognition.startListening();
    } else {
      setState('idle');
    }
  }, [speechRecognition, startMicMeter]);

  const injectUserMessage = useCallback((text: string) => {
    if (!text.trim() || !isSessionActiveRef.current || isPausedRef.current) return;
    processUserSpeechRef.current(text);
  }, []);

  useEffect(() => {
    return () => { isSessionActiveRef.current = false; stopMicMeter(); };
  }, [stopMicMeter]);

  return {
    state,
    transcript,
    interimTranscript: speechRecognition.interimTranscript,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    setTicketType,
    setAiMode,
    toggleMic,
    interrupt,
    injectUserMessage,
    isMuted,
    isPaused,
    analyserNode: null,
    micLevel,
    browserSupported: speechRecognition.browserSupported,
    lastError,
    currentSectionIndex,
    questionsAskedInSection,
    examComplete,
  };
}
