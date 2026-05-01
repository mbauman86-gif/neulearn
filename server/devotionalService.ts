import OpenAI from "openai";
import { storage } from "./storage";
import type { Devotional, Child, ChildSettings } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface DevotionalContent {
  scriptureReference: string;
  scriptureText: string;
  title: string;
  explanation: string;
  reflection: string;
  prayerPrompt: string;
  deeperContext: string;
}

function getGradeDescription(grade: string): string {
  switch (grade) {
    case "K":
      return "Kindergarten (ages 5-6) - Use very simple words, short sentences, and concrete examples. Relate to everyday experiences like playing, family, and friends.";
    case "1":
      return "1st Grade (ages 6-7) - Use simple vocabulary and short sentences. Include relatable examples and simple analogies.";
    case "2":
      return "2nd Grade (ages 7-8) - Use age-appropriate vocabulary with slightly more detail. Can understand basic abstract concepts when explained simply.";
    default:
      return "Early elementary (ages 5-8) - Use simple, clear language appropriate for young children.";
  }
}

function getFaithModeDescription(faithMode: string): string {
  switch (faithMode) {
    case "FULL_DISCIPLESHIP":
      return "Include rich theological content, deeper scripture exploration, and explicit connections to Christian doctrine. Focus on discipleship and knowing God deeply.";
    case "FAITH_FORWARD":
      return "Balance scripture teaching with practical application. Include the gospel message but keep theological concepts accessible and connected to daily life.";
    case "VALUES_ONLY":
      return "Focus on character virtues and moral lessons. Reference scripture as wisdom literature without deep theological explanation. Emphasize kindness, honesty, and good character.";
    default:
      return "Balance scripture teaching with practical application.";
  }
}

function getGradeLabel(grade: string): string {
  switch (grade) {
    case "K":
      return "Kindergartener";
    case "1":
      return "1st grader";
    case "2":
      return "2nd grader";
    default:
      return "young child";
  }
}

export async function generateDevotional(
  child: Child & { settings: ChildSettings | null }
): Promise<DevotionalContent> {
  const grade = child.grade;
  const faithMode = child.settings?.faithMode || "FAITH_FORWARD";
  const gradeDesc = getGradeDescription(grade);
  const faithDesc = getFaithModeDescription(faithMode);

  const systemPrompt = `You are a loving Christian children's devotional writer, creating daily scripture devotionals for homeschool families. Your devotionals are warm, engaging, and age-appropriate.

Write for: ${gradeDesc}

Faith approach: ${faithDesc}

Your devotional should feel like a gentle conversation with a child, not a lecture. Use "you" to speak directly to the child. Include wonder and delight in God's Word.`;

  const gradeLabel = getGradeLabel(grade);
  const userPrompt = `Create a daily devotional for ${child.name}, a ${gradeLabel}.

Generate a JSON object with these fields:
- scriptureReference: A single Bible verse reference (e.g., "Psalm 23:1" or "John 3:16")
- scriptureText: The full verse text (use a child-friendly translation like NIrV or ICB style)
- title: A short, engaging title for today's devotional (5-8 words max)
- explanation: ${grade === "K" ? "2-3" : "3-4"} sentences explaining what the verse means in simple, relatable terms. Use examples from a child's daily life.
- reflection: A thought-provoking but simple question or statement for the child to think about. Start with "Think about..." or ask a gentle question.
- prayerPrompt: A simple, short prayer prompt the child can use (1-2 sentences starting with "Dear God..." or "Lord Jesus...")
- deeperContext: ${faithMode === "FULL_DISCIPLESHIP" ? "2-3 sentences providing deeper theological context or connection to the gospel for children ready for more." : "1-2 sentences with an optional activity or way to remember this verse today."}

Make the content fresh and specific - avoid generic platitudes. Choose a verse that would resonate with young children's experiences.

Respond with valid JSON only.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  try {
    const parsed = JSON.parse(content) as DevotionalContent;
    return parsed;
  } catch (error) {
    console.error("Failed to parse devotional response:", content);
    throw new Error("Invalid devotional format from AI");
  }
}

function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export async function ensureDevotionalForToday(
  childId: string
): Promise<Devotional> {
  const child = await storage.getChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  const cadence = child.settings?.devotionalCadence || "daily";
  const now = new Date();
  
  // For weekly cadence, use the Monday of the current week as the date key
  const dateKey = cadence === "weekly" 
    ? getWeekStartDate(now)
    : now.toISOString().split("T")[0];

  const existing = await storage.getDevotionalByChildAndDate(childId, dateKey);
  if (existing) {
    return existing;
  }

  const content = await generateDevotional(child);

  const devotional = await storage.createDevotional({
    childId,
    date: dateKey,
    grade: child.grade,
    faithMode: child.settings?.faithMode || "FAITH_FORWARD",
    scriptureReference: content.scriptureReference,
    scriptureText: content.scriptureText,
    title: content.title,
    explanation: content.explanation,
    reflection: content.reflection,
    prayerPrompt: content.prayerPrompt,
    deeperContext: content.deeperContext,
  });

  return devotional;
}
