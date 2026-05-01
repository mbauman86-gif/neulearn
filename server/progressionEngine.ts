import { db } from "./db";
import { storage } from "./storage";
import { 
  skills, 
  skillEdges, 
  childSkillProgress, 
  curriculumStrands,
  milestones,
  childMilestoneProgress,
  yearEndGoals,
  childYearGoalProgress,
  learningSignals,
  childLearningProfile
} from "@shared/schema";
import { eq, and, inArray, sql, desc, asc } from "drizzle-orm";

export interface SkillNode {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  strand: string;
  orderInStrand: number;
  prerequisites: string[]; // skill IDs that must be mastered first
  masteryLevel: string; // NOT_STARTED, DEVELOPING, PROFICIENT, FLUENT, TRANSFER
}

export interface NextSkillRecommendation {
  skill: SkillNode;
  reason: string;
  strandName: string;
  isReview: boolean;
  priority: number; // 1 = highest priority
}

export interface ProgressionContext {
  childId: string;
  grade: string;
  currentStrands: Array<{
    strandId: string;
    strandName: string;
    subject: string;
    progressPercent: number;
    currentSkillId?: string;
  }>;
  readySkills: SkillNode[];
  needsReviewSkills: SkillNode[];
  yearGoalProgress: Array<{
    goalTitle: string;
    subject: string;
    progressPercent: number;
    skillsRemaining: number;
  }>;
}

export class ProgressionEngine {
  
  async getSkillWithPrerequisites(skillId: string): Promise<SkillNode | null> {
    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, skillId),
    });
    
    if (!skill) return null;
    
    const edges = await db.select({ prerequisiteId: skillEdges.prerequisiteSkillId })
      .from(skillEdges)
      .where(eq(skillEdges.dependentSkillId, skillId));
    
    return {
      id: skill.id,
      name: skill.name,
      subject: skill.subject,
      gradeLevel: skill.gradeLevel,
      strand: skill.strand,
      orderInStrand: skill.orderInStrand,
      prerequisites: edges.map(e => e.prerequisiteId),
      masteryLevel: "NOT_STARTED",
    };
  }
  
  async getSkillsForSubjectAndGrade(subject: string, grade: string): Promise<SkillNode[]> {
    const allSkills = await db.select().from(skills)
      .where(and(
        eq(skills.subject, subject),
        eq(skills.gradeLevel, grade)
      ))
      .orderBy(asc(skills.orderInStrand));
    
    const skillIds = allSkills.map(s => s.id);
    
    let edges: { prerequisiteId: string; dependentId: string }[] = [];
    if (skillIds.length > 0) {
      edges = await db.select({
        prerequisiteId: skillEdges.prerequisiteSkillId,
        dependentId: skillEdges.dependentSkillId,
      })
        .from(skillEdges)
        .where(inArray(skillEdges.dependentSkillId, skillIds));
    }
    
    const prereqMap = new Map<string, string[]>();
    for (const edge of edges) {
      const existing = prereqMap.get(edge.dependentId) || [];
      existing.push(edge.prerequisiteId);
      prereqMap.set(edge.dependentId, existing);
    }
    
    return allSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      subject: skill.subject,
      gradeLevel: skill.gradeLevel,
      strand: skill.strand,
      orderInStrand: skill.orderInStrand,
      prerequisites: prereqMap.get(skill.id) || [],
      masteryLevel: "NOT_STARTED",
    }));
  }
  
  async getChildMasteryLevels(childId: string): Promise<Map<string, string>> {
    const progress = await db.select().from(childSkillProgress)
      .where(eq(childSkillProgress.childId, childId));
    
    const masteryMap = new Map<string, string>();
    for (const p of progress) {
      masteryMap.set(p.skillId, p.masteryLevel);
    }
    return masteryMap;
  }
  
  isPrerequisiteMet(prereqSkillId: string, masteryLevels: Map<string, string>): boolean {
    const level = masteryLevels.get(prereqSkillId);
    // Prerequisite is met if skill is at PROFICIENT or higher (FLUENT, TRANSFER)
    return level === "PROFICIENT" || level === "FLUENT" || level === "TRANSFER";
  }
  
  areAllPrerequisitesMet(skill: SkillNode, masteryLevels: Map<string, string>): boolean {
    if (skill.prerequisites.length === 0) return true;
    return skill.prerequisites.every(prereq => this.isPrerequisiteMet(prereq, masteryLevels));
  }
  
  async getReadyToLearnSkills(
    childId: string, 
    subject: string, 
    grade: string
  ): Promise<SkillNode[]> {
    const allSkills = await this.getSkillsForSubjectAndGrade(subject, grade);
    const masteryLevels = await this.getChildMasteryLevels(childId);
    
    const readySkills: SkillNode[] = [];
    
    for (const skill of allSkills) {
      skill.masteryLevel = masteryLevels.get(skill.id) || "NOT_STARTED";
      
      // Skip skills already at FLUENT or TRANSFER (fully mastered)
      if (skill.masteryLevel === "FLUENT" || skill.masteryLevel === "TRANSFER") continue;
      
      if (this.areAllPrerequisitesMet(skill, masteryLevels)) {
        readySkills.push(skill);
      }
    }
    
    return readySkills.sort((a, b) => a.orderInStrand - b.orderInStrand);
  }
  
  async getNeedsReviewSkills(childId: string): Promise<SkillNode[]> {
    const progress = await db.select().from(childSkillProgress)
      .where(and(
        eq(childSkillProgress.childId, childId),
        eq(childSkillProgress.needsReinforcement, true)
      ));
    
    if (progress.length === 0) return [];
    
    const skillIds = progress.map(p => p.skillId);
    const skillRecords = await db.select().from(skills)
      .where(inArray(skills.id, skillIds));
    
    const masteryMap = new Map<string, string>();
    for (const p of progress) {
      masteryMap.set(p.skillId, p.masteryLevel);
    }
    
    return skillRecords.map(s => ({
      id: s.id,
      name: s.name,
      subject: s.subject,
      gradeLevel: s.gradeLevel,
      strand: s.strand,
      orderInStrand: s.orderInStrand,
      prerequisites: [],
      masteryLevel: masteryMap.get(s.id) || "DEVELOPING",
    }));
  }
  
  async getNextSkillRecommendations(
    childId: string,
    grade: string,
    subject?: string,
    limit: number = 5
  ): Promise<NextSkillRecommendation[]> {
    const recommendations: NextSkillRecommendation[] = [];
    
    const subjects = subject ? [subject] : ["MATH", "READING", "CHARACTER"];
    
    for (const subj of subjects) {
      const readySkills = await this.getReadyToLearnSkills(childId, subj, grade);
      
      const strands = await db.select().from(curriculumStrands)
        .where(and(
          eq(curriculumStrands.subject, subj),
          eq(curriculumStrands.grade, grade)
        ))
        .orderBy(asc(curriculumStrands.orderInSubject));
      
      const strandNames = new Map<string, string>();
      for (const strand of strands) {
        strandNames.set(strand.name.toLowerCase().replace(/\s+/g, '_'), strand.name);
      }
      
      for (const skill of readySkills.slice(0, 2)) {
        const strandName = strandNames.get(skill.strand) || skill.strand;
        
        let reason = "Next skill in sequence";
        let priority = 3;
        
        if (skill.masteryLevel === "NOT_STARTED") {
          reason = `New skill: ${skill.name}`;
          priority = 2;
        } else if (skill.masteryLevel === "DEVELOPING") {
          reason = `Continue building: ${skill.name}`;
          priority = 1;
        } else if (skill.masteryLevel === "PROFICIENT") {
          reason = `Almost fluent: ${skill.name}`;
          priority = 1;
        }
        
        recommendations.push({
          skill,
          reason,
          strandName,
          isReview: false,
          priority,
        });
      }
    }
    
    const needsReview = await this.getNeedsReviewSkills(childId);
    for (const skill of needsReview.slice(0, 2)) {
      recommendations.push({
        skill,
        reason: `Review needed: ${skill.name}`,
        strandName: skill.strand,
        isReview: true,
        priority: 0,
      });
    }
    
    return recommendations
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit);
  }
  
  async selectNextSkillForLesson(
    childId: string,
    grade: string,
    subject: string
  ): Promise<SkillNode | null> {
    const needsReview = await this.getNeedsReviewSkills(childId);
    const subjectReview = needsReview.filter(s => s.subject === subject);
    if (subjectReview.length > 0) {
      return subjectReview[0];
    }
    
    const readySkills = await this.getReadyToLearnSkills(childId, subject, grade);
    
    const inProgress = readySkills.filter(s => 
      s.masteryLevel === "DEVELOPING" || s.masteryLevel === "PROFICIENT"
    );
    if (inProgress.length > 0) {
      return inProgress[0];
    }
    
    const notStarted = readySkills.filter(s => s.masteryLevel === "NOT_STARTED");
    if (notStarted.length > 0) {
      return notStarted[0];
    }
    
    return null;
  }
  
  async getProgressionContext(childId: string, grade: string): Promise<ProgressionContext> {
    const subjects = ["MATH", "READING", "CHARACTER"];
    const currentStrands: ProgressionContext["currentStrands"] = [];
    const allReadySkills: SkillNode[] = [];
    
    for (const subject of subjects) {
      const readySkills = await this.getReadyToLearnSkills(childId, subject, grade);
      allReadySkills.push(...readySkills);
      
      if (readySkills.length > 0) {
        const currentSkill = readySkills.find(s => 
          s.masteryLevel === "DEVELOPING" || s.masteryLevel === "PROFICIENT"
        ) || readySkills[0];
        
        const totalSkills = await db.select({ count: sql<number>`count(*)` })
          .from(skills)
          .where(and(
            eq(skills.subject, subject),
            eq(skills.gradeLevel, grade)
          ));
        
        // Count skills at FLUENT or TRANSFER as mastered for progress calculation
        const masteredCount = await db.select({ count: sql<number>`count(*)` })
          .from(childSkillProgress)
          .where(and(
            eq(childSkillProgress.childId, childId),
            sql`${childSkillProgress.masteryLevel} IN ('FLUENT', 'TRANSFER')`
          ));
        
        const total = Number(totalSkills[0]?.count || 0);
        const mastered = Number(masteredCount[0]?.count || 0);
        
        currentStrands.push({
          strandId: currentSkill.strand,
          strandName: currentSkill.strand,
          subject,
          progressPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
          currentSkillId: currentSkill.id,
        });
      }
    }
    
    const needsReviewSkills = await this.getNeedsReviewSkills(childId);
    
    const goals = await db.select().from(yearEndGoals)
      .where(eq(yearEndGoals.grade, grade));
    
    const yearGoalProgress: ProgressionContext["yearGoalProgress"] = [];
    for (const goal of goals) {
      const requiredSkillIds = goal.requiredSkillIds || [];
      const masteredSkills = await db.select({ count: sql<number>`count(*)` })
        .from(childSkillProgress)
        .where(and(
          eq(childSkillProgress.childId, childId),
          eq(childSkillProgress.masteryLevel, "MASTERED"),
          inArray(childSkillProgress.skillId, requiredSkillIds.length > 0 ? requiredSkillIds : ["__none__"])
        ));
      
      const mastered = Number(masteredSkills[0]?.count || 0);
      const total = requiredSkillIds.length;
      
      yearGoalProgress.push({
        goalTitle: goal.title,
        subject: goal.subject,
        progressPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
        skillsRemaining: total - mastered,
      });
    }
    
    return {
      childId,
      grade,
      currentStrands,
      readySkills: allReadySkills,
      needsReviewSkills,
      yearGoalProgress,
    };
  }
  
  async recordLearningSignal(
    childId: string,
    signalType: string,
    data: {
      lessonInstanceId?: string;
      skillId?: string;
      questionId?: string;
      attemptNumber?: number;
      isCorrect?: boolean;
      timeSpentSeconds?: number;
      hintLevel?: number;
      voiceConfidenceScore?: number;
      activityId?: string;
      wasSkipped?: boolean;
      expressedFrustration?: boolean;
      expressedConfidence?: boolean;
    }
  ): Promise<void> {
    await db.insert(learningSignals).values({
      childId,
      lessonInstanceId: data.lessonInstanceId,
      skillId: data.skillId,
      signalType,
      data: {
        questionId: data.questionId,
        attemptNumber: data.attemptNumber,
        isCorrect: data.isCorrect,
        timeSpentSeconds: data.timeSpentSeconds,
        hintLevel: data.hintLevel,
        voiceConfidenceScore: data.voiceConfidenceScore,
        activityId: data.activityId,
        wasSkipped: data.wasSkipped,
        expressedFrustration: data.expressedFrustration,
        expressedConfidence: data.expressedConfidence,
      },
    });
  }
  
  async updateChildMastery(
    childId: string,
    skillId: string,
    outcome: {
      isCorrect: boolean;
      confidence?: number;
      hintsUsed?: number;
      voiceScore?: number;
    }
  ): Promise<void> {
    const existing = await db.select().from(childSkillProgress)
      .where(and(
        eq(childSkillProgress.childId, childId),
        eq(childSkillProgress.skillId, skillId)
      ))
      .limit(1);
    
    const current = existing[0];
    const now = new Date().toISOString().split('T')[0];
    
    let newMasteryLevel = current?.masteryLevel || "DEVELOPING";
    let evidenceCount = (current?.evidenceCount || 0) + 1;
    let successCount = current?.successCount || 0;
    let attemptCount = (current?.attemptCount || 0) + 1;
    
    if (outcome.isCorrect) {
      successCount++;
    }
    
    const successRate = attemptCount > 0 ? successCount / attemptCount : 0;
    
    // 5-state mastery progression:
    // NOT_STARTED → DEVELOPING → PROFICIENT → FLUENT → TRANSFER
    // TRANSFER requires explicit evidence of applying skill in new contexts
    if (current?.masteryLevel === "FLUENT" && successRate >= 0.95 && attemptCount >= 5) {
      // TRANSFER is earned by demonstrating application in varied contexts
      newMasteryLevel = "TRANSFER";
    } else if (successRate >= 0.9 && attemptCount >= 4) {
      newMasteryLevel = "FLUENT";
    } else if (successRate >= 0.75 && attemptCount >= 3) {
      newMasteryLevel = "PROFICIENT";
    } else if (attemptCount >= 1) {
      newMasteryLevel = "DEVELOPING";
    }
    
    const needsReinforcement = !outcome.isCorrect || 
      (outcome.hintsUsed !== undefined && outcome.hintsUsed >= 2) ||
      (outcome.voiceScore !== undefined && outcome.voiceScore < 60);
    
    if (current) {
      await db.update(childSkillProgress)
        .set({
          masteryLevel: newMasteryLevel,
          evidenceCount,
          successCount,
          attemptCount,
          lastPracticeDate: now,
          lastScore: outcome.isCorrect ? 100 : undefined,
          needsReinforcement: needsReinforcement ? true : false,
          updatedAt: new Date(),
        })
        .where(eq(childSkillProgress.id, current.id));
    } else {
      await db.insert(childSkillProgress).values({
        childId,
        skillId,
        masteryLevel: newMasteryLevel,
        evidenceCount,
        successCount,
        attemptCount,
        lastPracticeDate: now,
        lastScore: outcome.isCorrect ? 100 : undefined,
        needsReinforcement: needsReinforcement ? true : false,
      });
    }
  }
  
  async getLearningProfileForAI(childId: string): Promise<{
    strengths: string[];
    struggles: string[];
    preferredModes: string[];
    averageSessionMinutes: number;
    hintUsagePattern: string;
    voiceConfidenceAverage: number;
    recentSuccessRate: number;
  }> {
    const profile = await db.select().from(childLearningProfile)
      .where(eq(childLearningProfile.childId, childId))
      .limit(1);
    
    const recentSignals = await db.select().from(learningSignals)
      .where(eq(learningSignals.childId, childId))
      .orderBy(desc(learningSignals.createdAt))
      .limit(50);
    
    const strengths: string[] = [];
    const struggles: string[] = [];
    let totalVoiceScore = 0;
    let voiceCount = 0;
    let correctCount = 0;
    let attemptCount = 0;
    
    for (const signal of recentSignals) {
      const data = signal.data as any;
      if (data.voiceConfidenceScore) {
        totalVoiceScore += data.voiceConfidenceScore;
        voiceCount++;
      }
      if (data.isCorrect !== undefined) {
        attemptCount++;
        if (data.isCorrect) correctCount++;
      }
    }
    
    const lp = profile[0];
    const subjectStrengths = lp?.subjectStrengths || {};
    
    for (const [subject, stats] of Object.entries(subjectStrengths)) {
      const s = stats as { averageScore: number; struggleRate: number };
      if (s.averageScore >= 80) {
        strengths.push(subject);
      }
      if (s.struggleRate >= 40) {
        struggles.push(subject);
      }
    }
    
    let hintPattern = "moderate";
    if (lp?.hintUsageRate !== undefined && lp?.hintUsageRate !== null) {
      if (lp.hintUsageRate < 20) hintPattern = "independent";
      else if (lp.hintUsageRate > 50) hintPattern = "needs_support";
    }
    
    return {
      strengths,
      struggles,
      preferredModes: (lp?.preferredInteractionTypes as string[]) || [],
      averageSessionMinutes: lp?.averageSessionMinutes || 10,
      hintUsagePattern: hintPattern,
      voiceConfidenceAverage: voiceCount > 0 ? Math.round(totalVoiceScore / voiceCount) : 75,
      recentSuccessRate: attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 70,
    };
  }
}

export const progressionEngine = new ProgressionEngine();
