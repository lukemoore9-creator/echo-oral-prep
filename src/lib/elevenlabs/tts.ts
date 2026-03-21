/**
 * ElevenLabs Text-to-Speech streaming client
 *
 * Calls the ElevenLabs streaming TTS API and returns a ReadableStream
 * of audio bytes (audio/mpeg).
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

interface TTSOptions {
  /** Override the default voice ID */
  voiceId?: string;
  /** Model to use for synthesis */
  model?: string;
  /** Voice stability (0-1). Lower = more expressive, higher = more consistent */
  stability?: number;
  /** Similarity boost (0-1). Higher = closer to original voice */
  similarityBoost?: number;
}

/**
 * Streams TTS audio from ElevenLabs.
 *
 * @param text - The text to synthesize
 * @param options - Optional TTS configuration overrides
 * @returns A ReadableStream of audio/mpeg bytes
 * @throws Error if API key or voice ID is missing, or if the API request fails
 */
export async function streamTTS(
  text: string,
  options: TTSOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is not set');
  }

  const voiceId = options.voiceId ?? process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error(
      'ELEVENLABS_VOICE_ID environment variable is not set and no voiceId was provided'
    );
  }

  const model = options.model ?? 'eleven_monolingual_v1';
  const stability = options.stability ?? 0.5;
  const similarityBoost = options.similarityBoost ?? 0.75;

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorBody}`
    );
  }

  if (!response.body) {
    throw new Error('ElevenLabs API returned no response body');
  }

  return response.body;
}
