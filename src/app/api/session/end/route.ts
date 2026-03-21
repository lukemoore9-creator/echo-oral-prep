import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SessionExchange } from '@/types';

interface EndSessionBody {
  sessionId: string;
  exchanges: SessionExchange[];
  duration: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EndSessionBody = await request.json();
    const { sessionId, exchanges, duration } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to this user and is active
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existingSession.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (existingSession.status === 'completed') {
      return NextResponse.json(
        { error: 'Session is already completed' },
        { status: 400 }
      );
    }

    // Calculate overall score from exchanges
    const scoredExchanges = exchanges.filter(
      (e) => e.score !== null && e.score !== undefined
    );

    let overallScore: number | null = null;
    if (scoredExchanges.length > 0) {
      const totalScore = scoredExchanges.reduce(
        (sum, e) => sum + (e.score ?? 0),
        0
      );
      overallScore =
        Math.round((totalScore / scoredExchanges.length) * 10) / 10;
    }

    // Calculate topic scores
    const topicScoreMap: Record<string, { total: number; count: number }> = {};

    for (const exchange of scoredExchanges) {
      // Determine the topic from the exchange
      // We look at the examiner question metadata if available, or use exam_topic_id
      const topicKey = exchange.exam_topic_id ?? 'general';
      if (!topicScoreMap[topicKey]) {
        topicScoreMap[topicKey] = { total: 0, count: 0 };
      }
      topicScoreMap[topicKey].total += exchange.score ?? 0;
      topicScoreMap[topicKey].count += 1;
    }

    const topicScores: Record<string, number> = {};
    for (const [topic, data] of Object.entries(topicScoreMap)) {
      topicScores[topic] = Math.round((data.total / data.count) * 10) / 10;
    }

    // Update the session
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        duration_seconds: Math.max(0, Math.round(duration)),
        overall_score: overallScore,
        topic_scores: topicScores,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Insert session exchanges
    if (exchanges.length > 0) {
      const exchangeRows = exchanges.map((e, index) => ({
        session_id: sessionId,
        question_id: e.question_id,
        exam_topic_id: e.exam_topic_id,
        examiner_question: e.examiner_question,
        candidate_answer: e.candidate_answer,
        ai_feedback: e.ai_feedback,
        score: e.score,
        key_points_hit: e.key_points_hit,
        key_points_missed: e.key_points_missed,
        duration_seconds: e.duration_seconds,
        exchange_order: index,
      }));

      const { error: exchangeError } = await supabase
        .from('session_exchanges')
        .insert(exchangeRows);

      if (exchangeError) {
        console.error('Failed to insert exchanges:', exchangeError);
        // Non-fatal: session is updated even if exchange insert fails
      }
    }

    // Update user profile total session minutes
    const sessionMinutes = Math.ceil(duration / 60);
    const { error: profileError } = await supabase.rpc(
      'increment_session_minutes',
      {
        user_id_input: user.id,
        minutes_to_add: sessionMinutes,
      }
    );

    if (profileError) {
      // Non-fatal: log but don't fail the request
      console.error('Failed to update profile minutes:', profileError);
    }

    return NextResponse.json({
      success: true,
      overallScore,
      topicScores,
      totalExchanges: exchanges.length,
      durationSeconds: duration,
    });
  } catch (err) {
    console.error('Session end error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
