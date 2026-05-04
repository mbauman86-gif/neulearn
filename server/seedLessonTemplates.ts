import { storage } from "./storage";
import type { DifficultyConfig, ModeConfig, AssessmentQuestion } from "@shared/schema";

type TemplateData = {
  subject: string;
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
  assessmentBank?: {
    formative: AssessmentQuestion[];
    checkpoint: AssessmentQuestion[];
    challenge: AssessmentQuestion[];
  };
};

const mathTemplates: TemplateData[] = [
  {
    subject: "MATH",
    targetSkillName: "counting_to_10",
    gradeBand: "K",
    objective: "Count objects from 1 to 10 with one-to-one correspondence",
    difficultyLevels: {
      easy: { numberRange: [1, 5], problemCount: 3 },
      medium: { numberRange: [1, 10], problemCount: 5 },
      hard: { numberRange: [1, 10], problemCount: 6 },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Use blocks, buttons, or small toys to practice counting.", 
        materials: ["blocks", "buttons", "small toys"],
        parentGuidance: "Have your child touch each object as they count to build one-to-one correspondence."
      },
      visual: { 
        instructionsPattern: "Draw dots or use stickers to represent and count objects.",
        materials: ["paper", "crayons", "stickers"],
        parentGuidance: "Encourage your child to point to each drawing as they count."
      },
      story: { 
        instructionsPattern: "Count animals, toys, or characters in a simple counting story.",
        materials: ["counting book", "stuffed animals"],
        parentGuidance: "Pause at each page and let your child count the objects before turning."
      },
    },
  },
  {
    subject: "MATH",
    targetSkillName: "addition_within_5",
    gradeBand: "K",
    objective: "Add numbers with sums up to 5 using concrete objects",
    difficultyLevels: {
      easy: { numberRange: [0, 3], problemCount: 3 },
      medium: { numberRange: [0, 5], problemCount: 4 },
      hard: { numberRange: [0, 5], problemCount: 5 },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Combine groups of objects to find the total.",
        materials: ["blocks", "counting bears", "buttons"],
        parentGuidance: "Start with two small groups and ask 'How many altogether?'"
      },
      visual: { 
        instructionsPattern: "Draw pictures or use dot cards to show addition.",
        materials: ["paper", "crayons", "dot cards"],
        parentGuidance: "Have your child draw circles to represent each number then count all."
      },
      story: { 
        instructionsPattern: "Solve addition word problems with familiar scenarios.",
        materials: ["paper", "crayons"],
        parentGuidance: "Use real-life examples like adding fruits or toys."
      },
    },
  },
  {
    subject: "MATH",
    targetSkillName: "addition_within_10",
    gradeBand: "1",
    objective: "Add numbers with sums up to 10",
    difficultyLevels: {
      easy: { numberRange: [0, 5], problemCount: 4 },
      medium: { numberRange: [0, 10], problemCount: 6 },
      hard: { numberRange: [0, 10], problemCount: 8, includesMissingAddend: true },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Use ten-frames and counters to solve addition problems.",
        materials: ["ten-frame", "counters", "number cards"],
        parentGuidance: "Show how filling a ten-frame helps visualize addition."
      },
      visual: { 
        instructionsPattern: "Draw number bonds and part-part-whole diagrams.",
        materials: ["paper", "markers", "number line"],
        parentGuidance: "Use a number line to count on from the first number."
      },
      story: { 
        instructionsPattern: "Solve addition stories about everyday situations.",
        materials: ["paper", "crayons"],
        parentGuidance: "Act out the story with objects before solving."
      },
    },
  },
  {
    subject: "MATH",
    targetSkillName: "subtraction_within_10",
    gradeBand: "1",
    objective: "Subtract numbers within 10",
    difficultyLevels: {
      easy: { numberRange: [0, 5], problemCount: 4 },
      medium: { numberRange: [0, 10], problemCount: 6 },
      hard: { numberRange: [0, 10], problemCount: 8 },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Remove objects from a group to find how many are left.",
        materials: ["counters", "blocks", "snacks"],
        parentGuidance: "Start with a group and take some away while counting."
      },
      visual: { 
        instructionsPattern: "Cross out pictures or use number lines to subtract.",
        materials: ["paper", "crayons", "number line"],
        parentGuidance: "Draw all objects first, then cross out to subtract."
      },
      story: { 
        instructionsPattern: "Solve subtraction stories about things going away.",
        materials: ["paper", "crayons"],
        parentGuidance: "Use scenarios like birds flying away or cookies being eaten."
      },
    },
  },
  {
    subject: "MATH",
    targetSkillName: "addition_within_20",
    gradeBand: "2",
    objective: "Add numbers with sums up to 20 fluently",
    difficultyLevels: {
      easy: { numberRange: [0, 10], problemCount: 5 },
      medium: { numberRange: [0, 20], problemCount: 8 },
      hard: { numberRange: [0, 20], problemCount: 10, includesMissingAddend: true },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Use two ten-frames to add numbers past 10.",
        materials: ["two ten-frames", "counters"],
        parentGuidance: "Show making a ten as a strategy for adding larger numbers."
      },
      visual: { 
        instructionsPattern: "Use number lines and break-apart strategies.",
        materials: ["paper", "pencil", "number line to 20"],
        parentGuidance: "Practice 'making 10' as an addition strategy."
      },
      story: { 
        instructionsPattern: "Solve two-step addition word problems.",
        materials: ["paper", "pencil"],
        parentGuidance: "Break complex problems into smaller steps."
      },
    },
  },
];

const readingTemplates: TemplateData[] = [
  {
    subject: "READING",
    targetSkillName: "letter_recognition",
    gradeBand: "K",
    objective: "Recognize and name uppercase and lowercase letters",
    difficultyLevels: {
      easy: { customParams: { letters: 5, focusOn: "uppercase" } },
      medium: { customParams: { letters: 10, focusOn: "both" } },
      hard: { customParams: { letters: 15, focusOn: "matching" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Find and sort magnetic letters or letter cards.",
        materials: ["magnetic letters", "letter cards", "sorting trays"],
        parentGuidance: "Say the letter name together when your child finds it."
      },
      visual: { 
        instructionsPattern: "Match letters in books, magazines, or on signs.",
        materials: ["alphabet book", "magazines", "highlighter"],
        parentGuidance: "Play 'letter hunt' around the house or in books."
      },
      story: { 
        instructionsPattern: "Learn letters through alphabet stories and songs.",
        materials: ["alphabet book", "letter props"],
        parentGuidance: "Connect each letter to something meaningful to your child."
      },
    },
  },
  {
    subject: "READING",
    targetSkillName: "letter_sounds",
    gradeBand: "K",
    objective: "Associate letters with their most common sounds",
    difficultyLevels: {
      easy: { customParams: { sounds: 5, focusOn: "consonants" } },
      medium: { customParams: { sounds: 10, focusOn: "consonants_short_vowels" } },
      hard: { customParams: { sounds: 15, focusOn: "all_sounds" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Sort objects by their beginning sounds.",
        materials: ["small objects", "letter cards", "sorting bins"],
        parentGuidance: "Collect household items that start with target sounds."
      },
      visual: { 
        instructionsPattern: "Match pictures to letters based on beginning sounds.",
        materials: ["picture cards", "letter cards"],
        parentGuidance: "Emphasize the beginning sound when naming pictures."
      },
      story: { 
        instructionsPattern: "Read alliterative stories focusing on target sounds.",
        materials: ["phonics books"],
        parentGuidance: "Pause and emphasize words with target sounds."
      },
    },
  },
  {
    subject: "READING",
    targetSkillName: "cvc_blending",
    gradeBand: "1",
    objective: "Blend CVC (consonant-vowel-consonant) words",
    difficultyLevels: {
      easy: { wordCount: 3, sentenceLength: "none" },
      medium: { wordCount: 5, sentenceLength: "short" },
      hard: { wordCount: 8, sentenceLength: "medium", includesBlending: true },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Build words with letter tiles or magnetic letters.",
        materials: ["letter tiles", "word building mat"],
        parentGuidance: "Touch each letter while saying its sound, then blend."
      },
      visual: { 
        instructionsPattern: "Use word family charts and picture-word matching.",
        materials: ["word family charts", "picture cards"],
        parentGuidance: "Point under each letter as you blend the sounds."
      },
      story: { 
        instructionsPattern: "Read decodable readers with target CVC words.",
        materials: ["decodable reader"],
        parentGuidance: "Let your child try to sound out words before helping."
      },
    },
  },
  {
    subject: "READING",
    targetSkillName: "sight_words",
    gradeBand: "1",
    objective: "Read high-frequency sight words automatically",
    difficultyLevels: {
      easy: { customParams: { words: 5 } },
      medium: { customParams: { words: 10 } },
      hard: { customParams: { words: 15 } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Play sight word games with flashcards and activities.",
        materials: ["sight word cards", "game board"],
        parentGuidance: "Keep practice sessions short and fun."
      },
      visual: { 
        instructionsPattern: "Hunt for sight words in books and write them.",
        materials: ["books", "paper", "highlighter tape"],
        parentGuidance: "Celebrate when your child spots a known word."
      },
      story: { 
        instructionsPattern: "Read predictable books with repeated sight words.",
        materials: ["predictable books", "pointer"],
        parentGuidance: "Read together and let your child chime in on known words."
      },
    },
  },
  {
    subject: "READING",
    targetSkillName: "reading_comprehension",
    gradeBand: "2",
    objective: "Understand and retell stories read aloud or independently",
    difficultyLevels: {
      easy: { customParams: { textLevel: "beginning", questionsCount: 2 } },
      medium: { customParams: { textLevel: "developing", questionsCount: 3 } },
      hard: { customParams: { textLevel: "fluent", questionsCount: 5 } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Act out stories with puppets or toys.",
        materials: ["puppets", "props", "costumes"],
        parentGuidance: "Ask 'what happened first, next, last?'"
      },
      visual: { 
        instructionsPattern: "Draw pictures to sequence story events.",
        materials: ["paper", "crayons", "story cards"],
        parentGuidance: "Have your child draw their favorite part and explain why."
      },
      story: { 
        instructionsPattern: "Read together and discuss the story as you go.",
        materials: ["chapter book", "reading journal"],
        parentGuidance: "Pause to ask prediction and connection questions."
      },
    },
  },
];

const characterTemplates: TemplateData[] = [
  {
    subject: "CHARACTER",
    targetSkillName: "kindness",
    gradeBand: "K-2",
    objective: "Understand and practice showing kindness to others",
    difficultyLevels: {
      easy: { customParams: { focus: "identifying_kindness" } },
      medium: { customParams: { focus: "practicing_kindness" } },
      hard: { customParams: { focus: "extending_kindness" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Create kindness cards or do kind acts together.",
        materials: ["paper", "art supplies", "kindness jar"],
        parentGuidance: "Brainstorm ways to show kindness at home and in the community."
      },
      visual: { 
        instructionsPattern: "Read stories about kindness and discuss examples.",
        materials: ["picture books about kindness"],
        parentGuidance: "Point out kind actions in the story and in real life."
      },
      story: { 
        instructionsPattern: "Act out scenarios showing kind and unkind choices.",
        materials: ["puppets", "dolls"],
        parentGuidance: "Ask 'How would that make someone feel?'"
      },
    },
  },
  {
    subject: "CHARACTER",
    targetSkillName: "honesty",
    gradeBand: "K-2",
    objective: "Understand the importance of telling the truth",
    difficultyLevels: {
      easy: { customParams: { focus: "truth_vs_lie" } },
      medium: { customParams: { focus: "consequences" } },
      hard: { customParams: { focus: "difficult_truths" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Sort cards into 'truth' and 'lie' piles.",
        materials: ["scenario cards", "sorting bins"],
        parentGuidance: "Discuss why telling the truth is important even when hard."
      },
      visual: { 
        instructionsPattern: "Read stories about honesty and its rewards.",
        materials: ["picture books about honesty"],
        parentGuidance: "Share age-appropriate examples from your own life."
      },
      story: { 
        instructionsPattern: "Role-play situations where honesty is tested.",
        materials: ["props for role-play"],
        parentGuidance: "Practice saying 'I'm sorry' and making things right."
      },
    },
  },
  {
    subject: "CHARACTER",
    targetSkillName: "patience",
    gradeBand: "K-2",
    objective: "Practice waiting calmly and persevering through challenges",
    difficultyLevels: {
      easy: { customParams: { waitTime: "short" } },
      medium: { customParams: { waitTime: "medium" } },
      hard: { customParams: { waitTime: "extended" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Do activities that require waiting (planting, baking).",
        materials: ["seeds", "soil", "baking ingredients"],
        parentGuidance: "Talk about what's happening while you wait together."
      },
      visual: { 
        instructionsPattern: "Use a visual timer and reward chart for waiting.",
        materials: ["visual timer", "sticker chart"],
        parentGuidance: "Start with short waits and gradually increase."
      },
      story: { 
        instructionsPattern: "Read stories about characters who learned patience.",
        materials: ["books about patience"],
        parentGuidance: "Discuss times when waiting was hard but worth it."
      },
    },
  },
  {
    subject: "CHARACTER",
    targetSkillName: "gratitude",
    gradeBand: "K-2",
    objective: "Recognize blessings and express thankfulness",
    difficultyLevels: {
      easy: { customParams: { focus: "saying_thank_you" } },
      medium: { customParams: { focus: "recognizing_blessings" } },
      hard: { customParams: { focus: "gratitude_in_hard_times" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Make a gratitude craft or fill a thankfulness jar.",
        materials: ["jar", "paper strips", "art supplies"],
        parentGuidance: "Add to the jar daily and read entries together weekly."
      },
      visual: { 
        instructionsPattern: "Create a gratitude list or thankfulness collage.",
        materials: ["paper", "magazines", "glue", "scissors"],
        parentGuidance: "Include people, places, and things to be thankful for."
      },
      story: { 
        instructionsPattern: "Read stories about gratitude and write thank-you notes.",
        materials: ["gratitude books", "note cards"],
        parentGuidance: "Model gratitude by sharing what you're thankful for."
      },
    },
  },
  {
    subject: "CHARACTER",
    targetSkillName: "responsibility",
    gradeBand: "K-2",
    objective: "Take ownership of tasks and follow through on commitments",
    difficultyLevels: {
      easy: { customParams: { taskComplexity: "simple" } },
      medium: { customParams: { taskComplexity: "multi-step" } },
      hard: { customParams: { taskComplexity: "ongoing" } },
    },
    modes: {
      hands_on: { 
        instructionsPattern: "Practice age-appropriate chores with a responsibility chart.",
        materials: ["chore chart", "stickers", "cleaning supplies"],
        parentGuidance: "Start with one task and add more as success builds."
      },
      visual: { 
        instructionsPattern: "Create visual task cards for daily routines.",
        materials: ["index cards", "pictures", "velcro strip"],
        parentGuidance: "Let your child check off completed tasks."
      },
      story: { 
        instructionsPattern: "Read about characters taking responsibility.",
        materials: ["books about responsibility"],
        parentGuidance: "Discuss what happens when we do or don't keep our word."
      },
    },
  },
];

export async function seedLessonTemplates(): Promise<void> {
  const existingTemplates = await storage.getLessonTemplates();

  if (existingTemplates.length === 0) {
    console.log("Seeding lesson templates...");
    const allTemplates = [...mathTemplates, ...readingTemplates, ...characterTemplates];
    for (const template of allTemplates) {
      await storage.createLessonTemplate(template);
      console.log(`  Created template: ${template.subject} - ${template.targetSkillName}`);
    }
    console.log(`Successfully seeded ${allTemplates.length} legacy lesson templates.`);
  } else {
    console.log(
      `Legacy lesson templates already seeded (${existingTemplates.length} templates). Skipping legacy seed.`,
    );
  }

  // V2 hand-authored reading templates with full assessment banks (digraphs + sight
  // words). Idempotent — only inserts templates that don't already exist by
  // (subject, targetSkillName, gradeBand). Safe to run on every server start.
  try {
    const { seedV2ReadingTemplates } = await import("./seedReadingTemplatesV2");
    const result = await seedV2ReadingTemplates();
    console.log(
      `V2 reading templates: inserted=${result.inserted}, skipped=${result.skipped}` +
        (result.unlinkedSkills.length
          ? `, unlinked-skills=${result.unlinkedSkills.join(",")}`
          : ""),
    );
  } catch (err) {
    console.error("Failed to seed V2 reading templates:", err);
  }
}
