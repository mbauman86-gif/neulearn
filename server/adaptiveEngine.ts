import OpenAI from "openai";
import { storage } from "./storage";
import { progressionEngine } from "./progressionEngine";
import { 
  type LessonInstance, 
  type LessonTemplate, 
  type ChildSettings,
  type LessonInstanceStep,
  type LessonInstanceAssessment,
  type TeachPhase,
  type PracticePhase,
  type PracticeActivity,
  type DifficultyLevel,
  type LearningMode
} from "@shared/schema";
import { z } from "zod";

// Using Replit's AI Integrations service for OpenAI-compatible API access
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout
  maxRetries: 2,
});

// STRICT 4-section lesson structure: GOAL → TEACH → DO → CHECK
// This follows the "I Do → We Do → You Do" pedagogy
const AILessonResponseSchema = z.object({
  title: z.string().min(1),
  
  // GOAL: The learning objective for this lesson (required)
  goal: z.string().min(1).describe("What the child will learn - start with 'Today you will learn...'"),
  
  // TEACH: Concept explanation with text (I DO phase)
  teach: z.object({
    text: z.string().min(1).describe("Simple explanation a K-2 child understands"),
    vocabulary: z.array(z.object({
      term: z.string(),
      definition: z.string(),
    })).optional(),
    workedExample: z.object({
      problem: z.string(),
      steps: z.array(z.object({
        stepNumber: z.number(),
        instruction: z.string(),
        visual: z.string().optional(),
      })).min(1),
      answer: z.string(),
    }).optional(),
  }),
  
  // DO: 2-4 action steps with parent and child tasks (WE DO phase)
  do: z.array(z.object({
    stepNumber: z.number(),
    parentInstructions: z.string().min(1),
    childTask: z.string().min(1),
    materials: z.array(z.string()).optional(),
    duration: z.number().optional(),
  })).min(2).max(4),
  
  // CHECK: 2-3 assessment questions (YOU DO phase)
  check: z.object({
    questions: z.array(z.object({
      questionId: z.string(),
      prompt: z.string(),
      type: z.enum(["number", "text", "choice", "yes_no"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.number()]),
      hint: z.string().optional(),
      // For AI-powered semantic validation (open-ended questions)
      answerCriteria: z.string().optional(),
      useAIValidation: z.boolean().optional(),
    })).min(2).max(3),
  }),
  
  // Optional practice activities for interactive learning
  practicePhase: z.object({
    introduction: z.string(),
    activities: z.array(z.object({
      activityId: z.string(),
      prompt: z.string(),
      interactionType: z.enum(["tap_choice", "fill_blank", "match", "count"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.number()]),
      successFeedback: z.string(),
      tryAgainFeedback: z.string(),
      hint: z.string().optional(),
    })),
  }).optional(),
  
  parentNote: z.string(),
  
  faithIntegration: z.object({
    scripture: z.string().optional(),
    tieIn: z.string().optional(),
    optionalPrayer: z.string().optional(),
  }).optional(),
});

type AILessonResponse = z.infer<typeof AILessonResponseSchema>;

export class AdaptiveEngine {
  
  private determineDifficulty(settings: ChildSettings, subject: string): DifficultyLevel {
    const lastOutcome = settings.lastDifficultyOutcome;
    const confidence = settings.confidence || 50;
    
    if (lastOutcome === "too_hard" || confidence < 30) {
      return "easy";
    }
    if (lastOutcome === "too_easy" || confidence > 70) {
      return "hard";
    }
    
    if (subject === "MATH") {
      const stage = settings.mathStage || "within_5";
      if (stage === "within_5") return "easy";
      if (stage === "within_20") return "hard";
    }
    
    if (subject === "READING") {
      const stage = settings.readingStage || "pre_reader";
      if (stage === "pre_reader") return "easy";
      if (stage === "fluent_for_grade") return "hard";
    }
    
    return "medium";
  }
  
  private determineMode(settings: ChildSettings): LearningMode {
    const preferredModes = settings.preferredModes || ["hands_on"];
    return (preferredModes[0] as LearningMode) || "hands_on";
  }
  
  private getFaithContext(faithMode: string): string {
    switch (faithMode) {
      case "FULL_DISCIPLESHIP":
        return "Integrate non-denominational, Jesus-centered Biblical teaching. Include scripture memorization, prayer prompts, and connections to Christian principles. Stay non-political and avoid denomination-specific doctrine. When age-appropriate, encourage curious exploration of related ideas without penalty.";
      case "FAITH_FORWARD":
        return "Weave scripture and Jesus-centered Christian values naturally into the lesson when they fit honestly. Include a relevant Bible verse and show how the skill connects to faith. Stay non-denominational and apolitical. Leave room for the child to ask questions and explore.";
      case "VALUES_ONLY":
        return "Keep the main lesson body free of explicit scripture and prayer. Focus on character virtues — kindness, honesty, patience, perseverance, curiosity — woven through the lesson naturally. STILL produce the faithIntegration block with a relevant scripture and a 2-3 sentence non-denominational, scholarly Jesus-centered perspective; the UI will surface it only via an opt-in 'Faith Lens' button. Never editorialize on contested politics.";
      default:
        return "Use a non-denominational, Jesus-centered Christian frame at a gentle level. Stay strictly apolitical. Allow space for the child to wonder and explore.";
    }
  }
  
  // Build lesson instance from parent's lesson request
  async buildLessonInstanceForParent(
    childId: string,
    subject: string,
    parentLessonId: string,
    parentConfig: {
      skillTag?: string;
      parentNotes?: string;
      sessionLengthMinutes?: number;
      preferredMode?: string;
    }
  ): Promise<LessonInstance> {
    const child = await storage.getChildById(childId);
    if (!child || !child.settings) {
      throw new Error("Child not found or settings missing");
    }
    
    const settings = child.settings;
    const today = new Date().toISOString().split('T')[0];
    
    const difficulty = this.determineDifficulty(settings, subject);
    const mode = (parentConfig.preferredMode as LearningMode) || this.determineMode(settings);
    
    // Use parent notes to customize the objective
    let targetSkillName = parentConfig.skillTag || this.getDefaultSkillName(subject, child.grade);
    let objective = parentConfig.parentNotes || this.getDefaultObjective(subject, child.grade);
    
    const lessonContent = await this.generateLessonWithAI({
      childName: child.name,
      grade: child.grade,
      subject,
      targetSkillName,
      objective,
      difficulty,
      mode,
      faithMode: settings.faithMode,
      sessionLength: parentConfig.sessionLengthMinutes || settings.sessionLengthMinutes || 10,
      template: undefined, // Parent lessons don't use templates
    });
    
    // Map the new schema to storage format
    const teachPhase: TeachPhase = {
      conceptExplanation: lessonContent.teach.text,
      vocabulary: lessonContent.teach.vocabulary,
      workedExample: lessonContent.teach.workedExample || {
        problem: "",
        steps: [],
        answer: "",
      },
    };
    
    const steps = lessonContent.do.map(step => ({
      stepNumber: step.stepNumber,
      parentInstructions: step.parentInstructions,
      childTask: step.childTask,
      materials: step.materials,
      duration: step.duration,
    }));
    
    const assessment = {
      questions: lessonContent.check.questions,
    };
    
    const instance = await storage.createLessonInstance({
      childId,
      parentLessonId,
      difficultyUsed: difficulty,
      modeUsed: mode,
      subject,
      title: lessonContent.title,
      goal: lessonContent.goal,
      objective,
      targetSkillName,
      steps,
      teachPhase,
      practicePhase: lessonContent.practicePhase,
      parentNote: lessonContent.parentNote,
      assessment,
      faithIntegration: lessonContent.faithIntegration,
      date: today,
    });
    
    return instance;
  }
  
  async buildLessonInstance(
    childId: string,
    subject?: string,
    skillId?: string
  ): Promise<LessonInstance> {
    const child = await storage.getChildById(childId);
    if (!child || !child.settings) {
      throw new Error("Child not found or settings missing");
    }
    
    const settings = child.settings;
    const today = new Date().toISOString().split('T')[0];
    
    const chosenSubject = subject || this.selectNextSubject(settings);
    const difficulty = this.determineDifficulty(settings, chosenSubject);
    const mode = this.determineMode(settings);
    
    let template: LessonTemplate | undefined;
    let targetSkillName = "";
    let objective = "";
    let selectedSkillId: string | undefined = skillId;
    
    if (skillId) {
      const skill = await storage.getSkillById(skillId);
      if (skill) {
        template = await storage.getLessonTemplateBySkill(skill.name, child.grade);
        targetSkillName = skill.name;
        objective = skill.description;
      }
    }
    
    if (!template && !skillId) {
      const nextSkill = await progressionEngine.selectNextSkillForLesson(
        childId,
        child.grade,
        chosenSubject
      );
      
      if (nextSkill) {
        selectedSkillId = nextSkill.id;
        targetSkillName = nextSkill.name;
        const skill = await storage.getSkillById(nextSkill.id);
        if (skill) {
          objective = skill.description;
          template = await storage.getLessonTemplateBySkill(skill.name, child.grade);
        }
        console.log(`[PROGRESSION] Selected next skill: ${nextSkill.name} (mastery: ${nextSkill.masteryLevel})`);
      }
    }
    
    if (!template) {
      const templates = await storage.getLessonTemplates(chosenSubject, child.grade);
      if (templates.length > 0) {
        template = templates[Math.floor(Math.random() * templates.length)];
        if (!targetSkillName) targetSkillName = template.targetSkillName;
        if (!objective) objective = template.objective;
      } else {
        if (!targetSkillName) targetSkillName = this.getDefaultSkillName(chosenSubject, child.grade);
        if (!objective) objective = this.getDefaultObjective(chosenSubject, child.grade);
      }
    }
    
    const learningProfile = await progressionEngine.getLearningProfileForAI(childId);
    
    const lessonContent = await this.generateLessonWithAI({
      childName: child.name,
      grade: child.grade,
      subject: chosenSubject,
      targetSkillName,
      objective,
      difficulty,
      mode,
      faithMode: settings.faithMode,
      sessionLength: settings.sessionLengthMinutes || 10,
      template,
      learningProfile,
    });
    
    // Map the new schema to storage format
    // Convert teach -> teachPhase, do -> steps, check -> assessment for backward compatibility
    const teachPhase: TeachPhase = {
      conceptExplanation: lessonContent.teach.text,
      vocabulary: lessonContent.teach.vocabulary,
      workedExample: lessonContent.teach.workedExample || {
        problem: "",
        steps: [],
        answer: "",
      },
    };
    
    const steps = lessonContent.do.map(step => ({
      stepNumber: step.stepNumber,
      parentInstructions: step.parentInstructions,
      childTask: step.childTask,
      materials: step.materials,
      duration: step.duration,
    }));
    
    const assessment = {
      questions: lessonContent.check.questions,
    };
    
    const instance = await storage.createLessonInstance({
      childId,
      lessonTemplateId: template?.id,
      difficultyUsed: difficulty,
      modeUsed: mode,
      subject: chosenSubject,
      title: lessonContent.title,
      goal: lessonContent.goal,
      objective,
      targetSkillName,
      steps,
      teachPhase,
      practicePhase: lessonContent.practicePhase,
      parentNote: lessonContent.parentNote,
      assessment,
      faithIntegration: lessonContent.faithIntegration,
      date: today,
    });
    
    return instance;
  }
  
  private selectNextSubject(settings: ChildSettings): string {
    const subjects = settings.subjectsEnabled || ["READING", "MATH", "CHARACTER"];
    const validSubjects = subjects.filter(s => ["READING", "MATH", "CHARACTER"].includes(s));
    return validSubjects[Math.floor(Math.random() * validSubjects.length)] || "MATH";
  }
  
  private getGradeAgeRange(grade: string): string {
    const ranges: Record<string, string> = {
      K: "ages 5-6",
      "1": "ages 6-7",
      "2": "ages 7-8",
      "3": "ages 8-9",
      "4": "ages 9-10",
      "5": "ages 10-11",
      "6": "ages 11-12",
      "7": "ages 12-13",
      "8": "ages 13-14",
    };
    return ranges[grade] || "ages 5-14";
  }

  private getGradeBand(grade: string): "K-2" | "3-5" | "6-8" {
    if (["K", "1", "2"].includes(grade)) return "K-2";
    if (["3", "4", "5"].includes(grade)) return "3-5";
    return "6-8";
  }

  private getDefaultSkillName(subject: string, grade: string): string {
    const defaults: Record<string, Record<string, string>> = {
      MATH: {
        K: "counting_to_10",
        "1": "addition_within_10",
        "2": "addition_within_20",
        "3": "multiplication_basics",
        "4": "fractions_introduction",
        "5": "decimals_and_percentages",
      },
      READING: {
        K: "letter_recognition",
        "1": "sight_words",
        "2": "reading_comprehension",
        "3": "vocabulary_building",
        "4": "reading_analysis",
        "5": "critical_reading",
      },
      CHARACTER: {
        K: "kindness",
        "1": "honesty",
        "2": "patience",
        "3": "responsibility",
        "4": "integrity",
        "5": "leadership",
      },
    };
    return defaults[subject]?.[grade] || "general_practice";
  }
  
  private getDefaultObjective(subject: string, grade: string): string {
    const defaults: Record<string, Record<string, string>> = {
      MATH: {
        K: "Count objects from 1 to 10",
        "1": "Add numbers within 10 using hands-on materials",
        "2": "Add and subtract numbers within 20",
        "3": "Understand multiplication as repeated addition and learn basic facts",
        "4": "Understand fractions as parts of a whole and compare simple fractions",
        "5": "Convert between fractions, decimals, and percentages",
      },
      READING: {
        K: "Recognize and name uppercase and lowercase letters",
        "1": "Read common sight words fluently",
        "2": "Read and understand grade-level stories",
        "3": "Learn new vocabulary words and use context clues",
        "4": "Analyze story elements including characters, setting, and plot",
        "5": "Evaluate texts critically and identify author's purpose",
      },
      CHARACTER: {
        K: "Show kindness to others through actions",
        "1": "Tell the truth even when it's hard",
        "2": "Wait patiently and persevere through challenges",
        "3": "Take responsibility for your actions and belongings",
        "4": "Do the right thing even when no one is watching",
        "5": "Lead by example and encourage others",
      },
    };
    return defaults[subject]?.[grade] || "Practice and grow in this area";
  }
  
  private async generateLessonWithAI(params: {
    childName: string;
    grade: string;
    subject: string;
    targetSkillName: string;
    objective: string;
    difficulty: DifficultyLevel;
    mode: LearningMode;
    faithMode: string;
    sessionLength: number;
    template?: LessonTemplate;
    learningProfile?: {
      strengths: string[];
      struggles: string[];
      preferredModes: string[];
      averageSessionMinutes: number;
      hintUsagePattern: string;
      voiceConfidenceAverage: number;
      recentSuccessRate: number;
    };
  }): Promise<AILessonResponse> {
    const modeInstructions = this.getModeInstructions(params.mode);
    const difficultyContext = this.getDifficultyContext(params.difficulty, params.subject);
    const faithContext = this.getFaithContext(params.faithMode);
    
    const templateContext = params.template 
      ? `Use this lesson template as a guide:
        Difficulty settings: ${JSON.stringify(params.template.difficultyLevels[params.difficulty])}
        Mode instructions: ${JSON.stringify(params.template.modes[params.mode])}`
      : "";
    
    const gradeBand = this.getGradeBand(params.grade);
    const ageRange = this.getGradeAgeRange(params.grade);
    
    const gradeSpecificGuidance = gradeBand === "K-2"
      ? `GRADE K-2 SPECIFIC GUIDANCE:
- Use very simple vocabulary and short sentences
- Default to physical, tactile, hands-on activities with real objects — keep screen time minimal
- Lean on TTS read-aloud and voice answers; assume the child may not yet read independently
- Include lots of visual cues and repetition
- Keep explanations brief (2-3 sentences max)
- Use playful, encouraging language
- Activities should involve counting, sorting, matching physical items
- Assessment questions should be simple choice or single-digit numbers`
      : gradeBand === "3-5"
      ? `GRADE 3-5 SPECIFIC GUIDANCE:
- Use grade-appropriate vocabulary with some challenge words
- Include both hands-on activities AND written work
- Explanations can be more detailed (3-5 sentences)
- Activities can include research, writing paragraphs, multi-step problems
- Assessment can include short answer questions and multi-step calculations
- Include opportunities for independent thinking and reasoning
- Can reference real-world applications and connections
- It is appropriate for the child to begin using simple digital tools (typing, structured search) under guidance`
      : `GRADE 6-8 SPECIFIC GUIDANCE:
- Use mature, precise vocabulary; assume the student reads fluently
- Lessons can be project- or pursuit-driven, pulling skills into a real outcome the student cares about
- Activities can include real software/tools (code editors, spreadsheets, design tools, AI as a collaborator)
- Explanations can be 4-7 sentences with proper terminology and "why this matters" framing
- Assessment can include written reasoning, multi-step problems, evidence and citation
- Encourage independent investigation; AI tutoring is appropriate as a thinking partner, not an answer source
- Avoid childish framing (no cartoon mascot leaning, no "kiddo" voice); treat the student as a serious learner`;

    const systemPrompt = `You are a thoughtful K-8 homeschool curriculum designer creating a lesson for a grade ${params.grade} student (${ageRange}).

EDITORIAL STANCE (non-negotiable):
- Foundation: a non-denominational, Jesus-centered Christian frame at the depth specified below — never denomination-specific.
- Apolitical: do not take sides on contested political or social issues, partisan figures, or culture-war topics. If a topic naturally surfaces, present it neutrally and at age-appropriate depth.
- Freedom to explore: when the child wonders about other ideas, traditions, or worldviews, treat that curiosity as healthy. Never shame exploration.
- Real-world relevance: tie the skill to something the child can actually use, build, observe, or create in their life.
- Montessori-style: a child can be at different grade levels per subject. Never frame the child as "behind" or compare them to other kids — meet them where they are.
- Faith Lens (always present, never hidden): ALWAYS populate the faithIntegration block, regardless of mode. The Christian foundation is part of the product in every mode. The UI decides how prominently it surfaces in the lesson body — but the Faith Lens button is ALWAYS visible and one tap away. Faith mode names parent-facing are "Subtle" / "Woven in" / "Centered" — NEVER use the words "hidden," "off," "disabled," or "no faith" in any generated copy. Use a scholarly, charitable, non-political voice (e.g., the register of teachers like Wes Huff, Tim Keller, or N.T. Wright) — not folksy or proselytizing.

CRITICAL: Every lesson MUST have exactly 4 sections - GOAL, TEACH, DO, CHECK. Missing any section is a failure.

Follow this "I Do → We Do → You Do" pedagogy:
1. GOAL (Required): One sentence starting "Today you will learn..." stating the learning objective
2. TEACH (Required - I Do): Clear concept explanation with worked example showing HOW to do it
3. DO (Required - We Do): 2-4 action steps with specific, tangible tasks
4. CHECK (Required - You Do): 2-3 assessment questions to check understanding

${gradeSpecificGuidance}

CRITICAL DO-STEP RULES:
- Each childTask MUST be a SPECIFIC ACTION the child performs
- Each childTask MUST start with an ACTION VERB: Count, Draw, Write, Build, Sort, Match, Trace, Cut, Glue, Act out, Clap, Point to, Circle, Color, Stack, Put, Find, Pick up, Hold up, Show me, Calculate, Explain, Research, Create, Solve
- Each childTask MUST include a SPECIFIC QUANTITY or MEASURABLE OUTCOME
- Activities should use appropriate materials for the grade level

GOOD childTask examples for ${gradeBand}:
${gradeBand === "K-2" ? `- "Count 5 red blocks and stack them in a tower"
- "Write the letter B three times on your paper"
- "Draw a circle around all the words that start with 'S'"
- "Sort your crayons into 2 groups: warm colors and cool colors"
- "Hold up 3 fingers on one hand and 2 on the other, then count them all"` : gradeBand === "3-5" ? `- "Calculate 3 x 4 by drawing 3 groups of 4 circles, then count the total"
- "Write 3 sentences using at least 2 vocabulary words from the lesson"
- "Create a simple diagram showing the water cycle with labels"
- "Solve 2/4 + 1/4 by drawing fraction bars and shading the correct parts"
- "Research one fact about your topic and write it in your own words"` : `- "Outline a 5-paragraph argument for one position on this question, with at least 2 cited sources"
- "Build a working pre-algebra word-problem solver in a spreadsheet for the equation type taught today"
- "Write a 200-word reflection comparing today's text to one you've read before, citing specific passages"
- "Design a simple experiment to test the hypothesis we discussed; list variables, control, and what data you'd collect"
- "Use an AI tutor to brainstorm three angles on this topic, then evaluate which is strongest and explain why"`}

BAD childTask examples (TOO VAGUE - never use these):
- "Let's practice together!" (no specific action)
- "Try your best!" (no tangible task)
- "Now it's your turn!" (what should they DO?)
- "Think about the answer" (not a physical action)

Your lessons should be:
- Age-appropriate for grade ${params.grade} (${ageRange})
- Engaging with minimal unnecessary screen time
- Encouraging and never shaming - celebrate effort, not just results
- About ${params.sessionLength} minutes total

${faithContext}

Learning Mode: ${modeInstructions}

${difficultyContext}

${templateContext}

${this.getLearningProfileContext(params.learningProfile)}

CRITICAL: Return ONLY valid JSON with ALL 4 required sections:
{
  "title": "Engaging lesson title",
  "goal": "Today you will learn to [specific skill in simple words].",
  "teach": {
    "text": "Simple explanation in 2-3 sentences. Start with 'Let me show you how...' or 'Today we are learning...'",
    "vocabulary": [
      {"term": "Word", "definition": "Simple definition a child understands"}
    ],
    "workedExample": {
      "problem": "The problem we'll solve together (e.g., 'Let's solve 2 + 3 together!')",
      "steps": [
        {"stepNumber": 1, "instruction": "First step in simple words", "visual": "Optional emoji"},
        {"stepNumber": 2, "instruction": "Second step", "visual": "Optional"}
      ],
      "answer": "The final answer with celebration (e.g., 'So 2 + 3 = 5! Great job!')"
    }
  },
  "do": [
    {
      "stepNumber": 1,
      "parentInstructions": "Gather 5 small objects (blocks, coins, or cereal pieces) and place them in front of your child",
      "childTask": "Count each object out loud as you touch it. Put 3 objects in one pile and 2 in another pile.",
      "materials": ["5 small household objects", "paper plate or tray"],
      "duration": 3
    },
    {
      "stepNumber": 2,
      "parentInstructions": "Guide your child to combine the piles and count the total together",
      "childTask": "Push both piles together. Count all the objects from 1 to 5. Hold up 5 fingers to show the answer!",
      "duration": 3
    },
    {
      "stepNumber": 3,
      "parentInstructions": "Have your child practice independently with new numbers",
      "childTask": "Draw 2 apples on your paper. Then draw 2 more apples. Count all your apples and write the number.",
      "materials": ["paper", "crayons"],
      "duration": 4
    }
  ],
  "check": {
    "questions": [
      {
        "questionId": "q1",
        "prompt": "Fun, age-appropriate question",
        "type": "choice",
        "options": ["Option A", "Option B", "Option C"],
        "correctAnswer": "Option A"
      },
      {
        "questionId": "q2",
        "prompt": "Second question",
        "type": "number",
        "correctAnswer": 5
      }
    ]
  },
  "practicePhase": {
    "introduction": "Encouraging message like 'Now it's your turn to practice!'",
    "activities": [
      {
        "activityId": "p1",
        "prompt": "Question for child to answer",
        "interactionType": "tap_choice",
        "options": ["2", "3", "4", "5"],
        "correctAnswer": "4",
        "successFeedback": "Celebratory message when correct",
        "tryAgainFeedback": "Kind, encouraging message when wrong",
        "hint": "Helpful hint"
      }
    ]
  },
  "parentNote": "Brief note to encourage and guide the parent",
  "faithIntegration": {
    "scripture": "Required: a Bible verse relevant to the topic (any mode, including VALUES_ONLY). Use a clean, readable translation.",
    "tieIn": "Required: 2-3 sentences in a non-denominational, Jesus-centered, scholarly-yet-accessible voice connecting the lesson topic to faith. Tone register: Wes Huff / Tim Keller — charitable, intellectually serious, never preachy or political.",
    "optionalPrayer": "Optional: a simple prayer. Omit in VALUES_ONLY mode."
  }
}`;

    const userPrompt = `Create a ${params.subject} lesson for ${params.childName} (grade ${params.grade}).

Skill: ${params.targetSkillName}
Objective: ${params.objective}
Difficulty: ${params.difficulty}
Learning Mode: ${params.mode}

REQUIRED: Your response MUST include ALL 4 sections:
1. "goal": One sentence starting "Today you will learn..." 
2. "teach": Object with "text" explaining the concept AND optional "workedExample"
3. "do": Array of 2-4 steps where each "childTask" is a SPECIFIC PHYSICAL ACTION with:
   - An action verb (Count, Draw, Write, Sort, Build, Hold up, Point to, Circle, Color, etc.)
   - A specific quantity or measurable outcome
   - Real objects the child can touch or manipulate
4. "check": Object with "questions" array containing 2-3 assessment questions

CRITICAL: 
- If any of goal, teach.text, do[], or check.questions[] are missing, the lesson will be rejected!
- If any childTask is vague like "Try it!" or "Practice!" it will be REJECTED. Every childTask must describe EXACTLY what to do!

Also include "practicePhase" with 2-3 tap_choice activities for interactive practice.

Remember: A young child is learning this for the first time. Explain it like you're teaching, not testing!`;

    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from AI");
        }
        
        const parsed = JSON.parse(content);
        
        // Pre-validation: Check for critical missing sections before Zod
        const missingFields: string[] = [];
        if (!parsed.goal) missingFields.push("goal");
        if (!parsed.teach?.text) missingFields.push("teach.text");
        if (!parsed.do || !Array.isArray(parsed.do) || parsed.do.length < 2) {
          missingFields.push("do (need 2-4 steps)");
        }
        if (!parsed.check?.questions || !Array.isArray(parsed.check.questions) || parsed.check.questions.length < 2) {
          missingFields.push("check.questions (need 2-3 questions)");
        }
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
        }
        
        // Validate that childTask entries are specific, tangible actions
        // Expanded list includes physical, social, and character-building action verbs
        const actionVerbs = /^(Count|Draw|Write|Build|Sort|Match|Trace|Cut|Glue|Act|Clap|Point|Circle|Color|Stack|Put|Find|Pick|Hold|Show|Push|Say|Sing|Touch|Place|Gather|Make|Create|Look|Move|Open|Close|Fold|Turn|Copy|Name|Tell|Tap|Mark|Connect|Line|Fill|Cross|Check|Add|Remove|Separate|Combine|Arrange|Group|Collect|Read|Spell|Sound|Listen|Stand|Give|Walk|Run|Jump|Sit|Hug|Share|Help|Pray|Thank|Ask|Answer|Wave|Smile|Shake|Bow|Nod|Raise|Lower|Stretch|Bend|Twist|Spin|Roll|Throw|Catch|Kick|Bounce|Squeeze|Press|Pull|Lift|Drop|Set|Lay|Hang|Stick|Wrap|Tie|Pour|Scoop|Stir|Mix|Sprinkle|Measure|Carry|Toss|Flip|Slide|Swing|Pat|Rub|Knock|Ring|Blow|Breathe|Sniff|Smell|Taste|Feel|Hear|See|Watch|Stare|Peek|Blink|Wink|Frown|Grin|Laugh|Whisper|Shout|Call|Greet|Introduce|Welcome|Invite|Offer|Accept|Agree|Promise|Apologize|Forgive|Congratulate|Compliment|Encourage|Comfort|Calm|Remind|Warn|Teach|Learn|Practice|Repeat|Review|Quiz|Test|Compare|Classify|Organize|Plan|Prepare|Clean|Tidy|Adjust|Fix|Repair|Improve|Select|Highlight|Underline|Explain|Describe|Define|Identify|Recognize|Remember|Recall|Recite|Memorize|Visualize|Imagine|Pretend|Role-play|Demonstrate|Model|Illustrate|Diagram|Chart|Graph|Map|Outline|Summarize|Guide|Lead|Direct|Manage|Monitor|Track|Follow|Chase|Seek|Search|Explore|Discover|Reveal|Display|Present|Perform|Execute|Apply|Use|Operate|Start|Begin|Launch|Activate|Get|Rise|Develop|Grow|Expand|Extend|Reach|Achieve|Accomplish|Complete|Finish|End|Conclude|Try|Attempt|Face|Meet|Overcome|Support|Maintain|Protect|Guard|Defend|Cover|Hide|Unite|Join|Attach|Secure|Lock|Unlock|Seal|Mend|Restore|Renew|Recharge|Refill)/i;
        // More lenient: includes articles, relationship words, and common contexts for character lessons
        const hasQuantifier = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|all|each|every|both|some|many|few|several|once|twice|times?|a|an|the|your|someone|person|people|family|friend|teacher|parent|sibling|neighbor|classmate|member|partner|buddy|helper|paper|card|picture|drawing|note|letter|list|chart|poster|book|page|story|verse|prayer|song|word|sentence|object|item|block|bead|piece|step|time|minute|second)\b/i;
        
        const vagueChildTasks: string[] = [];
        if (Array.isArray(parsed.do)) {
          for (const step of parsed.do) {
            const childTask = step.childTask;
            if (childTask) {
              // Check if it starts with an action verb
              if (!actionVerbs.test(childTask.trim())) {
                vagueChildTasks.push(`Step ${step.stepNumber}: "${childTask.slice(0, 40)}..." - must start with action verb`);
              }
              // Check if it contains a quantifier/object/context (more lenient for character lessons)
              else if (!hasQuantifier.test(childTask)) {
                vagueChildTasks.push(`Step ${step.stepNumber}: "${childTask.slice(0, 40)}..." - needs specific quantity/number`);
              }
            }
          }
        }
        
        if (vagueChildTasks.length > 0) {
          console.warn(`[AdaptiveEngine] Vague childTasks detected:`, vagueChildTasks);
          throw new Error(`DO steps must have specific, tangible actions: ${vagueChildTasks.join("; ")}`);
        }
        
        const validated = AILessonResponseSchema.parse(parsed);
        console.log(`[AdaptiveEngine] Successfully generated lesson on attempt ${attempt + 1}`);
        return validated;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[AdaptiveEngine] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          console.log(`[AdaptiveEngine] Retrying...`);
        }
      }
    }
    
    console.error("[AdaptiveEngine] All attempts failed:", lastError?.message);
    throw new Error(`AI lesson generation failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}. Please try again.`);
  }
  
  private getModeInstructions(mode: LearningMode): string {
    const instructions: Record<LearningMode, string> = {
      hands_on: "Use physical objects, manipulatives, and hands-on activities. Think blocks, beads, household items, art supplies.",
      visual: "Use drawings, pictures, diagrams, and visual representations. Include coloring, drawing, and visual patterns.",
      story: "Wrap the lesson in an engaging story. Use characters, scenarios, and narrative to teach concepts.",
    };
    return instructions[mode];
  }
  
  private getDifficultyContext(difficulty: DifficultyLevel, subject: string): string {
    if (subject === "MATH") {
      switch (difficulty) {
        case "easy": return "Use numbers 0-5 only. Keep problems simple with concrete objects.";
        case "medium": return "Use numbers 0-10. Include some word problems with familiar contexts.";
        case "hard": return "Use numbers 0-20. Include missing addend problems and multi-step thinking.";
      }
    }
    if (subject === "READING") {
      switch (difficulty) {
        case "easy": return "Focus on single letters and sounds. Use picture clues heavily.";
        case "medium": return "Include CVC words and simple blending. Use sight words.";
        case "hard": return "Include longer words, simple sentences, and comprehension questions.";
      }
    }
    switch (difficulty) {
      case "easy": return "Keep concepts very simple and concrete. Lots of repetition.";
      case "medium": return "Introduce concepts with examples and guided practice.";
      case "hard": return "Include deeper thinking and application to real situations.";
    }
  }
  
  private getLearningProfileContext(profile?: {
    strengths: string[];
    struggles: string[];
    preferredModes: string[];
    averageSessionMinutes: number;
    hintUsagePattern: string;
    voiceConfidenceAverage: number;
    recentSuccessRate: number;
  }): string {
    if (!profile) return "";
    
    const insights: string[] = [];
    
    if (profile.strengths.length > 0) {
      insights.push(`This child shows strength in: ${profile.strengths.join(", ")}`);
    }
    
    if (profile.struggles.length > 0) {
      insights.push(`Areas needing extra support: ${profile.struggles.join(", ")} - provide more scaffolding and encouragement`);
    }
    
    if (profile.hintUsagePattern === "needs_support") {
      insights.push("This child often uses hints - include progressive hints and break steps into smaller pieces");
    } else if (profile.hintUsagePattern === "independent") {
      insights.push("This child works independently - can handle slightly more challenging problems");
    }
    
    if (profile.recentSuccessRate < 60) {
      insights.push("Recent lessons have been challenging - simplify language and add more examples");
    } else if (profile.recentSuccessRate > 85) {
      insights.push("Recent lessons have been mastered quickly - can stretch with slightly harder content");
    }
    
    if (profile.voiceConfidenceAverage < 60) {
      insights.push("Voice answers show uncertainty - phrase questions to build confidence");
    }
    
    if (insights.length === 0) return "";
    
    return `PERSONALIZATION (adapt the lesson based on this child's learning patterns):
${insights.map(i => `- ${i}`).join("\n")}`;
  }
  
  private createFallbackLesson(params: {
    childName: string;
    grade: string;
    subject: string;
    targetSkillName: string;
    objective: string;
    difficulty: DifficultyLevel;
    mode: LearningMode;
    faithMode: string;
    sessionLength: number;
  }): AILessonResponse {
    const fallbackTeach = this.getFallbackTeach(params.subject, params.targetSkillName, params.difficulty);
    const fallbackPractice = this.getFallbackPracticePhase(params.subject, params.targetSkillName, params.difficulty);
    const fallbackCheck = this.getFallbackCheck(params.subject, params.targetSkillName);
    
    return {
      title: `${params.subject} Fun: ${params.targetSkillName}`,
      goal: `Today you will learn ${params.objective.toLowerCase()}.`,
      teach: fallbackTeach,
      do: this.getFallbackDoSteps(params.subject, params.childName, params.difficulty),
      check: fallbackCheck,
      practicePhase: fallbackPractice,
      parentNote: `Take your time and follow ${params.childName}'s lead. If they seem frustrated, take a break and try again later. Celebrate all efforts!`,
      // faithIntegration is always populated; UI decides whether to auto-display or surface only via the opt-in Faith Lens button (per faithMode).
      faithIntegration: {
        scripture: "Proverbs 2:6 — For the Lord gives wisdom; from his mouth come knowledge and understanding.",
        tieIn: "Learning is one of the gifts God gives us. Every time we learn something new, we're using a gift He placed in us.",
        optionalPrayer: params.faithMode === "VALUES_ONLY" ? undefined : "Dear God, thank You for helping us learn today. Amen.",
      },
    };
  }
  
  private getFallbackDoSteps(subject: string, childName: string, difficulty: DifficultyLevel): AILessonResponse["do"] {
    if (subject === "MATH") {
      return [
        {
          stepNumber: 1,
          parentInstructions: `Gather 5 small objects like blocks, coins, or cereal pieces. Place them in front of ${childName}.`,
          childTask: "Count each object out loud as you touch it: 1, 2, 3, 4, 5. Put 3 in one pile and 2 in another.",
          materials: ["5 small household objects", "2 bowls or plates"],
          duration: 3,
        },
        {
          stepNumber: 2,
          parentInstructions: "Guide your child to combine the piles and count the total together.",
          childTask: "Push both piles together. Count all the objects from 1 to 5. Hold up 5 fingers to show the answer!",
          duration: 3,
        },
        {
          stepNumber: 3,
          parentInstructions: "Give your child paper and have them practice independently with drawing.",
          childTask: "Draw 3 circles on your paper. Draw 2 more circles. Count all your circles and write the number 5!",
          materials: ["paper", "crayons or pencil"],
          duration: 4,
        },
      ];
    } else if (subject === "READING") {
      return [
        {
          stepNumber: 1,
          parentInstructions: `Write the letter on paper or use letter cards. Point to it and say the letter name and sound with ${childName}.`,
          childTask: "Point to the letter and say its name 3 times. Then say the sound it makes 3 times.",
          materials: ["paper", "marker or crayons", "letter cards (optional)"],
          duration: 3,
        },
        {
          stepNumber: 2,
          parentInstructions: "Guide your child to trace the letter shape with their finger, then with a crayon.",
          childTask: "Trace the letter with your finger in the air 3 times. Then write the letter 3 times on your paper.",
          materials: ["paper", "crayons"],
          duration: 3,
        },
        {
          stepNumber: 3,
          parentInstructions: "Help your child find objects or pictures that start with this letter sound.",
          childTask: "Find 3 things in the room that start with this letter sound. Point to each one and say its name!",
          duration: 4,
        },
      ];
    } else {
      return [
        {
          stepNumber: 1,
          parentInstructions: `Discuss the character trait with ${childName}. Share an example from your own life.`,
          childTask: "Draw a picture of someone showing kindness. Color your picture with 3 or more colors.",
          materials: ["paper", "crayons or colored pencils"],
          duration: 3,
        },
        {
          stepNumber: 2,
          parentInstructions: "Role-play a scenario where your child can practice the character trait.",
          childTask: "Act out 2 ways you could help a friend who dropped their crayons. Show each way one at a time!",
          duration: 3,
        },
        {
          stepNumber: 3,
          parentInstructions: "Help your child think of a real way to practice this trait today.",
          childTask: "Think of 1 way you can be kind today. Tell me your idea and draw a picture of it!",
          materials: ["paper", "crayons"],
          duration: 4,
        },
      ];
    }
  }
  
  private getFallbackPracticePhase(subject: string, skillName: string, difficulty: DifficultyLevel): AILessonResponse["practicePhase"] {
    if (subject === "MATH") {
      return {
        introduction: "Great job learning! Now it's your turn to practice!",
        activities: [
          {
            activityId: "p1",
            prompt: "What is 1 + 1?",
            interactionType: "tap_choice",
            options: ["1", "2", "3", "4"],
            correctAnswer: "2",
            successFeedback: "Amazing! 1 + 1 = 2! You're a math star!",
            tryAgainFeedback: "Good try! Let's count together: 1... and 1 more... that's 2!",
            hint: "Use your fingers! Hold up 1 finger, then 1 more. How many fingers do you have up?",
          },
          {
            activityId: "p2",
            prompt: "What is 2 + 1?",
            interactionType: "tap_choice",
            options: ["2", "3", "4", "5"],
            correctAnswer: "3",
            successFeedback: "Wonderful! 2 + 1 = 3! You're doing great!",
            tryAgainFeedback: "Nice effort! Let's try again. Start with 2 and add 1 more.",
            hint: "Hold up 2 fingers, then add 1 more finger. Now count them all!",
          },
        ],
      };
    } else if (subject === "READING") {
      return {
        introduction: "You're learning so well! Let's practice together!",
        activities: [
          {
            activityId: "p1",
            prompt: "What sound does the letter 'C' make?",
            interactionType: "tap_choice",
            options: ["kuh", "sss", "mmm", "tuh"],
            correctAnswer: "kuh",
            successFeedback: "Yes! 'C' says 'kuh' like in 'cat'! Fantastic!",
            tryAgainFeedback: "Good try! Think of the word 'cat'. What sound do you hear at the start?",
            hint: "Say 'cat' slowly. The first sound is what 'C' says!",
          },
          {
            activityId: "p2",
            prompt: "Which word rhymes with 'cat'?",
            interactionType: "tap_choice",
            options: ["dog", "hat", "bird", "sun"],
            correctAnswer: "hat",
            successFeedback: "You got it! 'Cat' and 'hat' both end with '-at'!",
            tryAgainFeedback: "Let's listen again. Cat... hat... They sound the same at the end!",
            hint: "Words that rhyme sound the same at the end. Cat ends with '-at'. Which word also ends with '-at'?",
          },
        ],
      };
    } else {
      return {
        introduction: "You're learning to be kind! Let's practice making good choices!",
        activities: [
          {
            activityId: "p1",
            prompt: "Your friend drops their crayons. What should you do?",
            interactionType: "tap_choice",
            options: ["Walk away", "Help pick them up", "Laugh", "Take them"],
            correctAnswer: "Help pick them up",
            successFeedback: "That's right! Helping others is so kind! You have a caring heart!",
            tryAgainFeedback: "Think about what would make your friend feel happy and loved.",
            hint: "What would you want someone to do if you dropped YOUR crayons?",
          },
          {
            activityId: "p2",
            prompt: "Someone is sitting alone at lunch. What's the kind thing to do?",
            interactionType: "tap_choice",
            options: ["Ignore them", "Ask them to join you", "Make fun of them", "Run away"],
            correctAnswer: "Ask them to join you",
            successFeedback: "Beautiful! Including others is such a wonderful way to show kindness!",
            tryAgainFeedback: "Imagine how it feels to be alone. What would make that person smile?",
            hint: "Everyone likes to have friends! What would make them feel included?",
          },
        ],
      };
    }
  }
  
  private getFallbackTeach(subject: string, skillName: string, difficulty: DifficultyLevel): AILessonResponse["teach"] {
    if (subject === "MATH") {
      return {
        text: "Today we're going to learn about numbers! Numbers help us count things around us. When we add numbers, we put things together to find out how many we have in total.",
        vocabulary: [
          { term: "Add", definition: "Put things together to find the total" },
          { term: "Count", definition: "Say numbers in order while pointing to things" },
        ],
        workedExample: {
          problem: "Let's solve 2 + 1 together!",
          steps: [
            { stepNumber: 1, instruction: "First, hold up 2 fingers on one hand", visual: "2" },
            { stepNumber: 2, instruction: "Now hold up 1 finger on your other hand", visual: "1" },
            { stepNumber: 3, instruction: "Count all your fingers together: 1, 2, 3!", visual: "3" },
          ],
          answer: "So 2 + 1 = 3! Great job!",
        },
      };
    } else if (subject === "READING") {
      return {
        text: "Today we're going to explore letters and sounds! Every letter makes a special sound. When we put sounds together, we can read words!",
        vocabulary: [
          { term: "Letter", definition: "A symbol that makes a sound" },
          { term: "Sound", definition: "What a letter says when we read it" },
        ],
        workedExample: {
          problem: "Let's read the word 'cat' together!",
          steps: [
            { stepNumber: 1, instruction: "First, look at the letter C. It says 'cuh'", visual: "C" },
            { stepNumber: 2, instruction: "Next is A. It says 'aaa'", visual: "A" },
            { stepNumber: 3, instruction: "Last is T. It says 'tuh'", visual: "T" },
            { stepNumber: 4, instruction: "Now blend them together: cuh-aaa-tuh... CAT!", visual: "CAT" },
          ],
          answer: "You read 'cat'! Amazing!",
        },
      };
    } else {
      return {
        text: "Today we're going to learn about being kind! Kindness means being nice and helpful to others. When we are kind, we make other people feel happy.",
        vocabulary: [
          { term: "Kindness", definition: "Being nice and caring to others" },
          { term: "Helpful", definition: "Doing things that make life easier for others" },
        ],
        workedExample: {
          problem: "Let's think about how to be kind!",
          steps: [
            { stepNumber: 1, instruction: "Think of someone you can help today", visual: "think" },
            { stepNumber: 2, instruction: "Choose one kind thing to do for them", visual: "heart" },
            { stepNumber: 3, instruction: "Do it with a smile!", visual: "smile" },
          ],
          answer: "Being kind makes everyone feel wonderful, including you!",
        },
      };
    }
  }
  
  private getFallbackCheck(subject: string, skillName: string): AILessonResponse["check"] {
    if (subject === "MATH") {
      return {
        questions: [
          {
            questionId: "q1",
            prompt: "What is 1 + 1?",
            type: "choice",
            options: ["1", "2", "3", "4"],
            correctAnswer: "2",
          },
          {
            questionId: "q2",
            prompt: "What is 2 + 1?",
            type: "number",
            correctAnswer: 3,
          },
        ],
      };
    } else if (subject === "READING") {
      return {
        questions: [
          {
            questionId: "q1",
            prompt: "What sound does the letter 'C' make at the start of 'cat'?",
            type: "choice",
            options: ["kuh", "sss", "mmm", "tuh"],
            correctAnswer: "kuh",
          },
          {
            questionId: "q2",
            prompt: "Can you tell me a word that starts with the letter C?",
            type: "text",
            correctAnswer: "cat",
            answerCriteria: "Any word that starts with the letter C (like cat, car, cup, cake, cow, corn, etc.)",
            useAIValidation: true,
          },
        ],
      };
    } else {
      return {
        questions: [
          {
            questionId: "q1",
            prompt: "What should you do when someone drops their crayons?",
            type: "choice",
            options: ["Walk away", "Help pick them up", "Take them"],
            correctAnswer: "Help pick them up",
          },
          {
            questionId: "q2",
            prompt: "Did you have fun learning about kindness today?",
            type: "yes_no",
            correctAnswer: "yes",
          },
        ],
      };
    }
  }
  
  async generateHintForWrongAnswer(params: {
    question: string;
    correctAnswer: string | number;
    childAnswer: string;
    gradeBand: string;
    modeUsed: string;
    subject: string;
  }): Promise<{
    misconceptionTag: string;
    explanationForChild: string;
    hint: string;
    nextAction: string;
  }> {
    const gradeBand = this.getGradeBand(params.gradeBand);
    const systemPrompt = `You are a kind, encouraging tutor helping a ${gradeBand === "K-2" ? "young child (grades K-2)" : gradeBand === "3-5" ? "student (grades 3-5)" : "student (grades 6-8)"} who gave a wrong answer.
NEVER make the child feel bad. Always be gentle, supportive, and encouraging.
Your goal is to TEACH them HOW to solve the problem step-by-step, not just encourage them.
Stay apolitical. Do not invoke religious framing in a hint unless the underlying lesson is faith content. The child is allowed to be curious about ideas; never shame a question.

CRITICAL: Your hint must EXPLAIN the method/steps to find the answer. Don't just say "try again" - actually TEACH them.

For MATH problems:
- Show them the counting/solving method: "Let's use our fingers! Hold up 3 fingers, then hold up 2 more. Now count them all: 1, 2, 3, 4, 5!"
- Explain the concept: "When we add, we put things together. Let's count them all!"

For READING problems:
- Sound out letters: "Let's break it down! The first letter 'c' makes the 'cuh' sound..."
- Blend sounds together: "Now let's put those sounds together slowly: c-a-t... cat!"

For CHARACTER/other problems:
- Give a relatable example: "Think about a time when someone shared with you. How did that feel?"

Return ONLY valid JSON with this structure:
{
  "misconceptionTag": "one of: counting_error, place_value, guessing, skipped_step, reading_error, letter_confusion, rushed",
  "explanationForChild": "A very simple, kind explanation using words a 5-7 year old understands",
  "hint": "Step-by-step instructions that TEACH the child HOW to solve this specific problem. Be concrete and specific!",
  "nextAction": "one of: simpler_example, guided_practice, try_again, pivot_down_difficulty"
}`;

    const userPrompt = `The child was asked: "${params.question}"
The correct answer is: ${params.correctAnswer}
The child answered: "${params.childAnswer}"
Subject: ${params.subject}
Grade: ${params.gradeBand}
Learning mode: ${params.modeUsed}

IMPORTANT: Create a hint that TEACHES the child the method to solve this problem. Show them the steps!
Don't just encourage - INSTRUCT them on HOW to find the answer.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from AI");
      }
      
      return JSON.parse(content);
      
    } catch (error) {
      console.error("AI hint generation failed, using fallback:", error);
      return {
        misconceptionTag: "unknown",
        explanationForChild: "That's a great try! Let's look at this together.",
        hint: "Take your time and try again. You're doing great!",
        nextAction: "try_again",
      };
    }
  }
  
  async completeLesson(lessonInstanceId: string): Promise<{
    pointsEarned: number;
    newJourneyPosition: number;
    newJourneyStage: number;
    newGrowthPoints: number;
    progression?: {
      xpEarned: number;
      leveledUp: boolean;
      newLevel?: number;
      newTitle?: string;
      unlockedItems?: Array<{ name: string; slug: string }>;
      badgesEarned?: Array<{ name: string; slug: string; xpAwarded: number }>;
      currentStreak: number;
    };
  }> {
    console.log(`[PROGRESSION] Starting lesson completion for lessonId: ${lessonInstanceId}`);
    
    const lesson = await storage.getLessonInstanceById(lessonInstanceId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    console.log(`[PROGRESSION] Lesson found for child: ${lesson.childId}, subject: ${lesson.subject}`);
    
    // Calculate base XP (replaces old points system)
    const xpBase = 15;
    const difficultyBonus = lesson.difficultyUsed === "hard" ? 10 : lesson.difficultyUsed === "medium" ? 5 : 0;
    const xpEarned = xpBase + difficultyBonus;
    
    // Mark lesson as completed
    await storage.updateLessonInstanceStatus(lessonInstanceId, "COMPLETED", xpEarned);
    
    // Update old journey/growth points for backward compatibility
    const updatedSettings = await storage.addGrowthPoints(lesson.childId, xpEarned);
    await storage.addPoints(lesson.childId, xpEarned);
    
    // Award XP in new progression system
    console.log(`[PROGRESSION] Awarding ${xpEarned} XP to child: ${lesson.childId}`);
    const xpResult = await storage.awardXP(lesson.childId, xpEarned);
    console.log(`[PROGRESSION] XP award result:`, JSON.stringify(xpResult));
    
    // Update streak
    const today = new Date().toISOString().split('T')[0];
    console.log(`[PROGRESSION] Updating streak for date: ${today}`);
    const streakResult = await storage.updateStreak(lesson.childId, today);
    console.log(`[PROGRESSION] Streak result:`, JSON.stringify(streakResult));
    
    // Check for and award any earned badges
    const badgesEarned = await storage.checkAndAwardBadges(lesson.childId);
    console.log(`[PROGRESSION] Badges earned: ${badgesEarned.length}`);
    
    // Build progression response
    const progression = {
      xpEarned,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      newTitle: xpResult.newTitle,
      unlockedItems: xpResult.unlockedItems?.map(item => ({
        name: item.name,
        slug: item.slug,
      })),
      badgesEarned: badgesEarned.map(b => ({
        name: b.badge.name,
        slug: b.badge.slug,
        xpAwarded: b.xpAwarded,
      })),
      currentStreak: streakResult?.currentStreak || 0,
    };
    
    return {
      pointsEarned: xpEarned,
      newJourneyPosition: updatedSettings?.journeyPosition || 0,
      newJourneyStage: updatedSettings?.journeyStage || 1,
      newGrowthPoints: updatedSettings?.growthPoints || 0,
      progression,
    };
  }
}

export const adaptiveEngine = new AdaptiveEngine();
