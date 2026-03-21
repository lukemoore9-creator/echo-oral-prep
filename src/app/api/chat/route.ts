import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildExaminerSystemPrompt } from '@/lib/claude/examiner';
import type { ConversationMessage } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatRequestBody {
  messages: ConversationMessage[];
  ticketType: string;
  topicFocus?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, ticketType, topicFocus } = body;

    if (!ticketType) {
      return NextResponse.json(
        { error: 'ticketType is required' },
        { status: 400 }
      );
    }

    // Build the system prompt
    const systemPrompt = buildExaminerSystemPrompt(ticketType, topicFocus);

    // Convert our ConversationMessage[] to Anthropic message format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
      role: msg.role === 'examiner' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // If there are no messages yet, we need to prompt Claude for the opening question.
    // Anthropic requires at least one user message, so we add a system-level instruction.
    if (anthropicMessages.length === 0) {
      anthropicMessages.push({
        role: 'user',
        content:
          'Begin the oral examination. Introduce yourself and ask your first question.',
      });
    }

    // Stream the response from Claude
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Collect the full streamed response text
    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                new TextEncoder().encode(event.delta.text)
              );
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);

    const message =
      err instanceof Error ? err.message : 'Internal server error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
