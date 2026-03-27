import fs from "fs";
import path from "path";

// Read .env.local manually (avoid dotenv dependency)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "L0Dsvb3SLTyegXwtm47J";
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env.local");
  process.exit(1);
}

const GREETINGS: { name: string; text: string }[] = [
  {
    name: "greeting-first",
    text: "Hi there, welcome to Echo. Shall I fire some questions at you to find your weak spots, or is there a specific topic you want to focus on?",
  },
  {
    name: "greeting-returning",
    text: "Welcome back. Want to pick up where we left off, or tackle something different today?",
  },
];

async function generateAudio(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?optimize_streaming_latency=4&output_format=mp3_22050_32`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "audio");
  fs.mkdirSync(outDir, { recursive: true });

  for (const { name, text } of GREETINGS) {
    console.log(`Generating ${name}...`);
    const audio = await generateAudio(text);
    const outPath = path.join(outDir, `${name}.mp3`);
    fs.writeFileSync(outPath, audio);
    console.log(`  Saved ${outPath} (${audio.byteLength} bytes)`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
