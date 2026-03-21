import { create } from 'zustand';
import type {
  VoiceSessionState,
  ConversationMessage,
  ExaminerResponse,
} from '@/types';

interface TopicScore {
  topic: string;
  totalScore: number;
  count: number;
  average: number;
}

interface SessionState {
  /** Current voice interaction state */
  voiceState: VoiceSessionState;
  /** Full conversation history */
  messages: ConversationMessage[];
  /** The current topic being examined */
  currentTopic: string | null;
  /** Accumulated scores by topic */
  topicScores: Map<string, TopicScore>;
  /** Overall average score across all scored exchanges */
  overallScore: number | null;
  /** Active session ID from Supabase */
  sessionId: string | null;
  /** The ticket type slug for this session */
  ticketType: string | null;
  /** Optional topic focus requested by the candidate */
  topicFocus: string | null;
  /** Whether a session is currently active */
  isSessionActive: boolean;
  /** Total number of exchanges */
  exchangeCount: number;
}

interface SessionActions {
  /** Update the voice interaction state */
  setVoiceState: (state: VoiceSessionState) => void;
  /** Add a message to the conversation */
  addMessage: (message: ConversationMessage) => void;
  /** Update scores from an examiner response */
  updateScores: (response: ExaminerResponse) => void;
  /** Start a new session */
  startSession: (params: {
    sessionId: string;
    ticketType: string;
    topicFocus?: string;
  }) => void;
  /** End the current session */
  endSession: () => void;
  /** Reset all state */
  reset: () => void;
  /** Get topic scores as a plain object (for serialization) */
  getTopicScoresRecord: () => Record<string, number>;
}

const initialState: SessionState = {
  voiceState: 'idle',
  messages: [],
  currentTopic: null,
  topicScores: new Map(),
  overallScore: null,
  sessionId: null,
  ticketType: null,
  topicFocus: null,
  isSessionActive: false,
  exchangeCount: 0,
};

export const useSessionStore = create<SessionState & SessionActions>(
  (set, get) => ({
    ...initialState,

    setVoiceState: (voiceState) => set({ voiceState }),

    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message],
        exchangeCount:
          message.role === 'candidate'
            ? state.exchangeCount + 1
            : state.exchangeCount,
      })),

    updateScores: (response) =>
      set((state) => {
        const newTopicScores = new Map(state.topicScores);

        if (response.score !== null && response.topic) {
          const existing = newTopicScores.get(response.topic) ?? {
            topic: response.topic,
            totalScore: 0,
            count: 0,
            average: 0,
          };

          const updated = {
            ...existing,
            totalScore: existing.totalScore + response.score,
            count: existing.count + 1,
            average:
              (existing.totalScore + response.score) / (existing.count + 1),
          };

          newTopicScores.set(response.topic, updated);
        }

        // Calculate overall average
        let totalScore = 0;
        let totalCount = 0;
        newTopicScores.forEach((ts) => {
          totalScore += ts.totalScore;
          totalCount += ts.count;
        });

        return {
          topicScores: newTopicScores,
          currentTopic: response.topic ?? state.currentTopic,
          overallScore: totalCount > 0 ? totalScore / totalCount : null,
        };
      }),

    startSession: ({ sessionId, ticketType, topicFocus }) =>
      set({
        ...initialState,
        sessionId,
        ticketType,
        topicFocus: topicFocus ?? null,
        isSessionActive: true,
        voiceState: 'idle',
      }),

    endSession: () =>
      set({
        isSessionActive: false,
        voiceState: 'idle',
      }),

    reset: () => set({ ...initialState }),

    getTopicScoresRecord: () => {
      const scores: Record<string, number> = {};
      get().topicScores.forEach((ts, topic) => {
        scores[topic] = Math.round(ts.average * 10) / 10;
      });
      return scores;
    },
  })
);
