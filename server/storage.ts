import { db } from "./db";
import { 
  users, children, childSettings, plans, tasks, quizzes, rewardState, devotionals,
  skills, childSkillProgress, taskSkills, taskOutcomes,
  lessonTemplates, lessonInstances, lessonAttempts, parentLessons,
  avatarState, badgeDefinitions, earnedBadges, inventoryItems, childInventory, levelThresholds,
  worldDefinitions, worldTools, childWorldProgress, childWorldTools, journeyTiles,
  buddyLinks, activityEvents, activityReactions,
  buddyProfiles, profileReactions, buddyPokes,
  aiTeacherSessions, aiTeacherMessages,
  parentProfiles, communityGroups, groupMemberships, groupPosts, postReplies, helpfulVotes, parentConnections, parentMessages,
  dailyQueues,
  type User, type Child, type ChildSettings, type Plan, type Task, type Quiz, type RewardState, type Devotional,
  type Skill, type ChildSkillProgress, type TaskSkill, type TaskOutcome,
  type LessonTemplate, type LessonInstance, type LessonAttempt, type ParentLesson,
  type AvatarState, type BadgeDefinition, type EarnedBadge, type InventoryItem, type ChildInventoryItem, type LevelThreshold,
  type LessonInstanceStep, type LessonInstanceAssessment, type TeachPhase, type PracticePhase, type DifficultyConfig, type ModeConfig, type AssessmentQuestion,
  type LessonProgressState,
  type WorldDefinition, type WorldTool, type ChildWorldProgress, type ChildWorldTool, type JourneyTile,
  type BuddyLink, type ActivityEvent, type ActivityReaction, type ActivityEventMetadata,
  type BuddyProfile, type ProfileReaction, type BuddyPoke,
  type AvatarTraits, defaultAvatarTraits,
  type AiTeacherSession, type AiTeacherMessage,
  type ParentProfile, type CommunityGroup, type GroupMembership, type GroupPost, type PostReply, type ParentConnection, type ParentMessage,
  type DailyQueue, type DailyQueueItem
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, inArray, sql, or, ne } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string): Promise<User>;
  
  // Child operations
  getChildById(id: string): Promise<(Child & { settings: ChildSettings | null; avatarTraits?: any }) | undefined>;
  getChildrenByParentId(parentId: string): Promise<Array<Child & { settings: ChildSettings | null; rewards: RewardState | null; avatarTraits?: any }>>;
  getChildByUsername(username: string): Promise<(Child & { settings: ChildSettings | null }) | undefined>;
  createChild(data: {
    parentId: string;
    name: string;
    grade: string;
    username: string;
    pinHash: string;
    faithMode: string;
    learningStyle: string;
  }): Promise<Child>;
  updateChild(id: string, data: Partial<{
    name: string;
    grade: string;
    username: string;
    pinHash: string;
    avatarUrl: string | null;
  }>): Promise<Child | undefined>;
  
  // Child settings operations
  updateChildSettings(childId: string, data: {
    faithMode?: string;
    learningStyle?: string;
    dyslexiaSupport?: boolean;
    devotionalCadence?: string;
  }): Promise<ChildSettings | undefined>;
  
  // Plan operations
  createPlan(data: {
    childId: string;
    type: string;
    startDate: string;
    endDate?: string;
  }): Promise<Plan>;
  getPlansByChildId(childId: string): Promise<Plan[]>;
  getLatestPlanByChildId(childId: string): Promise<Plan | undefined>;
  
  // Task operations
  createTasks(tasks: Array<{
    planId: string;
    childId: string;
    date: string;
    subject: string;
    title: string;
    objective: string;
    activityType: string;
    instructionsForChild: string;
    instructionsForParent?: string;
    scriptureReference?: string;
    scriptureText?: string;
    reflectionPrompt?: string;
    overview?: string;
    materialsNeeded?: string[];
    lessonSteps?: Array<{ stepNumber: number; parentInstructions: string; childTask: string }>;
    assessment?: { type: "skill_check" | "mini_quiz" | "reflection"; instructions: string };
    extensionOptions?: string[];
    faithIntegration?: { scripture: string; tieIn: string; optionalPrayer: string } | null;
    customizationPoints?: string[];
  }>): Promise<Task[]>;
  getTasksByChildAndDateRange(childId: string, startDate: string, endDate: string): Promise<Task[]>;
  getTasksByPlanId(planId: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  getRecentTasksWithNotes(childId: string, limit?: number): Promise<Task[]>;
  completeTask(id: string): Promise<Task | undefined>;
  updateTask(id: string, data: {
    objective?: string;
    instructionsForChild?: string;
    instructionsForParent?: string | null;
    materialsNeeded?: string[];
    scriptureReference?: string | null;
    scriptureText?: string | null;
    reflectionPrompt?: string | null;
    parentNotes?: string | null;
  }): Promise<Task | undefined>;
  
  // Quiz operations
  createQuiz(data: {
    taskId: string;
    questions: Array<{
      type: "MULTIPLE_CHOICE" | "YES_NO" | "SHORT_TEXT";
      questionText: string;
      options?: string[];
      correctAnswer: string;
    }>;
  }): Promise<Quiz>;
  getQuizByTaskId(taskId: string): Promise<Quiz | undefined>;
  submitQuizAnswers(taskId: string, answers: string[]): Promise<{ quiz: Quiz; score: number }>;
  
  // Reward operations
  getRewardsByChildId(childId: string): Promise<RewardState | undefined>;
  addPoints(childId: string, points: number): Promise<RewardState>;
  addBadge(childId: string, badge: string): Promise<RewardState>;
  initializeRewards(childId: string): Promise<RewardState>;
  
  // Progress stats operations
  getProgressStats(childId: string): Promise<{
    totalTasksCompleted: number;
    weeklyActivity: Array<{ date: string; completed: number; total: number }>;
    subjectBreakdown: Array<{ subject: string; completed: number; total: number }>;
    streakDays: number;
    todayCompleted: number;
    todayTotal: number;
  }>;
  
  // Devotional operations
  getDevotionalByChildAndDate(childId: string, date: string): Promise<Devotional | undefined>;
  createDevotional(data: {
    childId: string;
    date: string;
    grade: string;
    faithMode: string;
    scriptureReference: string;
    scriptureText: string;
    title: string;
    explanation: string;
    reflection: string;
    prayerPrompt?: string;
    deeperContext?: string;
  }): Promise<Devotional>;
  
  // ============================================
  // ADAPTIVE LEARNING OPERATIONS
  // ============================================
  
  // Skill operations
  getAllSkills(): Promise<Skill[]>;
  getSkillsBySubjectAndGrade(subject: string, gradeLevel: string): Promise<Skill[]>;
  getSkillById(id: string): Promise<Skill | undefined>;
  createSkill(data: {
    subject: string;
    strand: string;
    gradeLevel: string;
    standardCode?: string;
    name: string;
    description: string;
    prerequisiteSkillIds?: string[];
    orderInStrand: number;
  }): Promise<Skill>;
  
  // Child skill progress operations
  getChildSkillProgress(childId: string): Promise<ChildSkillProgress[]>;
  getChildSkillProgressBySkill(childId: string, skillId: string): Promise<ChildSkillProgress | undefined>;
  upsertChildSkillProgress(data: {
    childId: string;
    skillId: string;
    masteryLevel: string;
    evidenceCount?: number;
    successCount?: number;
    attemptCount?: number;
    lastPracticeDate?: string;
    lastScore?: number;
    needsReinforcement?: boolean;
  }): Promise<ChildSkillProgress>;
  getSkillsNeedingReinforcement(childId: string): Promise<Array<Skill & { progress: ChildSkillProgress }>>;
  getReadyToAdvanceSkills(childId: string, gradeLevel: string): Promise<Skill[]>;
  
  // Task-skill linking operations
  linkTaskToSkills(taskId: string, skillLinks: Array<{ skillId: string; isPrimaryFocus: boolean; isReview: boolean }>): Promise<TaskSkill[]>;
  getSkillsForTask(taskId: string): Promise<Array<Skill & { isPrimaryFocus: boolean; isReview: boolean }>>;
  
  // Task outcome operations
  createTaskOutcome(data: {
    taskId: string;
    childId: string;
    quizScore?: number;
    parentFeedback?: string;
    childConfidence?: number;
    timeOnTaskMinutes?: number;
    approachUsed?: string;
    notes?: string;
  }): Promise<TaskOutcome>;
  getTaskOutcome(taskId: string): Promise<TaskOutcome | undefined>;
  getRecentTaskOutcomes(childId: string, limit?: number): Promise<Array<TaskOutcome & { task: Task }>>;
  
  // Mastery snapshot for AI prompting
  getMasterySnapshot(childId: string): Promise<{
    subjectMastery: Array<{
      subject: string;
      totalSkills: number;
      mastered: number;
      developing: number;
      emerging: number;
      notIntroduced: number;
      skillsNeedingReinforcement: string[];
    }>;
    recentOutcomes: Array<{
      taskTitle: string;
      subject: string;
      date: string;
      quizScore: number | null;
      parentFeedback: string | null;
      wasSuccessful: boolean;
    }>;
    strugglingAreas: string[];
    readyToAdvance: string[];
  }>;
  
  // ============================================
  // ADAPTIVE LESSON ENGINE OPERATIONS
  // ============================================
  
  // Lesson template operations
  getLessonTemplates(subject?: string, gradeBand?: string): Promise<LessonTemplate[]>;
  getLessonTemplateById(id: string): Promise<LessonTemplate | undefined>;
  getLessonTemplateBySkill(skillName: string, gradeBand: string): Promise<LessonTemplate | undefined>;
  createLessonTemplate(data: {
    subject: string;
    targetSkillId?: string;
    targetSkillName: string;
    gradeBand: string;
    objective: string;
    difficultyLevels: { easy: DifficultyConfig; medium: DifficultyConfig; hard: DifficultyConfig };
    modes: { hands_on: ModeConfig; visual: ModeConfig; story: ModeConfig };
    assessmentBank?: { formative: AssessmentQuestion[]; checkpoint: AssessmentQuestion[]; challenge: AssessmentQuestion[] };
  }): Promise<LessonTemplate>;
  
  // Lesson instance operations
  getLessonInstanceById(id: string): Promise<LessonInstance | undefined>;
  getLessonInstancesForChild(childId: string, date?: string): Promise<LessonInstance[]>;
  getTodaysLessonsForChild(childId: string): Promise<LessonInstance[]>;
  getAllLessonsForChild(childId: string): Promise<LessonInstance[]>;
  createLessonInstance(data: {
    childId: string;
    lessonTemplateId?: string;
    difficultyUsed: string;
    modeUsed: string;
    subject: string;
    title: string;
    goal?: string;
    objective: string;
    targetSkillName: string;
    steps: LessonInstanceStep[];
    teachPhase?: TeachPhase;
    practicePhase?: PracticePhase;
    parentNote?: string;
    assessment?: LessonInstanceAssessment;
    faithIntegration?: { scripture?: string; tieIn?: string; optionalPrayer?: string };
    date: string;
    parentLessonId?: string;
  }): Promise<LessonInstance>;
  updateLessonInstanceStatus(id: string, status: string, pointsEarned?: number): Promise<LessonInstance | undefined>;
  skipLessonInstance(id: string, reason?: string): Promise<LessonInstance | undefined>;
  resumeSkippedLesson(id: string): Promise<LessonInstance | undefined>;
  getSkippedLessonsForChild(childId: string): Promise<LessonInstance[]>;
  getLessonsForParent(parentId: string, filters?: { childId?: string; status?: string; subject?: string }): Promise<Array<LessonInstance & { childName: string }>>;
  saveLessonProgress(id: string, progressStepIndex: number, progressState: LessonProgressState): Promise<LessonInstance | undefined>;
  clearLessonProgress(id: string): Promise<LessonInstance | undefined>;
  
  // Lesson attempt operations (no-wrong-answer model)
  createLessonAttempt(data: {
    lessonInstanceId: string;
    childId: string;
    questionId: string;
    childAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    attemptNumber: number;
    misconceptionTag?: string;
    explanationForChild?: string;
    hint?: string;
    nextAction?: string;
  }): Promise<LessonAttempt>;
  getAttemptsForLesson(lessonInstanceId: string): Promise<LessonAttempt[]>;
  getAttemptCountForQuestion(lessonInstanceId: string, questionId: string): Promise<number>;
  
  // Learner profile operations
  updateLearnerProfile(childId: string, data: {
    readingStage?: string;
    mathStage?: string;
    preferredModes?: string[];
    sessionLengthMinutes?: number;
    confidence?: number;
    lastDifficultyOutcome?: string;
  }): Promise<ChildSettings | undefined>;
  
  // Journey progress operations
  updateJourneyProgress(childId: string, data: {
    journeyStage?: number;
    journeyPosition?: number;
    growthPoints?: number;
  }): Promise<ChildSettings | undefined>;
  addGrowthPoints(childId: string, points: number): Promise<ChildSettings | undefined>;
  
  // Parent lesson operations
  createParentLesson(data: {
    parentId: string;
    childId: string;
    subject: string;
    skillTag?: string;
    parentNotes?: string;
    sessionLengthMinutes?: number;
    preferredMode?: string;
  }): Promise<ParentLesson>;
  getParentLessonById(id: string): Promise<ParentLesson | undefined>;
  getParentLessonsByChildId(childId: string): Promise<ParentLesson[]>;
  updateParentLessonStatus(id: string, status: string): Promise<ParentLesson | undefined>;
  
  // ============================================
  // PROGRESSION SYSTEM OPERATIONS
  // ============================================
  
  // Avatar state operations
  getAvatarState(childId: string): Promise<AvatarState | undefined>;
  initializeAvatarState(childId: string): Promise<AvatarState>;
  updateAvatarMood(childId: string, mood: string): Promise<AvatarState | undefined>;
  updateAvatarTraits(childId: string, traits: AvatarTraits): Promise<AvatarState | undefined>;
  equipItem(childId: string, slot: string, itemId: string | null): Promise<AvatarState | undefined>;
  
  // XP and leveling operations
  awardXP(childId: string, xpAmount: number): Promise<{
    avatarState: AvatarState;
    leveledUp: boolean;
    newLevel?: number;
    newTitle?: string;
    unlockedItems?: InventoryItem[];
  }>;
  updateStreak(childId: string, date: string): Promise<AvatarState | undefined>;
  
  // Level thresholds operations
  getLevelThresholds(): Promise<LevelThreshold[]>;
  getLevelThreshold(level: number): Promise<LevelThreshold | undefined>;
  seedLevelThresholds(): Promise<void>;
  
  // Badge operations
  getAllBadgeDefinitions(): Promise<BadgeDefinition[]>;
  getBadgeDefinitionBySlug(slug: string): Promise<BadgeDefinition | undefined>;
  getEarnedBadges(childId: string): Promise<Array<EarnedBadge & { badge: BadgeDefinition }>>;
  awardBadge(childId: string, badgeSlug: string, context?: { lessonId?: string; subject?: string; value?: number }): Promise<{
    earned: boolean;
    badge?: BadgeDefinition;
    xpAwarded?: number;
    alreadyHad?: boolean;
  }>;
  checkAndAwardBadges(childId: string): Promise<Array<{ badge: BadgeDefinition; xpAwarded: number }>>;
  seedBadgeDefinitions(): Promise<void>;
  
  // Inventory operations
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemBySlug(slug: string): Promise<InventoryItem | undefined>;
  getChildInventory(childId: string): Promise<Array<ChildInventoryItem & { item: InventoryItem }>>;
  grantInventoryItem(childId: string, itemSlug: string, obtainedVia: string, context?: { lessonId?: string; badgeId?: string; level?: number }): Promise<ChildInventoryItem | undefined>;
  hasInventoryItem(childId: string, itemSlug: string): Promise<boolean>;
  seedInventoryItems(): Promise<void>;
  
  // Full progression data for UI
  getFullProgression(childId: string): Promise<{
    avatarState: AvatarState;
    currentLevelInfo: LevelThreshold | undefined;
    nextLevelInfo: LevelThreshold | undefined;
    xpToNextLevel: number;
    earnedBadges: Array<EarnedBadge & { badge: BadgeDefinition }>;
    inventory: Array<ChildInventoryItem & { item: InventoryItem }>;
    lessonsCompletedCount: number;
  }>;

  // ============================================
  // JOURNEY WORLD SYSTEM OPERATIONS
  // ============================================
  
  getAllWorlds(): Promise<WorldDefinition[]>;
  getWorldBySlug(slug: string): Promise<WorldDefinition | undefined>;
  getWorldTools(worldId: string): Promise<WorldTool[]>;
  
  getChildWorldProgress(childId: string, worldId: string): Promise<ChildWorldProgress | undefined>;
  getChildAllWorldProgress(childId: string): Promise<ChildWorldProgress[]>;
  initializeChildWorldProgress(childId: string, worldId: string): Promise<ChildWorldProgress>;
  updateChildWorldProgress(childId: string, worldId: string, data: Partial<{
    currentTile: number;
    tilesCompleted: number;
    status: string;
    startedAt: Date;
    completedAt: Date;
  }>): Promise<ChildWorldProgress | undefined>;
  
  getJourneyTiles(childId: string, worldId: string): Promise<JourneyTile[]>;
  createJourneyTiles(childId: string, worldId: string, tilesCount: number): Promise<JourneyTile[]>;
  getJourneyTileById(tileId: string): Promise<JourneyTile | undefined>;
  updateJourneyTile(tileId: string, data: Partial<{
    status: string;
    lessonInstanceId: string;
    completedAt: Date;
  }>): Promise<JourneyTile | undefined>;
  
  getChildEarnedTools(childId: string): Promise<Array<WorldTool & { earnedAt: Date }>>;
  awardWorldTool(childId: string, toolId: string, earnedAtTile: number, lessonInstanceId?: string): Promise<ChildWorldTool>;
  
  getJourneyData(childId: string): Promise<{
    currentWorld: WorldDefinition;
    worldProgress: ChildWorldProgress;
    tiles: JourneyTile[];
    earnedTools: Array<WorldTool & { earnedAt: string }>;
    allWorlds: WorldDefinition[];
  } | null>;

  getJourneyPreviewForParent(childId: string): Promise<{
    childId: string;
    hasJourney: boolean;
    currentWorld?: {
      name: string;
      slug: string;
      themeColor: string;
    };
    currentTile?: {
      tileNumber: number;
      totalTiles: number;
      subject: string;
      status: string;
    };
    currentLesson?: {
      id: string;
      title: string;
      goal: string | null;
      objective: string;
      subject: string;
      targetSkillName: string;
      faithIntegration?: {
        scripture?: string;
        tieIn?: string;
      } | null;
      status: string;
    };
    upcomingTiles: Array<{
      tileNumber: number;
      subject: string;
    }>;
    progress: {
      tilesCompleted: number;
      totalTiles: number;
      percentComplete: number;
    };
  } | null>;

  // ============================================
  // SOCIAL WORLD V1 - BUDDY SYSTEM OPERATIONS
  // ============================================
  
  // Buddy request operations
  createBuddyRequest(requesterId: string, receiverId: string): Promise<BuddyLink>;
  createSiblingBuddyLinks(newChildId: string, parentId: string): Promise<BuddyLink[]>;
  getBuddyLinkById(id: string): Promise<BuddyLink | undefined>;
  getBuddyLinkBetweenChildren(childId1: string, childId2: string): Promise<BuddyLink | undefined>;
  
  // Get buddy requests by status
  getPendingBuddyRequestsForParent(parentId: string): Promise<Array<BuddyLink & { 
    requester: Child & { avatarTraits?: any }; 
    receiver: Child & { avatarTraits?: any };
    isRequesterChild: boolean; // true if this parent's child is the requester
  }>>;
  getPendingBuddyRequestsForChild(childId: string): Promise<Array<BuddyLink & { requester: Child & { avatarTraits?: any } }>>;
  getActiveBuddies(childId: string): Promise<Array<Child & { buddyLinkId: string; avatarTraits?: any }>>;
  getBuddiesWaitingForApproval(childId: string): Promise<Array<Child & { buddyLinkId: string; status: string; avatarTraits?: any }>>;
  
  // Buddy status updates
  approveBuddyRequestByParent(buddyLinkId: string, isRequesterParent: boolean): Promise<BuddyLink | undefined>;
  acceptBuddyRequest(buddyLinkId: string): Promise<BuddyLink | undefined>;
  declineBuddyRequest(buddyLinkId: string, declinedBy: string, reason?: string): Promise<BuddyLink | undefined>;
  removeBuddy(buddyLinkId: string): Promise<boolean>;
  
  // Search for children to add as buddies (by username, excluding self and existing buddies)
  searchChildrenByUsername(searchTerm: string, excludeChildId: string): Promise<Array<{ id: string; name: string; username: string; avatarTraits: any }>>;

  // ============================================
  // SOCIAL WORLD V1 - ACTIVITY FEED OPERATIONS
  // ============================================
  
  // Activity event operations
  createActivityEvent(data: {
    childId: string;
    eventType: string;
    metadata: ActivityEventMetadata;
    visibility?: string;
  }): Promise<ActivityEvent>;
  
  getActivityFeedForChild(childId: string, limit?: number): Promise<Array<ActivityEvent & { 
    child: Child & { avatarTraits?: any };
    reactions: Array<ActivityReaction & { child: Child }>;
  }>>;
  
  getActivityEventById(id: string): Promise<ActivityEvent | undefined>;
  
  // Reaction operations
  addReaction(activityEventId: string, childId: string, reactionType: string): Promise<ActivityReaction>;
  removeReaction(reactionId: string): Promise<boolean>;
  getReactionsForActivity(activityEventId: string): Promise<Array<ActivityReaction & { child: Child }>>;
  hasReacted(activityEventId: string, childId: string): Promise<boolean>;
  
  // Parent oversight
  getChildActivityEvents(childId: string, limit?: number): Promise<ActivityEvent[]>;
  getChildReactionsReceived(childId: string, limit?: number): Promise<Array<ActivityReaction & { 
    activity: ActivityEvent;
    reactor: Child;
  }>>;

  // ============================================
  // BUDDY PROFILE OPERATIONS
  // ============================================
  
  // Profile CRUD
  getBuddyProfile(childId: string): Promise<BuddyProfile | undefined>;
  createBuddyProfile(childId: string): Promise<BuddyProfile>;
  updateBuddyProfile(childId: string, data: Partial<{
    theme: string;
    accentColor: string;
    identityTags: string[];
    learningStyles: string[];
    funFacts: string[];
    favoriteSubjects: string[];
    topBuddyIds: string[];
  }>): Promise<BuddyProfile | undefined>;
  
  // Profile reactions
  addProfileReaction(profileChildId: string, reactorChildId: string, reactionType: string): Promise<ProfileReaction>;
  getProfileReactions(profileChildId: string): Promise<Array<ProfileReaction & { reactor: Child }>>;
  removeProfileReaction(reactionId: string): Promise<boolean>;
  
  // ============================================
  // BUDDY POKES
  // ============================================
  
  sendPoke(buddyLinkId: string, senderChildId: string, recipientChildId: string): Promise<BuddyPoke>;
  acknowledgePoke(pokeId: string, recipientChildId: string): Promise<{ success: boolean; error?: string }>;
  getUnacknowledgedPokes(childId: string): Promise<Array<BuddyPoke & { sender: Child & { avatarTraits?: any } }>>;
  getRecentPokes(childId: string, limit?: number): Promise<Array<BuddyPoke & { sender: Child & { avatarTraits?: any } }>>;
  canSendPoke(buddyLinkId: string, senderChildId: string): Promise<boolean>;

  // ============================================
  // AI TEACHER OPERATIONS
  // ============================================
  
  createAiTeacherSession(data: {
    childId: string;
    lessonInstanceId?: string;
    subject?: string;
    currentStep?: number;
  }): Promise<AiTeacherSession>;
  
  getAiTeacherSession(sessionId: string): Promise<AiTeacherSession | undefined>;
  getActiveSessionForLesson(childId: string, lessonInstanceId: string): Promise<AiTeacherSession | undefined>;
  getActiveSessionForChild(childId: string): Promise<AiTeacherSession | undefined>;
  
  updateAiTeacherSession(sessionId: string, data: {
    currentStep?: number;
    status?: string;
    messageCount?: number;
  }): Promise<AiTeacherSession | undefined>;
  
  endAiTeacherSession(sessionId: string): Promise<AiTeacherSession | undefined>;
  
  createAiTeacherMessage(data: {
    sessionId: string;
    role: string;
    content: string;
    inputMode?: string;
    outputMode?: string;
    audioUrl?: string;
  }): Promise<AiTeacherMessage>;
  
  getMessagesForSession(sessionId: string): Promise<AiTeacherMessage[]>;

  // ============================================
  // PARENT COMMUNITY OPERATIONS
  // ============================================

  // Parent profile operations
  getParentProfile(userId: string): Promise<ParentProfile | undefined>;
  createParentProfile(data: {
    userId: string;
    firstName: string;
    lastName?: string;
    bio?: string;
    city?: string;
    state?: string;
    homeschoolStyle?: string;
    yearsHomeschooling?: number;
    childAgeRanges?: string[];
    interests?: string[];
    showLocation?: boolean;
    showInDiscovery?: boolean;
    allowConnectionRequests?: boolean;
    isComplete?: boolean;
  }): Promise<ParentProfile>;
  updateParentProfile(userId: string, data: Partial<{
    firstName: string;
    lastName: string;
    bio: string;
    city: string;
    state: string;
    homeschoolStyle: string;
    yearsHomeschooling: number;
    childAgeRanges: string[];
    interests: string[];
    showLocation: boolean;
    showInDiscovery: boolean;
    allowConnectionRequests: boolean;
    isComplete: boolean;
  }>): Promise<ParentProfile | undefined>;

  // Discovery operations
  discoverFamilies(params: {
    userId: string;
    state?: string;
    city?: string;
    interests?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Array<ParentProfile & { childCount: number }>>;
  getFamiliesWithBuddyConnections(userId: string): Promise<Array<ParentProfile & { buddyChildName: string; myChildName: string }>>;

  // Community group operations
  getCommunityGroups(params: {
    groupType?: string;
    state?: string;
    city?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CommunityGroup[]>;
  getCommunityGroup(groupId: string): Promise<CommunityGroup | undefined>;
  getCommunityGroupBySlug(slug: string): Promise<CommunityGroup | undefined>;
  createCommunityGroup(data: {
    name: string;
    slug: string;
    description?: string;
    groupType: string;
    city?: string;
    state?: string;
    topics?: string[];
    isPrivate?: boolean;
    requiresApproval?: boolean;
    joinCode?: string;
    maxMembers?: number;
    createdBy?: string;
  }): Promise<CommunityGroup>;
  updateCommunityGroup(groupId: string, data: Partial<{
    name: string;
    description: string;
    topics: string[];
    isPrivate: boolean;
    requiresApproval: boolean;
    joinCode: string;
    maxMembers: number;
    isActive: boolean;
  }>): Promise<CommunityGroup | undefined>;

  // Group membership operations
  getGroupMembership(groupId: string, userId: string): Promise<GroupMembership | undefined>;
  getGroupMembers(groupId: string, status?: string): Promise<Array<GroupMembership & { profile: ParentProfile | null }>>;
  getUserGroups(userId: string): Promise<Array<CommunityGroup & { membership: GroupMembership }>>;
  joinGroup(groupId: string, userId: string): Promise<GroupMembership>;
  addGroupCreatorAsMember(groupId: string, userId: string): Promise<GroupMembership>;
  approveGroupMember(groupId: string, userId: string, approvedBy: string): Promise<GroupMembership | undefined>;
  updateMemberRole(groupId: string, userId: string, role: string): Promise<GroupMembership | undefined>;
  leaveGroup(groupId: string, userId: string): Promise<boolean>;

  // Group posts operations
  getGroupPosts(groupId: string, params?: {
    postType?: string;
    sortBy?: 'new' | 'active' | 'helpful';
    limit?: number;
    offset?: number;
  }): Promise<Array<GroupPost & { author: ParentProfile | null }>>;
  getGroupPost(postId: string): Promise<(GroupPost & { author: ParentProfile | null }) | undefined>;
  createGroupPost(data: {
    groupId: string;
    authorId: string;
    postType?: string;
    title?: string;
    content: string;
    resourceUrl?: string;
  }): Promise<GroupPost>;
  updateGroupPost(postId: string, data: Partial<{
    title: string;
    content: string;
    resourceUrl: string;
    isPinned: boolean;
    isHidden: boolean;
  }>): Promise<GroupPost | undefined>;
  deleteGroupPost(postId: string): Promise<boolean>;

  // Post replies operations
  getPostReplies(postId: string): Promise<Array<PostReply & { author: ParentProfile | null }>>;
  createPostReply(data: {
    postId: string;
    authorId: string;
    content: string;
  }): Promise<PostReply>;
  deletePostReply(replyId: string): Promise<boolean>;

  // Helpful votes
  toggleHelpfulVote(userId: string, postId?: string, replyId?: string): Promise<{ voted: boolean }>;
  hasVoted(userId: string, postId?: string, replyId?: string): Promise<boolean>;

  // Parent connection operations
  getParentConnections(userId: string, status?: string): Promise<Array<ParentConnection & { profile: ParentProfile }>>;
  getParentConnection(connectionId: string): Promise<ParentConnection | undefined>;
  getConnectionBetween(userId1: string, userId2: string): Promise<ParentConnection | undefined>;
  sendConnectionRequest(data: {
    requesterId: string;
    receiverId: string;
    connectionSource?: string;
    sourceId?: string;
    message?: string;
  }): Promise<ParentConnection>;
  respondToConnectionRequest(connectionId: string, accept: boolean): Promise<ParentConnection | undefined>;
  getPendingConnectionRequests(userId: string): Promise<Array<ParentConnection & { requester: ParentProfile }>>;

  // Parent messaging operations
  getMessages(connectionId: string, limit?: number): Promise<ParentMessage[]>;
  sendMessage(data: {
    connectionId: string;
    senderId: string;
    content: string;
  }): Promise<ParentMessage>;
  markMessageRead(messageId: string): Promise<ParentMessage | undefined>;
  reportMessage(messageId: string): Promise<ParentMessage | undefined>;

  // Auto-generate local groups
  ensureStateGroup(state: string): Promise<CommunityGroup>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      role: "PARENT",
    }).returning();
    return user;
  }

  // Child operations
  async getChildById(id: string): Promise<(Child & { settings: ChildSettings | null; avatarTraits?: any }) | undefined> {
    const [result] = await db
      .select({
        child: children,
        settings: childSettings,
        avatarTraits: avatarState.avatarTraits,
      })
      .from(children)
      .leftJoin(childSettings, eq(children.id, childSettings.childId))
      .leftJoin(avatarState, eq(children.id, avatarState.childId))
      .where(eq(children.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.child,
      settings: result.settings,
      avatarTraits: result.avatarTraits,
    };
  }

  async getChildrenByParentId(parentId: string): Promise<Array<Child & { settings: ChildSettings | null; rewards: RewardState | null; avatarTraits?: any }>> {
    const results = await db
      .select({
        child: children,
        settings: childSettings,
        rewards: rewardState,
        avatarTraits: avatarState.avatarTraits,
      })
      .from(children)
      .leftJoin(childSettings, eq(children.id, childSettings.childId))
      .leftJoin(rewardState, eq(children.id, rewardState.childId))
      .leftJoin(avatarState, eq(children.id, avatarState.childId))
      .where(eq(children.parentId, parentId));
    
    return results.map((r: any) => ({
      ...r.child,
      settings: r.settings,
      rewards: r.rewards,
      avatarTraits: r.avatarTraits,
    }));
  }

  async getChildByUsername(username: string): Promise<(Child & { settings: ChildSettings | null }) | undefined> {
    const [result] = await db
      .select()
      .from(children)
      .leftJoin(childSettings, eq(children.id, childSettings.childId))
      .where(eq(children.username, username));
    
    if (!result) return undefined;
    
    return {
      ...result.children,
      settings: result.child_settings,
    };
  }

  async createChild(data: {
    parentId: string;
    name: string;
    grade: string;
    username: string;
    pinHash: string;
    faithMode: string;
    learningStyle: string;
  }): Promise<Child> {
    const [child] = await db.insert(children).values({
      parentId: data.parentId,
      name: data.name,
      grade: data.grade,
      username: data.username,
      pinHash: data.pinHash,
    }).returning();

    await db.insert(childSettings).values({
      childId: child.id,
      faithMode: data.faithMode,
      learningStyle: data.learningStyle,
    });

    await this.initializeRewards(child.id);

    // Auto-buddy siblings (children within the same family)
    await this.createSiblingBuddyLinks(child.id, data.parentId);

    return child;
  }

  async updateChild(id: string, data: Partial<{
    name: string;
    grade: string;
    username: string;
    pinHash: string;
    avatarUrl: string | null;
  }>): Promise<Child | undefined> {
    const [child] = await db
      .update(children)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(children.id, id))
      .returning();
    return child;
  }

  // Child settings operations
  async updateChildSettings(childId: string, data: {
    faithMode?: string;
    learningStyle?: string;
    dyslexiaSupport?: boolean;
    devotionalCadence?: string;
  }): Promise<ChildSettings | undefined> {
    // First check if settings exist for this child
    const [existing] = await db
      .select()
      .from(childSettings)
      .where(eq(childSettings.childId, childId));
    
    if (existing) {
      // Update existing settings
      const [settings] = await db
        .update(childSettings)
        .set(data)
        .where(eq(childSettings.childId, childId))
        .returning();
      return settings;
    } else {
      // Create new settings row - use provided values with fallbacks only for missing fields
      const [settings] = await db
        .insert(childSettings)
        .values({
          childId,
          faithMode: data.faithMode ?? "FAITH_FORWARD",
          learningStyle: data.learningStyle ?? "HANDS_ON_MONTESSORI",
          dyslexiaSupport: data.dyslexiaSupport ?? false,
        })
        .returning();
      return settings;
    }
  }

  // Plan operations
  async createPlan(data: {
    childId: string;
    type: string;
    startDate: string;
    endDate?: string;
  }): Promise<Plan> {
    const [plan] = await db.insert(plans).values(data).returning();
    return plan;
  }

  async getPlansByChildId(childId: string): Promise<Plan[]> {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.childId, childId))
      .orderBy(desc(plans.generatedAt));
  }

  async getLatestPlanByChildId(childId: string): Promise<Plan | undefined> {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.childId, childId))
      .orderBy(desc(plans.generatedAt))
      .limit(1);
    return plan;
  }

  // Task operations
  async createTasks(taskData: Array<{
    planId: string;
    childId: string;
    date: string;
    subject: string;
    title: string;
    objective: string;
    activityType: string;
    instructionsForChild: string;
    instructionsForParent?: string;
    scriptureReference?: string;
    scriptureText?: string;
    reflectionPrompt?: string;
    overview?: string;
    materialsNeeded?: string[];
    lessonSteps?: Array<{ stepNumber: number; parentInstructions: string; childTask: string }>;
    assessment?: { type: "skill_check" | "mini_quiz" | "reflection"; instructions: string };
    extensionOptions?: string[];
    faithIntegration?: { scripture: string; tieIn: string; optionalPrayer: string } | null;
    customizationPoints?: string[];
  }>): Promise<Task[]> {
    if (taskData.length === 0) return [];
    return await db.insert(tasks).values(taskData).returning();
  }

  async getTasksByChildAndDateRange(childId: string, startDate: string, endDate: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.childId, childId),
          gte(tasks.date, startDate),
          lte(tasks.date, endDate)
        )
      );
  }

  async getTasksByPlanId(planId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.planId, planId));
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getRecentTasksWithNotes(childId: string, limit: number = 10): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.childId, childId),
          sql`${tasks.parentNotes} IS NOT NULL AND ${tasks.parentNotes} != ''`
        )
      )
      .orderBy(sql`${tasks.completedAt} DESC NULLS LAST`)
      .limit(limit);
  }

  async completeTask(id: string): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ status: "COMPLETED", completedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async updateTask(id: string, data: {
    objective?: string;
    instructionsForChild?: string;
    instructionsForParent?: string | null;
    materialsNeeded?: string[];
    scriptureReference?: string | null;
    scriptureText?: string | null;
    reflectionPrompt?: string | null;
    parentNotes?: string | null;
  }): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Quiz operations
  async createQuiz(data: {
    taskId: string;
    questions: Array<{
      type: "MULTIPLE_CHOICE" | "YES_NO" | "SHORT_TEXT";
      questionText: string;
      options?: string[];
      correctAnswer: string;
    }>;
  }): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(data).returning();
    return quiz;
  }

  async getQuizByTaskId(taskId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.taskId, taskId));
    return quiz;
  }

  async submitQuizAnswers(taskId: string, answers: string[]): Promise<{ quiz: Quiz; score: number }> {
    const quiz = await this.getQuizByTaskId(taskId);
    if (!quiz) throw new Error("Quiz not found");

    const score = quiz.questions.reduce((acc, q, idx) => {
      return acc + (q.correctAnswer === answers[idx] ? 1 : 0);
    }, 0);

    const [updatedQuiz] = await db
      .update(quizzes)
      .set({
        answers,
        score,
        completedAt: new Date(),
      })
      .where(eq(quizzes.taskId, taskId))
      .returning();

    return { quiz: updatedQuiz, score };
  }

  // Reward operations
  async getRewardsByChildId(childId: string): Promise<RewardState | undefined> {
    const [rewards] = await db
      .select()
      .from(rewardState)
      .where(eq(rewardState.childId, childId));
    return rewards;
  }

  async addPoints(childId: string, points: number): Promise<RewardState> {
    const current = await this.getRewardsByChildId(childId);
    const newPoints = (current?.points || 0) + points;

    const [updated] = await db
      .update(rewardState)
      .set({ points: newPoints, lastUpdated: new Date() })
      .where(eq(rewardState.childId, childId))
      .returning();

    return updated;
  }

  async addBadge(childId: string, badge: string): Promise<RewardState> {
    const current = await this.getRewardsByChildId(childId);
    const currentBadges = current?.badges || [];
    
    if (currentBadges.includes(badge)) {
      return current!;
    }

    const newBadges = [...currentBadges, badge];

    const [updated] = await db
      .update(rewardState)
      .set({ badges: newBadges, lastUpdated: new Date() })
      .where(eq(rewardState.childId, childId))
      .returning();

    return updated;
  }

  async initializeRewards(childId: string): Promise<RewardState> {
    const [rewards] = await db.insert(rewardState).values({
      childId,
      points: 0,
      badges: [],
    }).returning();
    return rewards;
  }

  async getProgressStats(childId: string): Promise<{
    totalTasksCompleted: number;
    weeklyActivity: Array<{ date: string; completed: number; total: number }>;
    subjectBreakdown: Array<{ subject: string; completed: number; total: number }>;
    streakDays: number;
    todayCompleted: number;
    todayTotal: number;
  }> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate start of week (Monday)
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = go back 6 days, else go back to Monday
    const monday = new Date(today);
    monday.setDate(monday.getDate() - daysToSubtract);
    const mondayStr = monday.toISOString().split('T')[0];
    
    // End of week is Sunday (6 days after Monday), but clamp to today for accurate totals
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];
    
    // Use today as the upper bound to avoid counting future tasks
    const upperBoundStr = todayStr < sundayStr ? todayStr : sundayStr;

    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.childId, childId));

    const weekTasks = allTasks.filter(
      t => t.date >= mondayStr && t.date <= upperBoundStr
    );

    const totalTasksCompleted = allTasks.filter(t => t.status === "COMPLETED").length;

    // Build weekly activity for all 7 days starting from Monday
    // Future days show as empty (total: 0) until tasks are assigned
    const weeklyActivity: Array<{ date: string; completed: number; total: number }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // For future days, show zeros; for past/today, show actual counts
      if (dateStr > todayStr) {
        weeklyActivity.push({
          date: dateStr,
          completed: 0,
          total: 0,
        });
      } else {
        const dayTasks = weekTasks.filter(t => t.date === dateStr);
        weeklyActivity.push({
          date: dateStr,
          completed: dayTasks.filter(t => t.status === "COMPLETED").length,
          total: dayTasks.length,
        });
      }
    }

    const subjects = ["READING", "MATH", "SCIENCE", "CHARACTER"];
    const subjectBreakdown = subjects.map(subject => {
      const subjectTasks = allTasks.filter(t => t.subject === subject);
      return {
        subject,
        completed: subjectTasks.filter(t => t.status === "COMPLETED").length,
        total: subjectTasks.length,
      };
    });

    let streakDays = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = allTasks.filter(t => t.date === dateStr);
      
      if (dayTasks.length === 0) {
        if (i === 0) continue;
        break;
      }
      
      const allCompleted = dayTasks.every(t => t.status === "COMPLETED");
      if (allCompleted) {
        streakDays++;
      } else {
        break;
      }
    }

    const todayTasks = allTasks.filter(t => t.date === todayStr);
    const todayCompleted = todayTasks.filter(t => t.status === "COMPLETED").length;
    const todayTotal = todayTasks.length;

    return {
      totalTasksCompleted,
      weeklyActivity,
      subjectBreakdown,
      streakDays,
      todayCompleted,
      todayTotal,
    };
  }

  // Devotional operations
  async getDevotionalByChildAndDate(childId: string, date: string): Promise<Devotional | undefined> {
    const [devotional] = await db
      .select()
      .from(devotionals)
      .where(and(eq(devotionals.childId, childId), eq(devotionals.date, date)));
    return devotional;
  }

  async createDevotional(data: {
    childId: string;
    date: string;
    grade: string;
    faithMode: string;
    scriptureReference: string;
    scriptureText: string;
    title: string;
    explanation: string;
    reflection: string;
    prayerPrompt?: string;
    deeperContext?: string;
  }): Promise<Devotional> {
    const [devotional] = await db.insert(devotionals).values(data).returning();
    return devotional;
  }

  async getProgressSummaryForParent(parentId: string): Promise<Array<{
    childId: string;
    childName: string;
    grade: string;
    todayCompleted: number;
    todayTotal: number;
    streakDays: number;
    totalPoints: number;
    weeklyActivity: Array<{ date: string; completed: number; total: number }>;
  }>> {
    const parentChildren = await this.getChildrenByParentId(parentId);
    
    const summaries = await Promise.all(
      parentChildren.map(async (child) => {
        const stats = await this.getProgressStats(child.id);
        const rewards = await this.getRewardsByChildId(child.id);
        
        return {
          childId: child.id,
          childName: child.name,
          grade: child.grade,
          todayCompleted: stats.todayCompleted,
          todayTotal: stats.todayTotal,
          streakDays: stats.streakDays,
          totalPoints: rewards?.points || 0,
          weeklyActivity: stats.weeklyActivity,
        };
      })
    );
    
    return summaries;
  }

  // ============================================
  // ADAPTIVE LEARNING IMPLEMENTATIONS
  // ============================================

  // Skill operations
  async getAllSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(asc(skills.subject), asc(skills.strand), asc(skills.orderInStrand));
  }

  async getSkillsBySubjectAndGrade(subject: string, gradeLevel: string): Promise<Skill[]> {
    return await db
      .select()
      .from(skills)
      .where(and(eq(skills.subject, subject), eq(skills.gradeLevel, gradeLevel)))
      .orderBy(asc(skills.strand), asc(skills.orderInStrand));
  }

  async getSkillById(id: string): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }

  async createSkill(data: {
    subject: string;
    strand: string;
    gradeLevel: string;
    standardCode?: string;
    name: string;
    description: string;
    prerequisiteSkillIds?: string[];
    orderInStrand: number;
  }): Promise<Skill> {
    const [skill] = await db.insert(skills).values({
      subject: data.subject,
      strand: data.strand,
      gradeLevel: data.gradeLevel,
      standardCode: data.standardCode,
      name: data.name,
      description: data.description,
      prerequisiteSkillIds: data.prerequisiteSkillIds || [],
      orderInStrand: data.orderInStrand,
    }).returning();
    return skill;
  }

  // Child skill progress operations
  async getChildSkillProgress(childId: string): Promise<ChildSkillProgress[]> {
    return await db
      .select()
      .from(childSkillProgress)
      .where(eq(childSkillProgress.childId, childId));
  }

  async getChildSkillProgressBySkill(childId: string, skillId: string): Promise<ChildSkillProgress | undefined> {
    const [progress] = await db
      .select()
      .from(childSkillProgress)
      .where(and(eq(childSkillProgress.childId, childId), eq(childSkillProgress.skillId, skillId)));
    return progress;
  }

  async upsertChildSkillProgress(data: {
    childId: string;
    skillId: string;
    masteryLevel: string;
    evidenceCount?: number;
    successCount?: number;
    attemptCount?: number;
    lastPracticeDate?: string;
    lastScore?: number;
    needsReinforcement?: boolean;
  }): Promise<ChildSkillProgress> {
    const existing = await this.getChildSkillProgressBySkill(data.childId, data.skillId);
    
    if (existing) {
      const [updated] = await db
        .update(childSkillProgress)
        .set({
          masteryLevel: data.masteryLevel,
          evidenceCount: data.evidenceCount ?? existing.evidenceCount,
          successCount: data.successCount ?? existing.successCount,
          attemptCount: data.attemptCount ?? existing.attemptCount,
          lastPracticeDate: data.lastPracticeDate ?? existing.lastPracticeDate,
          lastScore: data.lastScore ?? existing.lastScore,
          needsReinforcement: data.needsReinforcement ?? existing.needsReinforcement,
          updatedAt: new Date(),
        })
        .where(eq(childSkillProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(childSkillProgress).values({
        childId: data.childId,
        skillId: data.skillId,
        masteryLevel: data.masteryLevel,
        evidenceCount: data.evidenceCount || 0,
        successCount: data.successCount || 0,
        attemptCount: data.attemptCount || 0,
        lastPracticeDate: data.lastPracticeDate,
        lastScore: data.lastScore,
        needsReinforcement: data.needsReinforcement || false,
      }).returning();
      return created;
    }
  }

  async getSkillsNeedingReinforcement(childId: string): Promise<Array<Skill & { progress: ChildSkillProgress }>> {
    const results = await db
      .select()
      .from(childSkillProgress)
      .innerJoin(skills, eq(childSkillProgress.skillId, skills.id))
      .where(and(eq(childSkillProgress.childId, childId), eq(childSkillProgress.needsReinforcement, true)));
    
    return results.map(r => ({
      ...r.skills,
      progress: r.child_skill_progress,
    }));
  }

  async getReadyToAdvanceSkills(childId: string, gradeLevel: string): Promise<Skill[]> {
    const progress = await this.getChildSkillProgress(childId);
    const progressMap = new Map(progress.map(p => [p.skillId, p]));
    
    const gradeSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.gradeLevel, gradeLevel))
      .orderBy(asc(skills.strand), asc(skills.orderInStrand));
    
    const readySkills: Skill[] = [];
    
    for (const skill of gradeSkills) {
      const skillProgress = progressMap.get(skill.id);
      
      if (!skillProgress || skillProgress.masteryLevel === "NOT_STARTED") {
        const prereqs = skill.prerequisiteSkillIds || [];
        const prereqsMet = prereqs.every(prereqId => {
          const prereqProgress = progressMap.get(prereqId);
          // Prerequisite met if at PROFICIENT or higher
          return prereqProgress && (prereqProgress.masteryLevel === "PROFICIENT" || prereqProgress.masteryLevel === "FLUENT" || prereqProgress.masteryLevel === "TRANSFER");
        });
        
        if (prereqsMet || prereqs.length === 0) {
          readySkills.push(skill);
        }
      }
    }
    
    return readySkills;
  }

  // Task-skill linking operations
  async linkTaskToSkills(taskId: string, skillLinks: Array<{ skillId: string; isPrimaryFocus: boolean; isReview: boolean }>): Promise<TaskSkill[]> {
    if (skillLinks.length === 0) return [];
    
    const values = skillLinks.map(link => ({
      taskId,
      skillId: link.skillId,
      isPrimaryFocus: link.isPrimaryFocus,
      isReview: link.isReview,
    }));
    
    return await db.insert(taskSkills).values(values).returning();
  }

  async getSkillsForTask(taskId: string): Promise<Array<Skill & { isPrimaryFocus: boolean; isReview: boolean }>> {
    const results = await db
      .select()
      .from(taskSkills)
      .innerJoin(skills, eq(taskSkills.skillId, skills.id))
      .where(eq(taskSkills.taskId, taskId));
    
    return results.map(r => ({
      ...r.skills,
      isPrimaryFocus: r.task_skills.isPrimaryFocus,
      isReview: r.task_skills.isReview,
    }));
  }

  // Task outcome operations
  async createTaskOutcome(data: {
    taskId: string;
    childId: string;
    quizScore?: number;
    parentFeedback?: string;
    childConfidence?: number;
    timeOnTaskMinutes?: number;
    approachUsed?: string;
    notes?: string;
  }): Promise<TaskOutcome> {
    const [outcome] = await db.insert(taskOutcomes).values(data).returning();
    return outcome;
  }

  async getTaskOutcome(taskId: string): Promise<TaskOutcome | undefined> {
    const [outcome] = await db
      .select()
      .from(taskOutcomes)
      .where(eq(taskOutcomes.taskId, taskId));
    return outcome;
  }

  async getRecentTaskOutcomes(childId: string, limit: number = 10): Promise<Array<TaskOutcome & { task: Task }>> {
    const results = await db
      .select()
      .from(taskOutcomes)
      .innerJoin(tasks, eq(taskOutcomes.taskId, tasks.id))
      .where(eq(taskOutcomes.childId, childId))
      .orderBy(desc(taskOutcomes.completedAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r.task_outcomes,
      task: r.tasks,
    }));
  }

  // Mastery snapshot for AI prompting
  async getMasterySnapshot(childId: string): Promise<{
    subjectMastery: Array<{
      subject: string;
      totalSkills: number;
      mastered: number;
      developing: number;
      emerging: number;
      notIntroduced: number;
      skillsNeedingReinforcement: string[];
    }>;
    recentOutcomes: Array<{
      taskTitle: string;
      subject: string;
      date: string;
      quizScore: number | null;
      parentFeedback: string | null;
      wasSuccessful: boolean;
    }>;
    strugglingAreas: string[];
    readyToAdvance: string[];
  }> {
    const child = await this.getChildById(childId);
    if (!child) throw new Error("Child not found");
    
    const allSkills = await this.getAllSkills();
    const progress = await this.getChildSkillProgress(childId);
    const progressMap = new Map(progress.map(p => [p.skillId, p]));
    
    const subjects = ["READING", "MATH", "SCIENCE", "CHARACTER"];
    const subjectMastery = subjects.map(subject => {
      const subjectSkills = allSkills.filter(s => s.subject === subject && s.gradeLevel === child.grade);
      
      // 5-state mastery: NOT_STARTED, DEVELOPING, PROFICIENT, FLUENT, TRANSFER
      let mastered = 0, developing = 0, emerging = 0, notIntroduced = 0;
      const reinforcementNeeded: string[] = [];
      
      for (const skill of subjectSkills) {
        const skillProgress = progressMap.get(skill.id);
        if (!skillProgress || skillProgress.masteryLevel === "NOT_STARTED") {
          notIntroduced++;
        } else if (skillProgress.masteryLevel === "FLUENT" || skillProgress.masteryLevel === "TRANSFER") {
          mastered++;
        } else if (skillProgress.masteryLevel === "PROFICIENT") {
          developing++;
        } else if (skillProgress.masteryLevel === "DEVELOPING") {
          emerging++;
        }
        
        if (skillProgress?.needsReinforcement) {
          reinforcementNeeded.push(skill.name);
        }
      }
      
      return {
        subject,
        totalSkills: subjectSkills.length,
        mastered,
        developing,
        emerging,
        notIntroduced,
        skillsNeedingReinforcement: reinforcementNeeded,
      };
    });
    
    const recentOutcomesData = await this.getRecentTaskOutcomes(childId, 5);
    const recentOutcomes = recentOutcomesData.map(o => ({
      taskTitle: o.task.title,
      subject: o.task.subject,
      date: o.task.date,
      quizScore: o.quizScore,
      parentFeedback: o.parentFeedback,
      wasSuccessful: (o.quizScore === null || o.quizScore >= 70) && 
                     o.parentFeedback !== "TOO_HARD" && 
                     o.parentFeedback !== "STRUGGLED",
    }));
    
    const strugglingAreas = progress
      .filter(p => p.needsReinforcement || (p.lastScore !== null && p.lastScore < 70))
      .map(p => {
        const skill = allSkills.find(s => s.id === p.skillId);
        return skill?.name || "";
      })
      .filter(Boolean);
    
    const readySkills = await this.getReadyToAdvanceSkills(childId, child.grade);
    const readyToAdvance = readySkills.slice(0, 5).map(s => s.name);
    
    return {
      subjectMastery,
      recentOutcomes,
      strugglingAreas,
      readyToAdvance,
    };
  }

  // ============================================
  // ADAPTIVE LESSON ENGINE IMPLEMENTATIONS
  // ============================================

  // Lesson template operations
  async getLessonTemplates(subject?: string, gradeBand?: string): Promise<LessonTemplate[]> {
    let query = db.select().from(lessonTemplates).where(eq(lessonTemplates.isActive, true));
    
    const results = await query;
    
    return results.filter(t => {
      if (subject && t.subject !== subject) return false;
      if (gradeBand && t.gradeBand !== gradeBand && t.gradeBand !== "K-2") return false;
      return true;
    });
  }

  async getLessonTemplateById(id: string): Promise<LessonTemplate | undefined> {
    const [template] = await db.select().from(lessonTemplates).where(eq(lessonTemplates.id, id));
    return template;
  }

  async getLessonTemplateBySkill(skillName: string, gradeBand: string): Promise<LessonTemplate | undefined> {
    const results = await db
      .select()
      .from(lessonTemplates)
      .where(and(
        eq(lessonTemplates.targetSkillName, skillName),
        eq(lessonTemplates.isActive, true)
      ));
    
    // Prefer exact grade match, fall back to K-2
    const exactMatch = results.find(t => t.gradeBand === gradeBand);
    const fallback = results.find(t => t.gradeBand === "K-2");
    return exactMatch || fallback;
  }

  async createLessonTemplate(data: {
    subject: string;
    targetSkillId?: string;
    targetSkillName: string;
    gradeBand: string;
    objective: string;
    difficultyLevels: { easy: DifficultyConfig; medium: DifficultyConfig; hard: DifficultyConfig };
    modes: { hands_on: ModeConfig; visual: ModeConfig; story: ModeConfig };
    assessmentBank?: { formative: AssessmentQuestion[]; checkpoint: AssessmentQuestion[]; challenge: AssessmentQuestion[] };
  }): Promise<LessonTemplate> {
    const [template] = await db.insert(lessonTemplates).values({
      subject: data.subject,
      targetSkillId: data.targetSkillId,
      targetSkillName: data.targetSkillName,
      gradeBand: data.gradeBand,
      objective: data.objective,
      difficultyLevels: data.difficultyLevels,
      modes: data.modes,
      assessmentBank: data.assessmentBank,
    }).returning();
    return template;
  }

  // Lesson instance operations
  async getLessonInstanceById(id: string): Promise<LessonInstance | undefined> {
    const [instance] = await db.select().from(lessonInstances).where(eq(lessonInstances.id, id));
    return instance;
  }

  async getLessonInstancesForChild(childId: string, date?: string): Promise<LessonInstance[]> {
    if (date) {
      return await db
        .select()
        .from(lessonInstances)
        .where(and(eq(lessonInstances.childId, childId), eq(lessonInstances.date, date)))
        .orderBy(desc(lessonInstances.createdAt));
    }
    return await db
      .select()
      .from(lessonInstances)
      .where(eq(lessonInstances.childId, childId))
      .orderBy(desc(lessonInstances.createdAt));
  }

  async getTodaysLessonsForChild(childId: string): Promise<LessonInstance[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(lessonInstances)
      .where(and(eq(lessonInstances.childId, childId), eq(lessonInstances.date, today)))
      .orderBy(asc(lessonInstances.createdAt));
  }

  async getAllLessonsForChild(childId: string): Promise<LessonInstance[]> {
    return await db
      .select()
      .from(lessonInstances)
      .where(eq(lessonInstances.childId, childId))
      .orderBy(desc(lessonInstances.createdAt));
  }

  async createLessonInstance(data: {
    childId: string;
    lessonTemplateId?: string;
    difficultyUsed: string;
    modeUsed: string;
    subject: string;
    title: string;
    goal?: string;
    objective: string;
    targetSkillName: string;
    steps: LessonInstanceStep[];
    teachPhase?: TeachPhase;
    practicePhase?: PracticePhase;
    parentNote?: string;
    assessment?: LessonInstanceAssessment;
    faithIntegration?: { scripture?: string; tieIn?: string; optionalPrayer?: string };
    date: string;
    parentLessonId?: string;
  }): Promise<LessonInstance> {
    const [instance] = await db.insert(lessonInstances).values({
      childId: data.childId,
      lessonTemplateId: data.lessonTemplateId,
      difficultyUsed: data.difficultyUsed,
      modeUsed: data.modeUsed,
      subject: data.subject,
      title: data.title,
      goal: data.goal,
      objective: data.objective,
      targetSkillName: data.targetSkillName,
      steps: data.steps,
      teachPhase: data.teachPhase,
      practicePhase: data.practicePhase,
      parentNote: data.parentNote,
      assessment: data.assessment,
      parentLessonId: data.parentLessonId,
      faithIntegration: data.faithIntegration,
      date: data.date,
    }).returning();
    return instance;
  }

  async updateLessonInstanceStatus(id: string, status: string, pointsEarned?: number): Promise<LessonInstance | undefined> {
    const updateData: any = { status };
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }
    if (pointsEarned !== undefined) {
      updateData.pointsEarned = pointsEarned;
    }
    
    const [instance] = await db
      .update(lessonInstances)
      .set(updateData)
      .where(eq(lessonInstances.id, id))
      .returning();
    return instance;
  }

  async skipLessonInstance(id: string, reason?: string): Promise<LessonInstance | undefined> {
    const [instance] = await db
      .update(lessonInstances)
      .set({
        status: "SKIPPED",
        skippedAt: new Date(),
        skipReason: reason || null,
      })
      .where(eq(lessonInstances.id, id))
      .returning();
    return instance;
  }

  async resumeSkippedLesson(id: string): Promise<LessonInstance | undefined> {
    const [instance] = await db
      .update(lessonInstances)
      .set({
        status: "READY",
        skippedAt: null,
        skipReason: null,
      })
      .where(eq(lessonInstances.id, id))
      .returning();
    return instance;
  }

  async getSkippedLessonsForChild(childId: string): Promise<LessonInstance[]> {
    return await db
      .select()
      .from(lessonInstances)
      .where(and(
        eq(lessonInstances.childId, childId),
        eq(lessonInstances.status, "SKIPPED")
      ))
      .orderBy(desc(lessonInstances.skippedAt));
  }

  async getLessonsForParent(parentId: string, filters?: { childId?: string; status?: string; subject?: string }): Promise<Array<LessonInstance & { childName: string }>> {
    // First get all children for this parent
    const parentChildren = await db.select().from(children).where(eq(children.parentId, parentId));
    if (parentChildren.length === 0) return [];
    
    const childIds = filters?.childId 
      ? [filters.childId] 
      : parentChildren.map(c => c.id);
    
    // Build conditions array
    const conditions: any[] = [inArray(lessonInstances.childId, childIds)];
    
    if (filters?.status) {
      conditions.push(eq(lessonInstances.status, filters.status));
    }
    
    if (filters?.subject) {
      conditions.push(eq(lessonInstances.subject, filters.subject));
    }
    
    const lessons = await db
      .select()
      .from(lessonInstances)
      .where(and(...conditions))
      .orderBy(desc(lessonInstances.createdAt));
    
    // Map child names to lessons
    const childMap = new Map(parentChildren.map(c => [c.id, c.name]));
    return lessons.map(lesson => ({
      ...lesson,
      childName: childMap.get(lesson.childId) || "Unknown",
    }));
  }

  async saveLessonProgress(id: string, progressStepIndex: number, progressState: LessonProgressState): Promise<LessonInstance | undefined> {
    const [instance] = await db
      .update(lessonInstances)
      .set({
        progressStepIndex,
        progressState,
        lastInteractionAt: new Date(),
        status: "IN_PROGRESS",
      })
      .where(eq(lessonInstances.id, id))
      .returning();
    return instance;
  }

  async clearLessonProgress(id: string): Promise<LessonInstance | undefined> {
    const [instance] = await db
      .update(lessonInstances)
      .set({
        progressStepIndex: 0,
        progressState: null,
        lastInteractionAt: null,
      })
      .where(eq(lessonInstances.id, id))
      .returning();
    return instance;
  }

  // Lesson attempt operations
  async createLessonAttempt(data: {
    lessonInstanceId: string;
    childId: string;
    questionId: string;
    childAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    attemptNumber: number;
    misconceptionTag?: string;
    explanationForChild?: string;
    hint?: string;
    nextAction?: string;
  }): Promise<LessonAttempt> {
    const [attempt] = await db.insert(lessonAttempts).values(data).returning();
    return attempt;
  }

  async getAttemptsForLesson(lessonInstanceId: string): Promise<LessonAttempt[]> {
    return await db
      .select()
      .from(lessonAttempts)
      .where(eq(lessonAttempts.lessonInstanceId, lessonInstanceId))
      .orderBy(asc(lessonAttempts.timestamp));
  }

  async getAttemptCountForQuestion(lessonInstanceId: string, questionId: string): Promise<number> {
    const attempts = await db
      .select()
      .from(lessonAttempts)
      .where(and(
        eq(lessonAttempts.lessonInstanceId, lessonInstanceId),
        eq(lessonAttempts.questionId, questionId)
      ));
    return attempts.length;
  }

  // Learner profile operations
  async updateLearnerProfile(childId: string, data: {
    readingStage?: string;
    mathStage?: string;
    preferredModes?: string[];
    sessionLengthMinutes?: number;
    confidence?: number;
    lastDifficultyOutcome?: string;
  }): Promise<ChildSettings | undefined> {
    const [settings] = await db
      .update(childSettings)
      .set(data)
      .where(eq(childSettings.childId, childId))
      .returning();
    return settings;
  }

  // Journey progress operations
  async updateJourneyProgress(childId: string, data: {
    journeyStage?: number;
    journeyPosition?: number;
    growthPoints?: number;
  }): Promise<ChildSettings | undefined> {
    const [settings] = await db
      .update(childSettings)
      .set(data)
      .where(eq(childSettings.childId, childId))
      .returning();
    return settings;
  }

  async addGrowthPoints(childId: string, points: number): Promise<ChildSettings | undefined> {
    const [current] = await db
      .select()
      .from(childSettings)
      .where(eq(childSettings.childId, childId));
    
    if (!current) return undefined;
    
    const newPoints = (current.growthPoints || 0) + points;
    const newPosition = (current.journeyPosition || 0) + 1;
    
    // Check if we should advance journey stage (every 10 positions)
    const newStage = Math.floor(newPosition / 10) + 1;
    
    const [settings] = await db
      .update(childSettings)
      .set({
        growthPoints: newPoints,
        journeyPosition: newPosition,
        journeyStage: newStage,
      })
      .where(eq(childSettings.childId, childId))
      .returning();
    return settings;
  }

  // Parent lesson operations
  async createParentLesson(data: {
    parentId: string;
    childId: string;
    subject: string;
    skillTag?: string;
    parentNotes?: string;
    sessionLengthMinutes?: number;
    preferredMode?: string;
  }): Promise<ParentLesson> {
    const [lesson] = await db.insert(parentLessons).values({
      parentId: data.parentId,
      childId: data.childId,
      subject: data.subject,
      skillTag: data.skillTag,
      parentNotes: data.parentNotes,
      sessionLengthMinutes: data.sessionLengthMinutes || 10,
      preferredMode: data.preferredMode,
      status: "PENDING",
    }).returning();
    return lesson;
  }

  async getParentLessonById(id: string): Promise<ParentLesson | undefined> {
    const [lesson] = await db.select().from(parentLessons).where(eq(parentLessons.id, id));
    return lesson;
  }

  async getParentLessonsByChildId(childId: string): Promise<ParentLesson[]> {
    return db
      .select()
      .from(parentLessons)
      .where(eq(parentLessons.childId, childId))
      .orderBy(desc(parentLessons.createdAt));
  }

  async updateParentLessonStatus(id: string, status: string): Promise<ParentLesson | undefined> {
    const [lesson] = await db
      .update(parentLessons)
      .set({ status })
      .where(eq(parentLessons.id, id))
      .returning();
    return lesson;
  }

  // ============================================
  // PROGRESSION SYSTEM OPERATIONS
  // ============================================

  // Avatar state operations
  async getAvatarState(childId: string): Promise<AvatarState | undefined> {
    const [state] = await db
      .select()
      .from(avatarState)
      .where(eq(avatarState.childId, childId));
    return state;
  }

  async initializeAvatarState(childId: string): Promise<AvatarState> {
    const existing = await this.getAvatarState(childId);
    if (existing) return existing;
    
    const [state] = await db.insert(avatarState).values({
      childId,
      level: 1,
      currentXP: 0,
      totalXPEarned: 0,
      equippedItems: {},
      mood: "HAPPY",
      currentStreak: 0,
      longestStreak: 0,
    }).returning();
    return state;
  }

  async updateAvatarMood(childId: string, mood: string): Promise<AvatarState | undefined> {
    const [state] = await db
      .update(avatarState)
      .set({ mood, updatedAt: new Date() })
      .where(eq(avatarState.childId, childId))
      .returning();
    return state;
  }

  async updateAvatarTraits(childId: string, traits: AvatarTraits): Promise<AvatarState | undefined> {
    // Ensure avatar state exists first
    let current = await this.getAvatarState(childId);
    if (!current) {
      current = await this.initializeAvatarState(childId);
    }
    
    const [state] = await db
      .update(avatarState)
      .set({ avatarTraits: traits, updatedAt: new Date() })
      .where(eq(avatarState.childId, childId))
      .returning();
    return state;
  }

  async equipItem(childId: string, slot: string, itemId: string | null): Promise<AvatarState | undefined> {
    const current = await this.getAvatarState(childId);
    if (!current) return undefined;
    
    const equippedItems = { ...current.equippedItems, [slot]: itemId };
    
    const [state] = await db
      .update(avatarState)
      .set({ equippedItems, updatedAt: new Date() })
      .where(eq(avatarState.childId, childId))
      .returning();
    return state;
  }

  // XP and leveling operations
  async awardXP(childId: string, xpAmount: number): Promise<{
    avatarState: AvatarState;
    leveledUp: boolean;
    newLevel?: number;
    newTitle?: string;
    unlockedItems?: InventoryItem[];
  }> {
    let state = await this.getAvatarState(childId);
    if (!state) {
      state = await this.initializeAvatarState(childId);
    }
    
    const newTotalXP = state.totalXPEarned + xpAmount;
    const newCurrentXP = state.currentXP + xpAmount;
    
    // Get all level thresholds to check for level up
    const thresholds = await this.getLevelThresholds();
    
    // Find current level based on total XP
    let newLevel = 1;
    let newTitle = "Curious Beginner";
    for (const t of thresholds) {
      if (newTotalXP >= t.xpRequired) {
        newLevel = t.level;
        newTitle = t.title;
      }
    }
    
    const leveledUp = newLevel > state.level;
    const unlockedItems: InventoryItem[] = [];
    
    // If leveled up, check for level rewards
    if (leveledUp) {
      // Grant any items unlocked at new level
      for (let level = state.level + 1; level <= newLevel; level++) {
        const threshold = thresholds.find(t => t.level === level);
        if (threshold?.rewardItemSlug) {
          const item = await this.getInventoryItemBySlug(threshold.rewardItemSlug);
          if (item) {
            await this.grantInventoryItem(childId, threshold.rewardItemSlug, "LEVEL_UP", { level });
            unlockedItems.push(item);
          }
        }
      }
    }
    
    // Calculate XP within current level for progress bar
    const currentThreshold = thresholds.find(t => t.level === newLevel);
    const nextThreshold = thresholds.find(t => t.level === newLevel + 1);
    const xpAtCurrentLevel = currentThreshold?.xpRequired || 0;
    const xpInCurrentLevel = newTotalXP - xpAtCurrentLevel;
    
    const [updatedState] = await db
      .update(avatarState)
      .set({
        level: newLevel,
        currentXP: xpInCurrentLevel,
        totalXPEarned: newTotalXP,
        mood: leveledUp ? "EXCITED" : state.mood,
        updatedAt: new Date(),
      })
      .where(eq(avatarState.childId, childId))
      .returning();
    
    return {
      avatarState: updatedState,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      newTitle: leveledUp ? newTitle : undefined,
      unlockedItems: unlockedItems.length > 0 ? unlockedItems : undefined,
    };
  }

  async updateStreak(childId: string, date: string): Promise<AvatarState | undefined> {
    const state = await this.getAvatarState(childId);
    if (!state) return undefined;
    
    const lastDate = state.lastActivityDate;
    let newStreak = state.currentStreak;
    
    if (!lastDate) {
      // First activity ever
      newStreak = 1;
    } else {
      const last = new Date(lastDate);
      const current = new Date(date);
      const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, no change
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = state.currentStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
    
    const longestStreak = Math.max(newStreak, state.longestStreak);
    
    const [updatedState] = await db
      .update(avatarState)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: date,
        updatedAt: new Date(),
      })
      .where(eq(avatarState.childId, childId))
      .returning();
    
    return updatedState;
  }

  // Level thresholds operations
  async getLevelThresholds(): Promise<LevelThreshold[]> {
    return db.select().from(levelThresholds).orderBy(asc(levelThresholds.level));
  }

  async getLevelThreshold(level: number): Promise<LevelThreshold | undefined> {
    const [threshold] = await db
      .select()
      .from(levelThresholds)
      .where(eq(levelThresholds.level, level));
    return threshold;
  }

  async seedLevelThresholds(): Promise<void> {
    const existing = await this.getLevelThresholds();
    if (existing.length > 0) return;
    
    const thresholdData: Array<{ level: number; xpRequired: number; title: string; rewardItemSlug?: string }> = [
      { level: 1, xpRequired: 0, title: "Curious Beginner", rewardItemSlug: "starter_badge" },
      { level: 2, xpRequired: 50, title: "Eager Explorer", rewardItemSlug: "explorer_hat" },
      { level: 3, xpRequired: 120, title: "Rising Star", rewardItemSlug: "star_sticker" },
      { level: 4, xpRequired: 200, title: "Knowledge Seeker", rewardItemSlug: "book_accessory" },
      { level: 5, xpRequired: 300, title: "Learning Champion", rewardItemSlug: "champion_cape" },
      { level: 6, xpRequired: 420, title: "Wisdom Gatherer" },
      { level: 7, xpRequired: 560, title: "Bright Mind" },
      { level: 8, xpRequired: 720, title: "Super Scholar", rewardItemSlug: "scholar_glasses" },
      { level: 9, xpRequired: 900, title: "Discovery Master" },
      { level: 10, xpRequired: 1100, title: "Adventure Hero", rewardItemSlug: "hero_crown" },
      { level: 11, xpRequired: 1320, title: "Shining Light" },
      { level: 12, xpRequired: 1560, title: "Wisdom Keeper" },
      { level: 13, xpRequired: 1820, title: "Learning Legend" },
      { level: 14, xpRequired: 2100, title: "Knowledge Knight" },
      { level: 15, xpRequired: 2400, title: "Master Explorer", rewardItemSlug: "master_pet" },
      { level: 16, xpRequired: 2720, title: "Brilliant Star" },
      { level: 17, xpRequired: 3060, title: "Wisdom Wizard" },
      { level: 18, xpRequired: 3420, title: "Learning Luminary" },
      { level: 19, xpRequired: 3800, title: "Grand Scholar" },
      { level: 20, xpRequired: 4200, title: "Ultimate Champion", rewardItemSlug: "ultimate_trophy" },
    ];
    
    await db.insert(levelThresholds).values(thresholdData);
  }

  // Badge operations
  async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    return db.select().from(badgeDefinitions).where(eq(badgeDefinitions.isActive, true)).orderBy(asc(badgeDefinitions.sortOrder));
  }

  async getBadgeDefinitionBySlug(slug: string): Promise<BadgeDefinition | undefined> {
    const [badge] = await db.select().from(badgeDefinitions).where(eq(badgeDefinitions.slug, slug));
    return badge;
  }

  async getEarnedBadges(childId: string): Promise<Array<EarnedBadge & { badge: BadgeDefinition }>> {
    const results = await db
      .select()
      .from(earnedBadges)
      .innerJoin(badgeDefinitions, eq(earnedBadges.badgeId, badgeDefinitions.id))
      .where(eq(earnedBadges.childId, childId))
      .orderBy(desc(earnedBadges.earnedAt));
    
    return results.map(r => ({
      ...r.earned_badges,
      badge: r.badge_definitions,
    }));
  }

  async awardBadge(childId: string, badgeSlug: string, context?: { lessonId?: string; subject?: string; value?: number }): Promise<{
    earned: boolean;
    badge?: BadgeDefinition;
    xpAwarded?: number;
    alreadyHad?: boolean;
  }> {
    const badge = await this.getBadgeDefinitionBySlug(badgeSlug);
    if (!badge) return { earned: false };
    
    // Check if already earned
    const existing = await db
      .select()
      .from(earnedBadges)
      .where(and(
        eq(earnedBadges.childId, childId),
        eq(earnedBadges.badgeId, badge.id)
      ));
    
    if (existing.length > 0) {
      return { earned: false, alreadyHad: true, badge };
    }
    
    // Award the badge
    await db.insert(earnedBadges).values({
      childId,
      badgeId: badge.id,
      context,
    });
    
    // Award XP for the badge if applicable
    let xpAwarded = 0;
    if (badge.xpReward > 0) {
      await this.awardXP(childId, badge.xpReward);
      xpAwarded = badge.xpReward;
    }
    
    // NOTE: Badge earned is not auto-posted to activity feed.
    // Children can manually share badges via the "Share with Buddies" feature.
    
    return { earned: true, badge, xpAwarded };
  }

  async checkAndAwardBadges(childId: string): Promise<Array<{ badge: BadgeDefinition; xpAwarded: number }>> {
    const awarded: Array<{ badge: BadgeDefinition; xpAwarded: number }> = [];
    const allBadges = await this.getAllBadgeDefinitions();
    const avatarStateData = await this.getAvatarState(childId);
    
    // Get lesson completion count
    const completedLessons = await db
      .select()
      .from(lessonInstances)
      .where(and(
        eq(lessonInstances.childId, childId),
        eq(lessonInstances.status, "COMPLETED")
      ));
    const lessonsCompleted = completedLessons.length;
    
    // Check for skipped lessons - blocks mastery/achievement badges until all are completed
    const skippedLessons = await db
      .select()
      .from(lessonInstances)
      .where(and(
        eq(lessonInstances.childId, childId),
        eq(lessonInstances.status, "SKIPPED")
      ));
    const hasSkippedLessons = skippedLessons.length > 0;
    
    for (const badge of allBadges) {
      const criteria = badge.unlockCriteria as any;
      let shouldAward = false;
      
      switch (criteria.type) {
        case "lessons_completed":
          // Block lessons_completed badges if there are skipped lessons
          // Child must complete all skipped lessons before earning mastery badges
          if (hasSkippedLessons) {
            shouldAward = false;
          } else {
            shouldAward = lessonsCompleted >= (criteria.threshold || 1);
          }
          break;
        case "streak_days":
          shouldAward = (avatarStateData?.currentStreak || 0) >= (criteria.threshold || 1);
          break;
        case "xp_earned":
          shouldAward = (avatarStateData?.totalXPEarned || 0) >= (criteria.threshold || 1);
          break;
        case "level_reached":
          shouldAward = (avatarStateData?.level || 1) >= (criteria.threshold || 1);
          break;
        // subject_mastery and special badges need custom handling
      }
      
      if (shouldAward) {
        const result = await this.awardBadge(childId, badge.slug);
        if (result.earned && result.badge) {
          awarded.push({ badge: result.badge, xpAwarded: result.xpAwarded || 0 });
        }
      }
    }
    
    return awarded;
  }

  async seedBadgeDefinitions(): Promise<void> {
    const existing = await this.getAllBadgeDefinitions();
    if (existing.length > 0) return;
    
    const badges: Array<{
      slug: string;
      name: string;
      description: string;
      category: string;
      unlockCriteria: any;
      xpReward: number;
      sortOrder: number;
    }> = [
      // Achievement badges
      { slug: "first_lesson", name: "First Steps", description: "Completed your very first lesson!", category: "ACHIEVEMENT", unlockCriteria: { type: "lessons_completed", threshold: 1 }, xpReward: 25, sortOrder: 1 },
      { slug: "lesson_5", name: "Getting Started", description: "Completed 5 lessons!", category: "ACHIEVEMENT", unlockCriteria: { type: "lessons_completed", threshold: 5 }, xpReward: 50, sortOrder: 2 },
      { slug: "lesson_10", name: "Learning Explorer", description: "Completed 10 lessons!", category: "ACHIEVEMENT", unlockCriteria: { type: "lessons_completed", threshold: 10 }, xpReward: 75, sortOrder: 3 },
      { slug: "lesson_25", name: "Knowledge Seeker", description: "Completed 25 lessons!", category: "ACHIEVEMENT", unlockCriteria: { type: "lessons_completed", threshold: 25 }, xpReward: 100, sortOrder: 4 },
      { slug: "lesson_50", name: "Lesson Champion", description: "Completed 50 lessons!", category: "ACHIEVEMENT", unlockCriteria: { type: "lessons_completed", threshold: 50 }, xpReward: 150, sortOrder: 5 },
      
      // Streak badges
      { slug: "streak_3", name: "Getting in Rhythm", description: "3 day learning streak!", category: "STREAK", unlockCriteria: { type: "streak_days", threshold: 3 }, xpReward: 30, sortOrder: 10 },
      { slug: "streak_7", name: "Week Warrior", description: "7 day learning streak!", category: "STREAK", unlockCriteria: { type: "streak_days", threshold: 7 }, xpReward: 75, sortOrder: 11 },
      { slug: "streak_14", name: "Two Week Wonder", description: "14 day learning streak!", category: "STREAK", unlockCriteria: { type: "streak_days", threshold: 14 }, xpReward: 100, sortOrder: 12 },
      { slug: "streak_30", name: "Monthly Master", description: "30 day learning streak!", category: "STREAK", unlockCriteria: { type: "streak_days", threshold: 30 }, xpReward: 200, sortOrder: 13 },
      
      // Level badges
      { slug: "level_5", name: "Rising Star", description: "Reached Level 5!", category: "LEVEL", unlockCriteria: { type: "level_reached", threshold: 5 }, xpReward: 0, sortOrder: 20 },
      { slug: "level_10", name: "Adventure Hero", description: "Reached Level 10!", category: "LEVEL", unlockCriteria: { type: "level_reached", threshold: 10 }, xpReward: 0, sortOrder: 21 },
      { slug: "level_15", name: "Master Explorer", description: "Reached Level 15!", category: "LEVEL", unlockCriteria: { type: "level_reached", threshold: 15 }, xpReward: 0, sortOrder: 22 },
      { slug: "level_20", name: "Ultimate Champion", description: "Reached Level 20!", category: "LEVEL", unlockCriteria: { type: "level_reached", threshold: 20 }, xpReward: 0, sortOrder: 23 },
      
      // XP badges
      { slug: "xp_100", name: "Point Collector", description: "Earned 100 XP!", category: "XP", unlockCriteria: { type: "xp_earned", threshold: 100 }, xpReward: 0, sortOrder: 30 },
      { slug: "xp_500", name: "XP Hunter", description: "Earned 500 XP!", category: "XP", unlockCriteria: { type: "xp_earned", threshold: 500 }, xpReward: 0, sortOrder: 31 },
      { slug: "xp_1000", name: "XP Master", description: "Earned 1000 XP!", category: "XP", unlockCriteria: { type: "xp_earned", threshold: 1000 }, xpReward: 0, sortOrder: 32 },
    ];
    
    await db.insert(badgeDefinitions).values(badges);
  }

  // Inventory operations
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.isActive, true)).orderBy(asc(inventoryItems.sortOrder));
  }

  async getInventoryItemBySlug(slug: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.slug, slug));
    return item;
  }

  async getChildInventory(childId: string): Promise<Array<ChildInventoryItem & { item: InventoryItem }>> {
    const results = await db
      .select()
      .from(childInventory)
      .innerJoin(inventoryItems, eq(childInventory.itemId, inventoryItems.id))
      .where(eq(childInventory.childId, childId))
      .orderBy(desc(childInventory.obtainedAt));
    
    return results.map(r => ({
      ...r.child_inventory,
      item: r.inventory_items,
    }));
  }

  async grantInventoryItem(childId: string, itemSlug: string, obtainedVia: string, context?: { lessonId?: string; badgeId?: string; level?: number }): Promise<ChildInventoryItem | undefined> {
    const item = await this.getInventoryItemBySlug(itemSlug);
    if (!item) return undefined;
    
    // Check if already owns
    const hasItem = await this.hasInventoryItem(childId, itemSlug);
    if (hasItem) return undefined;
    
    const [inventoryEntry] = await db.insert(childInventory).values({
      childId,
      itemId: item.id,
      obtainedVia,
      context,
    }).returning();
    
    return inventoryEntry;
  }

  async hasInventoryItem(childId: string, itemSlug: string): Promise<boolean> {
    const item = await this.getInventoryItemBySlug(itemSlug);
    if (!item) return false;
    
    const [existing] = await db
      .select()
      .from(childInventory)
      .where(and(
        eq(childInventory.childId, childId),
        eq(childInventory.itemId, item.id)
      ));
    
    return !!existing;
  }

  async seedInventoryItems(): Promise<void> {
    const existing = await this.getAllInventoryItems();
    if (existing.length > 0) return;
    
    const items: Array<{
      slug: string;
      name: string;
      description: string;
      category: string;
      rarity: string;
      unlockMethod: string;
      unlockRequirement?: any;
      equipSlot?: string;
      sortOrder: number;
    }> = [
      // Starter items (given at creation)
      { slug: "starter_badge", name: "Learner Badge", description: "Your first badge as a learner!", category: "TROPHY", rarity: "COMMON", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 1 }, sortOrder: 1 },
      
      // Level reward items
      { slug: "explorer_hat", name: "Explorer Hat", description: "A stylish hat for adventurous learners", category: "AVATAR_ACCESSORY", rarity: "COMMON", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 2 }, equipSlot: "hat", sortOrder: 10 },
      { slug: "star_sticker", name: "Shiny Star", description: "You're a rising star!", category: "STICKER", rarity: "UNCOMMON", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 3 }, sortOrder: 11 },
      { slug: "book_accessory", name: "Magic Book", description: "Holds all your knowledge", category: "AVATAR_ACCESSORY", rarity: "UNCOMMON", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 4 }, equipSlot: "accessory", sortOrder: 12 },
      { slug: "champion_cape", name: "Champion Cape", description: "A cape fit for a learning champion!", category: "AVATAR_ACCESSORY", rarity: "RARE", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 5 }, equipSlot: "outfit", sortOrder: 13 },
      { slug: "scholar_glasses", name: "Scholar Glasses", description: "See the world through wise eyes", category: "AVATAR_ACCESSORY", rarity: "RARE", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 8 }, equipSlot: "glasses", sortOrder: 14 },
      { slug: "hero_crown", name: "Hero Crown", description: "Crown of the adventure hero!", category: "AVATAR_ACCESSORY", rarity: "EPIC", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 10 }, equipSlot: "hat", sortOrder: 15 },
      { slug: "master_pet", name: "Wise Owl", description: "A loyal companion for master explorers", category: "PET", rarity: "EPIC", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 15 }, equipSlot: "pet", sortOrder: 16 },
      { slug: "ultimate_trophy", name: "Ultimate Trophy", description: "The ultimate symbol of learning mastery!", category: "TROPHY", rarity: "LEGENDARY", unlockMethod: "LEVEL_UP", unlockRequirement: { level: 20 }, sortOrder: 17 },
      
      // Background items
      { slug: "forest_background", name: "Forest Clearing", description: "A peaceful forest scene", category: "BACKGROUND", rarity: "COMMON", unlockMethod: "LESSON", unlockRequirement: { lessonsCompleted: 5 }, equipSlot: "background", sortOrder: 30 },
      { slug: "beach_background", name: "Sunny Beach", description: "A tropical paradise", category: "BACKGROUND", rarity: "UNCOMMON", unlockMethod: "LESSON", unlockRequirement: { lessonsCompleted: 15 }, equipSlot: "background", sortOrder: 31 },
      { slug: "space_background", name: "Starry Space", description: "Explore the cosmos!", category: "BACKGROUND", rarity: "RARE", unlockMethod: "LESSON", unlockRequirement: { lessonsCompleted: 30 }, equipSlot: "background", sortOrder: 32 },
      { slug: "castle_background", name: "Royal Castle", description: "A majestic castle", category: "BACKGROUND", rarity: "EPIC", unlockMethod: "LESSON", unlockRequirement: { lessonsCompleted: 50 }, equipSlot: "background", sortOrder: 33 },
      
      // Additional stickers
      { slug: "rainbow_sticker", name: "Rainbow", description: "A colorful rainbow!", category: "STICKER", rarity: "COMMON", unlockMethod: "BADGE", unlockRequirement: { badgeSlug: "streak_3" }, sortOrder: 50 },
      { slug: "heart_sticker", name: "Golden Heart", description: "A heart of gold", category: "STICKER", rarity: "UNCOMMON", unlockMethod: "BADGE", unlockRequirement: { badgeSlug: "streak_7" }, sortOrder: 51 },
      { slug: "trophy_sticker", name: "Champion Trophy", description: "A symbol of excellence", category: "STICKER", rarity: "RARE", unlockMethod: "BADGE", unlockRequirement: { badgeSlug: "lesson_25" }, sortOrder: 52 },
    ];
    
    await db.insert(inventoryItems).values(items);
  }

  // Full progression data for UI
  async getFullProgression(childId: string): Promise<{
    avatarState: AvatarState;
    currentLevelInfo: LevelThreshold | undefined;
    nextLevelInfo: LevelThreshold | undefined;
    xpToNextLevel: number;
    earnedBadges: Array<EarnedBadge & { badge: BadgeDefinition }>;
    inventory: Array<ChildInventoryItem & { item: InventoryItem }>;
    lessonsCompletedCount: number;
  }> {
    let state = await this.getAvatarState(childId);
    if (!state) {
      state = await this.initializeAvatarState(childId);
    }
    
    const thresholds = await this.getLevelThresholds();
    const currentLevelInfo = thresholds.find(t => t.level === state!.level);
    const nextLevelInfo = thresholds.find(t => t.level === state!.level + 1);
    
    const xpToNextLevel = nextLevelInfo 
      ? nextLevelInfo.xpRequired - state.totalXPEarned 
      : 0;
    
    const badges = await this.getEarnedBadges(childId);
    const inventory = await this.getChildInventory(childId);
    
    // Count completed lessons
    const completedLessons = await db
      .select()
      .from(lessonInstances)
      .where(and(
        eq(lessonInstances.childId, childId),
        eq(lessonInstances.status, "COMPLETED")
      ));
    
    return {
      avatarState: state,
      currentLevelInfo,
      nextLevelInfo,
      xpToNextLevel,
      earnedBadges: badges,
      inventory,
      lessonsCompletedCount: completedLessons.length,
    };
  }

  // ============================================
  // JOURNEY WORLD SYSTEM OPERATIONS
  // ============================================

  async getAllWorlds(): Promise<WorldDefinition[]> {
    return db.select().from(worldDefinitions).where(eq(worldDefinitions.isActive, true)).orderBy(asc(worldDefinitions.order));
  }

  async getWorldBySlug(slug: string): Promise<WorldDefinition | undefined> {
    const [world] = await db.select().from(worldDefinitions).where(eq(worldDefinitions.slug, slug));
    return world;
  }

  async getWorldTools(worldId: string): Promise<WorldTool[]> {
    return db.select().from(worldTools)
      .where(and(eq(worldTools.worldId, worldId), eq(worldTools.isActive, true)))
      .orderBy(asc(worldTools.sortOrder));
  }

  async getChildWorldProgress(childId: string, worldId: string): Promise<ChildWorldProgress | undefined> {
    const [progress] = await db.select().from(childWorldProgress)
      .where(and(eq(childWorldProgress.childId, childId), eq(childWorldProgress.worldId, worldId)));
    return progress;
  }

  async getChildAllWorldProgress(childId: string): Promise<ChildWorldProgress[]> {
    return db.select().from(childWorldProgress).where(eq(childWorldProgress.childId, childId));
  }

  async initializeChildWorldProgress(childId: string, worldId: string): Promise<ChildWorldProgress> {
    const [progress] = await db.insert(childWorldProgress).values({
      childId,
      worldId,
      currentTile: 1,
      tilesCompleted: 0,
      status: "ACTIVE",
      startedAt: new Date(),
    }).returning();
    return progress;
  }

  async updateChildWorldProgress(childId: string, worldId: string, data: Partial<{
    currentTile: number;
    tilesCompleted: number;
    status: string;
    startedAt: Date;
    completedAt: Date;
  }>): Promise<ChildWorldProgress | undefined> {
    const [updated] = await db.update(childWorldProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(childWorldProgress.childId, childId), eq(childWorldProgress.worldId, worldId)))
      .returning();
    return updated;
  }

  async getJourneyTiles(childId: string, worldId: string): Promise<JourneyTile[]> {
    return db.select().from(journeyTiles)
      .where(and(eq(journeyTiles.childId, childId), eq(journeyTiles.worldId, worldId)))
      .orderBy(asc(journeyTiles.tileNumber));
  }

  async createJourneyTiles(childId: string, worldId: string, tilesCount: number): Promise<JourneyTile[]> {
    const subjects = ["MATH", "READING", "CHARACTER"];
    const tools = await this.getWorldTools(worldId);
    
    const tiles: Array<{
      childId: string;
      worldId: string;
      tileNumber: number;
      subject: string;
      status: string;
      tileType: string;
      rewardToolId: string | null;
    }> = [];

    for (let i = 1; i <= tilesCount; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const isMilestone = i % 5 === 0;
      const tool = tools.find(t => t.unlockTileNumber === i);
      
      tiles.push({
        childId,
        worldId,
        tileNumber: i,
        subject,
        status: i === 1 ? "CURRENT" : "LOCKED",
        tileType: isMilestone ? "MILESTONE" : "NORMAL",
        rewardToolId: tool?.id || null,
      });
    }

    const created = await db.insert(journeyTiles).values(tiles).returning();
    return created;
  }

  async getJourneyTileById(tileId: string): Promise<JourneyTile | undefined> {
    const [tile] = await db.select().from(journeyTiles).where(eq(journeyTiles.id, tileId));
    return tile;
  }

  async updateJourneyTile(tileId: string, data: Partial<{
    status: string;
    lessonInstanceId: string;
    completedAt: Date;
  }>): Promise<JourneyTile | undefined> {
    const [updated] = await db.update(journeyTiles).set(data).where(eq(journeyTiles.id, tileId)).returning();
    return updated;
  }

  async getChildEarnedTools(childId: string): Promise<Array<WorldTool & { earnedAt: Date }>> {
    const earned = await db.select()
      .from(childWorldTools)
      .innerJoin(worldTools, eq(childWorldTools.toolId, worldTools.id))
      .where(eq(childWorldTools.childId, childId));
    
    return earned.map(row => ({
      ...row.world_tools,
      earnedAt: row.child_world_tools.earnedAt,
    }));
  }

  async awardWorldTool(childId: string, toolId: string, earnedAtTile: number, lessonInstanceId?: string): Promise<ChildWorldTool> {
    const [awarded] = await db.insert(childWorldTools).values({
      childId,
      toolId,
      earnedAtTile,
      lessonInstanceId: lessonInstanceId || null,
    }).returning();
    return awarded;
  }

  async getJourneyData(childId: string): Promise<{
    currentWorld: WorldDefinition;
    worldProgress: ChildWorldProgress;
    tiles: JourneyTile[];
    earnedTools: Array<WorldTool & { earnedAt: string }>;
    allWorlds: WorldDefinition[];
  } | null> {
    const allWorlds = await this.getAllWorlds();
    if (allWorlds.length === 0) return null;

    let allProgress = await this.getChildAllWorldProgress(childId);
    
    // Find current active world or initialize first world
    let currentProgress = allProgress.find(p => p.status === "ACTIVE");
    let currentWorld: WorldDefinition | undefined;

    if (!currentProgress) {
      // Start with first world
      const firstWorld = allWorlds[0];
      currentProgress = await this.initializeChildWorldProgress(childId, firstWorld.id);
      currentWorld = firstWorld;
    } else {
      currentWorld = allWorlds.find(w => w.id === currentProgress!.worldId);
    }

    if (!currentWorld) return null;

    // Get or create tiles
    let tiles = await this.getJourneyTiles(childId, currentWorld.id);
    if (tiles.length === 0) {
      tiles = await this.createJourneyTiles(childId, currentWorld.id, currentWorld.tilesCount);
    }

    // Get earned tools
    const earnedToolsRaw = await this.getChildEarnedTools(childId);
    const worldToolsForCurrentWorld = await this.getWorldTools(currentWorld.id);
    const earnedToolsForWorld = earnedToolsRaw.filter(t => 
      worldToolsForCurrentWorld.some(wt => wt.id === t.id)
    );

    return {
      currentWorld,
      worldProgress: currentProgress,
      tiles,
      earnedTools: earnedToolsForWorld.map(t => ({
        ...t,
        earnedAt: t.earnedAt.toISOString(),
      })),
      allWorlds,
    };
  }

  async getJourneyPreviewForParent(childId: string): Promise<{
    childId: string;
    hasJourney: boolean;
    currentWorld?: {
      name: string;
      slug: string;
      themeColor: string;
    };
    currentTile?: {
      tileNumber: number;
      totalTiles: number;
      subject: string;
      status: string;
    };
    currentLesson?: {
      id: string;
      title: string;
      goal: string | null;
      objective: string;
      subject: string;
      targetSkillName: string;
      faithIntegration?: {
        scripture?: string;
        tieIn?: string;
      } | null;
      status: string;
    };
    upcomingTiles: Array<{
      tileNumber: number;
      subject: string;
    }>;
    progress: {
      tilesCompleted: number;
      totalTiles: number;
      percentComplete: number;
    };
  } | null> {
    const journeyData = await this.getJourneyData(childId);
    
    if (!journeyData) {
      return {
        childId,
        hasJourney: false,
        upcomingTiles: [],
        progress: { tilesCompleted: 0, totalTiles: 0, percentComplete: 0 },
      };
    }

    const { currentWorld, worldProgress, tiles } = journeyData;
    
    // Find the current tile (status = CURRENT)
    const currentTile = tiles.find(t => t.status === "CURRENT");
    
    // Get upcoming tiles (next 3 locked tiles after current)
    const currentTileNum = currentTile?.tileNumber || 0;
    const upcomingTiles = tiles
      .filter(t => t.status === "LOCKED" && t.tileNumber > currentTileNum)
      .slice(0, 3)
      .map(t => ({
        tileNumber: t.tileNumber,
        subject: t.subject,
      }));

    // Get the lesson instance for current tile if it exists
    let currentLesson: {
      id: string;
      title: string;
      goal: string | null;
      objective: string;
      subject: string;
      targetSkillName: string;
      faithIntegration?: { scripture?: string; tieIn?: string } | null;
      status: string;
    } | undefined;

    if (currentTile?.lessonInstanceId) {
      const [lesson] = await db.select()
        .from(lessonInstances)
        .where(eq(lessonInstances.id, currentTile.lessonInstanceId));
      
      if (lesson) {
        currentLesson = {
          id: lesson.id,
          title: lesson.title,
          goal: lesson.goal,
          objective: lesson.objective,
          subject: lesson.subject,
          targetSkillName: lesson.targetSkillName,
          faithIntegration: lesson.faithIntegration,
          status: lesson.status,
        };
      }
    }

    const tilesCompleted = worldProgress.tilesCompleted;
    const totalTiles = tiles.length;
    const percentComplete = totalTiles > 0 ? Math.round((tilesCompleted / totalTiles) * 100) : 0;

    return {
      childId,
      hasJourney: true,
      currentWorld: {
        name: currentWorld.name,
        slug: currentWorld.slug,
        themeColor: currentWorld.themeColor,
      },
      currentTile: currentTile ? {
        tileNumber: currentTile.tileNumber,
        totalTiles,
        subject: currentTile.subject,
        status: currentTile.status,
      } : undefined,
      currentLesson,
      upcomingTiles,
      progress: {
        tilesCompleted,
        totalTiles,
        percentComplete,
      },
    };
  }

  // ============================================
  // SOCIAL WORLD V1 - BUDDY SYSTEM IMPLEMENTATIONS
  // ============================================

  async createBuddyRequest(requesterId: string, receiverId: string): Promise<BuddyLink> {
    const [link] = await db.insert(buddyLinks).values({
      requesterId,
      receiverId,
      status: "PENDING_REQUESTER_APPROVAL",
    }).returning();
    return link;
  }

  async createSiblingBuddyLinks(newChildId: string, parentId: string): Promise<BuddyLink[]> {
    // Get all other children of this parent (siblings)
    const siblings = await db.select({ id: children.id })
      .from(children)
      .where(
        and(
          eq(children.parentId, parentId),
          sql`${children.id} != ${newChildId}`
        )
      );
    
    if (siblings.length === 0) return [];

    // Create buddy links with ACTIVE status for each sibling
    const createdLinks: BuddyLink[] = [];
    const now = new Date();
    
    for (const sibling of siblings) {
      // Check if link already exists
      const existing = await this.getBuddyLinkBetweenChildren(newChildId, sibling.id);
      if (existing) continue;

      const [link] = await db.insert(buddyLinks).values({
        requesterId: sibling.id, // Existing sibling as requester
        receiverId: newChildId,   // New child as receiver
        status: "ACTIVE",         // Siblings are automatically buddies
        requesterParentApprovedAt: now,
        receiverParentApprovedAt: now,
      }).returning();
      createdLinks.push(link);
    }

    return createdLinks;
  }

  async getBuddyLinkById(id: string): Promise<BuddyLink | undefined> {
    const [link] = await db.select().from(buddyLinks).where(eq(buddyLinks.id, id));
    return link;
  }

  async getBuddyLinkBetweenChildren(childId1: string, childId2: string): Promise<BuddyLink | undefined> {
    const [link] = await db.select().from(buddyLinks).where(
      or(
        and(eq(buddyLinks.requesterId, childId1), eq(buddyLinks.receiverId, childId2)),
        and(eq(buddyLinks.requesterId, childId2), eq(buddyLinks.receiverId, childId1))
      )
    );
    return link;
  }

  async getPendingBuddyRequestsForParent(parentId: string): Promise<Array<BuddyLink & { 
    requester: Child & { avatarTraits?: any }; 
    receiver: Child & { avatarTraits?: any };
    isRequesterChild: boolean;
  }>> {
    // Get all children for this parent
    const parentChildren = await db.select({ id: children.id }).from(children).where(eq(children.parentId, parentId));
    const parentChildIds = parentChildren.map(c => c.id);
    
    if (parentChildIds.length === 0) return [];

    // Find requests where parent's child is requester and needs their approval
    const asRequesterResults = await db.select({
      buddyLink: buddyLinks,
      requester: children,
      requesterAvatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.requesterId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.requesterId, avatarState.childId))
      .where(
        and(
          inArray(buddyLinks.requesterId, parentChildIds),
          eq(buddyLinks.status, "PENDING_REQUESTER_APPROVAL")
        )
      );

    // Find requests where parent's child is receiver and needs their approval
    const asReceiverResults = await db.select({
      buddyLink: buddyLinks,
      receiver: children,
      receiverAvatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.receiverId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.receiverId, avatarState.childId))
      .where(
        and(
          inArray(buddyLinks.receiverId, parentChildIds),
          eq(buddyLinks.status, "PENDING_RECEIVER_APPROVAL")
        )
      );

    // Get full child data for both sides with avatar traits
    const results: Array<BuddyLink & { requester: Child & { avatarTraits?: any }; receiver: Child & { avatarTraits?: any }; isRequesterChild: boolean }> = [];

    for (const r of asRequesterResults) {
      // Get receiver with avatar traits
      const receiverData = await db.select({
        child: children,
        avatarTraits: avatarState.avatarTraits,
      })
        .from(children)
        .leftJoin(avatarState, eq(children.id, avatarState.childId))
        .where(eq(children.id, r.buddyLink.receiverId));
      
      if (receiverData.length > 0) {
        results.push({
          ...r.buddyLink,
          requester: { ...r.requester, avatarTraits: r.requesterAvatarTraits },
          receiver: { ...receiverData[0].child, avatarTraits: receiverData[0].avatarTraits },
          isRequesterChild: true,
        });
      }
    }

    for (const r of asReceiverResults) {
      // Get requester with avatar traits
      const requesterData = await db.select({
        child: children,
        avatarTraits: avatarState.avatarTraits,
      })
        .from(children)
        .leftJoin(avatarState, eq(children.id, avatarState.childId))
        .where(eq(children.id, r.buddyLink.requesterId));
      
      if (requesterData.length > 0) {
        results.push({
          ...r.buddyLink,
          requester: { ...requesterData[0].child, avatarTraits: requesterData[0].avatarTraits },
          receiver: { ...r.receiver, avatarTraits: r.receiverAvatarTraits },
          isRequesterChild: false,
        });
      }
    }

    return results;
  }

  async getPendingBuddyRequestsForChild(childId: string): Promise<Array<BuddyLink & { requester: Child & { avatarTraits?: any } }>> {
    const results = await db.select({
      buddyLink: buddyLinks,
      requester: children,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.requesterId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.requesterId, avatarState.childId))
      .where(
        and(
          eq(buddyLinks.receiverId, childId),
          eq(buddyLinks.status, "PENDING_RECEIVER")
        )
      );

    return results.map(r => ({
      ...r.buddyLink,
      requester: { ...r.requester, avatarTraits: r.avatarTraits },
    }));
  }

  async getActiveBuddies(childId: string): Promise<Array<Child & { buddyLinkId: string; avatarTraits?: any }>> {
    // Find all active buddy links where child is either requester or receiver
    // Also join with avatar_state to get avatar traits
    const asRequester = await db.select({
      buddyLink: buddyLinks,
      buddy: children,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.receiverId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.receiverId, avatarState.childId))
      .where(
        and(
          eq(buddyLinks.requesterId, childId),
          eq(buddyLinks.status, "ACTIVE")
        )
      );

    const asReceiver = await db.select({
      buddyLink: buddyLinks,
      buddy: children,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.requesterId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.requesterId, avatarState.childId))
      .where(
        and(
          eq(buddyLinks.receiverId, childId),
          eq(buddyLinks.status, "ACTIVE")
        )
      );

    const buddies = [
      ...asRequester.map(r => ({ ...r.buddy, buddyLinkId: r.buddyLink.id, avatarTraits: r.avatarTraits })),
      ...asReceiver.map(r => ({ ...r.buddy, buddyLinkId: r.buddyLink.id, avatarTraits: r.avatarTraits })),
    ];

    return buddies;
  }

  async getBuddiesWaitingForApproval(childId: string): Promise<Array<Child & { buddyLinkId: string; status: string; avatarTraits?: any }>> {
    // Get buddy requests where child is involved and status is waiting for parent approval
    // This includes both PENDING_REQUESTER_APPROVAL (child sent, waiting for their parent)
    // and PENDING_RECEIVER_APPROVAL (child accepted, waiting for their parent)
    
    const asRequester = await db.select({
      buddyLink: buddyLinks,
      buddy: children,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.receiverId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.receiverId, avatarState.childId))
      .where(
        and(
          eq(buddyLinks.requesterId, childId),
          eq(buddyLinks.status, "PENDING_REQUESTER_APPROVAL")
        )
      );

    const asReceiver = await db.select({
      buddyLink: buddyLinks,
      buddy: children,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.requesterId, children.id))
      .leftJoin(avatarState, eq(buddyLinks.requesterId, avatarState.childId))
      .where(
        and(
          eq(buddyLinks.receiverId, childId),
          eq(buddyLinks.status, "PENDING_RECEIVER_APPROVAL")
        )
      );

    return [
      ...asRequester.map(r => ({ ...r.buddy, buddyLinkId: r.buddyLink.id, status: r.buddyLink.status, avatarTraits: r.avatarTraits })),
      ...asReceiver.map(r => ({ ...r.buddy, buddyLinkId: r.buddyLink.id, status: r.buddyLink.status, avatarTraits: r.avatarTraits })),
    ];
  }

  async approveBuddyRequestByParent(buddyLinkId: string, isRequesterParent: boolean): Promise<BuddyLink | undefined> {
    const link = await this.getBuddyLinkById(buddyLinkId);
    if (!link) return undefined;

    if (isRequesterParent) {
      // Requester's parent approving - move to PENDING_RECEIVER
      if (link.status !== "PENDING_REQUESTER_APPROVAL") return undefined;
      const [updated] = await db.update(buddyLinks).set({
        status: "PENDING_RECEIVER",
        requesterParentApprovedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(buddyLinks.id, buddyLinkId)).returning();
      return updated;
    } else {
      // Receiver's parent approving - move to ACTIVE
      if (link.status !== "PENDING_RECEIVER_APPROVAL") return undefined;
      const [updated] = await db.update(buddyLinks).set({
        status: "ACTIVE",
        receiverParentApprovedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(buddyLinks.id, buddyLinkId)).returning();
      return updated;
    }
  }

  async acceptBuddyRequest(buddyLinkId: string): Promise<BuddyLink | undefined> {
    const link = await this.getBuddyLinkById(buddyLinkId);
    if (!link || link.status !== "PENDING_RECEIVER") return undefined;

    const [updated] = await db.update(buddyLinks).set({
      status: "PENDING_RECEIVER_APPROVAL",
      updatedAt: new Date(),
    }).where(eq(buddyLinks.id, buddyLinkId)).returning();
    return updated;
  }

  async declineBuddyRequest(buddyLinkId: string, declinedBy: string, reason?: string): Promise<BuddyLink | undefined> {
    const [updated] = await db.update(buddyLinks).set({
      status: "DECLINED",
      declinedBy,
      declinedReason: reason || null,
      updatedAt: new Date(),
    }).where(eq(buddyLinks.id, buddyLinkId)).returning();
    return updated;
  }

  async removeBuddy(buddyLinkId: string): Promise<boolean> {
    const result = await db.delete(buddyLinks).where(eq(buddyLinks.id, buddyLinkId));
    return true;
  }

  async searchChildrenByUsername(searchTerm: string, excludeChildId: string): Promise<Array<{ id: string; name: string; username: string; avatarTraits: any }>> {
    // Broad match search - matches username OR display name
    // Join with avatar_state to get avatar traits
    const results = await db.select({
      id: children.id,
      name: children.name,
      username: children.username,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(children)
      .leftJoin(avatarState, eq(children.id, avatarState.childId))
      .where(
        and(
          or(
            sql`LOWER(${children.username}) LIKE LOWER(${`%${searchTerm}%`})`,
            sql`LOWER(${children.name}) LIKE LOWER(${`%${searchTerm}%`})`
          ),
          ne(children.id, excludeChildId)
        )
      )
      .limit(10);
    
    return results;
  }

  // ============================================
  // SOCIAL WORLD V1 - ACTIVITY FEED IMPLEMENTATIONS
  // ============================================

  async createActivityEvent(data: {
    childId: string;
    eventType: string;
    metadata: ActivityEventMetadata;
    visibility?: string;
  }): Promise<ActivityEvent> {
    const [event] = await db.insert(activityEvents).values({
      childId: data.childId,
      eventType: data.eventType,
      metadata: data.metadata,
      visibility: data.visibility || "BUDDIES_ONLY",
    }).returning();
    return event;
  }

  async getActivityFeedForChild(childId: string, limit: number = 50): Promise<Array<ActivityEvent & { 
    child: Child & { avatarTraits?: any };
    reactions: Array<ActivityReaction & { child: Child }>;
  }>> {
    // Get all buddies
    const buddies = await this.getActiveBuddies(childId);
    const buddyIds = buddies.map(b => b.id);
    
    // Include self and buddies in feed
    const feedChildIds = [childId, ...buddyIds];
    
    if (feedChildIds.length === 0) return [];

    // Get activity events with avatar traits from avatar_state table
    const events = await db.select({
      event: activityEvents,
      child: children,
      avatarTraits: avatarState.avatarTraits,
    })
      .from(activityEvents)
      .innerJoin(children, eq(activityEvents.childId, children.id))
      .leftJoin(avatarState, eq(activityEvents.childId, avatarState.childId))
      .where(inArray(activityEvents.childId, feedChildIds))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit);

    // Get reactions for each event
    const result: Array<ActivityEvent & { child: Child & { avatarTraits?: any }; reactions: Array<ActivityReaction & { child: Child }> }> = [];
    
    for (const e of events) {
      const reactions = await this.getReactionsForActivity(e.event.id);
      result.push({
        ...e.event,
        child: {
          ...e.child,
          avatarTraits: e.avatarTraits,
        },
        reactions,
      });
    }

    return result;
  }

  async getActivityEventById(id: string): Promise<ActivityEvent | undefined> {
    const [event] = await db.select().from(activityEvents).where(eq(activityEvents.id, id));
    return event;
  }

  async addReaction(activityEventId: string, childId: string, reactionType: string): Promise<ActivityReaction> {
    // Defense in depth: Validate reaction type - only 5 pre-approved reactions for child safety
    const validReactions = ["NICE_WORK", "SO_COOL", "GREAT_JOB", "AMAZING", "WAY_TO_GO"];
    if (!validReactions.includes(reactionType)) {
      throw new Error("Invalid reaction type");
    }
    
    // Check if already reacted with this type
    const existing = await db.select().from(activityReactions).where(
      and(
        eq(activityReactions.activityEventId, activityEventId),
        eq(activityReactions.childId, childId),
        eq(activityReactions.reactionType, reactionType)
      )
    );
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [reaction] = await db.insert(activityReactions).values({
      activityEventId,
      childId,
      reactionType,
    }).returning();
    return reaction;
  }

  async removeReaction(reactionId: string): Promise<boolean> {
    await db.delete(activityReactions).where(eq(activityReactions.id, reactionId));
    return true;
  }

  async getReactionsForActivity(activityEventId: string): Promise<Array<ActivityReaction & { child: Child }>> {
    const results = await db.select({
      reaction: activityReactions,
      child: children,
    })
      .from(activityReactions)
      .innerJoin(children, eq(activityReactions.childId, children.id))
      .where(eq(activityReactions.activityEventId, activityEventId));

    return results.map(r => ({
      ...r.reaction,
      child: r.child,
    }));
  }

  async hasReacted(activityEventId: string, childId: string): Promise<boolean> {
    const [existing] = await db.select().from(activityReactions).where(
      and(
        eq(activityReactions.activityEventId, activityEventId),
        eq(activityReactions.childId, childId)
      )
    );
    return !!existing;
  }

  async getChildActivityEvents(childId: string, limit: number = 50): Promise<ActivityEvent[]> {
    const events = await db.select()
      .from(activityEvents)
      .where(eq(activityEvents.childId, childId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit);
    return events;
  }

  async getChildReactionsReceived(childId: string, limit: number = 50): Promise<Array<ActivityReaction & { 
    activity: ActivityEvent;
    reactor: Child;
  }>> {
    // Get reactions on this child's activity events (from other children)
    const results = await db.select({
      reaction: activityReactions,
      activity: activityEvents,
      reactor: children,
    })
      .from(activityReactions)
      .innerJoin(activityEvents, eq(activityReactions.activityEventId, activityEvents.id))
      .innerJoin(children, eq(activityReactions.childId, children.id))
      .where(
        and(
          eq(activityEvents.childId, childId),
          ne(activityReactions.childId, childId) // Exclude self-reactions
        )
      )
      .orderBy(desc(activityReactions.createdAt))
      .limit(limit);

    return results.map(r => ({
      ...r.reaction,
      activity: r.activity,
      reactor: r.reactor,
    }));
  }

  // ============================================
  // BUDDY PROFILE IMPLEMENTATIONS
  // ============================================

  async getBuddyProfile(childId: string): Promise<BuddyProfile | undefined> {
    const [profile] = await db.select()
      .from(buddyProfiles)
      .where(eq(buddyProfiles.childId, childId));
    return profile;
  }

  async createBuddyProfile(childId: string): Promise<BuddyProfile> {
    const [profile] = await db.insert(buddyProfiles).values({
      childId,
      theme: "forest",
      accentColor: "blue",
      identityTags: [],
      learningStyles: [],
      funFacts: [],
      favoriteSubjects: [],
      topBuddyIds: [],
    }).returning();
    return profile;
  }

  async updateBuddyProfile(childId: string, data: Partial<{
    theme: string;
    accentColor: string;
    identityTags: string[];
    learningStyles: string[];
    funFacts: string[];
    favoriteSubjects: string[];
    topBuddyIds: string[];
  }>): Promise<BuddyProfile | undefined> {
    const [profile] = await db.update(buddyProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(buddyProfiles.childId, childId))
      .returning();
    return profile;
  }

  async addProfileReaction(profileChildId: string, reactorChildId: string, reactionType: string): Promise<ProfileReaction> {
    // Check if already reacted with this type
    const [existing] = await db.select().from(profileReactions).where(
      and(
        eq(profileReactions.profileChildId, profileChildId),
        eq(profileReactions.reactorChildId, reactorChildId),
        eq(profileReactions.reactionType, reactionType)
      )
    );
    
    if (existing) {
      return existing;
    }

    const [reaction] = await db.insert(profileReactions).values({
      profileChildId,
      reactorChildId,
      reactionType,
    }).returning();
    return reaction;
  }

  async getProfileReactions(profileChildId: string): Promise<Array<ProfileReaction & { reactor: Child }>> {
    const results = await db.select({
      reaction: profileReactions,
      reactor: children,
    })
      .from(profileReactions)
      .innerJoin(children, eq(profileReactions.reactorChildId, children.id))
      .where(eq(profileReactions.profileChildId, profileChildId))
      .orderBy(desc(profileReactions.createdAt));

    return results.map(r => ({
      ...r.reaction,
      reactor: r.reactor,
    }));
  }

  async removeProfileReaction(reactionId: string): Promise<boolean> {
    await db.delete(profileReactions).where(eq(profileReactions.id, reactionId));
    return true;
  }

  // ============================================
  // BUDDY POKES IMPLEMENTATION
  // ============================================

  async sendPoke(buddyLinkId: string, senderChildId: string, recipientChildId: string): Promise<BuddyPoke> {
    const [poke] = await db.insert(buddyPokes).values({
      buddyLinkId,
      senderChildId,
      recipientChildId,
    }).returning();
    return poke;
  }

  async acknowledgePoke(pokeId: string, recipientChildId: string): Promise<{ success: boolean; error?: string }> {
    // First verify the poke exists and belongs to this recipient
    const [poke] = await db.select().from(buddyPokes).where(eq(buddyPokes.id, pokeId));
    
    if (!poke) {
      return { success: false, error: "Poke not found" };
    }
    
    if (poke.recipientChildId !== recipientChildId) {
      return { success: false, error: "You can only acknowledge pokes sent to you" };
    }
    
    if (poke.acknowledgedAt) {
      return { success: false, error: "Poke already acknowledged" };
    }

    await db.update(buddyPokes)
      .set({ acknowledgedAt: new Date() })
      .where(eq(buddyPokes.id, pokeId));
    
    return { success: true };
  }

  async getUnacknowledgedPokes(childId: string): Promise<Array<BuddyPoke & { sender: Child & { avatarTraits?: any } }>> {
    const results = await db.select({
      poke: buddyPokes,
      sender: children,
      senderAvatarTraits: avatarState.avatarTraits,
    })
      .from(buddyPokes)
      .innerJoin(children, eq(buddyPokes.senderChildId, children.id))
      .leftJoin(avatarState, eq(buddyPokes.senderChildId, avatarState.childId))
      .where(
        and(
          eq(buddyPokes.recipientChildId, childId),
          sql`${buddyPokes.acknowledgedAt} IS NULL`
        )
      )
      .orderBy(desc(buddyPokes.createdAt));

    return results.map(r => ({
      ...r.poke,
      sender: { ...r.sender, avatarTraits: r.senderAvatarTraits },
    }));
  }

  async getRecentPokes(childId: string, limit: number = 10): Promise<Array<BuddyPoke & { sender: Child & { avatarTraits?: any } }>> {
    const results = await db.select({
      poke: buddyPokes,
      sender: children,
      senderAvatarTraits: avatarState.avatarTraits,
    })
      .from(buddyPokes)
      .innerJoin(children, eq(buddyPokes.senderChildId, children.id))
      .leftJoin(avatarState, eq(buddyPokes.senderChildId, avatarState.childId))
      .where(eq(buddyPokes.recipientChildId, childId))
      .orderBy(desc(buddyPokes.createdAt))
      .limit(limit);

    return results.map(r => ({
      ...r.poke,
      sender: { ...r.sender, avatarTraits: r.senderAvatarTraits },
    }));
  }

  async canSendPoke(buddyLinkId: string, senderChildId: string): Promise<boolean> {
    // First verify buddy link is ACTIVE
    const [buddyLink] = await db.select().from(buddyLinks).where(eq(buddyLinks.id, buddyLinkId));
    if (!buddyLink || buddyLink.status !== "ACTIVE") {
      return false;
    }

    // Rate limit: Must wait at least 1 hour since LAST poke (regardless of acknowledgement)
    // This prevents harassment via rapid re-poking after acknowledgement
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const [recentPoke] = await db.select().from(buddyPokes).where(
      and(
        eq(buddyPokes.buddyLinkId, buddyLinkId),
        eq(buddyPokes.senderChildId, senderChildId),
        gte(buddyPokes.createdAt, oneHourAgo)
      )
    ).orderBy(desc(buddyPokes.createdAt)).limit(1);
    
    // If there's any poke in the last hour (acknowledged or not), deny
    return !recentPoke;
  }

  // ============================================
  // AI TEACHER IMPLEMENTATION
  // ============================================

  async createAiTeacherSession(data: {
    childId: string;
    lessonInstanceId?: string;
    subject?: string;
    currentStep?: number;
  }): Promise<AiTeacherSession> {
    const [session] = await db.insert(aiTeacherSessions).values({
      childId: data.childId,
      lessonInstanceId: data.lessonInstanceId || null,
      subject: data.subject || null,
      currentStep: data.currentStep || null,
      status: "ACTIVE",
      messageCount: 0,
    }).returning();
    return session;
  }

  async getAiTeacherSession(sessionId: string): Promise<AiTeacherSession | undefined> {
    const [session] = await db.select().from(aiTeacherSessions).where(eq(aiTeacherSessions.id, sessionId));
    return session;
  }

  async getActiveSessionForLesson(childId: string, lessonInstanceId: string): Promise<AiTeacherSession | undefined> {
    const [session] = await db.select().from(aiTeacherSessions).where(
      and(
        eq(aiTeacherSessions.childId, childId),
        eq(aiTeacherSessions.lessonInstanceId, lessonInstanceId),
        eq(aiTeacherSessions.status, "ACTIVE")
      )
    ).orderBy(desc(aiTeacherSessions.createdAt)).limit(1);
    return session;
  }

  async getActiveSessionForChild(childId: string): Promise<AiTeacherSession | undefined> {
    const [session] = await db.select().from(aiTeacherSessions).where(
      and(
        eq(aiTeacherSessions.childId, childId),
        eq(aiTeacherSessions.status, "ACTIVE")
      )
    ).orderBy(desc(aiTeacherSessions.createdAt)).limit(1);
    return session;
  }

  async updateAiTeacherSession(sessionId: string, data: {
    currentStep?: number;
    status?: string;
    messageCount?: number;
  }): Promise<AiTeacherSession | undefined> {
    const updateData: any = {};
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.messageCount !== undefined) updateData.messageCount = data.messageCount;
    
    const [session] = await db.update(aiTeacherSessions)
      .set(updateData)
      .where(eq(aiTeacherSessions.id, sessionId))
      .returning();
    return session;
  }

  async endAiTeacherSession(sessionId: string): Promise<AiTeacherSession | undefined> {
    const [session] = await db.update(aiTeacherSessions)
      .set({ status: "ENDED", endedAt: new Date() })
      .where(eq(aiTeacherSessions.id, sessionId))
      .returning();
    return session;
  }

  async createAiTeacherMessage(data: {
    sessionId: string;
    role: string;
    content: string;
    inputMode?: string;
    outputMode?: string;
    audioUrl?: string;
  }): Promise<AiTeacherMessage> {
    const [message] = await db.insert(aiTeacherMessages).values({
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      inputMode: data.inputMode || null,
      outputMode: data.outputMode || null,
      audioUrl: data.audioUrl || null,
    }).returning();
    
    // Increment message count on session
    await db.update(aiTeacherSessions)
      .set({ messageCount: sql`${aiTeacherSessions.messageCount} + 1` })
      .where(eq(aiTeacherSessions.id, data.sessionId));
    
    return message;
  }

  async getMessagesForSession(sessionId: string): Promise<AiTeacherMessage[]> {
    return db.select().from(aiTeacherMessages)
      .where(eq(aiTeacherMessages.sessionId, sessionId))
      .orderBy(asc(aiTeacherMessages.createdAt));
  }

  // ============================================
  // PARENT COMMUNITY IMPLEMENTATIONS
  // ============================================

  async getParentProfile(userId: string): Promise<ParentProfile | undefined> {
    const [profile] = await db.select().from(parentProfiles).where(eq(parentProfiles.userId, userId));
    return profile;
  }

  async createParentProfile(data: {
    userId: string;
    firstName: string;
    lastName?: string;
    bio?: string;
    city?: string;
    state?: string;
    homeschoolStyle?: string;
    yearsHomeschooling?: number;
    childAgeRanges?: string[];
    interests?: string[];
    showLocation?: boolean;
    showInDiscovery?: boolean;
    allowConnectionRequests?: boolean;
    isComplete?: boolean;
  }): Promise<ParentProfile> {
    const [profile] = await db.insert(parentProfiles).values({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName || null,
      bio: data.bio || null,
      city: data.city || null,
      state: data.state || null,
      homeschoolStyle: data.homeschoolStyle || null,
      yearsHomeschooling: data.yearsHomeschooling || null,
      childAgeRanges: data.childAgeRanges || [],
      interests: data.interests || [],
      showLocation: data.showLocation ?? false,
      showInDiscovery: data.showInDiscovery ?? true,
      allowConnectionRequests: data.allowConnectionRequests ?? true,
      isComplete: data.isComplete ?? false,
    }).returning();
    return profile;
  }

  async updateParentProfile(userId: string, data: Partial<{
    firstName: string;
    lastName: string;
    bio: string;
    city: string;
    state: string;
    homeschoolStyle: string;
    yearsHomeschooling: number;
    childAgeRanges: string[];
    interests: string[];
    showLocation: boolean;
    showInDiscovery: boolean;
    allowConnectionRequests: boolean;
    isComplete: boolean;
  }>): Promise<ParentProfile | undefined> {
    const [profile] = await db.update(parentProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(parentProfiles.userId, userId))
      .returning();
    return profile;
  }

  async discoverFamilies(params: {
    userId: string;
    state?: string;
    city?: string;
    interests?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Array<ParentProfile & { childCount: number }>> {
    // Get existing connections (both directions) to exclude from discovery
    const existingConnections = await db.select({
      otherUserId: sql<string>`CASE 
        WHEN ${parentConnections.requesterId} = ${params.userId} THEN ${parentConnections.receiverId}
        ELSE ${parentConnections.requesterId}
      END`
    })
      .from(parentConnections)
      .where(or(
        eq(parentConnections.requesterId, params.userId),
        eq(parentConnections.receiverId, params.userId)
      ));
    
    const connectedUserIds = new Set(existingConnections.map(c => c.otherUserId));
    
    const conditions = [
      ne(parentProfiles.userId, params.userId),
      eq(parentProfiles.showInDiscovery, true),
      eq(parentProfiles.isComplete, true),
    ];
    
    if (params.state) {
      conditions.push(eq(parentProfiles.state, params.state));
    }
    if (params.city) {
      conditions.push(eq(parentProfiles.city, params.city));
    }
    
    const profiles = await db.select({
      profile: parentProfiles,
    })
      .from(parentProfiles)
      .where(and(...conditions))
      .limit(params.limit || 20)
      .offset(params.offset || 0)
      .orderBy(desc(parentProfiles.createdAt));
    
    // Filter out already connected users
    const filteredProfiles = profiles.filter(p => !connectedUserIds.has(p.profile.userId));
    
    const results = await Promise.all(filteredProfiles.map(async (p) => {
      const childCount = await db.select({ count: sql<number>`count(*)` })
        .from(children)
        .where(eq(children.parentId, p.profile.userId));
      return {
        ...p.profile,
        childCount: Number(childCount[0]?.count || 0),
      };
    }));
    
    return results;
  }

  async getFamiliesWithBuddyConnections(userId: string): Promise<Array<ParentProfile & { buddyChildName: string; myChildName: string }>> {
    const myChildren = await db.select().from(children).where(eq(children.parentId, userId));
    const myChildIds = myChildren.map(c => c.id);
    
    if (myChildIds.length === 0) return [];
    
    const activeBuddyLinks = await db.select({
      buddyLink: buddyLinks,
      requesterChild: children,
    })
      .from(buddyLinks)
      .innerJoin(children, eq(buddyLinks.requesterId, children.id))
      .where(and(
        eq(buddyLinks.status, "ACTIVE"),
        or(
          inArray(buddyLinks.requesterId, myChildIds),
          inArray(buddyLinks.receiverId, myChildIds)
        )
      ));
    
    const buddyParentIds = new Set<string>();
    const buddyMap: Record<string, { buddyChildName: string; myChildName: string }> = {};
    
    for (const link of activeBuddyLinks) {
      const isRequester = myChildIds.includes(link.buddyLink.requesterId);
      const buddyChildId = isRequester ? link.buddyLink.receiverId : link.buddyLink.requesterId;
      const myChildId = isRequester ? link.buddyLink.requesterId : link.buddyLink.receiverId;
      
      const [buddyChild] = await db.select().from(children).where(eq(children.id, buddyChildId));
      const myChild = myChildren.find(c => c.id === myChildId);
      
      if (buddyChild && myChild) {
        buddyParentIds.add(buddyChild.parentId);
        buddyMap[buddyChild.parentId] = {
          buddyChildName: buddyChild.name,
          myChildName: myChild.name,
        };
      }
    }
    
    if (buddyParentIds.size === 0) return [];
    
    const profiles = await db.select().from(parentProfiles)
      .where(inArray(parentProfiles.userId, Array.from(buddyParentIds)));
    
    return profiles.map(p => ({
      ...p,
      ...buddyMap[p.userId],
    }));
  }

  async getCommunityGroups(params: {
    groupType?: string;
    state?: string;
    city?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CommunityGroup[]> {
    const conditions = [eq(communityGroups.isActive, true)];
    
    if (params.groupType) {
      conditions.push(eq(communityGroups.groupType, params.groupType));
    }
    if (params.state) {
      conditions.push(eq(communityGroups.state, params.state));
    }
    if (params.city) {
      conditions.push(eq(communityGroups.city, params.city));
    }
    
    return db.select().from(communityGroups)
      .where(and(...conditions))
      .limit(params.limit || 20)
      .offset(params.offset || 0)
      .orderBy(desc(communityGroups.memberCount));
  }

  async getCommunityGroup(groupId: string): Promise<CommunityGroup | undefined> {
    const [group] = await db.select().from(communityGroups).where(eq(communityGroups.id, groupId));
    return group;
  }

  async getCommunityGroupBySlug(slug: string): Promise<CommunityGroup | undefined> {
    const [group] = await db.select().from(communityGroups).where(eq(communityGroups.slug, slug));
    return group;
  }

  async createCommunityGroup(data: {
    name: string;
    slug: string;
    description?: string;
    groupType: string;
    city?: string;
    state?: string;
    topics?: string[];
    isPrivate?: boolean;
    requiresApproval?: boolean;
    joinCode?: string;
    maxMembers?: number;
    createdBy?: string;
  }): Promise<CommunityGroup> {
    const [group] = await db.insert(communityGroups).values({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      groupType: data.groupType,
      city: data.city || null,
      state: data.state || null,
      topics: data.topics || [],
      isPrivate: data.isPrivate ?? false,
      requiresApproval: data.requiresApproval ?? true,
      joinCode: data.joinCode || null,
      maxMembers: data.maxMembers || null,
      createdBy: data.createdBy || null,
    }).returning();
    return group;
  }

  async updateCommunityGroup(groupId: string, data: Partial<{
    name: string;
    description: string;
    topics: string[];
    isPrivate: boolean;
    requiresApproval: boolean;
    joinCode: string;
    maxMembers: number;
    isActive: boolean;
  }>): Promise<CommunityGroup | undefined> {
    const [group] = await db.update(communityGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(communityGroups.id, groupId))
      .returning();
    return group;
  }

  async getGroupMembership(groupId: string, userId: string): Promise<GroupMembership | undefined> {
    const [membership] = await db.select().from(groupMemberships)
      .where(and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, userId)
      ));
    return membership;
  }

  async getGroupMembers(groupId: string, status?: string): Promise<Array<GroupMembership & { profile: ParentProfile | null }>> {
    const conditions = [eq(groupMemberships.groupId, groupId)];
    if (status) {
      conditions.push(eq(groupMemberships.status, status));
    }
    
    const members = await db.select({
      membership: groupMemberships,
      profile: parentProfiles,
    })
      .from(groupMemberships)
      .leftJoin(parentProfiles, eq(groupMemberships.userId, parentProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(groupMemberships.joinedAt));
    
    return members.map(m => ({
      ...m.membership,
      profile: m.profile,
    }));
  }

  async getUserGroups(userId: string): Promise<Array<CommunityGroup & { membership: GroupMembership }>> {
    const memberships = await db.select({
      group: communityGroups,
      membership: groupMemberships,
    })
      .from(groupMemberships)
      .innerJoin(communityGroups, eq(groupMemberships.groupId, communityGroups.id))
      .where(and(
        eq(groupMemberships.userId, userId),
        eq(groupMemberships.status, "ACTIVE")
      ))
      .orderBy(desc(groupMemberships.joinedAt));
    
    return memberships.map(m => ({
      ...m.group,
      membership: m.membership,
    }));
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMembership> {
    const group = await this.getCommunityGroup(groupId);
    const status = group?.requiresApproval ? "PENDING" : "ACTIVE";
    
    const [membership] = await db.insert(groupMemberships).values({
      groupId,
      userId,
      role: "MEMBER",
      status,
    }).returning();
    
    if (status === "ACTIVE") {
      await db.update(communityGroups)
        .set({ memberCount: sql`${communityGroups.memberCount} + 1` })
        .where(eq(communityGroups.id, groupId));
    }
    
    return membership;
  }

  async addGroupCreatorAsMember(groupId: string, userId: string): Promise<GroupMembership> {
    // Create membership with ACTIVE status and ADMIN role for group creators
    const [membership] = await db.insert(groupMemberships).values({
      groupId,
      userId,
      role: "ADMIN",
      status: "ACTIVE",
      approvedBy: userId,
      approvedAt: new Date(),
    }).returning();
    
    // Increment member count
    await db.update(communityGroups)
      .set({ memberCount: sql`${communityGroups.memberCount} + 1` })
      .where(eq(communityGroups.id, groupId));
    
    return membership;
  }

  async approveGroupMember(groupId: string, userId: string, approvedBy: string): Promise<GroupMembership | undefined> {
    const [membership] = await db.update(groupMemberships)
      .set({ 
        status: "ACTIVE", 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, userId)
      ))
      .returning();
    
    if (membership) {
      await db.update(communityGroups)
        .set({ memberCount: sql`${communityGroups.memberCount} + 1` })
        .where(eq(communityGroups.id, groupId));
    }
    
    return membership;
  }

  async updateMemberRole(groupId: string, userId: string, role: string): Promise<GroupMembership | undefined> {
    const [membership] = await db.update(groupMemberships)
      .set({ role, updatedAt: new Date() })
      .where(and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, userId)
      ))
      .returning();
    return membership;
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const result = await db.delete(groupMemberships)
      .where(and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, userId)
      ));
    
    await db.update(communityGroups)
      .set({ memberCount: sql`GREATEST(${communityGroups.memberCount} - 1, 0)` })
      .where(eq(communityGroups.id, groupId));
    
    return true;
  }

  async getGroupPosts(groupId: string, params?: {
    postType?: string;
    sortBy?: 'new' | 'active' | 'helpful';
    limit?: number;
    offset?: number;
  }): Promise<Array<GroupPost & { author: ParentProfile | null }>> {
    const conditions = [
      eq(groupPosts.groupId, groupId),
      eq(groupPosts.isHidden, false),
    ];
    
    if (params?.postType) {
      conditions.push(eq(groupPosts.postType, params.postType));
    }
    
    let orderByClause;
    switch (params?.sortBy) {
      case 'active':
        orderByClause = desc(groupPosts.updatedAt);
        break;
      case 'helpful':
        orderByClause = desc(groupPosts.helpfulCount);
        break;
      default:
        orderByClause = desc(groupPosts.createdAt);
    }
    
    const posts = await db.select({
      post: groupPosts,
      author: parentProfiles,
    })
      .from(groupPosts)
      .leftJoin(parentProfiles, eq(groupPosts.authorId, parentProfiles.userId))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(params?.limit || 20)
      .offset(params?.offset || 0);
    
    return posts.map(p => ({
      ...p.post,
      author: p.author,
    }));
  }

  async getGroupPost(postId: string): Promise<(GroupPost & { author: ParentProfile | null }) | undefined> {
    const [result] = await db.select({
      post: groupPosts,
      author: parentProfiles,
    })
      .from(groupPosts)
      .leftJoin(parentProfiles, eq(groupPosts.authorId, parentProfiles.userId))
      .where(eq(groupPosts.id, postId));
    
    if (!result) return undefined;
    
    return {
      ...result.post,
      author: result.author,
    };
  }

  async createGroupPost(data: {
    groupId: string;
    authorId: string;
    postType?: string;
    title?: string;
    content: string;
    resourceUrl?: string;
  }): Promise<GroupPost> {
    const [post] = await db.insert(groupPosts).values({
      groupId: data.groupId,
      authorId: data.authorId,
      postType: data.postType || "DISCUSSION",
      title: data.title || null,
      content: data.content,
      resourceUrl: data.resourceUrl || null,
    }).returning();
    
    await db.update(communityGroups)
      .set({ postCount: sql`${communityGroups.postCount} + 1` })
      .where(eq(communityGroups.id, data.groupId));
    
    return post;
  }

  async updateGroupPost(postId: string, data: Partial<{
    title: string;
    content: string;
    resourceUrl: string;
    isPinned: boolean;
    isHidden: boolean;
  }>): Promise<GroupPost | undefined> {
    const [post] = await db.update(groupPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groupPosts.id, postId))
      .returning();
    return post;
  }

  async deleteGroupPost(postId: string): Promise<boolean> {
    const post = await this.getGroupPost(postId);
    if (post) {
      await db.delete(groupPosts).where(eq(groupPosts.id, postId));
      await db.update(communityGroups)
        .set({ postCount: sql`GREATEST(${communityGroups.postCount} - 1, 0)` })
        .where(eq(communityGroups.id, post.groupId));
    }
    return true;
  }

  async getPostReplies(postId: string): Promise<Array<PostReply & { author: ParentProfile | null }>> {
    const replies = await db.select({
      reply: postReplies,
      author: parentProfiles,
    })
      .from(postReplies)
      .leftJoin(parentProfiles, eq(postReplies.authorId, parentProfiles.userId))
      .where(and(
        eq(postReplies.postId, postId),
        eq(postReplies.isHidden, false)
      ))
      .orderBy(asc(postReplies.createdAt));
    
    return replies.map(r => ({
      ...r.reply,
      author: r.author,
    }));
  }

  async createPostReply(data: {
    postId: string;
    authorId: string;
    content: string;
  }): Promise<PostReply> {
    const [reply] = await db.insert(postReplies).values({
      postId: data.postId,
      authorId: data.authorId,
      content: data.content,
    }).returning();
    
    await db.update(groupPosts)
      .set({ 
        replyCount: sql`${groupPosts.replyCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(groupPosts.id, data.postId));
    
    return reply;
  }

  async deletePostReply(replyId: string): Promise<boolean> {
    const [reply] = await db.select().from(postReplies).where(eq(postReplies.id, replyId));
    if (reply) {
      await db.delete(postReplies).where(eq(postReplies.id, replyId));
      await db.update(groupPosts)
        .set({ replyCount: sql`GREATEST(${groupPosts.replyCount} - 1, 0)` })
        .where(eq(groupPosts.id, reply.postId));
    }
    return true;
  }

  async toggleHelpfulVote(userId: string, postId?: string, replyId?: string): Promise<{ voted: boolean }> {
    const existing = await this.hasVoted(userId, postId, replyId);
    
    if (existing) {
      const conditions = [eq(helpfulVotes.userId, userId)];
      if (postId) conditions.push(eq(helpfulVotes.postId, postId));
      if (replyId) conditions.push(eq(helpfulVotes.replyId, replyId));
      
      await db.delete(helpfulVotes).where(and(...conditions));
      
      if (postId) {
        await db.update(groupPosts)
          .set({ helpfulCount: sql`GREATEST(${groupPosts.helpfulCount} - 1, 0)` })
          .where(eq(groupPosts.id, postId));
      }
      if (replyId) {
        await db.update(postReplies)
          .set({ helpfulCount: sql`GREATEST(${postReplies.helpfulCount} - 1, 0)` })
          .where(eq(postReplies.id, replyId));
      }
      
      return { voted: false };
    } else {
      await db.insert(helpfulVotes).values({
        userId,
        postId: postId || null,
        replyId: replyId || null,
      });
      
      if (postId) {
        await db.update(groupPosts)
          .set({ helpfulCount: sql`${groupPosts.helpfulCount} + 1` })
          .where(eq(groupPosts.id, postId));
      }
      if (replyId) {
        await db.update(postReplies)
          .set({ helpfulCount: sql`${postReplies.helpfulCount} + 1` })
          .where(eq(postReplies.id, replyId));
      }
      
      return { voted: true };
    }
  }

  async hasVoted(userId: string, postId?: string, replyId?: string): Promise<boolean> {
    const conditions = [eq(helpfulVotes.userId, userId)];
    if (postId) conditions.push(eq(helpfulVotes.postId, postId));
    if (replyId) conditions.push(eq(helpfulVotes.replyId, replyId));
    
    const [vote] = await db.select().from(helpfulVotes).where(and(...conditions));
    return !!vote;
  }

  async getParentConnections(userId: string, status?: string): Promise<Array<ParentConnection & { profile: ParentProfile }>> {
    const conditions = [
      or(
        eq(parentConnections.requesterId, userId),
        eq(parentConnections.receiverId, userId)
      ),
    ];
    
    if (status) {
      conditions.push(eq(parentConnections.status, status));
    }
    
    const connections = await db.select().from(parentConnections)
      .where(and(...conditions))
      .orderBy(desc(parentConnections.createdAt));
    
    const results = await Promise.all(connections.map(async (conn) => {
      const otherUserId = conn.requesterId === userId ? conn.receiverId : conn.requesterId;
      const [profile] = await db.select().from(parentProfiles).where(eq(parentProfiles.userId, otherUserId));
      return {
        ...conn,
        profile: profile!,
      };
    }));
    
    return results.filter(r => r.profile);
  }

  async getParentConnection(connectionId: string): Promise<ParentConnection | undefined> {
    const [connection] = await db.select().from(parentConnections).where(eq(parentConnections.id, connectionId));
    return connection;
  }

  async getConnectionBetween(userId1: string, userId2: string): Promise<ParentConnection | undefined> {
    const [connection] = await db.select().from(parentConnections)
      .where(or(
        and(eq(parentConnections.requesterId, userId1), eq(parentConnections.receiverId, userId2)),
        and(eq(parentConnections.requesterId, userId2), eq(parentConnections.receiverId, userId1))
      ));
    return connection;
  }

  async sendConnectionRequest(data: {
    requesterId: string;
    receiverId: string;
    connectionSource?: string;
    sourceId?: string;
    message?: string;
  }): Promise<ParentConnection> {
    const [connection] = await db.insert(parentConnections).values({
      requesterId: data.requesterId,
      receiverId: data.receiverId,
      status: "PENDING",
      connectionSource: data.connectionSource || null,
      sourceId: data.sourceId || null,
      message: data.message || null,
    }).returning();
    return connection;
  }

  async respondToConnectionRequest(connectionId: string, accept: boolean): Promise<ParentConnection | undefined> {
    const [connection] = await db.update(parentConnections)
      .set({ 
        status: accept ? "ACTIVE" : "DECLINED",
        updatedAt: new Date()
      })
      .where(eq(parentConnections.id, connectionId))
      .returning();
    return connection;
  }

  async getPendingConnectionRequests(userId: string): Promise<Array<ParentConnection & { requester: ParentProfile }>> {
    const requests = await db.select({
      connection: parentConnections,
      requester: parentProfiles,
    })
      .from(parentConnections)
      .innerJoin(parentProfiles, eq(parentConnections.requesterId, parentProfiles.userId))
      .where(and(
        eq(parentConnections.receiverId, userId),
        eq(parentConnections.status, "PENDING")
      ))
      .orderBy(desc(parentConnections.createdAt));
    
    return requests.map(r => ({
      ...r.connection,
      requester: r.requester,
    }));
  }

  async getMessages(connectionId: string, limit?: number): Promise<ParentMessage[]> {
    return db.select().from(parentMessages)
      .where(eq(parentMessages.connectionId, connectionId))
      .orderBy(asc(parentMessages.createdAt))
      .limit(limit || 100);
  }

  async sendMessage(data: {
    connectionId: string;
    senderId: string;
    content: string;
  }): Promise<ParentMessage> {
    const [message] = await db.insert(parentMessages).values({
      connectionId: data.connectionId,
      senderId: data.senderId,
      content: data.content,
    }).returning();
    return message;
  }

  async markMessageRead(messageId: string): Promise<ParentMessage | undefined> {
    const [message] = await db.update(parentMessages)
      .set({ readAt: new Date() })
      .where(eq(parentMessages.id, messageId))
      .returning();
    return message;
  }

  async reportMessage(messageId: string): Promise<ParentMessage | undefined> {
    const [message] = await db.update(parentMessages)
      .set({ isReported: true })
      .where(eq(parentMessages.id, messageId))
      .returning();
    return message;
  }

  async ensureStateGroup(state: string): Promise<CommunityGroup> {
    const slug = `neulearn-parents-${state.toLowerCase().replace(/\s+/g, '-')}`;
    
    const existing = await this.getCommunityGroupBySlug(slug);
    if (existing) return existing;
    
    return this.createCommunityGroup({
      name: `Neulearn Parents in ${state}`,
      slug,
      description: `Connect with other Neulearn homeschool families in ${state}`,
      groupType: "LOCAL_STATE",
      state,
      isPrivate: false,
      requiresApproval: false,
    });
  }

  // Daily Queue operations
  async getDailyQueue(childId: string, date: string): Promise<DailyQueue | undefined> {
    const [queue] = await db.select().from(dailyQueues)
      .where(and(
        eq(dailyQueues.childId, childId),
        eq(dailyQueues.date, date)
      ));
    return queue;
  }

  async getDailyQueueById(id: string): Promise<DailyQueue | undefined> {
    const [queue] = await db.select().from(dailyQueues)
      .where(eq(dailyQueues.id, id));
    return queue;
  }

  async createDailyQueue(data: {
    childId: string;
    date: string;
    items: DailyQueueItem[];
    totalItems: number;
  }): Promise<DailyQueue> {
    const [queue] = await db.insert(dailyQueues).values({
      childId: data.childId,
      date: data.date,
      items: data.items,
      totalItems: data.totalItems,
    }).returning();
    return queue;
  }

  async updateDailyQueue(id: string, data: {
    items?: DailyQueueItem[];
    completedItems?: number;
    status?: string;
    startedAt?: Date;
    completedAt?: Date;
  }): Promise<DailyQueue | undefined> {
    const [queue] = await db.update(dailyQueues)
      .set(data)
      .where(eq(dailyQueues.id, id))
      .returning();
    return queue;
  }

  async getChildSettings(childId: string): Promise<ChildSettings | undefined> {
    const [settings] = await db.select().from(childSettings)
      .where(eq(childSettings.childId, childId));
    return settings;
  }

  async getDailyDevotional(childId: string, date: string): Promise<Devotional | undefined> {
    const [devotional] = await db.select().from(devotionals)
      .where(and(
        eq(devotionals.childId, childId),
        eq(devotionals.date, date)
      ));
    return devotional;
  }

  async findQueueByLessonInstanceId(childId: string, lessonInstanceId: string): Promise<DailyQueue | undefined> {
    const queues = await db.select().from(dailyQueues)
      .where(eq(dailyQueues.childId, childId))
      .orderBy(desc(dailyQueues.generatedAt));
    
    for (const queue of queues) {
      const hasLesson = queue.items.some(item => item.lessonInstanceId === lessonInstanceId);
      if (hasLesson) {
        return queue;
      }
    }
    return undefined;
  }
}

export const storage = new DbStorage();
