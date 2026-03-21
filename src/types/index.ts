export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_tier: 'free' | 'basic' | 'pro';
  subscription_status: string;
  total_session_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category: 'commercial' | 'yachting' | 'engineering';
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ExamTopic {
  id: string;
  ticket_type_id: string;
  name: string;
  description: string | null;
  weight: number;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  exam_topic_id: string;
  question_text: string;
  expected_answer_points: string[] | null;
  difficulty: number;
  examiner_hint: string | null;
  source: string | null;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  ticket_type_id: string;
  exam_topic_id: string;
  title: string;
  content: string;
  content_type: 'text' | 'markdown' | 'html';
  source_reference: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  ticket_type_id: string;
  mode: 'practice' | 'mock_exam' | 'topic_drill';
  status: 'active' | 'completed' | 'abandoned';
  duration_seconds: number;
  overall_score: number | null;
  topic_scores: Record<string, number> | null;
  started_at: string;
  ended_at: string | null;
  ticket_type?: TicketType;
}

export interface SessionExchange {
  id: string;
  session_id: string;
  question_id: string | null;
  exam_topic_id: string | null;
  examiner_question: string;
  candidate_answer: string | null;
  ai_feedback: string | null;
  score: number | null;
  key_points_hit: string[] | null;
  key_points_missed: string[] | null;
  duration_seconds: number | null;
  exchange_order: number;
  created_at: string;
}

export interface ExaminerResponse {
  type: 'question' | 'feedback' | 'summary';
  message: string;
  topic: string;
  score: number | null;
  key_points_hit: string[];
  key_points_missed: string[];
  difficulty: number;
  next_action: 'ask_question' | 'probe_deeper' | 'change_topic' | 'end_session';
}

export type VoiceSessionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused';

export interface ConversationMessage {
  role: 'examiner' | 'candidate';
  content: string;
  timestamp: number;
  examinerData?: ExaminerResponse;
}
