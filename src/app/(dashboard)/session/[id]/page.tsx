import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VoiceSession } from '@/components/voice/VoiceSession';
import type { Session } from '@/types';

interface SessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ topic?: string }>;
}

export default async function SessionPage({
  params,
  searchParams,
}: SessionPageProps) {
  const { id } = await params;
  const { topic } = await searchParams;

  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch session with ticket type info
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(
      `
      *,
      ticket_type:ticket_types(*)
    `
    )
    .eq('id', id)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  // Validate that this session belongs to the authenticated user
  if (session.user_id !== user.id) {
    notFound();
  }

  // Validate the session is in a usable state
  if (session.status === 'completed') {
    redirect(`/dashboard/session/${id}/review`);
  }

  const typedSession = session as Session;

  return <VoiceSession session={typedSession} topicFocus={topic} />;
}
