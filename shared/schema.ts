import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("PARENT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const children = pgTable("children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  username: text("username").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const childSettings = pgTable("child_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }).unique(),
  faithMode: text("faith_mode").notNull().default("FAITH_FORWARD"),
  learningStyle: text("learning_style").notNull().default("HANDS_ON_MONTESSORI"),
  subjectsEnabled: json("subjects_enabled").$type<string[]>().notNull().default(sql`'["READING", "MATH", "CHARACTER"]'::json`),
  dyslexiaSupport: boolean("dyslexia_support").notNull().default(false),
  devotionalCadence: text("devotional_cadence").notNull().default("daily"), // daily | weekly
  
  // Learner profile fields for adaptive engine
  readingStage: text("reading_stage").notNull().default("pre_reader"), // pre_reader | early_reader | fluent_for_grade
  mathStage: text("math_stage").notNull().default("within_5"), // within_5 | within_10 | within_20
  preferredModes: json("preferred_modes").$type<string[]>().notNull().default(sql`'["hands_on"]'::json`), // hands_on | visual | story
  sessionLengthMinutes: integer("session_length_minutes").notNull().default(10),
  confidence: integer("confidence").notNull().default(50), // 0-100 scale
  lastDifficultyOutcome: text("last_difficulty_outcome"), // too_easy | just_right | too_hard
  
  // Journey progression
  journeyStage: integer("journey_stage").notNull().default(1),
  journeyPosition: integer("journey_position").notNull().default(0),
  growthPoints: integer("growth_points").notNull().default(0),
});

export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  generatedBy: text("generated_by").notNull().default("AI"),
});

// Type definitions for structured lesson data
export type LessonStep = {
  stepNumber: number;
  parentInstructions: string;
  childTask: string;
};

export type LessonAssessment = {
  type: "skill_check" | "mini_quiz" | "reflection";
  instructions: string;
};

export type FaithIntegration = {
  scripture: string;
  tieIn: string;
  optionalPrayer: string;
};

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  objective: text("objective").notNull(),
  overview: text("overview"),
  materialsNeeded: json("materials_needed").$type<string[]>(),
  lessonSteps: json("lesson_steps").$type<LessonStep[]>(),
  assessment: json("assessment").$type<LessonAssessment>(),
  extensionOptions: json("extension_options").$type<string[]>(),
  faithIntegration: json("faith_integration").$type<FaithIntegration>(),
  customizationPoints: json("customization_points").$type<string[]>(),
  activityType: text("activity_type").notNull(),
  instructionsForChild: text("instructions_for_child").notNull(),
  instructionsForParent: text("instructions_for_parent"),
  scriptureReference: text("scripture_reference"),
  scriptureText: text("scripture_text"),
  reflectionPrompt: text("reflection_prompt"),
  status: text("status").notNull().default("PENDING"),
  completedAt: timestamp("completed_at"),
  parentNotes: text("parent_notes"),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }).unique(),
  questions: json("questions").$type<Array<{
    type: "MULTIPLE_CHOICE" | "YES_NO" | "SHORT_TEXT";
    questionText: string;
    options?: string[];
    correctAnswer: string;
  }>>().notNull(),
  answers: json("answers").$type<string[]>(),
  score: integer("score"),
  completedAt: timestamp("completed_at"),
});

export const rewardState = pgTable("reward_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }).unique(),
  points: integer("points").notNull().default(0),
  badges: json("badges").$type<string[]>().notNull().default(sql`'[]'::json`),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const devotionals = pgTable("devotionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  grade: text("grade").notNull(),
  faithMode: text("faith_mode").notNull(),
  scriptureReference: text("scripture_reference").notNull(),
  scriptureText: text("scripture_text").notNull(),
  title: text("title").notNull(),
  explanation: text("explanation").notNull(),
  reflection: text("reflection").notNull(),
  prayerPrompt: text("prayer_prompt"),
  deeperContext: text("deeper_context"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// PARENT LESSON REQUEST TABLE
// ============================================

// Parent lessons - tracks parent-created lesson requests that drive child lessons
export const parentLessons = pgTable("parent_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  
  // Lesson configuration
  subject: text("subject").notNull(), // READING, MATH, CHARACTER
  skillTag: text("skill_tag"), // e.g., "math.addition_within_10"
  parentNotes: text("parent_notes"), // Free-form description from parent
  
  // Constraints
  sessionLengthMinutes: integer("session_length_minutes").default(10),
  preferredMode: text("preferred_mode"), // hands_on, visual, story
  
  // Status
  status: text("status").notNull().default("PENDING"), // PENDING, GENERATED, COMPLETED
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// ADAPTIVE LEARNING SYSTEM TABLES
// ============================================

// Skills table - K-5 curriculum standards organized by subject and strand
export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(), // READING, MATH, SCIENCE, CHARACTER
  strand: text("strand").notNull(), // e.g., "phonics", "number_sense", "life_science", "kindness"
  gradeLevel: text("grade_level").notNull(), // K, 1, 2, 3, 4, 5
  standardCode: text("standard_code"), // e.g., "CCSS.ELA-LITERACY.RF.K.2"
  name: text("name").notNull(), // e.g., "Letter Sound Recognition"
  description: text("description").notNull(),
  prerequisiteSkillIds: json("prerequisite_skill_ids").$type<string[]>().default(sql`'[]'::json`),
  orderInStrand: integer("order_in_strand").notNull().default(1), // Sequence within the strand
  
  // New progression fields
  strandId: varchar("strand_id"), // Link to curriculum_strands table
  difficultyBand: text("difficulty_band").default("medium"), // easy, medium, hard
  estimatedLessons: integer("estimated_lessons").default(3), // How many lessons to master this skill
});

// Child skill progress - tracks mastery per child per skill
export const childSkillProgress = pgTable("child_skill_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  masteryLevel: text("mastery_level").notNull().default("NOT_STARTED"), // NOT_STARTED, DEVELOPING, PROFICIENT, FLUENT, TRANSFER
  evidenceCount: integer("evidence_count").notNull().default(0), // Number of times skill was assessed
  successCount: integer("success_count").notNull().default(0), // Number of successful demonstrations
  attemptCount: integer("attempt_count").notNull().default(0), // Total attempts at this skill
  lastPracticeDate: text("last_practice_date"),
  lastScore: integer("last_score"), // Most recent score (0-100)
  needsReinforcement: boolean("needs_reinforcement").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Task skills - links tasks to the skills they teach or reinforce
export const taskSkills = pgTable("task_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  isPrimaryFocus: boolean("is_primary_focus").notNull().default(false), // Main skill being taught
  isReview: boolean("is_review").notNull().default(false), // Spiral review of previously learned skill
});

// Task outcomes - detailed learning evidence from completed tasks
export const taskOutcomes = pgTable("task_outcomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }).unique(),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  quizScore: integer("quiz_score"), // 0-100, null if no quiz
  parentFeedback: text("parent_feedback"), // TOO_EASY, JUST_RIGHT, TOO_HARD, STRUGGLED, NOT_INTERESTED
  childConfidence: integer("child_confidence"), // 1-5 scale (sad to happy face)
  timeOnTaskMinutes: integer("time_on_task_minutes"),
  approachUsed: text("approach_used"), // HANDS_ON, VISUAL, VERBAL, DISCOVERY
  notes: text("notes"), // Parent notes about the session
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

// ============================================
// ADAPTIVE LESSON ENGINE TABLES
// ============================================

// Difficulty level configuration for lesson templates
export type DifficultyConfig = {
  numberRange?: [number, number];
  problemCount?: number;
  includesMissingAddend?: boolean;
  wordCount?: number;
  sentenceLength?: string;
  includesBlending?: boolean;
  customParams?: Record<string, any>;
};

// Mode instruction patterns
export type ModeConfig = {
  instructionsPattern: string;
  materials?: string[];
  parentGuidance?: string;
};

// Assessment question types
export type AssessmentQuestion = {
  questionId: string;
  prompt: string;
  type: "number" | "text" | "choice" | "yes_no";
  options?: string[];
  correctAnswer: string | number;
  hint?: string;
  // For AI-powered semantic validation (open-ended questions)
  answerCriteria?: string; // e.g., "any word that starts with the letter C"
  useAIValidation?: boolean; // If true, use AI to validate instead of exact match
};

// Lesson templates - structured blueprints for AI to fill in
export const lessonTemplates = pgTable("lesson_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(), // READING, MATH, CHARACTER
  targetSkillId: varchar("target_skill_id").references(() => skills.id, { onDelete: "set null" }),
  targetSkillName: text("target_skill_name").notNull(), // e.g., "addition_within_10"
  gradeBand: text("grade_band").notNull(), // K, 1, 2, or K-2 for all
  objective: text("objective").notNull(), // e.g., "Add numbers within 10 using objects and pictures"
  
  // Difficulty configurations
  difficultyLevels: json("difficulty_levels").$type<{
    easy: DifficultyConfig;
    medium: DifficultyConfig;
    hard: DifficultyConfig;
  }>().notNull(),
  
  // Learning mode configurations
  modes: json("modes").$type<{
    hands_on: ModeConfig;
    visual: ModeConfig;
    story: ModeConfig;
  }>().notNull(),
  
  // Assessment bank for generating questions
  assessmentBank: json("assessment_bank").$type<{
    formative: AssessmentQuestion[];
    checkpoint: AssessmentQuestion[];
    challenge: AssessmentQuestion[];
  }>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Lesson step structure for AI-generated lessons
export type LessonInstanceStep = {
  stepNumber: number;
  parentInstructions: string;
  childTask: string;
  materials?: string[];
  duration?: number; // minutes
};

// Teach Phase - explains the concept and shows how to solve problems
export type TeachPhase = {
  conceptExplanation: string; // "Today we're learning about adding numbers..."
  vocabulary?: Array<{
    term: string;
    definition: string;
  }>;
  workedExample: {
    problem: string; // "Let's solve 2 + 3 together"
    steps: Array<{
      stepNumber: number;
      instruction: string; // "First, hold up 2 fingers"
      visual?: string; // Optional visual cue
    }>;
    answer: string; // "So 2 + 3 = 5!"
  };
};

// Assessment in lesson instance
export type LessonInstanceAssessment = {
  questions: Array<{
    questionId: string;
    prompt: string;
    type: "number" | "text" | "choice" | "yes_no";
    options?: string[];
    correctAnswer: string | number;
    hint?: string;
    // For AI-powered semantic validation (open-ended questions)
    answerCriteria?: string; // e.g., "any word that starts with the letter C"
    useAIValidation?: boolean; // If true, use AI to validate instead of exact match
  }>;
};

// Practice Activity - interactive "Your Turn" exercises
export type PracticeActivity = {
  activityId: string;
  prompt: string; // "Now you try! What is 3 + 2?"
  interactionType: "tap_choice" | "fill_blank" | "match" | "count";
  options?: string[]; // For tap_choice
  correctAnswer: string | number;
  successFeedback: string; // "Amazing! You got it right!"
  tryAgainFeedback: string; // "Good try! Let's think about this together."
  hint?: string; // Optional hint if they struggle
};

// Practice phase container
export type PracticePhase = {
  introduction: string; // "Now it's your turn to practice!"
  activities: PracticeActivity[];
};

// Progress state for lesson resume functionality
export type LessonProgressState = {
  currentPhase: "teach" | "practice" | "assess" | "complete";
  answeredQuestions: Record<string, {
    answer: string;
    isCorrect: boolean;
    attemptCount: number;
  }>;
  completedPracticeActivities: string[]; // IDs of completed practice activities
  lastUpdated: string; // ISO timestamp
};

// Lesson instances - AI-generated lessons for each child
export const lessonInstances = pgTable("lesson_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  lessonTemplateId: varchar("lesson_template_id").references(() => lessonTemplates.id, { onDelete: "set null" }),
  
  // Link to parent-created lesson request (if any)
  parentLessonId: varchar("parent_lesson_id").references(() => parentLessons.id, { onDelete: "set null" }),
  
  // What was used to generate this lesson
  difficultyUsed: text("difficulty_used").notNull(), // easy | medium | hard
  modeUsed: text("mode_used").notNull(), // hands_on | visual | story
  
  // The actual lesson content
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  
  // GOAL - required statement "By the end of this lesson, {childName} will be able to..."
  goal: text("goal"),
  
  objective: text("objective").notNull(),
  targetSkillName: text("target_skill_name").notNull(),
  
  // DO steps (AI-generated action items for parent/child)
  steps: json("steps").$type<LessonInstanceStep[]>().notNull(),
  
  // TEACH phase - concept explanation and worked example
  teachPhase: json("teach_phase").$type<TeachPhase>(),
  
  // Practice phase - interactive "Your Turn" exercises
  practicePhase: json("practice_phase").$type<PracticePhase>(),
  
  // Parent note from AI
  parentNote: text("parent_note"),
  
  // CHECK - Assessment questions (AI-generated from bank or fresh)
  assessment: json("assessment").$type<LessonInstanceAssessment>(),
  
  // Faith integration (if applicable based on settings)
  faithIntegration: json("faith_integration").$type<{
    scripture?: string;
    tieIn?: string;
    optionalPrayer?: string;
  }>(),
  
  // Status tracking
  status: text("status").notNull().default("READY"), // READY | IN_PROGRESS | COMPLETED | SKIPPED
  date: text("date").notNull(), // YYYY-MM-DD
  completedAt: timestamp("completed_at"),
  
  // Skip tracking (for lessons children want to do later)
  skippedAt: timestamp("skipped_at"),
  skipReason: text("skip_reason"), // "wanted_different", "too_hard", "not_interested"
  
  // Points earned upon completion
  pointsEarned: integer("points_earned"),
  
  // Progress tracking for resume functionality
  progressStepIndex: integer("progress_step_index").default(0), // Current step in lesson
  progressState: json("progress_state").$type<LessonProgressState>(), // Detailed progress snapshot
  lastInteractionAt: timestamp("last_interaction_at"), // When child last interacted
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Lesson attempts - tracks individual question responses for no-wrong-answer UX
export const lessonAttempts = pgTable("lesson_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonInstanceId: varchar("lesson_instance_id").notNull().references(() => lessonInstances.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  
  // Question details
  questionId: text("question_id").notNull(),
  childAnswer: text("child_answer").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  
  // Result
  isCorrect: boolean("is_correct").notNull(),
  attemptNumber: integer("attempt_number").notNull().default(1), // Which try was this
  
  // AI-generated response for wrong answers (no-wrong-answer UX)
  misconceptionTag: text("misconception_tag"), // counting_error | place_value | guessing | skipped_step
  explanationForChild: text("explanation_for_child"), // Kind, encouraging explanation
  hint: text("hint"), // Helpful hint for retry
  nextAction: text("next_action"), // simpler_example | guided_practice | pivot_down_difficulty
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
}).extend({
  password: z.string().min(6),
});

export const insertChildSchema = createInsertSchema(children).pick({
  name: true,
  grade: true,
  username: true,
}).extend({
  pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
  faithMode: z.enum(["FULL_DISCIPLESHIP", "FAITH_FORWARD", "VALUES_ONLY"]),
  learningStyle: z.enum(["HANDS_ON_MONTESSORI", "BALANCED", "DIGITAL_LIGHT"]),
});

export const insertPlanSchema = createInsertSchema(plans).pick({
  childId: true,
  type: true,
  startDate: true,
  endDate: true,
});

export const completeTaskSchema = z.object({
  taskId: z.string(),
  quizAnswers: z.array(z.string()).optional(),
});

// Schema for submitting task outcome with learning evidence
export const submitTaskOutcomeSchema = z.object({
  taskId: z.string(),
  quizAnswers: z.array(z.string()).optional(),
  parentFeedback: z.enum(["TOO_EASY", "JUST_RIGHT", "TOO_HARD", "STRUGGLED", "NOT_INTERESTED"]).optional(),
  childConfidence: z.number().min(1).max(5).optional(),
  timeOnTaskMinutes: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateChildSchema = z.object({
  name: z.string().min(1).optional(),
  grade: z.string().optional(),
  username: z.string().min(3).optional(),
  pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits").optional(),
  avatarUrl: z.string().nullable().optional(),
  faithMode: z.enum(["FULL_DISCIPLESHIP", "FAITH_FORWARD", "VALUES_ONLY"]).optional(),
  learningStyle: z.enum(["HANDS_ON_MONTESSORI", "BALANCED", "DIGITAL_LIGHT"]).optional(),
  dyslexiaSupport: z.boolean().optional(),
  readingStage: z.enum(["pre_reader", "emerging", "fluent_for_grade"]).optional(),
  mathStage: z.enum(["within_5", "within_10", "within_20"]).optional(),
  preferredModes: z.array(z.string()).optional(),
  sessionLengthMinutes: z.number().min(5).max(30).optional(),
});

export const updateTaskSchema = z.object({
  objective: z.string().min(1).optional(),
  instructionsForChild: z.string().min(1).optional(),
  instructionsForParent: z.string().nullable().optional(),
  materialsNeeded: z.array(z.string()).optional(),
  scriptureReference: z.string().nullable().optional(),
  scriptureText: z.string().nullable().optional(),
  reflectionPrompt: z.string().nullable().optional(),
  parentNotes: z.string().nullable().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;
export type ChildSettings = typeof childSettings.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type RewardState = typeof rewardState.$inferSelect;
export type Devotional = typeof devotionals.$inferSelect;

// Adaptive learning types
export type Skill = typeof skills.$inferSelect;
export type ChildSkillProgress = typeof childSkillProgress.$inferSelect;
export type TaskSkill = typeof taskSkills.$inferSelect;
export type TaskOutcome = typeof taskOutcomes.$inferSelect;
export type SubmitTaskOutcome = z.infer<typeof submitTaskOutcomeSchema>;

// Parent lesson types
export type ParentLesson = typeof parentLessons.$inferSelect;

// Adaptive lesson engine types
export type LessonTemplate = typeof lessonTemplates.$inferSelect;
export type LessonInstance = typeof lessonInstances.$inferSelect;
export type LessonAttempt = typeof lessonAttempts.$inferSelect;

// Mastery level enum for type safety
export const MasteryLevels = {
  NOT_STARTED: "NOT_STARTED",
  DEVELOPING: "DEVELOPING",
  PROFICIENT: "PROFICIENT",
  FLUENT: "FLUENT",
  TRANSFER: "TRANSFER",
} as const;
export type MasteryLevel = keyof typeof MasteryLevels;

// Parent feedback enum for type safety
export const ParentFeedbackOptions = {
  TOO_EASY: "TOO_EASY",
  JUST_RIGHT: "JUST_RIGHT",
  TOO_HARD: "TOO_HARD",
  STRUGGLED: "STRUGGLED",
  NOT_INTERESTED: "NOT_INTERESTED",
} as const;
export type ParentFeedback = keyof typeof ParentFeedbackOptions;

// Difficulty levels for adaptive engine
export const DifficultyLevels = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
} as const;
export type DifficultyLevel = keyof typeof DifficultyLevels;

// Learning modes
export const LearningModes = {
  hands_on: "hands_on",
  visual: "visual",
  story: "story",
} as const;
export type LearningMode = keyof typeof LearningModes;

// ============================================
// PROGRESSION SYSTEM TABLES
// ============================================

// Avatar moods/emotions
export const AvatarMoods = {
  HAPPY: "HAPPY",
  PROUD: "PROUD",
  EXCITED: "EXCITED",
  FOCUSED: "FOCUSED",
  SLEEPY: "SLEEPY",
} as const;
export type AvatarMood = keyof typeof AvatarMoods;

// Avatar customization trait options
export const AvatarTraitOptions = {
  skinTone: ["light", "fair", "medium", "tan", "brown", "dark"] as const,
  hairStyle: ["short", "long", "curly", "braids", "ponytail", "spiky", "bun", "pigtails"] as const,
  hairColor: ["blonde", "brown", "black", "red", "auburn", "gray", "blue", "pink", "purple"] as const,
  eyeStyle: ["round", "almond", "big", "sleepy", "happy", "sparkle"] as const,
  eyeColor: ["brown", "blue", "green", "hazel", "amber", "gray"] as const,
  mouthStyle: ["smile", "grin", "small", "open", "happy", "surprised"] as const,
  topStyle: ["tshirt", "sweater", "dress", "hoodie", "vest", "overalls"] as const,
  topColor: ["red", "blue", "green", "yellow", "purple", "pink", "orange", "white", "gray"] as const,
  bottomStyle: ["pants", "shorts", "skirt", "jeans", "leggings"] as const,
  bottomColor: ["blue", "black", "brown", "gray", "pink", "purple", "green"] as const,
  shoeStyle: ["sneakers", "boots", "sandals", "mary_janes", "slippers"] as const,
  shoeColor: ["red", "blue", "white", "black", "brown", "pink", "rainbow"] as const,
  accessory: ["none", "glasses", "headband", "bow", "hat", "crown", "flowers", "stars"] as const,
} as const;

// Avatar traits type for storing customization
export type AvatarTraits = {
  skinTone: (typeof AvatarTraitOptions.skinTone)[number];
  hairStyle: (typeof AvatarTraitOptions.hairStyle)[number];
  hairColor: (typeof AvatarTraitOptions.hairColor)[number];
  eyeStyle: (typeof AvatarTraitOptions.eyeStyle)[number];
  eyeColor: (typeof AvatarTraitOptions.eyeColor)[number];
  mouthStyle: (typeof AvatarTraitOptions.mouthStyle)[number];
  topStyle: (typeof AvatarTraitOptions.topStyle)[number];
  topColor: (typeof AvatarTraitOptions.topColor)[number];
  bottomStyle: (typeof AvatarTraitOptions.bottomStyle)[number];
  bottomColor: (typeof AvatarTraitOptions.bottomColor)[number];
  shoeStyle: (typeof AvatarTraitOptions.shoeStyle)[number];
  shoeColor: (typeof AvatarTraitOptions.shoeColor)[number];
  accessory: (typeof AvatarTraitOptions.accessory)[number];
};

// Default avatar traits
export const defaultAvatarTraits: AvatarTraits = {
  skinTone: "medium",
  hairStyle: "short",
  hairColor: "brown",
  eyeStyle: "round",
  eyeColor: "brown",
  mouthStyle: "smile",
  topStyle: "tshirt",
  topColor: "blue",
  bottomStyle: "pants",
  bottomColor: "blue",
  shoeStyle: "sneakers",
  shoeColor: "white",
  accessory: "none",
};

// Zod schema for avatar traits validation
export const avatarTraitsSchema = z.object({
  skinTone: z.enum(AvatarTraitOptions.skinTone),
  hairStyle: z.enum(AvatarTraitOptions.hairStyle),
  hairColor: z.enum(AvatarTraitOptions.hairColor),
  eyeStyle: z.enum(AvatarTraitOptions.eyeStyle),
  eyeColor: z.enum(AvatarTraitOptions.eyeColor),
  mouthStyle: z.enum(AvatarTraitOptions.mouthStyle),
  topStyle: z.enum(AvatarTraitOptions.topStyle),
  topColor: z.enum(AvatarTraitOptions.topColor),
  bottomStyle: z.enum(AvatarTraitOptions.bottomStyle),
  bottomColor: z.enum(AvatarTraitOptions.bottomColor),
  shoeStyle: z.enum(AvatarTraitOptions.shoeStyle),
  shoeColor: z.enum(AvatarTraitOptions.shoeColor),
  accessory: z.enum(AvatarTraitOptions.accessory),
});

// Item categories for inventory
export const ItemCategories = {
  AVATAR_ACCESSORY: "AVATAR_ACCESSORY", // Hats, glasses, etc.
  STICKER: "STICKER", // Collectible stickers
  BACKGROUND: "BACKGROUND", // Room/world backgrounds
  TROPHY: "TROPHY", // Achievement trophies
  PET: "PET", // Virtual pets/companions
} as const;
export type ItemCategory = keyof typeof ItemCategories;

// Item rarity levels
export const ItemRarities = {
  COMMON: "COMMON",
  UNCOMMON: "UNCOMMON",
  RARE: "RARE",
  EPIC: "EPIC",
  LEGENDARY: "LEGENDARY",
} as const;
export type ItemRarity = keyof typeof ItemRarities;

// Avatar state - tracks level, XP, and equipped items
export const avatarState = pgTable("avatar_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }).unique(),
  
  // Leveling
  level: integer("level").notNull().default(1),
  currentXP: integer("current_xp").notNull().default(0),
  totalXPEarned: integer("total_xp_earned").notNull().default(0),
  
  // Avatar customization - base character traits
  avatarTraits: json("avatar_traits").$type<AvatarTraits>().notNull().default(sql`'{"skinTone":"medium","hairStyle":"short","hairColor":"brown","eyeStyle":"round","eyeColor":"brown","mouthStyle":"smile","topStyle":"tshirt","topColor":"blue","bottomStyle":"pants","bottomColor":"blue","shoeStyle":"sneakers","shoeColor":"white","accessory":"none"}'::json`),
  
  // Avatar customization - equipped items (unlockable)
  equippedItems: json("equipped_items").$type<{
    hat?: string;
    glasses?: string;
    outfit?: string;
    accessory?: string;
    background?: string;
    pet?: string;
  }>().notNull().default(sql`'{}'::json`),
  
  // Current mood/emotion
  mood: text("mood").notNull().default("HAPPY"),
  
  // Streak tracking
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: text("last_activity_date"),
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Badge definitions - all possible badges in the system
export const badgeDefinitions = pgTable("badge_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // e.g., "first_lesson", "week_warrior"
  name: text("name").notNull(), // Display name
  description: text("description").notNull(), // What the badge is for
  iconUrl: text("icon_url"), // Badge icon
  category: text("category").notNull(), // ACHIEVEMENT, STREAK, SUBJECT, SPECIAL
  
  // Unlock criteria (stored as JSON for flexibility)
  unlockCriteria: json("unlock_criteria").$type<{
    type: "lessons_completed" | "streak_days" | "subject_mastery" | "xp_earned" | "level_reached" | "special";
    threshold?: number;
    subject?: string;
    customCheck?: string; // For special badges checked in code
  }>().notNull(),
  
  // Rewards for earning this badge
  xpReward: integer("xp_reward").notNull().default(0),
  
  // Display order
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Earned badges - tracks which badges each child has earned
export const earnedBadges = pgTable("earned_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  badgeId: varchar("badge_id").notNull().references(() => badgeDefinitions.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  
  // Optional context about how it was earned
  context: json("context").$type<{
    lessonId?: string;
    subject?: string;
    value?: number; // e.g., streak count when earned
  }>(),
});

// Inventory item definitions - all collectible items in the system
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // e.g., "astronaut_helmet", "rainbow_sticker"
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  
  category: text("category").notNull(), // AVATAR_ACCESSORY, STICKER, BACKGROUND, TROPHY, PET
  rarity: text("rarity").notNull().default("COMMON"), // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
  
  // How to obtain
  unlockMethod: text("unlock_method").notNull().default("LEVEL_UP"), // LEVEL_UP, BADGE, PURCHASE, LESSON, SPECIAL
  unlockRequirement: json("unlock_requirement").$type<{
    level?: number;
    badgeSlug?: string;
    lessonsCompleted?: number;
    xpCost?: number;
  }>(),
  
  // For equippable items, which slot
  equipSlot: text("equip_slot"), // hat, glasses, outfit, accessory, background, pet
  
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Child inventory - items owned by each child
export const childInventory = pgTable("child_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  obtainedAt: timestamp("obtained_at").notNull().defaultNow(),
  
  // How it was obtained
  obtainedVia: text("obtained_via").notNull().default("LEVEL_UP"), // LEVEL_UP, BADGE, LESSON, GIFT
  
  // Optional context
  context: json("context").$type<{
    lessonId?: string;
    badgeId?: string;
    level?: number;
  }>(),
});

// Level thresholds - XP needed for each level
export const levelThresholds = pgTable("level_thresholds", {
  level: integer("level").primaryKey(),
  xpRequired: integer("xp_required").notNull(), // Total XP needed to reach this level
  title: text("title").notNull(), // e.g., "Curious Explorer", "Star Learner"
  rewardItemSlug: text("reward_item_slug"), // Item unlocked at this level
});

// Types for progression system
export type AvatarState = typeof avatarState.$inferSelect;
export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type EarnedBadge = typeof earnedBadges.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type ChildInventoryItem = typeof childInventory.$inferSelect;
export type LevelThreshold = typeof levelThresholds.$inferSelect;

// Reading stages for K-2
export const ReadingStages = {
  pre_reader: "pre_reader",
  early_reader: "early_reader",
  fluent_for_grade: "fluent_for_grade",
} as const;
export type ReadingStage = keyof typeof ReadingStages;

// Math stages for K-2
export const MathStages = {
  within_5: "within_5",
  within_10: "within_10",
  within_20: "within_20",
} as const;
export type MathStage = keyof typeof MathStages;

// Schema for submitting lesson attempt (no-wrong-answer model)
export const submitLessonAttemptSchema = z.object({
  lessonInstanceId: z.string(),
  questionId: z.string(),
  childAnswer: z.string(),
});

// Schema for updating learner profile settings
export const updateLearnerProfileSchema = z.object({
  readingStage: z.enum(["pre_reader", "early_reader", "fluent_for_grade"]).optional(),
  mathStage: z.enum(["within_5", "within_10", "within_20"]).optional(),
  preferredModes: z.array(z.enum(["hands_on", "visual", "story"])).optional(),
  sessionLengthMinutes: z.number().min(5).max(30).optional(),
});

// Schema for generating a lesson
export const generateLessonSchema = z.object({
  childId: z.string(),
  subject: z.enum(["READING", "MATH", "CHARACTER"]).optional(),
  skillId: z.string().optional(),
});

// Schema for creating a parent lesson request
export const createParentLessonSchema = z.object({
  childId: z.string(),
  subject: z.enum(["READING", "MATH", "CHARACTER"]),
  skillTag: z.string().optional(),
  parentNotes: z.string().optional(),
  sessionLengthMinutes: z.number().min(5).max(30).optional(),
  preferredMode: z.enum(["hands_on", "visual", "story"]).optional(),
});

export type CreateParentLesson = z.infer<typeof createParentLessonSchema>;

// ============================================
// JOURNEY WORLD SYSTEM
// ============================================

// World identifiers
export const WorldIds = {
  FOREST: "FOREST",
  OCEAN: "OCEAN",
  GALAXY: "GALAXY",
  DESERT: "DESERT",
} as const;
export type WorldId = keyof typeof WorldIds;

// World definitions - the 4 themed worlds
export const worldDefinitions = pgTable("world_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // FOREST, OCEAN, GALAXY, DESERT
  name: text("name").notNull(), // "Forest Discovery Path"
  description: text("description").notNull(),
  order: integer("order").notNull(), // 1, 2, 3, 4 for progression order
  
  // Visual theming
  themeColor: text("theme_color").notNull(), // Primary color for the world
  backgroundUrl: text("background_url"), // World background image
  iconUrl: text("icon_url"), // World icon
  
  // Progression requirements
  tilesCount: integer("tiles_count").notNull().default(15), // Number of tiles in this world
  unlockRequirement: json("unlock_requirement").$type<{
    previousWorldSlug?: string; // Must complete previous world
    tilesCompleted?: number; // Or complete X tiles total
  }>(),
  
  // Identity themes for this world
  identityThemes: json("identity_themes").$type<string[]>().notNull().default(sql`'[]'::json`), // e.g., ["Explorer", "Scientist", "Artist"]
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// World tools - items earned within each world
export const worldTools = pgTable("world_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: varchar("world_id").notNull().references(() => worldDefinitions.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(), // e.g., "explorers_compass", "shell_scanner"
  name: text("name").notNull(), // "Explorer's Compass"
  description: text("description").notNull(), // What it does
  iconUrl: text("icon_url"),
  
  // How to earn this tool
  unlockTileNumber: integer("unlock_tile_number").notNull(), // Tile position that unlocks this tool
  
  // Optional functional effect
  effectType: text("effect_type"), // "hints", "unlock_paths", "reveal_hidden", "navigation"
  effectConfig: json("effect_config").$type<{
    hintBonus?: number;
    unlocksSpecialTiles?: boolean;
    revealRange?: number;
  }>(),
  
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Child world progress - tracks each child's position in each world
export const childWorldProgress = pgTable("child_world_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  worldId: varchar("world_id").notNull().references(() => worldDefinitions.id, { onDelete: "cascade" }),
  
  // Current position on the world path
  currentTile: integer("current_tile").notNull().default(0), // 0 = hasn't started, 1 = first tile, etc.
  tilesCompleted: integer("tiles_completed").notNull().default(0),
  
  // World completion status
  status: text("status").notNull().default("LOCKED"), // LOCKED, ACTIVE, COMPLETED
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Child earned tools - tracks which world tools each child has
export const childWorldTools = pgTable("child_world_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  toolId: varchar("tool_id").notNull().references(() => worldTools.id, { onDelete: "cascade" }),
  
  // When and how earned
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  earnedAtTile: integer("earned_at_tile").notNull(),
  
  // Optional: lesson that unlocked this tool
  lessonInstanceId: varchar("lesson_instance_id").references(() => lessonInstances.id, { onDelete: "set null" }),
});

// Journey tiles - individual tiles on the world path (can be pre-generated or dynamic)
export const journeyTiles = pgTable("journey_tiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  worldId: varchar("world_id").notNull().references(() => worldDefinitions.id, { onDelete: "cascade" }),
  
  // Position
  tileNumber: integer("tile_number").notNull(), // 1-based position in the world
  
  // Subject assigned (mystery until child reaches it)
  subject: text("subject").notNull(), // READING, MATH, CHARACTER
  
  // Link to lesson when started
  lessonInstanceId: varchar("lesson_instance_id").references(() => lessonInstances.id, { onDelete: "set null" }),
  
  // Status
  status: text("status").notNull().default("LOCKED"), // LOCKED, CURRENT, COMPLETED
  
  // Tool reward at this tile (if any)
  rewardToolId: varchar("reward_tool_id").references(() => worldTools.id, { onDelete: "set null" }),
  
  // Visual customization
  tileType: text("tile_type").notNull().default("NORMAL"), // NORMAL, MILESTONE, BOSS, BONUS
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types for world system
export type WorldDefinition = typeof worldDefinitions.$inferSelect;
export type WorldTool = typeof worldTools.$inferSelect;
export type ChildWorldProgress = typeof childWorldProgress.$inferSelect;
export type ChildWorldTool = typeof childWorldTools.$inferSelect;
export type JourneyTile = typeof journeyTiles.$inferSelect;

// ============================================
// SOCIAL WORLD V1 - BUDDY SYSTEM & ACTIVITY FEED
// ============================================

// Buddy status flow: Child A requests → A's parent approves → Child B sees → B accepts → B's parent approves → ACTIVE
export const buddyLinkStatusEnum = [
  "PENDING_REQUESTER_APPROVAL", // Waiting for requester's parent to approve
  "PENDING_RECEIVER", // Requester's parent approved, waiting for receiver child to accept
  "PENDING_RECEIVER_APPROVAL", // Receiver accepted, waiting for receiver's parent to approve
  "ACTIVE", // Both parents approved, buddy link is active
  "DECLINED", // Request was declined at any stage
] as const;

export const buddyLinks = pgTable("buddy_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("PENDING_REQUESTER_APPROVAL"),
  
  // Parent approval timestamps
  requesterParentApprovedAt: timestamp("requester_parent_approved_at"),
  receiverParentApprovedAt: timestamp("receiver_parent_approved_at"),
  
  // Tracking
  declinedBy: text("declined_by"), // "REQUESTER_PARENT", "RECEIVER", "RECEIVER_PARENT"
  declinedReason: text("declined_reason"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBuddyLinkSchema = createInsertSchema(buddyLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBuddyLink = z.infer<typeof insertBuddyLinkSchema>;
export type BuddyLink = typeof buddyLinks.$inferSelect;

// Activity event types
export const activityEventTypeEnum = [
  "LESSON_COMPLETED",
  "BADGE_EARNED",
  "CHALLENGE_SUBMITTED",
  "LEVEL_UP",
  "TOOL_EARNED",
  "WORLD_COMPLETED",
] as const;

// Activity event metadata types
export type LessonCompletedMetadata = {
  lessonId: string;
  lessonTitle: string;
  subject: string;
  xpEarned?: number;
};

export type BadgeEarnedMetadata = {
  badgeId: string;
  badgeName: string;
  badgeSlug: string;
};

export type BadgeSharedMetadata = {
  badgeSlug: string;
  badgeName: string;
  badgeCategory?: string;
};

export type LevelUpMetadata = {
  newLevel: number;
  newTitle: string;
};

export type ToolEarnedMetadata = {
  toolId: string;
  toolName: string;
  worldName: string;
};

export type WorldCompletedMetadata = {
  worldId: string;
  worldName: string;
};

export type ChallengeSubmittedMetadata = {
  challengeType: string;
  challengeTitle: string;
};

export type ActivityEventMetadata = 
  | LessonCompletedMetadata 
  | BadgeEarnedMetadata 
  | BadgeSharedMetadata
  | LevelUpMetadata 
  | ToolEarnedMetadata 
  | WorldCompletedMetadata 
  | ChallengeSubmittedMetadata;

export const activityEvents = pgTable("activity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // LESSON_COMPLETED, BADGE_EARNED, etc.
  metadata: json("metadata").$type<ActivityEventMetadata>().notNull(),
  
  // Visibility control
  visibility: text("visibility").notNull().default("BUDDIES_ONLY"), // PRIVATE, BUDDIES_ONLY
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityEventSchema = createInsertSchema(activityEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;
export type ActivityEvent = typeof activityEvents.$inferSelect;

// Pre-written safe reactions (no custom text)
export const reactionTypeEnum = [
  "NICE_WORK",
  "SO_COOL",
  "GREAT_JOB",
  "AMAZING",
  "WAY_TO_GO",
  "STAR",
  "HEART",
  "THUMBS_UP",
] as const;

export const activityReactions = pgTable("activity_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityEventId: varchar("activity_event_id").notNull().references(() => activityEvents.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(), // NICE_WORK, SO_COOL, etc.
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityReactionSchema = createInsertSchema(activityReactions).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityReaction = z.infer<typeof insertActivityReactionSchema>;
export type ActivityReaction = typeof activityReactions.$inferSelect;

// ============================================
// BUDDY PROFILE SYSTEM
// ============================================

// Profile theme options (background art style)
export const profileThemes = [
  "forest",
  "space",
  "ocean",
  "castle",
  "city",
  "farm",
  "cozy_cabin",
  "desert",
  "mountains",
] as const;
export type ProfileTheme = typeof profileThemes[number];

// Accent color options per theme
export const profileAccentColors = [
  "blue",
  "green",
  "purple",
  "teal",
  "orange",
  "pink",
  "gold",
] as const;
export type ProfileAccentColor = typeof profileAccentColors[number];

// Identity tags - "I feel most like..."
export const identityTags = [
  "maker",
  "reader",
  "artist",
  "scientist",
  "builder",
  "leader",
  "explorer",
  "helper",
] as const;
export type IdentityTag = typeof identityTags[number];

// Learning styles - "I like to learn by..."
export const learningStyles = [
  "building",
  "drawing",
  "moving",
  "listening",
  "talking",
  "reading",
  "playing_games",
] as const;
export type LearningStyle = typeof learningStyles[number];

// Fun facts pool - "Fun facts about me..."
export const funFactOptions = [
  "i_love_animals",
  "i_like_to_build_things",
  "i_like_helping_people",
  "i_love_stories",
  "im_learning_to_read",
  "i_like_being_outside",
  "i_like_math_puzzles",
  "i_love_music",
  "i_like_to_draw",
  "i_love_science",
  "i_like_sports",
  "i_love_cooking",
  "i_like_puzzles",
  "i_love_nature",
  "i_like_making_friends",
] as const;
export type FunFact = typeof funFactOptions[number];

// Favorite subjects
export const favoriteSubjectOptions = [
  "reading",
  "math",
  "science",
  "nature",
  "art",
  "music",
  "building",
  "stories",
  "character",
] as const;
export type FavoriteSubject = typeof favoriteSubjectOptions[number];

// Profile reactions (for reacting to someone's profile)
export const profileReactionTypes = [
  "NICE",
  "SO_COOL",
  "INSPIRING",
] as const;
export type ProfileReactionType = typeof profileReactionTypes[number];

export const buddyProfiles = pgTable("buddy_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }).unique(),
  
  // Theme customization
  theme: text("theme").notNull().default("forest"),
  accentColor: text("accent_color").notNull().default("blue"),
  
  // About me (structured, not free text)
  identityTags: json("identity_tags").$type<IdentityTag[]>().notNull().default([]),
  learningStyles: json("learning_styles").$type<LearningStyle[]>().notNull().default([]),
  funFacts: json("fun_facts").$type<FunFact[]>().notNull().default([]),
  
  // Favorite subjects (2-4 selections)
  favoriteSubjects: json("favorite_subjects").$type<FavoriteSubject[]>().notNull().default([]),
  
  // Top buddies to display (3-5 child IDs)
  topBuddyIds: json("top_buddy_ids").$type<string[]>().notNull().default([]),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBuddyProfileSchema = createInsertSchema(buddyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBuddyProfile = z.infer<typeof insertBuddyProfileSchema>;
export type BuddyProfile = typeof buddyProfiles.$inferSelect;

// Profile reactions table
export const profileReactions = pgTable("profile_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileChildId: varchar("profile_child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  reactorChildId: varchar("reactor_child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(), // NICE, SO_COOL, INSPIRING
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileReactionSchema = createInsertSchema(profileReactions).omit({
  id: true,
  createdAt: true,
});
export type InsertProfileReaction = z.infer<typeof insertProfileReactionSchema>;
export type ProfileReaction = typeof profileReactions.$inferSelect;

// Buddy pokes - friendly, safe interaction between buddies
export const buddyPokes = pgTable("buddy_pokes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buddyLinkId: varchar("buddy_link_id").notNull().references(() => buddyLinks.id, { onDelete: "cascade" }),
  senderChildId: varchar("sender_child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  recipientChildId: varchar("recipient_child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  
  // Tracking for rate-limiting and acknowledgment
  acknowledgedAt: timestamp("acknowledged_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBuddyPokeSchema = createInsertSchema(buddyPokes).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
});
export type InsertBuddyPoke = z.infer<typeof insertBuddyPokeSchema>;
export type BuddyPoke = typeof buddyPokes.$inferSelect;

// ============================================
// AI TEACHER SYSTEM
// ============================================

// AI Teacher conversation sessions
export const aiTeacherSessions = pgTable("ai_teacher_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  lessonInstanceId: varchar("lesson_instance_id").references(() => lessonInstances.id, { onDelete: "set null" }),
  
  // Session context
  subject: text("subject"), // MATH, READING, CHARACTER - null if general help
  currentStep: integer("current_step"), // Which lesson step they're on
  
  // Session state
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, ENDED
  messageCount: integer("message_count").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertAiTeacherSessionSchema = createInsertSchema(aiTeacherSessions).omit({
  id: true,
  messageCount: true,
  createdAt: true,
  endedAt: true,
});
export type InsertAiTeacherSession = z.infer<typeof insertAiTeacherSessionSchema>;
export type AiTeacherSession = typeof aiTeacherSessions.$inferSelect;

// AI Teacher messages within a session
export const aiTeacherMessages = pgTable("ai_teacher_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => aiTeacherSessions.id, { onDelete: "cascade" }),
  
  // Message content
  role: text("role").notNull(), // "child" or "teacher"
  content: text("content").notNull(),
  
  // Input/output mode
  inputMode: text("input_mode"), // "voice" or "text" - how child sent message
  outputMode: text("output_mode"), // "voice" or "text" - how teacher response was delivered
  
  // Audio reference (for TTS responses)
  audioUrl: text("audio_url"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiTeacherMessageSchema = createInsertSchema(aiTeacherMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertAiTeacherMessage = z.infer<typeof insertAiTeacherMessageSchema>;
export type AiTeacherMessage = typeof aiTeacherMessages.$inferSelect;

// Type for AI Teacher personality context
export interface AiTeacherContext {
  childName: string;
  grade: string;
  faithMode: string;
  learningStyle: string;
  preferredModes: string[];
  dyslexiaSupport: boolean;
  confidence: number;
  currentSubject?: string;
  currentLessonTitle?: string;
  currentStepContent?: string;
}

// ============================================
// PARENT COMMUNITY SYSTEM
// ============================================

// Homeschool style options
export const homeschoolStyleEnum = [
  "CLASSICAL",
  "CHARLOTTE_MASON",
  "MONTESSORI",
  "UNSCHOOL",
  "TRADITIONAL",
  "ECLECTIC",
  "WALDORF",
  "UNIT_STUDY",
  "OTHER",
] as const;
export type HomeschoolStyle = typeof homeschoolStyleEnum[number];

// Parent interest options
export const parentInterestEnum = [
  "STEM",
  "NATURE_SCHOOL",
  "READING_GROUPS",
  "FAITH_BASED",
  "ARTS_MUSIC",
  "OUTDOOR_LEARNING",
  "CO_OP_TEACHING",
  "SPECIAL_NEEDS",
  "NEURODIVERGENT_SUPPORT",
  "FIELD_TRIPS",
  "MAKER_SPACES",
  "SPORTS_PE",
] as const;
export type ParentInterest = typeof parentInterestEnum[number];

// Parent community profiles
export const parentProfiles = pgTable("parent_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Basic info
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  bio: text("bio"),
  
  // Location (city-level only for safety)
  city: text("city"),
  state: text("state"),
  
  // Homeschool info
  homeschoolStyle: text("homeschool_style"), // From homeschoolStyleEnum
  yearsHomeschooling: integer("years_homeschooling"),
  childAgeRanges: json("child_age_ranges").$type<string[]>().default(sql`'[]'::json`), // e.g., ["5-7", "8-10"]
  
  // Interests for discovery
  interests: json("interests").$type<string[]>().default(sql`'[]'::json`), // From parentInterestEnum
  
  // Privacy settings
  showLocation: boolean("show_location").notNull().default(false),
  showInDiscovery: boolean("show_in_discovery").notNull().default(true),
  allowConnectionRequests: boolean("allow_connection_requests").notNull().default(true),
  
  // Profile completion
  isComplete: boolean("is_complete").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertParentProfileSchema = createInsertSchema(parentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertParentProfile = z.infer<typeof insertParentProfileSchema>;
export type ParentProfile = typeof parentProfiles.$inferSelect;

// Community group types
export const groupTypeEnum = [
  "LOCAL_STATE", // Auto-generated by state
  "LOCAL_CITY", // Auto-generated by city
  "VIRTUAL_COOP", // Parent-created virtual group
  "ORGANIZATION", // Church, micro-school, etc.
] as const;
export type GroupType = typeof groupTypeEnum[number];

// Community groups
export const communityGroups = pgTable("community_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic info
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  groupType: text("group_type").notNull(), // From groupTypeEnum
  
  // For local groups
  city: text("city"),
  state: text("state"),
  
  // For virtual co-ops
  topics: json("topics").$type<string[]>().default(sql`'[]'::json`), // e.g., ["STEM", "reading"]
  
  // Membership settings
  isPrivate: boolean("is_private").notNull().default(false),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  joinCode: text("join_code"), // Optional code for private groups
  
  // Limits
  maxMembers: integer("max_members"),
  
  // Stats
  memberCount: integer("member_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  
  // Management
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCommunityGroupSchema = createInsertSchema(communityGroups).omit({
  id: true,
  memberCount: true,
  postCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCommunityGroup = z.infer<typeof insertCommunityGroupSchema>;
export type CommunityGroup = typeof communityGroups.$inferSelect;

// Group membership roles
export const groupMemberRoleEnum = [
  "MEMBER",
  "MODERATOR",
  "ADMIN",
] as const;
export type GroupMemberRole = typeof groupMemberRoleEnum[number];

// Group memberships
export const groupMemberships = pgTable("group_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => communityGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Role
  role: text("role").notNull().default("MEMBER"), // From groupMemberRoleEnum
  
  // Status
  status: text("status").notNull().default("PENDING"), // PENDING, ACTIVE, BANNED
  
  // Approval tracking
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
  approvedAt: true,
  joinedAt: true,
  updatedAt: true,
});
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type GroupMembership = typeof groupMemberships.$inferSelect;

// Discussion post types
export const postTypeEnum = [
  "QUESTION",
  "ANNOUNCEMENT",
  "RESOURCE_SHARE",
  "TIP",
  "CELEBRATION",
  "DISCUSSION",
] as const;
export type PostType = typeof postTypeEnum[number];

// Group discussion posts
export const groupPosts = pgTable("group_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => communityGroups.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Content
  postType: text("post_type").notNull().default("DISCUSSION"), // From postTypeEnum
  title: text("title"),
  content: text("content").notNull(),
  
  // Optional link/resource
  resourceUrl: text("resource_url"),
  
  // Engagement stats
  replyCount: integer("reply_count").notNull().default(0),
  helpfulCount: integer("helpful_count").notNull().default(0),
  
  // Moderation
  isPinned: boolean("is_pinned").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGroupPostSchema = createInsertSchema(groupPosts).omit({
  id: true,
  replyCount: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGroupPost = z.infer<typeof insertGroupPostSchema>;
export type GroupPost = typeof groupPosts.$inferSelect;

// Post replies
export const postReplies = pgTable("post_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => groupPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Content
  content: text("content").notNull(),
  
  // Engagement
  helpfulCount: integer("helpful_count").notNull().default(0),
  
  // Moderation
  isHidden: boolean("is_hidden").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPostReplySchema = createInsertSchema(postReplies).omit({
  id: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPostReply = z.infer<typeof insertPostReplySchema>;
export type PostReply = typeof postReplies.$inferSelect;

// Helpful votes for posts and replies
export const helpfulVotes = pgTable("helpful_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => groupPosts.id, { onDelete: "cascade" }),
  replyId: varchar("reply_id").references(() => postReplies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Parent connection status
export const parentConnectionStatusEnum = [
  "PENDING",
  "ACTIVE",
  "DECLINED",
  "BLOCKED",
] as const;
export type ParentConnectionStatus = typeof parentConnectionStatusEnum[number];

// Parent-to-parent connections
export const parentConnections = pgTable("parent_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Status
  status: text("status").notNull().default("PENDING"), // From parentConnectionStatusEnum
  
  // How they connected
  connectionSource: text("connection_source"), // "BUDDY_LINK", "GROUP", "DISCOVERY"
  sourceId: varchar("source_id"), // buddyLinkId or groupId if applicable
  
  // Optional message with request
  message: text("message"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertParentConnectionSchema = createInsertSchema(parentConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertParentConnection = z.infer<typeof insertParentConnectionSchema>;
export type ParentConnection = typeof parentConnections.$inferSelect;

// Parent messages (simple, safe messaging)
export const parentMessages = pgTable("parent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull().references(() => parentConnections.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Content (text only, no images for safety)
  content: text("content").notNull(),
  
  // Read tracking
  readAt: timestamp("read_at"),
  
  // Moderation
  isReported: boolean("is_reported").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertParentMessageSchema = createInsertSchema(parentMessages).omit({
  id: true,
  readAt: true,
  createdAt: true,
});
export type InsertParentMessage = z.infer<typeof insertParentMessageSchema>;
export type ParentMessage = typeof parentMessages.$inferSelect;

// ============================================
// CURRICULUM PROGRESSION SYSTEM
// ============================================

// Curriculum strands - major learning areas per subject per grade
export const curriculumStrands = pgTable("curriculum_strands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(), // READING, MATH, CHARACTER
  grade: text("grade").notNull(), // K, 1, 2, 3, 4, 5
  name: text("name").notNull(), // e.g., "Number Sense", "Phonics", "Kindness"
  description: text("description").notNull(),
  orderInSubject: integer("order_in_subject").notNull().default(1), // Sequence within subject for this grade
  
  // Estimated timeline
  estimatedWeeks: integer("estimated_weeks").notNull().default(6), // How many weeks this strand typically takes
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Year-end goals - what a child should master by end of grade
export const yearEndGoals = pgTable("year_end_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(), // READING, MATH, CHARACTER
  grade: text("grade").notNull(), // K, 1, 2, 3, 4, 5
  
  // Goal description
  title: text("title").notNull(), // e.g., "Add and subtract within 20 fluently"
  description: text("description").notNull(), // Detailed explanation
  standardCode: text("standard_code"), // e.g., "CCSS.MATH.1.OA.C.6"
  
  // Skills required to complete this goal
  requiredSkillIds: json("required_skill_ids").$type<string[]>().notNull().default(sql`'[]'::json`),
  
  // Progress tracking
  orderInSubject: integer("order_in_subject").notNull().default(1),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Milestones - intermediate checkpoints within a strand
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strandId: varchar("strand_id").notNull().references(() => curriculumStrands.id, { onDelete: "cascade" }),
  
  // Milestone info
  name: text("name").notNull(), // e.g., "Can add single digits fluently"
  description: text("description").notNull(),
  orderInStrand: integer("order_in_strand").notNull().default(1),
  
  // Skills that make up this milestone
  requiredSkillIds: json("required_skill_ids").$type<string[]>().notNull().default(sql`'[]'::json`),
  
  // Celebration/badge associated
  badgeSlug: text("badge_slug"), // Badge earned when milestone is completed
  
  // XP bonus for reaching milestone
  xpReward: integer("xp_reward").notNull().default(50),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Skill prerequisites - explicit dependency graph between skills
export const skillEdges = pgTable("skill_edges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prerequisiteSkillId: varchar("prerequisite_skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  dependentSkillId: varchar("dependent_skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  
  // Edge weight (how important is this prerequisite)
  weight: integer("weight").notNull().default(1), // 1 = recommended, 2 = required
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Child milestone progress - tracks which milestones each child has completed
export const childMilestoneProgress = pgTable("child_milestone_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  milestoneId: varchar("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  
  // Progress status
  status: text("status").notNull().default("NOT_STARTED"), // NOT_STARTED, IN_PROGRESS, COMPLETED
  progressPercent: integer("progress_percent").notNull().default(0), // 0-100
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Child year-end goal progress - tracks progress toward grade completion
export const childYearGoalProgress = pgTable("child_year_goal_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  goalId: varchar("goal_id").notNull().references(() => yearEndGoals.id, { onDelete: "cascade" }),
  
  // Progress tracking
  progressPercent: integer("progress_percent").notNull().default(0), // 0-100
  skillsCompleted: integer("skills_completed").notNull().default(0),
  skillsTotal: integer("skills_total").notNull().default(0),
  
  // Status
  status: text("status").notNull().default("NOT_STARTED"), // NOT_STARTED, IN_PROGRESS, COMPLETED
  
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Learning signals - engagement data collected during lessons
export const learningSignals = pgTable("learning_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  lessonInstanceId: varchar("lesson_instance_id").references(() => lessonInstances.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id").references(() => skills.id, { onDelete: "set null" }),
  
  // Signal type
  signalType: text("signal_type").notNull(), // QUESTION_ATTEMPT, HINT_USED, VOICE_ANSWER, SESSION_TIME, PRACTICE_ACTIVITY
  
  // Signal data (flexible JSON)
  data: json("data").$type<{
    questionId?: string;
    attemptNumber?: number;
    isCorrect?: boolean;
    timeSpentSeconds?: number;
    hintLevel?: number; // 1, 2, 3 for progressive hints
    voiceConfidenceScore?: number; // 0-100 from AI validation
    activityId?: string;
    wasSkipped?: boolean;
    expressedFrustration?: boolean; // Detected from voice/behavior
    expressedConfidence?: boolean;
  }>().notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Child learning profile - aggregated learning patterns
export const childLearningProfile = pgTable("child_learning_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }).unique(),
  
  // Aggregated patterns (updated periodically)
  
  // Subject preferences (which subjects they engage most with)
  subjectStrengths: json("subject_strengths").$type<{
    [subject: string]: {
      averageScore: number; // 0-100
      lessonsCompleted: number;
      averageTimeMinutes: number;
      struggleRate: number; // % of lessons where hints were used
    };
  }>().notNull().default(sql`'{}'::json`),
  
  // Time-of-day patterns
  bestTimeOfDay: text("best_time_of_day"), // morning, afternoon, evening
  averageSessionMinutes: integer("average_session_minutes"),
  
  // Learning style indicators
  preferredInteractionTypes: json("preferred_interaction_types").$type<string[]>().default(sql`'[]'::json`), // tap_choice, fill_blank, voice, etc.
  hintUsageRate: integer("hint_usage_rate"), // 0-100, how often they use hints
  
  // Struggle patterns
  commonMisconceptions: json("common_misconceptions").$type<{
    [misconceptionTag: string]: number; // count of occurrences
  }>().default(sql`'{}'::json`),
  
  // Engagement metrics
  averageAttemptBeforeSuccess: integer("average_attempt_before_success").default(1),
  completionRate: integer("completion_rate"), // 0-100, % of started lessons completed
  
  // Current position in curriculum
  currentStrandId: varchar("current_strand_id").references(() => curriculumStrands.id, { onDelete: "set null" }),
  currentMilestoneId: varchar("current_milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  currentSkillId: varchar("current_skill_id").references(() => skills.id, { onDelete: "set null" }),
  
  // Next recommended skills (computed by progression engine)
  nextSkillIds: json("next_skill_ids").$type<string[]>().default(sql`'[]'::json`),
  reinforcementSkillIds: json("reinforcement_skill_ids").$type<string[]>().default(sql`'[]'::json`), // Skills to review
  
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
});

// Types for curriculum progression
export type CurriculumStrand = typeof curriculumStrands.$inferSelect;
export type YearEndGoal = typeof yearEndGoals.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type SkillEdge = typeof skillEdges.$inferSelect;
export type ChildMilestoneProgress = typeof childMilestoneProgress.$inferSelect;
export type ChildYearGoalProgress = typeof childYearGoalProgress.$inferSelect;
export type LearningSignal = typeof learningSignals.$inferSelect;
export type ChildLearningProfile = typeof childLearningProfile.$inferSelect;

// Schema for recording learning signals
export const recordLearningSignalSchema = z.object({
  lessonInstanceId: z.string().optional(),
  skillId: z.string().optional(),
  signalType: z.enum(["QUESTION_ATTEMPT", "HINT_USED", "VOICE_ANSWER", "SESSION_TIME", "PRACTICE_ACTIVITY"]),
  data: z.object({
    questionId: z.string().optional(),
    attemptNumber: z.number().optional(),
    isCorrect: z.boolean().optional(),
    timeSpentSeconds: z.number().optional(),
    hintLevel: z.number().optional(),
    voiceConfidenceScore: z.number().optional(),
    activityId: z.string().optional(),
    wasSkipped: z.boolean().optional(),
    expressedFrustration: z.boolean().optional(),
    expressedConfidence: z.boolean().optional(),
  }),
});
export type RecordLearningSignal = z.infer<typeof recordLearningSignalSchema>;

// ============================================
// DAILY QUEUE (LEARNING OS) SYSTEM
// ============================================

// Queue item types for different learning activities
export type QueueItemType = "CORE_LEARNING" | "SPIRAL_REVIEW" | "APPLY" | "DEVOTIONAL";

// Daily queue item structure
export type DailyQueueItem = {
  id: string;
  type: QueueItemType;
  skillId?: string;
  skillName?: string;
  subject?: string;
  description: string;
  estimatedMinutes: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  lessonInstanceId?: string;
  completedAt?: string;
  order: number;
};

// Daily queue table - stores generated daily learning plans
export const dailyQueues = pgTable("daily_queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  
  // Queue items organized by section
  items: json("items").$type<DailyQueueItem[]>().notNull().default(sql`'[]'::json`),
  
  // Status tracking
  status: text("status").notNull().default("GENERATED"), // GENERATED, IN_PROGRESS, COMPLETED
  completedItems: integer("completed_items").notNull().default(0),
  totalItems: integer("total_items").notNull().default(0),
  
  // Timestamps
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export type DailyQueue = typeof dailyQueues.$inferSelect;
export type InsertDailyQueue = typeof dailyQueues.$inferInsert;
