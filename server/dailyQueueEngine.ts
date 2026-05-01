import { storage } from "./storage";
import { DailyQueueItem, Child, ChildSkillProgress, Skill } from "@shared/schema";

const DAYS_UNTIL_REVIEW = 7; // Days since last practice before skill needs spiral review
const CORE_ITEMS_PER_DAY = 2; // Number of new skills to learn each day
const REVIEW_ITEMS_PER_DAY = 2; // Number of spiral review items
const APPLY_ITEMS_PER_DAY = 1; // Number of transfer/application items

type SkillWithProgress = Skill & { progress?: ChildSkillProgress };

export async function generateDailyQueue(childId: string, date: string): Promise<DailyQueueItem[]> {
  const child = await storage.getChildById(childId);
  if (!child) throw new Error("Child not found");

  const settings = await storage.getChildSettings(childId);
  const enabledSubjects = settings?.subjectsEnabled || ["READING", "MATH", "CHARACTER"];

  const items: DailyQueueItem[] = [];
  let orderIndex = 0;

  // 1. CORE LEARNING - New skills to learn based on prerequisites
  const coreItems = await selectCoreSkills(childId, child.grade, enabledSubjects, CORE_ITEMS_PER_DAY);
  for (const skill of coreItems) {
    items.push({
      id: `core-${skill.id}-${Date.now()}-${orderIndex}`,
      type: "CORE_LEARNING",
      skillId: skill.id,
      skillName: skill.name,
      subject: skill.subject,
      description: skill.description,
      estimatedMinutes: skill.estimatedLessons ? skill.estimatedLessons * 5 : 10,
      status: "PENDING",
      order: orderIndex++,
    });
  }

  // 2. SPIRAL REVIEW - Previously learned skills that need reinforcement
  const reviewItems = await selectReviewSkills(childId, enabledSubjects, REVIEW_ITEMS_PER_DAY);
  for (const skill of reviewItems) {
    items.push({
      id: `review-${skill.id}-${Date.now()}-${orderIndex}`,
      type: "SPIRAL_REVIEW",
      skillId: skill.id,
      skillName: skill.name,
      subject: skill.subject,
      description: `Quick review: ${skill.description}`,
      estimatedMinutes: 5,
      status: "PENDING",
      order: orderIndex++,
    });
  }

  // 3. APPLY - Transfer-level practice for mastered skills
  const applyItems = await selectApplySkills(childId, enabledSubjects, APPLY_ITEMS_PER_DAY);
  for (const skill of applyItems) {
    items.push({
      id: `apply-${skill.id}-${Date.now()}-${orderIndex}`,
      type: "APPLY",
      skillId: skill.id,
      skillName: skill.name,
      subject: skill.subject,
      description: `Apply what you learned: ${skill.name}`,
      estimatedMinutes: 8,
      status: "PENDING",
      order: orderIndex++,
    });
  }

  // 4. DEVOTIONAL - Add a devotional if enabled
  if (settings?.faithMode !== "VALUES_ONLY") {
    const devotional = await storage.getDailyDevotional(childId, date);
    if (devotional) {
      items.push({
        id: `devotional-${devotional.id}-${Date.now()}`,
        type: "DEVOTIONAL",
        description: devotional.title,
        estimatedMinutes: 5,
        status: "PENDING",
        order: orderIndex++,
      });
    }
  }

  return items;
}

async function selectCoreSkills(
  childId: string,
  grade: string,
  subjects: string[],
  count: number
): Promise<Skill[]> {
  const allSkills = await storage.getAllSkills();
  const progress = await storage.getChildSkillProgress(childId);
  const progressMap = new Map(progress.map(p => [p.skillId, p]));

  const gradeOrder = ["K", "1", "2", "3", "4", "5"];
  const childGradeIndex = gradeOrder.indexOf(grade);

  const readySkills: SkillWithProgress[] = [];

  // First priority: Continue any in-progress (DEVELOPING) skills from any grade
  for (const skill of allSkills) {
    if (!subjects.includes(skill.subject)) continue;
    
    const skillProgress = progressMap.get(skill.id);
    if (skillProgress?.masteryLevel === "DEVELOPING") {
      readySkills.push({ ...skill, progress: skillProgress });
    }
  }

  // Second priority: Find new skills that are ready to learn (prerequisites met, not yet started)
  for (const skill of allSkills) {
    if (!subjects.includes(skill.subject)) continue;
    
    // Allow skills from current grade or earlier (for prerequisite chains)
    const skillGradeIndex = gradeOrder.indexOf(skill.gradeLevel);
    if (skillGradeIndex > childGradeIndex) continue;

    const skillProgress = progressMap.get(skill.id);
    const masteryLevel = skillProgress?.masteryLevel || "NOT_STARTED";

    // Only select skills that haven't been started yet
    if (masteryLevel !== "NOT_STARTED") continue;

    // Check prerequisites
    const prereqs = skill.prerequisiteSkillIds || [];
    const prereqsMet = prereqs.every(prereqId => {
      const prereqProgress = progressMap.get(prereqId);
      return prereqProgress && 
        (prereqProgress.masteryLevel === "PROFICIENT" || 
         prereqProgress.masteryLevel === "FLUENT" || 
         prereqProgress.masteryLevel === "TRANSFER");
    });

    if (prereqsMet || prereqs.length === 0) {
      readySkills.push({ ...skill, progress: skillProgress });
    }
  }

  // Prioritize: 
  // 1. Skills currently in DEVELOPING (continue working on them)
  // 2. Skills in NOT_STARTED (new skills to introduce)
  const developing = readySkills.filter(s => s.progress?.masteryLevel === "DEVELOPING");
  const notStarted = readySkills.filter(s => !s.progress || s.progress.masteryLevel === "NOT_STARTED");

  // Balance subjects: try to pick from different subjects
  const selected: Skill[] = [];
  const subjectCounts: Record<string, number> = {};

  // First, continue any developing skills
  for (const skill of developing) {
    if (selected.length >= count) break;
    selected.push(skill);
    subjectCounts[skill.subject] = (subjectCounts[skill.subject] || 0) + 1;
  }

  // Then add new skills, balancing subjects
  for (const skill of notStarted) {
    if (selected.length >= count) break;
    const subjectCount = subjectCounts[skill.subject] || 0;
    if (subjectCount < 2) { // Limit to 2 skills per subject per day
      selected.push(skill);
      subjectCounts[skill.subject] = subjectCount + 1;
    }
  }

  return selected;
}

async function selectReviewSkills(
  childId: string,
  subjects: string[],
  count: number
): Promise<Skill[]> {
  const allSkills = await storage.getAllSkills();
  const progress = await storage.getChildSkillProgress(childId);
  const today = new Date();

  const reviewCandidates: Array<Skill & { daysSincePractice: number }> = [];

  for (const p of progress) {
    // Only review skills that have been learned (PROFICIENT or higher)
    if (p.masteryLevel !== "PROFICIENT" && p.masteryLevel !== "FLUENT") continue;
    
    const skill = allSkills.find(s => s.id === p.skillId);
    if (!skill || !subjects.includes(skill.subject)) continue;

    // Calculate days since last practice
    let daysSincePractice = 999;
    if (p.lastPracticeDate) {
      const lastDate = new Date(p.lastPracticeDate);
      daysSincePractice = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Include if needs reinforcement or hasn't been practiced recently
    if (p.needsReinforcement || daysSincePractice >= DAYS_UNTIL_REVIEW) {
      reviewCandidates.push({ ...skill, daysSincePractice });
    }
  }

  // Sort by days since practice (oldest first) and needs reinforcement
  reviewCandidates.sort((a, b) => b.daysSincePractice - a.daysSincePractice);

  return reviewCandidates.slice(0, count);
}

async function selectApplySkills(
  childId: string,
  subjects: string[],
  count: number
): Promise<Skill[]> {
  const allSkills = await storage.getAllSkills();
  const progress = await storage.getChildSkillProgress(childId);

  const applyCandidates: Skill[] = [];

  for (const p of progress) {
    // Only select skills at FLUENT level (ready to work toward TRANSFER)
    if (p.masteryLevel !== "FLUENT") continue;
    
    const skill = allSkills.find(s => s.id === p.skillId);
    if (!skill || !subjects.includes(skill.subject)) continue;

    applyCandidates.push(skill);
  }

  // Shuffle and select random skills for application
  const shuffled = applyCandidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function getOrCreateDailyQueue(childId: string, date: string) {
  // Check if queue already exists for this date
  let queue = await storage.getDailyQueue(childId, date);
  
  if (!queue) {
    // Generate new queue
    const items = await generateDailyQueue(childId, date);
    queue = await storage.createDailyQueue({
      childId,
      date,
      items,
      totalItems: items.length,
    });
  }

  return queue;
}

export async function updateQueueItemStatus(
  queueId: string,
  itemId: string,
  status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
) {
  const queue = await storage.getDailyQueueById(queueId);
  if (!queue) throw new Error("Queue not found");

  const items = queue.items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        status,
        completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined,
      };
    }
    return item;
  });

  const completedItems = items.filter(i => i.status === "COMPLETED").length;
  const allComplete = items.every(i => i.status === "COMPLETED" || i.status === "SKIPPED");

  return await storage.updateDailyQueue(queueId, {
    items,
    completedItems,
    status: allComplete ? "COMPLETED" : "IN_PROGRESS",
    startedAt: queue.startedAt || new Date(),
    completedAt: allComplete ? new Date() : undefined,
  });
}
