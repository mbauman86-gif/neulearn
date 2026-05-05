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
  // ============================================
  // PHONICS FOUNDATIONS (K) — prereqs for digraphs
  // Hand-authored for the alpha so non-readers have full-audio templates from day one.
  // Both target EXISTING skills already in K2_SKILLS (skill names with capitals + spaces),
  // so the seed will relink them on next start.
  // ============================================
  {
    subject: "READING",
    targetSkillName: "Letter-Sound Correspondence",
    gradeBand: "K",
    objective: "Match each letter to the sound it makes — the foundation of reading.",
    difficultyLevels: {
      easy: { customParams: { focusOn: "consonants", letterCount: 5 } },
      medium: { customParams: { focusOn: "consonants_short_vowels", letterCount: 8 } },
      hard: { customParams: { focusOn: "all_letters", letterCount: 10 } },
    },
    modes: {
      hands_on: {
        instructionsPattern:
          "Use letter tiles or magnetic letters. Pick one up, say its sound, then put it down.",
        materials: ["letter tiles or magnetic letters"],
        parentGuidance:
          "Say the sound first, your child repeats. Then have them say the sound and you repeat. Trade.",
      },
      visual: {
        instructionsPattern: "Look at each letter and say the sound it makes.",
        materials: [],
        parentGuidance:
          "Cover the letter with your finger after they say the sound to confirm they heard the right one.",
      },
      story: {
        instructionsPattern:
          "Read a short alphabet story together. Pause when a target letter appears.",
        materials: ["any alphabet picture book you have at home"],
        parentGuidance:
          "Don't push for speed. The point is recognition — does the brain hear the sound when the eye sees the letter.",
      },
    },
    assessmentBank: {
      // Each item is a single-letter tap option — perfect for TTS-tap-to-hear UX.
      formative: [
        {
          questionId: "lsc-f-1",
          prompt: "Which letter makes the sound 'mmm', like in 'moon'?",
          type: "choice",
          options: ["m", "n", "p"],
          correctAnswer: "m",
        },
        {
          questionId: "lsc-f-2",
          prompt: "Which letter makes the sound 'sss', like a snake?",
          type: "choice",
          options: ["s", "f", "z"],
          correctAnswer: "s",
        },
        {
          questionId: "lsc-f-3",
          prompt: "Which letter makes the sound 'buh', like in 'ball'?",
          type: "choice",
          options: ["b", "d", "p"],
          correctAnswer: "b",
        },
        {
          questionId: "lsc-f-4",
          prompt: "Which letter makes the sound 'tuh', like in 'top'?",
          type: "choice",
          options: ["t", "d", "p"],
          correctAnswer: "t",
        },
        {
          questionId: "lsc-f-5",
          prompt: "Which letter makes the sound 'aaa', like in 'apple'?",
          type: "choice",
          options: ["a", "e", "u"],
          correctAnswer: "a",
        },
      ],
      checkpoint: [
        {
          questionId: "lsc-c-1",
          prompt: "Which letter makes the sound 'kuh', like in 'cat'?",
          type: "choice",
          options: ["c", "g", "q"],
          correctAnswer: "c",
        },
        {
          questionId: "lsc-c-2",
          prompt: "Which letter makes the sound 'fuh', like in 'fish'?",
          type: "choice",
          options: ["f", "v", "th"],
          correctAnswer: "f",
        },
        {
          questionId: "lsc-c-3",
          prompt: "Which letter makes the sound 'lll', like in 'lion'?",
          type: "choice",
          options: ["l", "r", "w"],
          correctAnswer: "l",
        },
        {
          questionId: "lsc-c-4",
          prompt: "Which letter makes the sound 'ooo', like in 'octopus'?",
          type: "choice",
          options: ["o", "u", "a"],
          correctAnswer: "o",
        },
        {
          questionId: "lsc-c-5",
          prompt: "Which letter makes the sound 'rrr', like a tiger?",
          type: "choice",
          options: ["r", "l", "w"],
          correctAnswer: "r",
        },
      ],
      challenge: [
        {
          questionId: "lsc-ch-1",
          prompt: "What sound does 'h' make? Pick the word that starts with that sound.",
          type: "choice",
          options: ["hat", "cat", "bat"],
          correctAnswer: "hat",
        },
        {
          questionId: "lsc-ch-2",
          prompt: "What sound does 'g' make? Pick the word that starts with that sound.",
          type: "choice",
          options: ["go", "no", "so"],
          correctAnswer: "go",
        },
        {
          questionId: "lsc-ch-3",
          prompt: "What sound does 'j' make? Pick the word that starts with that sound.",
          type: "choice",
          options: ["jam", "ham", "ram"],
          correctAnswer: "jam",
        },
        {
          questionId: "lsc-ch-4",
          prompt: "What sound does 'w' make? Pick the word that starts with that sound.",
          type: "choice",
          options: ["wet", "vet", "set"],
          correctAnswer: "wet",
        },
        {
          questionId: "lsc-ch-5",
          prompt: "Which two letters make a vowel sound? (Vowels are a, e, i, o, u.)",
          type: "choice",
          options: ["a and e", "b and c", "k and m"],
          correctAnswer: "a and e",
        },
      ],
    },
  },

  {
    subject: "READING",
    targetSkillName: "CVC Word Reading",
    gradeBand: "K",
    objective: "Read 3-letter words by blending the consonant-vowel-consonant sounds.",
    difficultyLevels: {
      easy: { customParams: { focusOn: "blend-aloud", wordCount: 3 } },
      medium: { customParams: { focusOn: "decode-and-pick", wordCount: 5 } },
      hard: { customParams: { focusOn: "in-sentence", wordCount: 6 } },
    },
    modes: {
      hands_on: {
        instructionsPattern:
          "Build CVC words with letter tiles. Slide each letter together as you say its sound, then say the whole word.",
        materials: ["letter tiles or magnetic letters"],
        parentGuidance:
          "Sound out s-l-o-w-l-y the first time. Then have your child blend them faster and faster until the word 'pops out'.",
      },
      visual: {
        instructionsPattern: "Look at each word. Say the sounds. Blend them together.",
        materials: [],
        parentGuidance:
          "Cover all but the first letter, say its sound. Reveal the next letter, say it. Reveal the third. Then sweep your finger across all three and blend.",
      },
      story: {
        instructionsPattern:
          "Read a short list of CVC words in a silly sentence together.",
        materials: ["a piece of paper"],
        parentGuidance:
          "Make up a goofy sentence using 3-4 CVC words. The point is to read with momentum, not perfection.",
      },
    },
    assessmentBank: {
      formative: [
        {
          questionId: "cvc-f-1",
          prompt: "Which word do these sounds make? c-a-t",
          type: "choice",
          options: ["cat", "cot", "cut"],
          correctAnswer: "cat",
        },
        {
          questionId: "cvc-f-2",
          prompt: "Which word do these sounds make? d-o-g",
          type: "choice",
          options: ["dig", "dog", "dug"],
          correctAnswer: "dog",
        },
        {
          questionId: "cvc-f-3",
          prompt: "Which word do these sounds make? s-u-n",
          type: "choice",
          options: ["sin", "son", "sun"],
          correctAnswer: "sun",
        },
        {
          questionId: "cvc-f-4",
          prompt: "Which word do these sounds make? p-i-g",
          type: "choice",
          options: ["pig", "peg", "pug"],
          correctAnswer: "pig",
        },
      ],
      checkpoint: [
        {
          questionId: "cvc-c-1",
          prompt: "Read this word out loud: bed. Which is correct?",
          type: "choice",
          options: ["bed", "bad", "bid"],
          correctAnswer: "bed",
        },
        {
          questionId: "cvc-c-2",
          prompt: "Read this word out loud: top. Which is correct?",
          type: "choice",
          options: ["tap", "tip", "top"],
          correctAnswer: "top",
        },
        {
          questionId: "cvc-c-3",
          prompt: "Read this word out loud: hat. Which is correct?",
          type: "choice",
          options: ["hat", "hut", "hot"],
          correctAnswer: "hat",
        },
        {
          questionId: "cvc-c-4",
          prompt: "Read this word out loud: bug. Which is correct?",
          type: "choice",
          options: ["big", "bag", "bug"],
          correctAnswer: "bug",
        },
        {
          questionId: "cvc-c-5",
          prompt: "Read this word out loud: net. Which is correct?",
          type: "choice",
          options: ["net", "not", "nut"],
          correctAnswer: "net",
        },
      ],
      challenge: [
        {
          questionId: "cvc-ch-1",
          prompt: "Pick the CVC word that means a small animal that says meow.",
          type: "choice",
          options: ["cat", "dog", "cow"],
          correctAnswer: "cat",
        },
        {
          questionId: "cvc-ch-2",
          prompt: "Pick the CVC word that means a place to sleep.",
          type: "choice",
          options: ["bed", "ban", "but"],
          correctAnswer: "bed",
        },
        {
          questionId: "cvc-ch-3",
          prompt: "Which sentence uses a real CVC word? 'I see a ___.'",
          type: "choice",
          options: ["bag", "bgg", "bzz"],
          correctAnswer: "bag",
        },
        {
          questionId: "cvc-ch-4",
          prompt: "Pick the CVC word that means something that flies.",
          type: "choice",
          options: ["bug", "log", "rug"],
          correctAnswer: "bug",
        },
        {
          questionId: "cvc-ch-5",
          prompt: "Pick the CVC word that rhymes with 'cat'.",
          type: "choice",
          options: ["bat", "big", "but"],
          correctAnswer: "bat",
        },
      ],
    },
  },

  // ============================================
  // DIGRAPHS (Grade 1) — depend on Letter-Sound + CVC above
  // ============================================
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
 * Returns every distinct text passage in the V2 templates that should be pre-rendered
 * to the karaoke audio cache. Used by the audio-prewarm admin route.
 *
 * Includes: objective lines, hands-on/visual/story instruction patterns, and every
 * assessment-bank prompt. Choice-option strings are NOT prewarmed individually; only
 * prompts get audio (the kid hears the question; tapping an option triggers a
 * separate single-word playback at runtime, which still gets cached on first use).
 */
export function collectV2PrewarmTexts(): string[] {
  const out = new Set<string>();
  for (const tpl of v2ReadingTemplates) {
    out.add(tpl.objective);
    for (const mode of [tpl.modes.hands_on, tpl.modes.visual, tpl.modes.story]) {
      out.add(mode.instructionsPattern);
    }
    for (const bank of [
      tpl.assessmentBank.formative,
      tpl.assessmentBank.checkpoint,
      tpl.assessmentBank.challenge,
    ]) {
      for (const item of bank) {
        out.add(item.prompt);
      }
    }
  }
  return Array.from(out);
}

/**
 * Idempotent seed: looks up each skill by name and inserts the template only if no
 * template with the same (subject, skillName, gradeBand) tuple already exists. Safe
 * to run multiple times; safe to run alongside the legacy seeder.
 *
 * If a template was previously inserted with `targetSkillId = null` (because the
 * skill row didn't exist yet) and the skill row now exists, this seed backfills
 * the link. So you can run seedV2Skills + seedV2ReadingTemplates in any order /
 * any number of times and they'll converge to the right state.
 */
export async function seedV2ReadingTemplates(): Promise<{
  inserted: number;
  skipped: number;
  relinked: number;
  unlinkedSkills: string[];
}> {
  let inserted = 0;
  let skipped = 0;
  let relinked = 0;
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

    const [existing] = await db
      .select()
      .from(lessonTemplates)
      .where(
        and(
          eq(lessonTemplates.subject, tpl.subject),
          eq(lessonTemplates.targetSkillName, tpl.targetSkillName),
          eq(lessonTemplates.gradeBand, tpl.gradeBand),
        ),
      )
      .limit(1);

    if (existing) {
      // Backfill targetSkillId if the skill now exists but the template was inserted
      // before the skill did. Pure additive update — no other fields touched.
      if (skill && !existing.targetSkillId) {
        await db
          .update(lessonTemplates)
          .set({ targetSkillId: skill.id })
          .where(eq(lessonTemplates.id, existing.id));
        relinked++;
      } else {
        skipped++;
      }
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

  return { inserted, skipped, relinked, unlinkedSkills };
}
