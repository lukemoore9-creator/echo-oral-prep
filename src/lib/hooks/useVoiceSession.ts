'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useAudioPlayer } from './useAudioPlayer';
import { useSessionStore } from '@/lib/store/sessionStore';
import type {
  ConversationMessage,
  ExaminerResponse,
  VoiceSessionState,
  SessionExchange,
} from '@/types';

interface UseVoiceSessionOptions {
  /** Called when the session ends */
  onSessionEnd?: (exchanges: SessionExchange[]) => void;
}

interface UseVoiceSessionReturn {
  /** Current voice state */
  voiceState: VoiceSessionState;
  /** Full conversation messages */
  messages: ConversationMessage[];
  /** Start a new exam session */
  startSession: (sessionId: string, ticketType: string, topicFocus?: string) => void;
  /** End the current session */
  endSession: () => void;
  /** Manually toggle listening on/off */
  toggleListening: () => void;
  /** Overall score */
  overallScore: number | null;
  /** Per-topic scores */
  topicScores: Map<string, { topic: string; average: number; count: number }>;
  /** Current topic being examined */
  currentTopic: string | null;
  /** Whether the session is active */
  isSessionActive: boolean;
  /** Whether the browser supports speech recognition */
  browserSupported: boolean;
  /** Any speech recognition error */
  speechError: string | null;
  /** Number of exchanges so far */
  exchangeCount: number;
}

/**
 * Main voice orchestration hook.
 *
 * Manages the full voice loop:
 *   IDLE -> LISTENING -> PROCESSING -> SPEAKING -> LISTENING -> ...
 *
 * Uses useSpeechRecognition for STT, useAudioPlayer for TTS playback,
 * and the Zustand sessionStore for state management.
 */
export function useVoiceSession(
  options: UseVoiceSessionOptions = {}
): UseVoiceSessionReturn {
  const { onSessionEnd } = options;
  const onSessionEndRef = useRef(onSessionEnd);
  onSessionEndRef.current = onSessionEnd;

  // Store
  const {
    voiceState,
    messages,
    currentTopic,
    topicScores,
    overallScore,
    sessionId,
    ticketType,
    topicFocus,
    isSessionActive,
    exchangeCount,
    setVoiceState,
    addMessage,
    updateScores,
    startSession: storeStartSession,
    endSession: storeEndSession,
    getTopicScoresRecord,
  } = useSessionStore();

  // Refs for latest values in callbacks
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const ticketTypeRef = useRef(ticketType);
  ticketTypeRef.current = ticketType;
  const topicFocusRef = useRef(topicFocus);
  topicFocusRef.current = topicFocus;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const isSessionActiveRef = useRef(isSessionActive);
  isSessionActiveRef.current = isSessionActive;

  /**
   * Process the candidate's transcript:
   * 1. Send to /api/chat to get examiner response
   * 2. Parse the examiner's JSON response
   * 3. Send to /api/tts to get audio
   * 4. Play the audio
   */
  const processTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || !isSessionActiveRef.current) return;

      setVoiceState('processing');

      // Add candidate message
      const candidateMessage: ConversationMessage = {
        role: 'candidate',
        content: transcript.trim(),
        timestamp: Date.now(),
      };
      addMessage(candidateMessage);

      try {
        // Build messages for Claude (convert to the format the API expects)
        const conversationMessages = [
          ...messagesRef.current,
          candidateMessage,
        ];

        // Call examiner API
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationMessages,
            ticketType: ticketTypeRef.current,
            topicFocus: topicFocusRef.current,
          }),
        });

        if (!chatResponse.ok) {
          throw new Error(`Chat API error: ${chatResponse.status}`);
        }

        const responseText = await chatResponse.text();

        // Parse the examiner response JSON
        // Claude may wrap it in markdown code blocks, so we handle that
        let examinerData: ExaminerResponse;
        try {
          // Try direct parse first
          examinerData = JSON.parse(responseText);
        } catch {
          // Try extracting from markdown code block
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch?.[1]) {
            examinerData = JSON.parse(jsonMatch[1].trim());
          } else {
            // Try finding a JSON object in the text
            const objectMatch = responseText.match(/\{[\s\S]*\}/);
            if (objectMatch) {
              examinerData = JSON.parse(objectMatch[0]);
            } else {
              throw new Error('Could not parse examiner response as JSON');
            }
          }
        }

        // Add examiner message
        const examinerMessage: ConversationMessage = {
          role: 'examiner',
          content: examinerData.message,
          timestamp: Date.now(),
          examinerData,
        };
        addMessage(examinerMessage);
        updateScores(examinerData);

        // Check if session should end
        if (examinerData.next_action === 'end_session') {
          await handleEndSession();
          return;
        }

        // Get TTS audio
        setVoiceState('speaking');

        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: examinerData.message }),
        });

        if (!ttsResponse.ok) {
          throw new Error(`TTS API error: ${ttsResponse.status}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        await play(audioBuffer);
      } catch (err) {
        console.error('Voice session error:', err);
        setVoiceState('idle');

        // Add an error message so the user knows something went wrong
        addMessage({
          role: 'examiner',
          content:
            'I apologise, there seems to be a technical issue. Could you repeat that?',
          timestamp: Date.now(),
        });
      }
    },
    [setVoiceState, addMessage, updateScores]
  );

  // Audio player — when audio ends, start listening again
  const { isPlaying, play, stop: stopAudio } = useAudioPlayer({
    onEnd: useCallback(() => {
      if (isSessionActiveRef.current) {
        setVoiceState('listening');
        startListeningFn.current?.();
      }
    }, [setVoiceState]),
  });

  // Speech recognition
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupported,
    error: speechError,
  } = useSpeechRecognition({
    lang: 'en-GB',
    silenceTimeout: 2000,
    onFinalTranscript: useCallback(
      (finalText: string) => {
        if (finalText.trim()) {
          processTranscript(finalText);
        }
      },
      [processTranscript]
    ),
  });

  // Store startListening in a ref so onEnd callback can access it
  const startListeningFn = useRef<(() => void) | null>(null);
  startListeningFn.current = startListening;

  // Sync listening state to store
  useEffect(() => {
    if (isListening && voiceState !== 'listening') {
      setVoiceState('listening');
    }
  }, [isListening, voiceState, setVoiceState]);

  // Sync playing state to store
  useEffect(() => {
    if (isPlaying && voiceState !== 'speaking') {
      setVoiceState('speaking');
    }
  }, [isPlaying, voiceState, setVoiceState]);

  /**
   * Handle ending the session — save exchanges, update Supabase.
   */
  const handleEndSession = useCallback(async () => {
    storeEndSession();
    stopListening();
    stopAudio();

    // Build session exchanges from messages
    const exchanges: SessionExchange[] = [];
    let exchangeOrder = 0;

    for (let i = 0; i < messagesRef.current.length; i++) {
      const msg = messagesRef.current[i];
      if (msg.role === 'examiner' && msg.examinerData) {
        // Find the preceding candidate answer
        const prevMsg =
          i > 0 ? messagesRef.current[i - 1] : null;
        const candidateAnswer =
          prevMsg?.role === 'candidate' ? prevMsg.content : null;

        exchanges.push({
          id: '', // Will be assigned by DB
          session_id: sessionIdRef.current ?? '',
          question_id: null,
          exam_topic_id: null,
          examiner_question: msg.content,
          candidate_answer: candidateAnswer,
          ai_feedback: msg.examinerData.type === 'feedback' ? msg.content : null,
          score: msg.examinerData.score,
          key_points_hit: msg.examinerData.key_points_hit,
          key_points_missed: msg.examinerData.key_points_missed,
          duration_seconds: null,
          exchange_order: exchangeOrder++,
          created_at: new Date(msg.timestamp).toISOString(),
        });
      }
    }

    // Call session end API
    if (sessionIdRef.current) {
      try {
        await fetch('/api/session/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            exchanges,
            duration: Math.floor(
              (Date.now() -
                (messagesRef.current[0]?.timestamp ?? Date.now())) /
                1000
            ),
          }),
        });
      } catch (err) {
        console.error('Failed to save session:', err);
      }
    }

    onSessionEndRef.current?.(exchanges);
  }, [storeEndSession, stopListening, stopAudio]);

  /**
   * Start a new exam session.
   * Initializes the store and sends the first request to get the opening question.
   */
  const startSession = useCallback(
    async (sessionId: string, ticketType: string, topicFocus?: string) => {
      storeStartSession({ sessionId, ticketType, topicFocus });
      setVoiceState('processing');

      try {
        // Get the opening question from the examiner
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            ticketType,
            topicFocus,
          }),
        });

        if (!chatResponse.ok) {
          throw new Error(`Chat API error: ${chatResponse.status}`);
        }

        const responseText = await chatResponse.text();

        let examinerData: ExaminerResponse;
        try {
          examinerData = JSON.parse(responseText);
        } catch {
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch?.[1]) {
            examinerData = JSON.parse(jsonMatch[1].trim());
          } else {
            const objectMatch = responseText.match(/\{[\s\S]*\}/);
            if (objectMatch) {
              examinerData = JSON.parse(objectMatch[0]);
            } else {
              throw new Error('Could not parse examiner response');
            }
          }
        }

        // Add the opening message
        const examinerMessage: ConversationMessage = {
          role: 'examiner',
          content: examinerData.message,
          timestamp: Date.now(),
          examinerData,
        };
        addMessage(examinerMessage);

        // Play TTS for the opening question
        setVoiceState('speaking');

        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: examinerData.message }),
        });

        if (!ttsResponse.ok) {
          throw new Error(`TTS API error: ${ttsResponse.status}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        await play(audioBuffer);
      } catch (err) {
        console.error('Failed to start session:', err);
        setVoiceState('idle');
        addMessage({
          role: 'examiner',
          content:
            'I apologise, there was a technical issue starting the examination. Please try again.',
          timestamp: Date.now(),
        });
      }
    },
    [storeStartSession, setVoiceState, addMessage, play]
  );

  /**
   * Toggle listening on/off manually.
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      // Process whatever transcript we have
      if (transcript.trim()) {
        processTranscript(transcript);
      }
    } else if (voiceState === 'idle' || voiceState === 'paused') {
      resetTranscript();
      startListening();
    }
  }, [
    isListening,
    stopListening,
    startListening,
    resetTranscript,
    transcript,
    voiceState,
    processTranscript,
  ]);

  return {
    voiceState,
    messages,
    startSession,
    endSession: handleEndSession,
    toggleListening,
    overallScore,
    topicScores,
    currentTopic,
    isSessionActive,
    browserSupported,
    speechError,
    exchangeCount,
  };
}
