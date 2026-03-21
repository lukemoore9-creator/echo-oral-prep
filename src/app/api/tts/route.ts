import { NextRequest, NextResponse } from 'next/server';
import { streamTTS } from '@/lib/elevenlabs/tts';

interface TTSRequestBody {
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequestBody = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text is required and must be a string' },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 5000 characters' },
        { status: 400 }
      );
    }

    const audioStream = await streamTTS(text);

    return new Response(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    console.error('TTS API error:', err);

    const message =
      err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('environment variable') ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
