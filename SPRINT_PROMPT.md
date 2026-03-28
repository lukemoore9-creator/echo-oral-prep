THREE THINGS TO DO. Read all three before starting.

PART 1 — SLIM DOWN COURSE FILES AND FIX SPEED

The course files in src/data/courses/oow-unlimited/ are 7-10KB each (96KB total). Combined with 83KB of question files, that's 180KB being loaded into the system prompt. This is why responses take 36 seconds.

Claude already knows COLREGS, SOLAS, STCW, MARPOL, and all maritime content from its training data. We do NOT need to teach it this. The course files should only contain things Claude DOESN'T know: exam-specific focus areas, common traps, and cross-references.

REWRITE every course file in src/data/courses/oow-unlimited/ to be SHORT — maximum 1500 characters each. Each file should contain ONLY:

1. Two sentences: what this topic covers and why it matters for the exam
2. Three to five bullet points: key exam focus areas examiners care about most
3. Three to five bullet points: common candidate mistakes and traps
4. Cross-references to related topics (one line each)

That's it. No regulation text. No definitions. No textbook content. Claude already knows all of that.

Example — colregs.md should look like this:

# COLREGS — OOW Exam Focus

COLREGS is the most heavily examined topic and is always covered first. Examiners expect both rule knowledge and practical application in scenarios.

KEY EXAM AREAS:
- Rules 5-8 (lookout, safe speed, risk of collision, action to avoid)
- Rules 13-15 (overtaking, head-on, crossing) — scenario questions are common
- Rule 19 (restricted visibility) — often tested with radar screen scenarios
- Lights and shapes identification — visual questions are pass/fail critical
- Rule 18 hierarchy of responsibilities between vessel types

COMMON MISTAKES:
- Forgetting "by hearing" in Rule 5 lookout definition
- Not knowing the difference between Rules 12-18 (in sight) and Rule 19 (not in sight)
- Giving flashcard answers without practical application
- Confusing NUC lights (two red) with RAM lights (red-white-red)
- Not knowing sound signals for restricted visibility

CROSS-REFERENCES:
- Lights and shapes visual identification: see bridge-equipment
- Radar plotting for Rule 19: see bridge-equipment
- Navigation in narrow channels (Rule 9): see navigation

Do this for ALL 12 files. Keep every file under 1500 characters.

The question JSON files should NOT change. They are the valuable content. But the prompt builder should ONLY load questions for the CURRENT topic being discussed, never all 12 at once.

Update src/lib/prompts.ts — buildExaminerPrompt:
- If no topic specified: load NO course content and NO questions. Just the base examiner prompt + student context. This is for the opening greeting.
- If topic specified: load ONLY that topic's course .md file and question .json file.
- NEVER load all 12 topics at once. Delete any code that does this.

Update src/app/api/chat/route.ts:
- Accept optional currentTopic from the request body
- Pass it to buildExaminerPrompt
- Log: console.log('[Chat] Prompt: ' + systemPrompt.length + ' chars, topic: ' + (currentTopic || 'none'))

Update src/lib/hooks/useVoiceSession.ts:
- Add currentTopicRef to track which topic the AI is currently examining
- After each AI response, detect the topic using keyword matching:
  const TOPIC_KEYWORDS = { 'colreg': 'colregs', 'rule ': 'colregs', 'collision': 'colregs', 'navigation': 'navigation', 'passage plan': 'navigation', 'chart': 'navigation', 'safety': 'safety', 'fire': 'safety', 'man overboard': 'safety', 'abandon': 'safety', 'solas': 'solas', 'meteorolog': 'meteorology', 'weather': 'meteorology', 'stability': 'stability', 'marpol': 'marpol', 'pollution': 'marpol', 'stcw': 'stcw', 'watchkeep': 'stcw', 'cargo': 'cargo', 'gmdss': 'gmdss', 'distress': 'gmdss', 'radar': 'bridge-equipment', 'ecdis': 'bridge-equipment', 'ais': 'bridge-equipment', 'maritime law': 'maritime-law', 'ism': 'maritime-law' };
- Send currentTopic in each /api/chat request
- Opening greeting sends NO topic

TARGET: Opening greeting prompt under 2500 chars. Topic prompt under 5000 chars. Response time under 3 seconds.

PART 2 — BUILD TRAINER MODE

Build a trainer mode at /trainer restricted to these emails only: lukemoore9@icloud.com and tdracos98@gmail.com

SUPABASE TABLE — output this SQL for me to run manually:
create table public.trainer_corrections (id uuid default gen_random_uuid() primary key, trainer_email text not null, topic text, ticket_type text, examiner_said text not null, student_said text, correction text, flag_reason text, correction_type text check (correction_type in ('correction', 'flag')), applied boolean default false, created_at timestamptz default now());
alter table public.trainer_corrections enable row level security;
create policy "full access corrections" on public.trainer_corrections for all using (true);

API ROUTE — create /api/trainer/correction/route.ts:
- POST: saves correction or flag to trainer_corrections table
- Requires auth, verifies email is in beta list
- Accepts: examinerSaid, studentSaid, correction, flagReason, correctionType, topic, ticketType, trainerEmail

CORRECTIONS LOADER — create src/lib/corrections-loader.ts:
- Async function loadRecentCorrections(ticketType?) that loads 20 most recent unapplied corrections from Supabase
- Returns formatted string for system prompt injection

INJECT INTO PROMPT — update /api/chat/route.ts:
- Load recent corrections and append to system prompt
- Section header: "TRAINER CORRECTIONS (override reference material):"

TRAINER PAGE — create src/app/trainer/page.tsx:
- Same voice session as main page — orb, voice loop, transcript, mic controls
- After EVERY examiner response in the transcript, show two small buttons:
  - "Correct" (blue outline) — opens inline text area, saves as correction type
  - "Flag" (red outline) — opens inline text area, saves as flag type
- Show green "Saved" or red "Flagged" confirmation that fades after 2 seconds
- Keep it clean — buttons should not disrupt the conversation flow

TRAINER NAV — update Header component:
- If user email is in beta list (lukemoore9@icloud.com, tdracos98@gmail.com), show "Trainer" link between Dashboard and UserButton
- Otherwise don't show it

PART 3 — SET UP QUESTION BANK STRUCTURE FOR EXAM REPORTS

Check if the current questions in src/data/questions/oow-unlimited/*.json have these fields. If any are missing, add them with null or empty defaults. Do NOT delete any existing question content:
- id (string, unique)
- question (string)
- ideal_answer (string)
- key_points (string array)
- unacceptable_answers (string array)
- examiner_preferences (object with wants_rule_number_first, wants_practical_examples, style_notes)
- follow_ups (string array)
- common_mistakes (string array)
- difficulty (number 1-5)
- source_examiner (string)
- examiner_notes (string)
- related_topics (string array)
- visual (string, optional)
- visual_instruction (string, optional)

BUILD ORDER:
1. Rewrite all 12 course .md files (slim them down to under 1500 chars each)
2. Update prompts.ts — topic-based loading only, never load all 12 at once
3. Update chat route — accept currentTopic, log prompt size
4. Update useVoiceSession — topic detection and currentTopic tracking
5. Test: opening greeting should be instant, topic questions should be 2-3 seconds
6. Output the trainer_corrections SQL for me to run in Supabase
7. Build trainer API route
8. Build corrections loader
9. Inject corrections into chat route
10. Build trainer page with correct/flag buttons
11. Add trainer nav link for beta users
12. Verify question schema has all fields, add missing ones
13. Commit and push

Start with step 1. Work through sequentially. Do not skip any step.
