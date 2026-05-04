import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const maxDuration = 60;

function buildFallback(message: string) {
  return {
    overallScore: 0,
    verdict: "refer" as const,
    examinerJudgement: message,
    confidence: "low" as const,
    sectionBreakdown: [],
    keyMoments: [],
    topThreeDrills: [],
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function deriveVerdict(score: number): "pass" | "marginal" | "refer" {
  if (score >= 75) return "pass";
  if (score >= 60) return "marginal";
  return "refer";
}

export async function POST(req: Request) {
  try {
    const { transcript, ticketType } = await req.json();

    const formattedTranscript = (transcript || [])
      .map(
        (entry: { speaker: string; text: string }) =>
          `${entry.speaker === "examiner" ? "Examiner" : "Candidate"}: ${entry.text}`
      )
      .join("\n\n");

    if (formattedTranscript.length < 50) {
      return Response.json(
        buildFallback("Transcript too short for a meaningful report.")
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `You are an expert maritime oral examination assessor. You have just observed a mock oral examination for a ${ticketType} certificate.

Analyse the transcript below and produce a structured assessment. Be honest, specific, and surgical.

Respond in this exact JSON format (no markdown, no code fences, just raw JSON):
{
  "overallScore": <number 0-100>,
  "verdict": "<pass | marginal | refer>",
  "examinerJudgement": "<one sentence overall judgement>",
  "confidence": "<high | medium | low>",
  "sectionBreakdown": [
    {
      "section": "<section name e.g. COLREGs & Lights>",
      "score": <number 0-100>,
      "questions": [
        { "q": "<the examiner's question>", "performance": "<strong | ok | weak>" }
      ]
    }
  ],
  "keyMoments": [
    {
      "question": "<the examiner's exact question>",
      "studentResponse": "<the candidate's actual words from the transcript>",
      "verdict": "<one-line assessment of the response>",
      "verdictTone": "<good | ok | bad>",
      "modelAnswer": "<2-3 sentence model answer showing what a strong response looks like>"
    }
  ],
  "topThreeDrills": [
    {
      "topicSlug": "<slug from list below>",
      "topicName": "<display name>",
      "reason": "<one sentence explaining why this needs drilling>"
    }
  ]
}

Rules:
- overallScore is 0-100. Verdict: >=75 is "pass", 60-74 is "marginal", <60 is "refer".
- confidence: "high" if exam had 10+ exchanges, "medium" if 5-9, "low" if <5.
- sectionBreakdown: group questions by topic area. Reference actual questions from the transcript.
- keyMoments: pick 2-4 moments. Quote the candidate's actual words. Model answers must be concise.
- topThreeDrills: exactly 3 items. Use these topic slugs ONLY: colregs, navigation, safety, solas, meteorology, stability, marpol, stcw, cargo, gmdss, bridge-equipment, maritime-law.
- If the exam was very short (<5 exchanges), set confidence to "low" and note in examinerJudgement.`,
      messages: [
        {
          role: "user",
          content: `Here is the full examination transcript:\n\n${formattedTranscript}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        buildFallback("Report generation encountered an issue. Please try again.")
      );
    }

    // Validate and normalize
    const overallScore = clamp(
      typeof parsed.overallScore === "number" ? parsed.overallScore : 0,
      0,
      100
    );

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const report = {
      overallScore,
      verdict: deriveVerdict(overallScore),
      examinerJudgement:
        typeof parsed.examinerJudgement === "string"
          ? parsed.examinerJudgement
          : "Assessment complete.",
      confidence:
        (["high", "medium", "low"] as const).includes(parsed.confidence)
          ? (parsed.confidence as "high" | "medium" | "low")
          : "medium",
      sectionBreakdown: Array.isArray(parsed.sectionBreakdown)
        ? parsed.sectionBreakdown.map((s: any) => ({
            section: s.section || "Unknown",
            score: clamp(typeof s.score === "number" ? s.score : 0, 0, 100),
            questions: Array.isArray(s.questions)
              ? s.questions.map((q: any) => ({
                  q: q.q || "",
                  performance:
                    (["strong", "ok", "weak"] as const).includes(q.performance)
                      ? q.performance
                      : "ok",
                }))
              : [],
          }))
        : [],
      keyMoments: Array.isArray(parsed.keyMoments)
        ? parsed.keyMoments.slice(0, 4).map((m: any) => ({
            question: m.question || "",
            studentResponse: m.studentResponse || "",
            verdict: m.verdict || "",
            verdictTone:
              (["good", "ok", "bad"] as const).includes(m.verdictTone)
                ? m.verdictTone
                : "ok",
            modelAnswer: m.modelAnswer || "",
          }))
        : [],
      topThreeDrills: Array.isArray(parsed.topThreeDrills)
        ? parsed.topThreeDrills.slice(0, 3).map((d: any) => ({
            topicSlug: d.topicSlug || "colregs",
            topicName: d.topicName || "COLREGs",
            reason: d.reason || "Needs more practice.",
          }))
        : [],
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return Response.json(report);
  } catch (err) {
    console.error("Report API error:", err);
    return Response.json(
      buildFallback("Report generation failed. Please try again."),
      { status: 500 }
    );
  }
}
