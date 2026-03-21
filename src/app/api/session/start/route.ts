import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface StartSessionBody {
  ticketTypeId: string;
  mode: 'practice' | 'mock_exam' | 'topic_drill';
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

    const body: StartSessionBody = await request.json();
    const { ticketTypeId, mode } = body;

    if (!ticketTypeId) {
      return NextResponse.json(
        { error: 'ticketTypeId is required' },
        { status: 400 }
      );
    }

    if (!mode || !['practice', 'mock_exam', 'topic_drill'].includes(mode)) {
      return NextResponse.json(
        { error: 'mode must be one of: practice, mock_exam, topic_drill' },
        { status: 400 }
      );
    }

    // Verify the ticket type exists and is active
    const { data: ticketType, error: ticketError } = await supabase
      .from('ticket_types')
      .select('id, is_active')
      .eq('id', ticketTypeId)
      .single();

    if (ticketError || !ticketType) {
      return NextResponse.json(
        { error: 'Invalid ticket type' },
        { status: 400 }
      );
    }

    if (!ticketType.is_active) {
      return NextResponse.json(
        { error: 'This ticket type is currently unavailable' },
        { status: 400 }
      );
    }

    // Create the session
    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        ticket_type_id: ticketTypeId,
        mode,
        status: 'active',
        duration_seconds: 0,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (err) {
    console.error('Session start error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
