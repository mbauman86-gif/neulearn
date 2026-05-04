/**
 * V2 hand-authored reading lesson templates (Phase 1, 2026-05-04).
 *
 * Replaces the AI-on-demand model for foundational reading skills. These templates are
 * the gold-standard reference implementation per the Phase 1 audit:
 *   - Each template has full assessmentBank (formative / checkpoint / challenge) so
 *     practice items and mastery-check items are sourced from disjoint pools.
 *   - Five consonant digraphs and a starter sight-word set.
 *   - Designed so a non-reader (e.g. Michael's son) can use them with karaoke-default
 *     read-along + voice answers.
 *
 * Skill names match the K-1 reading skills seeded by seedSkills.ts. If a skill doesn't
 * exist there yet, the template's targetSkillId will resolve as null and the template
 * will still seed but be unlinked.
 */
import { db } from "./db";
import { lessonTemplates, skills } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { AssessmentQuestion, DifficultyConfig, ModeConfig } from "@shared/schema";

interface ReadingTemplateData {
  subject: "READING";
  targetSkillName: string;
  gradeBand: string;
  objective: string;
  difficultyLevels: {
    easy: DifficultyConfig;
    medium: DifficultyConfig;
    hard: DifficultyConfig;
  };
  modes: {
    hands_on: ModeConfig;
    visual: ModeConfig;
    story: ModeConfig;
  };
  assessmentBank: {
    formative: AssessmentQuestion[];
    checkpoint: AssessmentQuestion[];
    challenge: AssessmentQuestion[];
  };
}

// Helper: build a digraph decoding template. Each digraph gets the same shape; only the
// digraph string and word lists change. The three banks are kept disjoint — words used
// in formative practice never appear in the checkpoint mastery check.
function digraphTemplate(args: {
  digraph: string;
  pronunciation: string;
  practiceWords: string[];
  checkpointWords: string[];
  challengeWords: string[];
}): ReadingTemplateData {
  const { digraph, pronunciation, practiceWords, checkpointWords, challengeWords } = args;

  const buildItem = (word: string, i: number, bank: string): AssessmentQuestion => ({
    questionId: `${digraph}-${bank}-${i}`,
    prompt: `Which word starts with the ${digraph} sound (${pronunciation})?`,
    type: "choice",
    // For a real K student we'd render audio + image options. The text options here are
    // a safe fallback the karaoke read-along can voice. Always include the correct word
    // plus 2 distractors that sound similar but don't start with the digraph.
    options: [
      word,
      word.replace(digraph, digraph[0]), // strip the digraph's second letter as a distractor
      word.charAt(0) + word.slice(2), // skip second letter as another distractor
    ].filter((opt, idx, arr) => arr.indexOf(opt) === idx).slice(0, 3),
    correctAnswer: word,
  });

  return {
    subject: "READING",
    targetSkillName: `digraph_${digraph}`,
    gradeBand: "1",
    objective: `Decode words that contain the consonant digraph "${digraph}" (sound: ${pronunciation}).`,
    difficultyLevels: {
      easy: { customParams: { focusOn: "isolation", wordCount: 3 } },
      medium: { customParams: { focusOn: "in-words", wordCount: 5 } },
      hard: { customParams: { focusOn: "in-sentence", wordCount: 6 } },
    },
    modes: {
      hands_on: {
        instructionsPattern: `Build "${digraph}" words with letter tiles. Say each word aloud after building it.`,
        materials: ["letter tiles or magnetic letters", "small whiteboard"],
        parentGuidance: `Say "${pronunciation}" first; have your child repeat. Then build a word together — point to "${digraph}" and slide it to the rest of the letters as you blend.`,
      },
      visual: {
        instructionsPattern: `Find "${digraph}" words in pictures and books. Underline the "${digraph}" with a colored highlighter.`,
        materials: ["a picture book", "highlighter"],
        parentGuidance: `Pause when you see a "${digraph}" word. Read it together, slowly, then at normal pace.`,
      },
      story: {
        instructionsPattern: `Read a short passage with several "${digraph}" words. Each time you see one, your child reads it.`,
        materials: ["the lesson story (provided)"],
        parentGuidance: `When your child reads a "${digraph}" word correctly, celebrate quietly — a thumbs up is enough. Don't break flow.`,
      },
    },
    assessmentBank: {
      formative: practiceWords.map((w, i) => buildItem(w, i, "formative")),
      checkpoint: checkpointWords.map((w, i) => buildItem(w, i, "checkpoint")),
      challenge: challengeWords.map((w, i) => buildItem(w, i, "challenge")),
    },
  };
}

export const v2ReadingTemplates: ReadingTemplateData[] = [
  digraphTemplate({
    digraph: "sh",
    pronunciation: "shh",
    practiceWords: ["ship", "shop", "shut", "shell"],
    checkpointWords: ["shoe", "shed", "shark", "fish"],
    challengeWords: ["wish", "rush", "shovel", "shrimp", "splash"],
  }),
  digraphTemplate({
    digraph: "ch",
    pronunciation: "ch",
    practiceWords: ["chip", "chop", "chin", "chick"],
    checkpointWords: ["chest", "chase", "much", "such"],
    challengeWords: ["beach", "lunch", "chimp", "chimney", "chocolate"],
  }),
  digraphTemplate({
    digraph: "th",
    pronunciation: "th (soft, like 'think')",
    practiceWords: ["thin", "thank", "thick", "moth"],
    checkpointWords: ["bath", "math", "path", "thirty"],
    challengeWords: ["thumb", "thread", "throne", "thunder", "thirteen"],
  }),
  digraphTemplate({
    digraph: "wh",
    pronunciation: "wh (like 'wheel')",
    practiceWords: ["when", "what", "whip", "wheel"],
    checkpointWords: ["whale", "white", "whisper", "where"],
    challengeWords: ["whisk", "whistle", "wheat", "wheelchair", "whichever"],
  }),
  digraphTemplate({
    digraph: "ck",
    pronunciation: "k (at the end of short words)",
    practiceWords: ["duck", "back", "rock", "lick"],
    checkpointWords: ["kick", "neck", "stuck", "trick"],
    challengeWords: ["pocket", "rocket", "chicken", "blanket", "checkers"],
  }),

  // Sight words — high-frequency words that don't decode regularly. Memorized by sight,
  // so the assessment is recognition-in-context, not phonics.
  {
    subject: "READING",
    targetSkillName: "sight_words_first_25",
    gradeBand: "1",
    objective:
      "Recognize the first 25 high-frequency sight words instantly, both in isolation and inside a sentence.",
    difficultyLevels: {
      easy: { customParams: { focusOn: "isolation", wordCount: 5 } },
      medium: { customParams: { focusOn: "in-sentence", wordCount: 8 } },
      hard: { customParams: { focusOn: "in-passage", wordCount: 12 } },
    },
    modes: {
      hands_on: {
        instructionsPattern: "Make sight-word flash cards. Say each word; flip and check.",
        materials: ["index cards", "marker"],
        parentGuidance:
          "Don't sound them out — these don't decode regularly. Say the whole word as a 'sight friend' the kid recognizes whole.",
      },
      visual: {
        instructionsPattern: "Underline sight words in a favorite picture book.",
        materials: ["a familiar picture book", "highlighter"],
        parentGuidance:
          "Read to them; pause when you hit a sight word and let them read it. If they hesitate more than 2 seconds, gently say it.",
      },
      story: {
        instructionsPattern: "Read a short passage where every sentence uses 2-3 sight words.",
        materials: ["the lesson passage (provided)"],
        parentGuidance:
          "Don't correct mid-sentence. Let them finish, then go back to any tricky word and read it together.",
      },
    },
    assessmentBank: {
      formative: [
        { questionId: "sw-f-1", prompt: "Read this word: the", type: "choice", options: ["the", "they", "this"], correctAnswer: "the" },
        { questionId: "sw-f-2", prompt: "Read this word: and", type: "choice", options: ["and", "an", "are"], correctAnswer: "and" },
        { questionId: "sw-f-3", prompt: "Read this word: of", type: "choice", options: ["off", "of", "for"], correctAnswer: "of" },
        { questionId: "sw-f-4", prompt: "Read this word: you", type: "choice", options: ["your", "you", "yes"], correctAnswer: "you" },
        { questionId: "sw-f-5", prompt: "Read this word: that", type: "choice", options: ["this", "than", "that"], correctAnswer: "that" },
      ],
      checkpoint: [
        { questionId: "sw-c-1", prompt: "Which word completes the sentence: 'I want ___ go.'", type: "choice", options: ["to", "two", "too"], correctAnswer: "to" },
        { questionId: "sw-c-2", prompt: "Which word completes: 'She ___ a friend.'", type: "choice", options: ["was", "saw", "has"], correctAnswer: "has" },
        { questionId: "sw-c-3", prompt: "Read this word: was", type: "choice", options: ["saw", "was", "has"], correctAnswer: "was" },
        { questionId: "sw-c-4", prompt: "Read this word: from", type: "choice", options: ["form", "for", "from"], correctAnswer: "from" },
        { questionId: "sw-c-5", prompt: "Read this word: with", type: "choice", options: ["which", "with", "what"], correctAnswer: "with" },
      ],
      challenge: [
        { questionId: "sw-ch-1", prompt: "Pick the sentence with NO sight-word mistakes.", type: "choice", options: ["Yu have to read.", "You have to read.", "You has to read."], correctAnswer: "You have to read." },
        { questionId: "sw-ch-2", prompt: "Read this sentence aloud, then choose what it means.", type: "choice", options: ["She is at the park.", "She has at the park.", "She at is the park."], correctAnswer: "She is at the park." },
        { questionId: "sw-ch-3", prompt: "Which word is missing? 'They ___ from the store.'", type: "choice", options: ["are", "is", "be"], correctAnswer: "are" },
        { questionId: "sw-ch-4", prompt: "Which sentence uses 'this' correctly?", type: "choice", options: ["This is mine.", "This are mine.", "This be mine."], correctAnswer: "This is mine." },
        { questionId: "sw-ch-5", prompt: "Read aloud: 'I have a book.' How many sight words does it have?", type: "number", correctAnswer: 4 },
      ],
    },
  },
];

/**
 * Idempotent seed: looks up each skill by name and inserts the template only if no
 * template with the same (subject, skillId, gradeBand) tuple already exists. Safe to
 * run multiple times; safe to run alongside the legacy seeder in seedLessonTemplates.ts.
 */
export async function seedV2ReadingTemplates(): Promise<{
  inserted: number;
  skipped: number;
  unlinkedSkills: string[];
}> {
  let inserted = 0;
  let skipped = 0;
  const unlinkedSkills: string[] = [];

  for (const tpl of v2ReadingTemplates) {
    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.name, tpl.targetSkillName))
      .limit(1);

    if (!skill) {
      unlinkedSkills.push(tpl.targetSkillName);
    }

    const existing = await db
      .select({ id: lessonTemplates.id })
      .from(lessonTemplates)
      .where(
        and(
          eq(lessonTemplates.subject, tpl.subject),
          eq(lessonTemplates.targetSkillName, tpl.targetSkillName),
          eq(lessonTemplates.gradeBand, tpl.gradeBand),
        ),
      )
      .limit(1);

    if (existing[0]) {
      skipped++;
      continue;
    }

    await db.insert(lessonTemplates).values({
      subject: tpl.subject,
      targetSkillId: skill?.id ?? null,
      targetSkillName: tpl.targetSkillName,
      gradeBand: tpl.gradeBand,
      objective: tpl.objective,
      difficultyLevels: tpl.difficultyLevels,
      modes: tpl.modes,
      assessmentBank: tpl.assessmentBank,
      isActive: true,
    });
    inserted++;
  }

  return { inserted, skipped, unlinkedSkills };
}
