import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, insertChildSchema, completeTaskSchema, updateChildSchema, updateTaskSchema, submitTaskOutcomeSchema, createParentLessonSchema, avatarTraitsSchema } from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";
import { ensureDevotionalForToday } from "./devotionalService";
import { seedSkills } from "./seedSkills";
import { seedLessonTemplates } from "./seedLessonTemplates";
import { seedCurriculumProgressions } from "./seedCurriculum";
import OpenAI from "openai";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { createHash } from "node:crypto";

// OpenAI client using Replit AI proxy for chat completions
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Direct OpenAI client for TTS (audio/speech endpoint not supported by Replit proxy)
const openaiDirect = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PgStore = connectPgSimple(session);

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    childId?: string;
    role?: string;
    impersonation?: {
      parentUserId: string;
      childId: string;
      startedAt: string;
    };
  }
}

// Zod schema for lesson step validation
const lessonStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  parentInstructions: z.string().min(10, "Parent instructions must be at least 10 characters"),
  childTask: z.string().min(10, "Child task must be at least 10 characters"),
});

// Zod schema for assessment validation
const assessmentSchema = z.object({
  type: z.enum(["skill_check", "mini_quiz", "reflection"]),
  instructions: z.string().min(10, "Assessment instructions must be at least 10 characters"),
});

// Zod schema for faith integration validation
const faithIntegrationSchema = z.object({
  scripture: z.string(),
  tieIn: z.string(),
  optionalPrayer: z.string(),
});

// Zod schema for structured lesson validation
const structuredLessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  gradeLevel: z.string(),
  subject: z.enum(["READING", "MATH", "SCIENCE", "CHARACTER"]),
  learningObjective: z.string().min(10, "Learning objective must be at least 10 characters"),
  overview: z.string().min(20, "Overview must be at least 20 characters"),
  materialsNeeded: z.array(z.string()).min(1, "At least one material is required"),
  lessonSteps: z.array(lessonStepSchema).min(3, "At least 3 lesson steps are required"),
  assessment: assessmentSchema,
  extensionOptions: z.array(z.string()).min(1, "At least one extension option is required"),
  faithIntegrationOptional: faithIntegrationSchema.optional(),
  customizationPoints: z.array(z.string()).min(1, "At least one customization point is required"),
});

// Zod schema for validating AI plan generation response (updated for structured lessons)
const aiPlanResponseSchema = z.object({
  days: z.array(z.object({
    date: z.string(),
    lessons: z.array(structuredLessonSchema),
  })),
});

// Middleware to check if user is authenticated
function requireAuth(req: any, res: any, next: any) {
  console.log('[AUTH] Checking session:', { 
    hasUserId: !!req.session.userId,
    hasChildId: !!req.session.childId,
    role: req.session.role,
    path: req.path,
    sessionID: req.sessionID
  });
  
  if (!req.session.userId && !req.session.childId) {
    console.log('[AUTH] Unauthorized - no valid session');
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  console.log('[AUTH] Authorized session');
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy - required for cookies to work behind Replit's proxy
  app.set('trust proxy', 1);
  
  // Configure express-session with PostgreSQL store
  // Replit always serves over HTTPS, so we need secure cookies even in development
  const isReplit = !!process.env.REPL_ID || !!process.env.REPLIT_DEV_DOMAIN;
  const isProduction = process.env.NODE_ENV === 'production';
  const useSecureCookies = isReplit || isProduction;
  
  console.log('[SESSION] Cookie config:', { isReplit, isProduction, useSecureCookies });
  
  app.use(session({
    store: new PgStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'homeschool-curriculum-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }));
  
  // Seed K-5 curriculum skills and lesson templates on startup
  seedSkills().catch(err => console.error("Failed to seed skills:", err));
  seedLessonTemplates().catch(err => console.error("Failed to seed lesson templates:", err));
  seedCurriculumProgressions().catch(err => console.error("Failed to seed curriculum progressions:", err));
  
  // Seed progression system data
  storage.seedLevelThresholds().catch(err => console.error("Failed to seed level thresholds:", err));
  storage.seedBadgeDefinitions().catch(err => console.error("Failed to seed badge definitions:", err));
  storage.seedInventoryItems().catch(err => console.error("Failed to seed inventory items:", err));
  
  // Parent authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser(data.email, passwordHash);
      
      // Store in session
      req.session.userId = user.id;
      req.session.role = user.role;
      
      // Explicitly save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error('[AUTH] Session save error:', err);
          return res.status(500).json({ error: "Session error" });
        }
        res.json({ 
          user: { id: user.id, email: user.email, role: user.role }
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store in session
      req.session.userId = user.id;
      req.session.role = user.role;
      
      // Explicitly save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error('[AUTH] Session save error:', err);
          return res.status(500).json({ error: "Session error" });
        }
        res.json({ 
          user: { id: user.id, email: user.email, role: user.role }
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('[AUTH] Error destroying session:', err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    // Check if parent is impersonating a child
    if (req.session.impersonation) {
      const child = await storage.getChildById(req.session.impersonation.childId);
      if (!child) {
        // Clear invalid impersonation
        delete req.session.impersonation;
        delete req.session.childId;
        return res.status(404).json({ error: "Child not found" });
      }
      return res.json({ 
        id: child.id, 
        name: child.name, 
        grade: child.grade,
        parentId: child.parentId,
        role: "CHILD",
        impersonatedByParentId: req.session.impersonation.parentUserId
      });
    }

    if (req.session.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({ id: user.id, email: user.email, role: user.role });
    }
    
    if (req.session.childId) {
      const child = await storage.getChildById(req.session.childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      return res.json({ 
        id: child.id, 
        name: child.name, 
        grade: child.grade,
        parentId: child.parentId,
        role: "CHILD"
      });
    }
    
    return res.status(404).json({ error: "Session invalid" });
  });

  // Child authentication
  app.post("/api/auth/child/login", async (req, res) => {
    try {
      const { username, pin } = req.body;
      
      const child = await storage.getChildByUsername(username);
      if (!child) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(pin, child.pinHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store in session
      req.session.childId = child.id;
      req.session.role = "CHILD";
      
      // Explicitly save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error('[AUTH] Session save error:', err);
          return res.status(500).json({ error: "Session error" });
        }
        res.json({ 
          child: { 
            id: child.id, 
            name: child.name, 
            grade: child.grade,
            parentId: child.parentId 
          }
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Parent impersonation - allows parent to view child portal without logging out
  app.post("/api/parent/impersonate/:childId", requireAuth, async (req: any, res) => {
    try {
      // Ensure requester is a parent (has userId)
      if (!req.session.userId) {
        return res.status(403).json({ error: "Only parents can impersonate children" });
      }

      const childId = req.params.childId;
      
      // Verify the child belongs to this parent
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      
      if (child.parentId !== req.session.userId) {
        return res.status(403).json({ error: "You can only view your own children's accounts" });
      }

      // Set impersonation state (keep parent's userId and role intact)
      req.session.impersonation = {
        parentUserId: req.session.userId,
        childId: childId,
        startedAt: new Date().toISOString()
      };
      // Note: Keep userId and role="PARENT" so parent APIs still work

      res.json({ 
        child: { 
          id: child.id, 
          name: child.name, 
          grade: child.grade,
          parentId: child.parentId 
        },
        impersonating: true
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop impersonation - return to parent view
  app.post("/api/parent/impersonation/stop", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.impersonation) {
        return res.status(400).json({ error: "Not currently impersonating" });
      }

      const parentUserId = req.session.impersonation.parentUserId;
      
      // Clear impersonation state (userId and role are already set to parent)
      delete req.session.impersonation;

      const user = await storage.getUserById(parentUserId);
      if (!user) {
        return res.status(404).json({ error: "Parent user not found" });
      }

      res.json({ 
        user: { id: user.id, email: user.email, role: user.role },
        success: true
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Child CRUD operations
  app.get("/api/children", requireAuth, async (req: any, res) => {
    try {
      const children = await storage.getChildrenByParentId(req.session.userId);
      res.json(children.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        username: c.username,
        avatarUrl: c.avatarUrl,
        avatarTraits: c.avatarTraits,
        // Nested settings object for EditChildDialog
        settings: c.settings ? {
          faithMode: c.settings.faithMode,
          learningStyle: c.settings.learningStyle,
          dyslexiaSupport: c.settings.dyslexiaSupport,
        } : undefined,
        // Nested rewardState object for ParentDashboard
        rewardState: c.rewards ? {
          points: c.rewards.points || 0,
          badges: c.rewards.badges || [],
        } : undefined,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to normalize grade values to standard format
  const normalizeGrade = (grade: string): string => {
    const g = grade.toLowerCase().trim();
    if (g === 'k' || g === 'kindergarten' || g === '0') return 'K';
    if (g === '1' || g === '1st' || g === 'first' || g === 'grade 1') return '1';
    if (g === '2' || g === '2nd' || g === 'second' || g === 'grade 2') return '2';
    return g.toUpperCase();
  };

  app.post("/api/children", requireAuth, async (req: any, res) => {
    try {
      const data = insertChildSchema.parse(req.body);
      
      // Check if username exists
      const existing = await storage.getChildByUsername(data.username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash PIN
      const pinHash = await bcrypt.hash(data.pin, 10);
      
      // Normalize grade to standard format (K, 1, 2)
      const normalizedGrade = normalizeGrade(data.grade);
      
      // Create child
      const child = await storage.createChild({
        parentId: req.session.userId,
        name: data.name,
        grade: normalizedGrade,
        username: data.username,
        pinHash,
        faithMode: data.faithMode,
        learningStyle: data.learningStyle,
      });

      res.json(child);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get progress summary for all children of the logged-in parent
  // This must be defined BEFORE /api/children/:id to avoid route conflict
  app.get("/api/children/progress-summary", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access required" });
      }
      
      const summaries = await storage.getProgressSummaryForParent(req.session.userId);
      res.json(summaries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/children/:id", requireAuth, async (req: any, res) => {
    try {
      const child = await storage.getChildById(req.params.id);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      res.json(child);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get child settings (for dyslexia mode and other display preferences)
  // Allows both parent access (any of their children) and child access (their own settings)
  app.get("/api/children/:id/settings", async (req: any, res) => {
    try {
      const childId = req.params.id;
      
      // Check if user is authenticated as parent or child
      const isParent = !!req.session.userId;
      const isChild = !!req.session.childId;
      
      if (!isParent && !isChild) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      
      // Verify access: parent must own child, or child must be accessing own settings
      if (isParent && child.parentId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (isChild && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Return settings or default values
      res.json(child.settings || {
        faithMode: "FAITH_FORWARD",
        learningStyle: "HANDS_ON_MONTESSORI",
        subjectsEnabled: ["READING", "MATH", "SCIENCE", "CHARACTER"],
        dyslexiaSupport: false,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update child profile
  app.patch("/api/children/:id", requireAuth, async (req: any, res) => {
    try {
      const child = await storage.getChildById(req.params.id);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(404).json({ error: "Child not found" });
      }

      const validation = updateChildSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
      }

      const data = validation.data;

      // Check if username is being changed and if it's unique
      if (data.username && data.username !== child.username) {
        const existing = await storage.getChildByUsername(data.username);
        if (existing) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      // Prepare child update data
      const childUpdate: any = {};
      if (data.name) childUpdate.name = data.name;
      if (data.grade) childUpdate.grade = normalizeGrade(data.grade);
      if (data.username) childUpdate.username = data.username;
      if (data.pin) childUpdate.pinHash = await bcrypt.hash(data.pin, 10);
      if (data.avatarUrl !== undefined) childUpdate.avatarUrl = data.avatarUrl;

      // Update child if there are changes
      if (Object.keys(childUpdate).length > 0) {
        await storage.updateChild(req.params.id, childUpdate);
      }

      // Update settings if provided
      const hasSettingsUpdate = data.faithMode || data.learningStyle || 
        data.dyslexiaSupport !== undefined || data.devotionalCadence ||
        data.readingStage || data.mathStage || data.preferredModes || 
        data.sessionLengthMinutes;
      
      if (hasSettingsUpdate) {
        const settingsUpdate: any = {};
        if (data.faithMode) settingsUpdate.faithMode = data.faithMode;
        if (data.learningStyle) settingsUpdate.learningStyle = data.learningStyle;
        if (data.dyslexiaSupport !== undefined) settingsUpdate.dyslexiaSupport = data.dyslexiaSupport;
        if (data.devotionalCadence) settingsUpdate.devotionalCadence = data.devotionalCadence;
        if (data.readingStage) settingsUpdate.readingStage = data.readingStage;
        if (data.mathStage) settingsUpdate.mathStage = data.mathStage;
        if (data.preferredModes) settingsUpdate.preferredModes = data.preferredModes;
        if (data.sessionLengthMinutes) settingsUpdate.sessionLengthMinutes = data.sessionLengthMinutes;
        await storage.updateChildSettings(req.params.id, settingsUpdate);
      }

      // Return updated child
      const updatedChild = await storage.getChildById(req.params.id);
      res.json(updatedChild);
    } catch (error: any) {
      console.error("Error updating child:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get upload URL for child avatar
  app.post("/api/children/:id/avatar/upload-url", requireAuth, async (req: any, res) => {
    try {
      const child = await storage.getChildById(req.params.id);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(404).json({ error: "Child not found" });
      }

      const objectStorage = new ObjectStorageService();
      const uploadUrl = await objectStorage.getObjectEntityUploadURL("avatars");
      
      // Also return the normalized path that should be saved to database
      const avatarPath = objectStorage.normalizeObjectEntityPath(uploadUrl);
      
      res.json({ uploadUrl, avatarPath });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(req.path);
      objectStorage.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      res.status(404).json({ error: "File not found" });
    }
  });

  // Generate plan with structured lessons
  app.post("/api/plans/generate", requireAuth, async (req: any, res) => {
    try {
      const { childId, planType } = req.body;
      
      const child = await storage.getChildById(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(404).json({ error: "Child not found" });
      }

      const settings = child.settings;
      if (!settings) {
        return res.status(400).json({ error: "Child settings not found" });
      }

      // Get mastery snapshot for adaptive learning
      let masterySnapshot;
      try {
        masterySnapshot = await storage.getMasterySnapshot(childId);
      } catch (e) {
        console.log("[AI] No mastery data available yet, generating without adaptive context");
        masterySnapshot = null;
      }
      
      // Get recent tasks with parent notes for context
      const tasksWithNotes = await storage.getRecentTasksWithNotes(childId, 5);

      // Build AI prompt for structured lessons
      const faithModeDescriptions = {
        FULL_DISCIPLESHIP: "REQUIRED: Include explicit Scripture references and Jesus-centered connections in every lesson's faithIntegrationOptional block. Make faith the central theme.",
        FAITH_FORWARD: "Include Scripture and Christian value tie-ins in most lessons. Balance faith integration with educational content. Include faithIntegrationOptional for about 75% of lessons.",
        VALUES_ONLY: "Focus primarily on Christian values like kindness, honesty, diligence, stewardship, and gratitude. Only include faithIntegrationOptional sparingly (about 25% of lessons).",
      };

      const learningStyleDescriptions = {
        HANDS_ON_MONTESSORI: "Heavily emphasize physical, hands-on activities using everyday objects in lessonSteps. Prefer step-by-step tactile tasks with child choice and exploration. Materials should be common household items.",
        BALANCED: "Mix hands-on activities with simple reading and varied approaches. Include a balance of physical and cognitive activities in lessonSteps.",
        DIGITAL_LIGHT: "Focus almost entirely on hands-on activities and reading in lessonSteps. Minimize device interaction. Emphasize real-world exploration.",
      };

      // Dyslexia support context
      let dyslexiaSupportContext = "";
      if (settings.dyslexiaSupport) {
        dyslexiaSupportContext = `
**DYSLEXIA SUPPORT MODE - IMPORTANT ADAPTATIONS:**
This child has dyslexia support enabled. You MUST adapt ALL lessons with these research-based strategies:

1. **MULTISENSORY LEARNING (REQUIRED):**
   - Every lesson must engage multiple senses (see, hear, touch, move)
   - Use tactile materials: sandpaper letters, playdough, finger tracing
   - Include movement: air writing, body letters, walking patterns
   - Add rhythm and music when possible

2. **READING APPROACH:**
   - Emphasize PHONICS and sound-symbol relationships
   - Break words into syllables explicitly
   - Use decodable text with controlled vocabulary
   - Include visual phonics cues and hand signals
   - Read aloud together before independent reading

3. **TEXT PRESENTATION:**
   - Keep written instructions VERY SHORT (5-7 words maximum)
   - Use simple, high-frequency words
   - One instruction per step
   - Avoid dense paragraphs - use bullet points
   - Include picture cues alongside text

4. **PACING & SUPPORT:**
   - Allow EXTRA TIME for reading tasks (double the typical time)
   - Provide frequent breaks during reading activities
   - Repeat key concepts in different ways
   - Celebrate effort, not just accuracy
   - Use scaffolded support: I do, we do, you do

5. **STRENGTHS-BASED:**
   - Leverage visual-spatial strengths
   - Include storytelling and oral expression
   - Use hands-on problem solving
   - Incorporate art and creativity
   - Build on kinesthetic learning

6. **ASSESSMENT MODIFICATIONS:**
   - Prefer oral responses over written
   - Use observation and demonstration
   - Allow extended time
   - Focus on understanding, not spelling
   - Accept alternative ways to show learning
`;
      }

      const gradeLevel = child.grade === 'K' ? 'Kindergarten' : `Grade ${child.grade}`;
      const today = new Date().toISOString().split('T')[0];
      const isWeekly = planType === "WEEKLY";
      
      // Build adaptive learning context from mastery snapshot
      let adaptiveLearningContext = "";
      if (masterySnapshot) {
        // Skills needing reinforcement
        if (masterySnapshot.strugglingAreas.length > 0) {
          adaptiveLearningContext += `\n**ADAPTIVE GUIDANCE - STRUGGLING AREAS (PRIORITY):**
The child is struggling with these skills and needs EXTRA SUPPORT:
${masterySnapshot.strugglingAreas.map(s => `- ${s}`).join('\n')}

For these areas:
- Break concepts into SMALLER, simpler steps
- Use more HANDS-ON and CONCRETE examples
- Provide more scaffolding and encouragement
- Use LIGHTER assessment (observation instead of quiz)
- Include extra practice of prerequisite skills\n`;
        }
        
        // Skills ready to advance
        if (masterySnapshot.readyToAdvance.length > 0) {
          adaptiveLearningContext += `\n**ADAPTIVE GUIDANCE - READY TO ADVANCE:**
The child is ready to learn NEW skills:
${masterySnapshot.readyToAdvance.map(s => `- ${s}`).join('\n')}

For these areas:
- Introduce these concepts today
- Build upon previously mastered skills
- Include slightly more challenging activities\n`;
        }
        
        // Recent lesson outcomes
        if (masterySnapshot.recentOutcomes.length > 0) {
          const recentSuccess = masterySnapshot.recentOutcomes.filter(o => o.wasSuccessful);
          const recentStruggle = masterySnapshot.recentOutcomes.filter(o => !o.wasSuccessful);
          
          if (recentStruggle.length > 0) {
            adaptiveLearningContext += `\n**RECENT STRUGGLES:**
${recentStruggle.map(o => `- ${o.taskTitle} (${o.subject}): ${o.parentFeedback || 'Low score'}`).join('\n')}
Consider reviewing these topics with a DIFFERENT APPROACH.\n`;
          }
          
          if (recentSuccess.length > 0) {
            adaptiveLearningContext += `\n**RECENT SUCCESSES:**
${recentSuccess.map(o => `- ${o.taskTitle} (${o.subject})`).join('\n')}
Build upon these achievements!\n`;
          }
        }
        
        // Subject mastery summary
        adaptiveLearningContext += `\n**CURRENT MASTERY BY SUBJECT:**
${masterySnapshot.subjectMastery.map(s => 
  `- ${s.subject}: ${s.mastered} mastered, ${s.developing} developing, ${s.emerging} emerging${
    s.skillsNeedingReinforcement.length > 0 ? ` (reinforce: ${s.skillsNeedingReinforcement.join(', ')})` : ''
  }`
).join('\n')}\n`;
      }
      
      // Add parent notes context if available
      if (tasksWithNotes.length > 0) {
        adaptiveLearningContext += `\n**PARENT OBSERVATIONS FROM RECENT LESSONS:**
Use these notes from the parent to personalize future lessons:
${tasksWithNotes.map(t => 
  `- ${t.subject} (${t.title}): "${t.parentNotes}"`
).join('\n')}

Consider these observations when planning lessons - they help you understand what works well for this child and what needs adjustment.\n`;
      }
      
      const systemPrompt = `You are an expert Christian homeschool curriculum generator for K-2 children (ages 5-8). You generate STRUCTURED, ACADEMIC lessons with clear learning objectives and step-by-step guidance for both parents and children.

**CORE VALUES:**
- Non-denominational, Gospel-centered Christian worldview
- Age-appropriate, encouraging, gentle tone
- Academic rigor appropriate for ${gradeLevel}
- PROGRESSIVE LEARNING: Lessons should build on prior knowledge and skills

**CHILD PROFILE:**
- Name: ${child.name}
- Grade Level: ${gradeLevel}
- Faith Integration Mode: ${settings.faithMode} - ${faithModeDescriptions[settings.faithMode as keyof typeof faithModeDescriptions]}
- Learning Style: ${settings.learningStyle} - ${learningStyleDescriptions[settings.learningStyle as keyof typeof learningStyleDescriptions]}
${dyslexiaSupportContext}${adaptiveLearningContext}

**LESSON STRUCTURE REQUIREMENTS (MANDATORY):**
Each lesson MUST follow this exact structure:
1. Clear learning objective (what skill/knowledge the child will gain)
2. Overview explaining the lesson's purpose and value (2-3 sentences)
3. Materials list (common household items only)
4. AT LEAST 3 detailed lesson steps with:
   - Numbered steps (1, 2, 3, etc.)
   - Parent instructions (what the parent should do/say)
   - Child task (what the child does at this step)
5. Assessment with type and instructions
6. Extension options for enrichment
7. Customization points for parents to adapt
8. Faith integration block (when appropriate for the faith mode)

**SUBJECTS:** READING, MATH, SCIENCE, CHARACTER

**QUALITY STANDARDS:**
- Each lesson should take 15-25 minutes
- Use simple language for child tasks (short sentences, 10 words or less)
- Parent instructions can be more detailed
- Materials must be common household items (paper, crayons, beans, blocks, leaves, etc.)
- Activities should be engaging and hands-on, not worksheets`;

      const jsonFormat = `Return ONLY valid JSON in this EXACT format:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "lessons": [
        {
          "title": "Engaging Lesson Title",
          "gradeLevel": "${gradeLevel}",
          "subject": "READING" | "MATH" | "SCIENCE" | "CHARACTER",
          "learningObjective": "By the end of this lesson, the child will be able to...",
          "overview": "2-3 sentences explaining what the child will learn and why it matters.",
          "materialsNeeded": ["Item 1", "Item 2", "Item 3"],
          "lessonSteps": [
            {
              "stepNumber": 1,
              "parentInstructions": "Detailed guidance for the parent on what to do and say",
              "childTask": "Simple, clear task for the child (short sentence)"
            },
            {
              "stepNumber": 2,
              "parentInstructions": "Next step guidance for parent",
              "childTask": "What the child does next"
            },
            {
              "stepNumber": 3,
              "parentInstructions": "Final step guidance",
              "childTask": "Concluding activity for child"
            }
          ],
          "assessment": {
            "type": "skill_check" | "mini_quiz" | "reflection",
            "instructions": "How to assess understanding (question to ask, skill to observe, etc.)"
          },
          "extensionOptions": [
            "Optional enrichment activity",
            "Hands-on variation or challenge"
          ],
          "faithIntegrationOptional": {
            "scripture": "Bible verse reference (e.g., Proverbs 3:5)",
            "tieIn": "How this connects to the lesson theme",
            "optionalPrayer": "Simple prayer the family can say together"
          },
          "customizationPoints": [
            "Ways parents can adapt this lesson",
            "Alternative approaches or materials"
          ]
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
- lessonSteps MUST have AT LEAST 3 steps (more is better for complex lessons)
- materialsNeeded MUST have at least 1 item
- extensionOptions MUST have at least 1 option
- customizationPoints MUST have at least 1 point
- faithIntegrationOptional is optional based on faith mode, but include when appropriate`;
      
      const userPrompt = isWeekly 
        ? `Create a comprehensive 5-day weekly plan (Monday through Friday) starting from ${today}. Include 4 lessons per day (one each for READING, MATH, SCIENCE, and CHARACTER subjects). Each lesson MUST follow the structured format with at least 3 steps. ${jsonFormat}`
        : `Create a comprehensive daily plan for ${today}. Include 4 lessons (one each for READING, MATH, SCIENCE, and CHARACTER subjects). Each lesson MUST follow the structured format with at least 3 steps. ${jsonFormat}`;

      // Retry logic for AI generation
      const MAX_RETRIES = 2;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        try {
          console.log(`[AI] Plan generation attempt ${attempt}/${MAX_RETRIES + 1}`);
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          });

          let rawResponse;
          try {
            rawResponse = JSON.parse(completion.choices[0].message.content || "{}");
          } catch (parseError) {
            console.error(`[AI] Attempt ${attempt}: Failed to parse JSON response`);
            lastError = new Error("Failed to parse AI response as JSON");
            continue;
          }
          
          console.log("[AI] Raw response structure:", JSON.stringify(Object.keys(rawResponse)));
          
          // Handle different possible response structures from AI
          let normalizedResponse = rawResponse;
          
          // If AI returns { plan: { days: [...] } }
          if (rawResponse.plan && rawResponse.plan.days) {
            normalizedResponse = rawResponse.plan;
          }
          
          // If AI returns { curriculum: { days: [...] } }
          if (rawResponse.curriculum && rawResponse.curriculum.days) {
            normalizedResponse = rawResponse.curriculum;
          }
          
          // If AI returns lessons directly without days wrapper for single day
          if (rawResponse.lessons && !rawResponse.days) {
            normalizedResponse = {
              days: [{ date: today, lessons: rawResponse.lessons }]
            };
          }
          
          // If AI returns with date key directly
          if (!normalizedResponse.days) {
            const dateKeys = Object.keys(rawResponse).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
            if (dateKeys.length > 0) {
              normalizedResponse = {
                days: dateKeys.map(date => ({
                  date,
                  lessons: rawResponse[date].lessons || rawResponse[date]
                }))
              };
            }
          }
          
          console.log("[AI] Normalized response has days:", normalizedResponse.days?.length || 0);
          
          // Validate AI response structure using Zod schema
          const validationResult = aiPlanResponseSchema.safeParse(normalizedResponse);
          
          if (!validationResult.success) {
            console.error(`[AI] Attempt ${attempt}: Validation failed:`, validationResult.error.issues.slice(0, 5));
            lastError = validationResult.error;
            continue;
          }
          
          const result = validationResult.data;
          
          // Additional validation: ensure we have at least one day with lessons
          if (!result.days || result.days.length === 0) {
            lastError = new Error("No days in response");
            continue;
          }
          
          // Validate that each day has lessons
          const invalidDays = result.days.filter(day => !day.lessons || day.lessons.length === 0);
          if (invalidDays.length > 0) {
            lastError = new Error("Some days are missing lessons");
            continue;
          }
          
          // SUCCESS! Create plan and tasks
          console.log(`[AI] Attempt ${attempt}: Validation successful!`);
          
          const endDate = isWeekly 
            ? new Date(new Date(today).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : today;
          
          const plan = await storage.createPlan({
            childId,
            type: planType,
            startDate: today,
            endDate,
          });

          // Create tasks from structured lessons
          const tasksToCreate = [];
          for (const day of result.days) {
            for (const lesson of day.lessons) {
              // Build combined instructions from steps for backward compatibility
              const childInstructions = lesson.lessonSteps
                .map(step => `Step ${step.stepNumber}: ${step.childTask}`)
                .join('\n');
              const parentInstructions = lesson.lessonSteps
                .map(step => `Step ${step.stepNumber}: ${step.parentInstructions}`)
                .join('\n');
              
              // Determine activity type from lesson content
              const activityType = lesson.assessment.type === 'mini_quiz' ? 'QUIZ' 
                : lesson.assessment.type === 'reflection' ? 'REFLECTION'
                : 'HANDS_ON';
              
              tasksToCreate.push({
                planId: plan.id,
                childId,
                date: day.date,
                subject: lesson.subject,
                title: lesson.title,
                objective: lesson.learningObjective,
                overview: lesson.overview,
                materialsNeeded: lesson.materialsNeeded,
                lessonSteps: lesson.lessonSteps,
                assessment: lesson.assessment,
                extensionOptions: lesson.extensionOptions,
                faithIntegration: lesson.faithIntegrationOptional || undefined,
                customizationPoints: lesson.customizationPoints,
                activityType,
                instructionsForChild: childInstructions,
                instructionsForParent: parentInstructions,
                scriptureReference: lesson.faithIntegrationOptional?.scripture,
                scriptureText: lesson.faithIntegrationOptional?.tieIn,
                reflectionPrompt: lesson.faithIntegrationOptional?.optionalPrayer,
              });
            }
          }

          const createdTasks = await storage.createTasks(tasksToCreate);

          // Use normalized grade (already stored as K, 1, or 2 at child creation)
          const normalizedGrade = normalizeGrade(child.grade);

          // Link tasks to skills using strand-based matching
          const allSkills = await storage.getAllSkills();
          
          // Group skills by subject+grade for efficient lookup
          const gradeSkillsBySubject: Record<string, typeof allSkills> = {};
          const strandSkillsMap: Record<string, typeof allSkills> = {}; // subject:strand -> skills
          
          for (const skill of allSkills) {
            if (skill.gradeLevel === normalizedGrade) {
              if (!gradeSkillsBySubject[skill.subject]) {
                gradeSkillsBySubject[skill.subject] = [];
              }
              gradeSkillsBySubject[skill.subject].push(skill);
              
              const strandKey = `${skill.subject}:${skill.strand}`;
              if (!strandSkillsMap[strandKey]) {
                strandSkillsMap[strandKey] = [];
              }
              strandSkillsMap[strandKey].push(skill);
            }
          }

          // Define strand keywords for better matching
          const strandKeywordMap: Record<string, string[]> = {
            // Reading strands
            "phonics": ["letter", "sound", "phonics", "phoneme", "alphabet", "blend"],
            "fluency": ["read", "fluency", "fluent", "reading", "word", "sentence"],
            "comprehension": ["understand", "comprehend", "story", "meaning", "main idea", "sequence"],
            "vocabulary": ["word", "vocabulary", "define", "meaning"],
            // Math strands  
            "number_sense": ["count", "number", "numeral", "digit", "place value", "ones", "tens"],
            "operations": ["add", "subtract", "plus", "minus", "sum", "difference", "equal"],
            "measurement": ["measure", "length", "time", "clock", "inch", "compare", "size"],
            "geometry": ["shape", "square", "circle", "triangle", "side", "corner", "pattern"],
            // Science strands
            "inquiry": ["observe", "question", "experiment", "predict", "test", "investigate"],
            "life_science": ["plant", "animal", "living", "grow", "life", "habitat", "nature"],
            "earth_science": ["weather", "earth", "rock", "water", "season", "sky", "sun", "moon"],
            "physical_science": ["push", "pull", "force", "motion", "move", "magnet", "material"],
            // Character strands
            "kindness": ["kind", "help", "share", "friend", "care", "gentle", "love"],
            "honesty": ["truth", "honest", "trust", "fair", "right", "wrong"],
            "diligence": ["work", "try", "effort", "finish", "practice", "persevere"],
            "stewardship": ["care", "creation", "nature", "responsible", "give", "share"],
            "gratitude": ["thank", "grateful", "appreciate", "blessing", "praise"],
          };

          for (const task of createdTasks) {
            const subjectSkills = gradeSkillsBySubject[task.subject] || [];
            if (subjectSkills.length === 0) {
              console.log(`[AI] No skills found for subject ${task.subject} grade ${normalizedGrade}`);
              continue;
            }

            const objectiveLower = (task.objective || '').toLowerCase();
            const titleLower = task.title.toLowerCase();
            const combinedText = `${objectiveLower} ${titleLower}`;
            
            // Find matching strands based on keywords
            const matchedStrands: string[] = [];
            for (const [strand, keywords] of Object.entries(strandKeywordMap)) {
              if (keywords.some(keyword => combinedText.includes(keyword))) {
                matchedStrands.push(strand);
              }
            }
            
            // Get skills from matched strands
            let matchedSkills: typeof allSkills = [];
            for (const strand of matchedStrands) {
              const strandKey = `${task.subject}:${strand}`;
              const strandSkills = strandSkillsMap[strandKey] || [];
              matchedSkills.push(...strandSkills);
            }
            
            // Remove duplicates
            matchedSkills = [...new Map(matchedSkills.map(s => [s.id, s])).values()];
            
            // Fallback: if no strand matches, use first skill in subject (ordered by orderInStrand)
            if (matchedSkills.length === 0) {
              const sortedByOrder = [...subjectSkills].sort((a, b) => 
                (a.orderInStrand || 1) - (b.orderInStrand || 1)
              );
              matchedSkills = [sortedByOrder[0]];
              console.log(`[AI] Using fallback skill "${sortedByOrder[0].name}" for task "${task.title}"`);
            }

            // Link up to 2 skills (primary + review)
            const skillsToLink = matchedSkills.slice(0, 2);

            try {
              await storage.linkTaskToSkills(
                task.id,
                skillsToLink.map((skill, idx) => ({
                  skillId: skill.id,
                  isPrimaryFocus: idx === 0,
                  isReview: idx > 0,
                }))
              );
              console.log(`[AI] Linked task "${task.title}" to skills: ${skillsToLink.map(s => s.name).join(', ')}`);
            } catch (linkError) {
              console.error(`[AI] Failed to link skills for task "${task.title}":`, linkError);
            }
          }

          // Create quizzes for lessons with mini_quiz assessment
          for (let i = 0; i < createdTasks.length; i++) {
            const task = createdTasks[i];
            const originalLesson = result.days
              .flatMap(d => d.lessons)
              .find(l => l.title === task.title);
            
            if (originalLesson?.assessment.type === 'mini_quiz') {
              await storage.createQuiz({
                taskId: task.id,
                questions: [{
                  type: "SHORT_TEXT",
                  questionText: originalLesson.assessment.instructions,
                  correctAnswer: "See assessment instructions",
                }],
              });
            }
          }

          return res.json({ plan, tasks: createdTasks });
          
        } catch (attemptError: any) {
          console.error(`[AI] Attempt ${attempt} error:`, attemptError.message);
          lastError = attemptError;
        }
      }
      
      // All retries failed
      console.error("[AI] All generation attempts failed:", lastError);
      return res.status(500).json({ 
        error: "Failed to generate curriculum plan after multiple attempts. Please try again.",
        details: process.env.NODE_ENV === 'development' ? lastError?.issues || lastError?.message : undefined
      });
      
    } catch (error: any) {
      console.error("Plan generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get plans for a child
  app.get("/api/children/:childId/plans", requireAuth, async (req: any, res) => {
    try {
      const plans = await storage.getPlansByChildId(req.params.childId);
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get tasks for a plan
  app.get("/api/plans/:planId/tasks", requireAuth, async (req: any, res) => {
    try {
      const tasks = await storage.getTasksByPlanId(req.params.planId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get tasks for a child (with optional date range)
  app.get("/api/children/:childId/tasks", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const tasks = await storage.getTasksByChildAndDateRange(
          req.params.childId,
          startDate as string,
          endDate as string
        );
        res.json(tasks);
      } else {
        // Default to today if no date range specified
        const today = new Date().toISOString().split('T')[0];
        const tasks = await storage.getTasksByChildAndDateRange(
          req.params.childId,
          today,
          today
        );
        res.json(tasks);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get task with quiz
  app.get("/api/tasks/:id", requireAuth, async (req: any, res) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      const quiz = await storage.getQuizByTaskId(task.id);
      
      res.json({ ...task, quiz });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update task (parent can edit lessons and add notes)
  app.patch("/api/tasks/:id", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access required" });
      }
      
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Verify the task belongs to a child of this parent
      const child = await storage.getChildById(task.childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to edit this task" });
      }
      
      const validation = updateTaskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
      }
      
      const updatedTask = await storage.updateTask(req.params.id, validation.data);
      res.json(updatedTask);
    } catch (error: any) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate text-to-speech audio for a task (child-friendly voice)
  app.post("/api/tasks/:id/audio", requireAuth, async (req: any, res) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Build child-friendly script from task content
      const scriptParts: string[] = [];
      
      // Title and objective
      scriptParts.push(`Today's lesson is called: ${task.title}.`);
      if (task.objective) {
        scriptParts.push(`Here's what you'll learn: ${task.objective}`);
      }
      
      // Overview
      if (task.overview) {
        scriptParts.push(task.overview);
      }
      
      // Materials
      if (task.materialsNeeded && task.materialsNeeded.length > 0) {
        scriptParts.push(`First, let's gather what you'll need: ${task.materialsNeeded.join(', ')}.`);
      }
      
      // Lesson steps (preferred) or legacy instructions
      if (task.lessonSteps && task.lessonSteps.length > 0) {
        scriptParts.push("Now let's do it step by step!");
        task.lessonSteps.forEach((step: any, idx: number) => {
          scriptParts.push(`Step ${step.stepNumber || idx + 1}: ${step.childTask}`);
        });
      } else if (task.instructionsForChild) {
        scriptParts.push(`Here's what to do: ${task.instructionsForChild}`);
      }
      
      // Faith integration
      if (task.faithIntegration) {
        if (task.faithIntegration.scripture) {
          scriptParts.push(`Let's remember this special verse: ${task.faithIntegration.scripture}`);
        }
        if (task.faithIntegration.tieIn) {
          scriptParts.push(task.faithIntegration.tieIn);
        }
      } else if (task.scriptureReference && task.scriptureText) {
        scriptParts.push(`Here's a special verse for you: ${task.scriptureReference}. "${task.scriptureText}"`);
      }
      
      // Encouraging closing
      scriptParts.push("You've got this! Have fun learning!");
      
      const fullScript = scriptParts.join(' ');
      
      // Generate TTS using OpenAI with a friendly voice
      // Nova voice is warm and friendly, perfect for children
      const mp3Response = await openaiDirect.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: fullScript,
        speed: 0.9, // Slightly slower for young learners
      });
      
      // Stream the audio response
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });
      res.send(buffer);
    } catch (error: any) {
      console.error("Error generating audio:", error);
      res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
  });

  // Complete task
  app.post("/api/tasks/complete", requireAuth, async (req: any, res) => {
    try {
      const data = completeTaskSchema.parse(req.body);
      
      const task = await storage.getTaskById(data.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Complete the task
      await storage.completeTask(data.taskId);
      
      // Ensure rewards exist for the child before awarding points/badges
      let rewards = await storage.getRewardsByChildId(task.childId);
      if (!rewards) {
        rewards = await storage.initializeRewards(task.childId);
      }
      
      // Award base points
      let pointsEarned = 10;
      
      // If quiz answers provided, submit them
      if (data.quizAnswers) {
        const { score } = await storage.submitQuizAnswers(data.taskId, data.quizAnswers);
        pointsEarned += 5; // Bonus points for quiz
      }

      await storage.addPoints(task.childId, pointsEarned);

      // Check for badge awards
      const currentBadges = rewards.badges || [];

      // First task badge
      if (currentBadges.length === 0) {
        await storage.addBadge(task.childId, "FIRST_TASK_COMPLETE");
      }

      // Check for day complete badge
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = await storage.getTasksByChildAndDateRange(task.childId, today, today);
      const allComplete = todayTasks.every(t => t.status === "COMPLETED");
      
      if (allComplete && !currentBadges.includes("FIRST_DAY_COMPLETE")) {
        await storage.addBadge(task.childId, "FIRST_DAY_COMPLETE");
      }

      // Subject-specific badges
      const completedTasks = todayTasks.filter(t => t.status === "COMPLETED");
      const scienceTasks = completedTasks.filter(t => t.subject === "SCIENCE");
      const characterTasks = completedTasks.filter(t => t.subject === "CHARACTER");

      if (scienceTasks.length >= 5 && !currentBadges.includes("NATURE_EXPLORER")) {
        await storage.addBadge(task.childId, "NATURE_EXPLORER");
      }

      if (characterTasks.length >= 5 && !currentBadges.includes("KIND_HEART")) {
        await storage.addBadge(task.childId, "KIND_HEART");
      }

      const updatedRewards = await storage.getRewardsByChildId(task.childId);
      res.json({ pointsEarned, rewards: updatedRewards });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get rewards for a child
  app.get("/api/children/:childId/rewards", requireAuth, async (req: any, res) => {
    try {
      const rewards = await storage.getRewardsByChildId(req.params.childId);
      res.json(rewards || { points: 0, badges: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get progress stats for a child
  app.get("/api/children/:childId/progress", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization: child can only access their own progress, parent can access their children's
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const stats = await storage.getProgressStats(childId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get daily devotional for a child (generates if not exists for today)
  app.get("/api/children/:childId/devotional", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization: child can only access their own devotional, parent can access their children's
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const devotional = await ensureDevotionalForToday(childId);
      res.json(devotional);
    } catch (error: any) {
      console.error("Error getting devotional:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PROGRESSION SYSTEM ENDPOINTS
  // ============================================

  // Get full progression data for a child
  app.get("/api/children/:childId/progression", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization: child can only access their own progression, parent can access their children's
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const progression = await storage.getFullProgression(childId);
      res.json(progression);
    } catch (error: any) {
      console.error("Error getting progression:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Equip an inventory item
  app.post("/api/children/:childId/progression/equip", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const { slot, itemSlug } = req.body;
      
      // Authorization
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      if (!slot) {
        return res.status(400).json({ error: "Slot is required" });
      }
      
      // If itemSlug is null, unequip the slot
      let itemId: string | null = null;
      if (itemSlug) {
        // Verify child owns the item
        const hasItem = await storage.hasInventoryItem(childId, itemSlug);
        if (!hasItem) {
          return res.status(400).json({ error: "You don't own this item" });
        }
        const item = await storage.getInventoryItemBySlug(itemSlug);
        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }
        itemId = item.id;
      }
      
      const avatarState = await storage.equipItem(childId, slot, itemId);
      res.json({ success: true, avatarState });
    } catch (error: any) {
      console.error("Error equipping item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update avatar mood
  app.post("/api/children/:childId/progression/mood", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const { mood } = req.body;
      
      // Authorization
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      if (!mood || !["HAPPY", "PROUD", "EXCITED", "FOCUSED", "SLEEPY"].includes(mood)) {
        return res.status(400).json({ error: "Invalid mood" });
      }
      
      const avatarState = await storage.updateAvatarMood(childId, mood);
      res.json({ success: true, avatarState });
    } catch (error: any) {
      console.error("Error updating mood:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update avatar traits (customization)
  app.patch("/api/children/:childId/avatar/traits", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization: child can only update their own avatar, parent can update their children's
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Validate the traits using Zod schema
      console.log("[Avatar] PATCH request body:", JSON.stringify(req.body, null, 2));
      const parseResult = avatarTraitsSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.log("[Avatar] Validation failed:", JSON.stringify(parseResult.error.errors, null, 2));
        return res.status(400).json({ error: "Invalid avatar traits", details: parseResult.error.errors });
      }
      
      const avatarState = await storage.updateAvatarTraits(childId, parseResult.data);
      res.json({ success: true, avatarState });
    } catch (error: any) {
      console.error("Error updating avatar traits:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get avatar traits for a child
  app.get("/api/children/:childId/avatar/traits", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization
      if (req.session.childId) {
        if (req.session.childId !== childId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const avatarState = await storage.getAvatarState(childId);
      if (!avatarState) {
        // Return default traits if no avatar state exists yet
        const { defaultAvatarTraits } = await import("@shared/schema");
        return res.json({ traits: defaultAvatarTraits });
      }
      
      res.json({ traits: avatarState.avatarTraits });
    } catch (error: any) {
      console.error("Error getting avatar traits:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all available badges
  app.get("/api/badges", async (_req, res) => {
    try {
      const badges = await storage.getAllBadgeDefinitions();
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all available inventory items
  app.get("/api/inventory-items", async (_req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ADAPTIVE LEARNING ENDPOINTS
  // ============================================

  // Submit task outcome with learning evidence (replaces simple task completion for richer feedback)
  app.post("/api/tasks/:taskId/outcome", requireAuth, async (req: any, res) => {
    try {
      const { taskId } = req.params;
      const data = submitTaskOutcomeSchema.parse({ ...req.body, taskId });
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Authorization check
      if (req.session.childId && req.session.childId !== task.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(task.childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Complete the task
      await storage.completeTask(taskId);

      // Handle quiz answers if present
      let quizScore: number | undefined;
      if (data.quizAnswers && data.quizAnswers.length > 0) {
        const quizResult = await storage.submitQuizAnswers(taskId, data.quizAnswers);
        quizScore = Math.round((quizResult.score / quizResult.quiz.questions.length) * 100);
      }

      // Create task outcome with learning evidence
      const outcome = await storage.createTaskOutcome({
        taskId,
        childId: task.childId,
        quizScore,
        parentFeedback: data.parentFeedback,
        childConfidence: data.childConfidence,
        timeOnTaskMinutes: data.timeOnTaskMinutes,
        notes: data.notes,
      });

      // Update skill progress based on outcome
      const taskSkillLinks = await storage.getSkillsForTask(taskId);
      const today = new Date().toISOString().split('T')[0];
      
      for (const skill of taskSkillLinks) {
        const currentProgress = await storage.getChildSkillProgressBySkill(task.childId, skill.id);
        
        // Determine if this was a successful demonstration
        const wasSuccessful = (quizScore === undefined || quizScore >= 70) && 
                             data.parentFeedback !== "TOO_HARD" && 
                             data.parentFeedback !== "STRUGGLED";
        
        // Calculate new mastery level using 5-state progression
        // NOT_STARTED → DEVELOPING → PROFICIENT → FLUENT → TRANSFER
        let newMasteryLevel = currentProgress?.masteryLevel || "DEVELOPING";
        const newEvidenceCount = (currentProgress?.evidenceCount || 0) + 1;
        const newSuccessCount = (currentProgress?.successCount || 0) + (wasSuccessful ? 1 : 0);
        const newAttemptCount = (currentProgress?.attemptCount || 0) + 1;
        
        // Mastery progression logic - 5-state system
        const successRate = newSuccessCount / newAttemptCount;
        if (successRate >= 0.95 && newAttemptCount >= 5 && newMasteryLevel === "FLUENT") {
          newMasteryLevel = "TRANSFER";
        } else if (successRate >= 0.9 && newAttemptCount >= 4) {
          newMasteryLevel = "FLUENT";
        } else if (successRate >= 0.75 && newAttemptCount >= 3) {
          newMasteryLevel = "PROFICIENT";
        } else if (newAttemptCount >= 1) {
          newMasteryLevel = "DEVELOPING";
        }
        
        // Check if reinforcement is needed
        const needsReinforcement = !wasSuccessful || 
                                   data.parentFeedback === "TOO_HARD" || 
                                   data.parentFeedback === "STRUGGLED" ||
                                   (quizScore !== undefined && quizScore < 70);
        
        await storage.upsertChildSkillProgress({
          childId: task.childId,
          skillId: skill.id,
          masteryLevel: newMasteryLevel,
          evidenceCount: newEvidenceCount,
          successCount: newSuccessCount,
          attemptCount: newAttemptCount,
          lastPracticeDate: today,
          lastScore: quizScore,
          needsReinforcement,
        });
      }

      // Award points (same logic as before)
      let pointsEarned = 10;
      if (quizScore !== undefined && quizScore >= 80) {
        pointsEarned += 5;
      }
      await storage.addPoints(task.childId, pointsEarned);

      const updatedRewards = await storage.getRewardsByChildId(task.childId);
      res.json({ 
        outcome,
        pointsEarned, 
        rewards: updatedRewards,
        masteryUpdated: taskSkillLinks.length > 0
      });
    } catch (error: any) {
      console.error("Error submitting task outcome:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get child's mastery snapshot (for AI prompting and parent visibility)
  app.get("/api/children/:childId/mastery", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization
      if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const snapshot = await storage.getMasterySnapshot(childId);
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get skills needing reinforcement for a child
  app.get("/api/children/:childId/skills/reinforcement", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const skills = await storage.getSkillsNeedingReinforcement(childId);
      res.json(skills);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all curriculum skills (for reference)
  app.get("/api/skills", requireAuth, async (req: any, res) => {
    try {
      const { subject, grade } = req.query;
      
      if (subject && grade) {
        const skills = await storage.getSkillsBySubjectAndGrade(subject as string, grade as string);
        res.json(skills);
      } else {
        const skills = await storage.getAllSkills();
        res.json(skills);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PARENT LESSON ROUTES
  // ============================================
  
  // Import adaptive engine for lesson generation
  const { adaptiveEngine } = await import("./adaptiveEngine");
  
  // Create a new parent lesson request and immediately generate a lesson instance
  app.post("/api/parent/lessons", requireAuth, async (req: any, res) => {
    // Only parents can create lessons
    if (req.session.role !== "PARENT" || !req.session.userId) {
      return res.status(403).json({ error: "Only parents can create lessons" });
    }
    try {
      const validated = createParentLessonSchema.parse(req.body);
      const parentId = req.session.userId;
      
      // Verify parent owns this child
      const child = await storage.getChildById(validated.childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Create the parent lesson record
      const parentLesson = await storage.createParentLesson({
        parentId,
        childId: validated.childId,
        subject: validated.subject,
        skillTag: validated.skillTag,
        parentNotes: validated.parentNotes,
        sessionLengthMinutes: validated.sessionLengthMinutes,
        preferredMode: validated.preferredMode,
      });
      
      // Immediately generate the lesson instance
      try {
        const lessonInstance = await adaptiveEngine.buildLessonInstanceForParent(
          validated.childId,
          validated.subject,
          parentLesson.id,
          {
            skillTag: validated.skillTag,
            parentNotes: validated.parentNotes,
            sessionLengthMinutes: validated.sessionLengthMinutes,
            preferredMode: validated.preferredMode,
          }
        );
        
        // Update parent lesson status to GENERATED
        await storage.updateParentLessonStatus(parentLesson.id, "GENERATED");
        
        res.json({
          parentLesson,
          lessonInstance,
          message: "Lesson created and ready for your child!",
        });
      } catch (genError: any) {
        console.error("Error generating lesson instance:", genError);
        // Keep parent lesson as PENDING if generation failed
        res.json({
          parentLesson,
          lessonInstance: null,
          error: "Lesson is queued but generation failed. Please try again.",
        });
      }
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating parent lesson:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get all parent lessons for a child
  app.get("/api/parent/lessons/:childId", requireAuth, async (req: any, res) => {
    // Only parents can view lesson history
    if (req.session.role !== "PARENT" || !req.session.userId) {
      return res.status(403).json({ error: "Only parents can view lesson history" });
    }
    try {
      const childId = req.params.childId;
      const parentId = req.session.userId;
      
      // Verify parent owns this child
      const child = await storage.getChildById(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const lessons = await storage.getParentLessonsByChildId(childId);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get all lesson instances for parent's children with optional filters
  app.get("/api/parent/lesson-instances", requireAuth, async (req: any, res) => {
    if (req.session.role !== "PARENT" || !req.session.userId) {
      return res.status(403).json({ error: "Only parents can view lesson history" });
    }
    try {
      const parentId = req.session.userId;
      const { childId, status, subject } = req.query;
      
      // If childId provided, verify parent owns this child
      if (childId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== parentId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const lessons = await storage.getLessonsForParent(parentId, {
        childId: childId as string | undefined,
        status: status as string | undefined,
        subject: subject as string | undefined,
      });
      res.json(lessons);
    } catch (error: any) {
      console.error("Error fetching parent lessons:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ADAPTIVE LESSON ENGINE ROUTES
  // ============================================
  
  // Generate a new adaptive lesson for a child
  app.post("/api/adaptive/lessons/generate", requireAuth, async (req: any, res) => {
    try {
      const { childId, subject, skillId } = req.body;
      
      if (!childId) {
        return res.status(400).json({ error: "childId is required" });
      }
      
      // Authorization check
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const lesson = await adaptiveEngine.buildLessonInstance(childId, subject, skillId);
      res.json(lesson);
    } catch (error: any) {
      console.error("Error generating adaptive lesson:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get today's lessons for a child
  app.get("/api/adaptive/lessons/today/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization check
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const lessons = await storage.getTodaysLessonsForChild(childId);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all lessons for a child (including historical completed lessons)
  app.get("/api/adaptive/lessons/all/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization check
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const lessons = await storage.getAllLessonsForChild(childId);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a specific lesson by ID
  app.get("/api/adaptive/lessons/:lessonId", requireAuth, async (req: any, res) => {
    try {
      const lesson = await storage.getLessonInstanceById(req.params.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization check
      if (req.session.userId) {
        const child = await storage.getChildById(lesson.childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Start a lesson (change status to IN_PROGRESS)
  app.post("/api/adaptive/lessons/:lessonId/start", requireAuth, async (req: any, res) => {
    try {
      const lesson = await storage.getLessonInstanceById(req.params.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Only the child can start their own lesson
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateLessonInstanceStatus(req.params.lessonId, "IN_PROGRESS");
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save lesson progress for resume functionality
  app.patch("/api/adaptive/lessons/:lessonId/progress", requireAuth, async (req: any, res) => {
    try {
      const lesson = await storage.getLessonInstanceById(req.params.lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization check - only the child or parent can save progress
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(lesson.childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const { progressStepIndex, progressState } = req.body;
      
      if (typeof progressStepIndex !== 'number' || progressStepIndex < 0) {
        return res.status(400).json({ error: "Invalid progressStepIndex" });
      }
      
      if (!progressState || !progressState.currentPhase) {
        return res.status(400).json({ error: "Invalid progressState" });
      }
      
      const updated = await storage.saveLessonProgress(
        req.params.lessonId,
        progressStepIndex,
        progressState
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error saving lesson progress:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Number word to digit mapping for K-2 children
  const numberWords: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
    'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
    'eighteen': '18', 'nineteen': '19', 'twenty': '20',
    // Common misspellings and homophones for K-2
    'too': '2', 'to': '2', 'for': '4', 'fore': '4', 'won': '1',
    'ate': '8', 'tree': '3', 'thre': '3', 'fiv': '5', 'fivee': '5',
    'siks': '6', 'sevn': '7', 'nien': '9', 'tenn': '10',
    'wun': '1', 'tu': '2', 'thri': '3', 'nyne': '9',
  };
  
  // Filler words to remove from child answers
  const fillerWords = new Set([
    'is', 'it', 'its', "it's", 'equals', 'equal', 'are', 'was', 'were',
    'answer', 'result', 'makes', 'gives', 'gets', 'i', 'think', 'guess',
    'maybe', 'um', 'uh', 'like', 'so', 'well', 'yeah', 'yes', 'no',
  ]);
  
  // Convert a single token (word) to normalized form
  function normalizeToken(token: string): string {
    let normalized = token.toLowerCase().trim();
    
    // Remove punctuation
    normalized = normalized.replace(/[.,!?;:()'"]/g, '');
    
    // Check if it's a number word
    if (numberWords[normalized]) {
      return numberWords[normalized];
    }
    
    // Check if it's already a number
    const numericValue = parseFloat(normalized);
    if (!isNaN(numericValue) && normalized.match(/^-?\d+\.?\d*$/)) {
      return String(numericValue);
    }
    
    return normalized;
  }
  
  // Extract the semantic content from an answer, handling multi-word phrases
  function extractAnswerContent(answer: string | number): string {
    let text = String(answer).toLowerCase().trim();
    
    // Remove surrounding quotes
    text = text.replace(/^['"`]+|['"`]+$/g, '');
    
    // Remove punctuation
    text = text.replace(/[.,!?;:()]/g, '');
    
    // Split into tokens
    const tokens = text.split(/\s+/).filter(t => t.length > 0);
    
    // Process tokens: convert number words, remove filler words and articles
    const processedTokens: string[] = [];
    for (const token of tokens) {
      // Skip articles and filler words
      if (['a', 'an', 'the'].includes(token) || fillerWords.has(token)) {
        continue;
      }
      
      // Normalize the token (converts number words to digits)
      const normalized = normalizeToken(token);
      if (normalized) {
        processedTokens.push(normalized);
      }
    }
    
    return processedTokens.join(' ');
  }
  
  // Calculate Levenshtein distance for fuzzy matching
  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  // Check if two answers match with tolerance for variations
  function answersMatch(childAnswer: string, correctAnswer: string): boolean {
    const childContent = extractAnswerContent(childAnswer);
    const correctContent = extractAnswerContent(correctAnswer);
    
    // Exact match after normalization
    if (childContent === correctContent) {
      return true;
    }
    
    // If correct answer is a number, also check if child just gave the number
    // (handles "3 apples" correct answer with "3" or "three" child input)
    const correctTokens = correctContent.split(' ');
    const childTokens = childContent.split(' ');
    
    // If correct answer starts with a number and child gave just that number
    if (correctTokens.length > 0 && childTokens.length === 1) {
      const correctFirstToken = correctTokens[0];
      if (correctFirstToken.match(/^\d+$/) && childTokens[0] === correctFirstToken) {
        return true;
      }
    }
    
    // If child answer starts with the correct number (e.g., "3" when answer is "3")
    if (childTokens.length > 0 && correctTokens.length === 1) {
      if (childTokens[0] === correctTokens[0]) {
        return true;
      }
    }
    
    // For short answers (1-2 chars), require exact match
    if (correctContent.length <= 2) {
      return childContent === correctContent;
    }
    
    // Allow fuzzy matching for longer answers (spelling tolerance)
    // Allow 1 error for words up to 5 chars, 2 errors for longer words
    const maxDistance = correctContent.length <= 5 ? 1 : 2;
    const distance = levenshteinDistance(childContent, correctContent);
    
    return distance <= maxDistance;
  }
  
  // AI-powered answer validation for open-ended questions
  // Progressive validation modes: strict (attempt 1), fuzzy (attempt 2), lenient (attempt 3+)
  async function validateAnswerWithAI(
    question: string,
    childAnswer: string,
    answerCriteria: string,
    subject: string,
    validationMode: 'strict' | 'fuzzy' | 'lenient' = 'strict'
  ): Promise<{ isCorrect: boolean; feedback: string }> {
    try {
      let systemPrompt = '';
      
      if (validationMode === 'strict') {
        systemPrompt = `You are a kind, encouraging teacher helping a young child (grades K-2).
Your job is to determine if a child's answer meets the criteria for the question.

STRICT MODE RULES:
1. The answer must be reasonably close to the expected answer
2. Ignore capitalization but look for correct content
3. Accept minor spelling variations (1-2 letters off)
4. The core concept/answer must be present

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "Encouraging message for the child (1-2 sentences max)"
}

If correct, give enthusiastic praise.
If incorrect, be gentle and encourage them to try again.`;
      } else if (validationMode === 'fuzzy') {
        systemPrompt = `You are a kind, encouraging teacher helping a young child (grades K-2).
Your job is to determine if a child's answer meets the criteria for the question.

FUZZY/LENIENT MODE RULES:
1. Be VERY GENEROUS with acceptance
2. Accept synonyms, related concepts, and partial answers
3. Accept phonetic approximations (e.g., "kat" for "cat", "wun" for "one")
4. If the child's answer shows they understand the concept AT ALL, mark correct
5. Accept answers that are in the right direction even if not exact
6. Ignore all spelling mistakes completely
7. Accept verbal/spoken approximations of the answer

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "Encouraging message for the child (1-2 sentences max)"
}

If correct, give enthusiastic praise.
If incorrect, be very gentle - they're trying their best!`;
      } else {
        // lenient mode - almost always accept
        systemPrompt = `You are a kind, encouraging teacher helping a young child (grades K-2).
Your job is to determine if a child's answer shows ANY understanding of the question.

VERY LENIENT MODE RULES:
1. Accept almost any answer that shows the child tried
2. Accept any synonym, related word, or concept
3. Accept phonetic attempts, partial words, or approximations
4. If they're even close or in the right topic area, mark correct
5. Only mark wrong if the answer is completely unrelated or blank

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "Encouraging message for the child (1-2 sentences max)"
}

Be extremely encouraging regardless of correctness!`;
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Subject: ${subject}
Question: "${question}"
Answer Criteria: "${answerCriteria}"
Child's Answer: "${childAnswer}"

Does the child's answer meet the criteria?`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      return {
        isCorrect: result.isCorrect === true,
        feedback: result.feedback || (result.isCorrect ? "Great job!" : "Let's try again!")
      };
    } catch (error) {
      console.error("AI validation error:", error);
      // Fallback to simple matching if AI fails
      return { isCorrect: false, feedback: "Let's try again!" };
    }
  }

  // Submit an answer (progressive validation model)
  // Attempt 1: Strict validation
  // Attempt 2: Fuzzy/lenient validation
  // Attempt 3: Show answer and let them retry
  // Attempt 4+: Allow skip for parent review
  app.post("/api/adaptive/lessons/:lessonId/attempt", requireAuth, async (req: any, res) => {
    try {
      const { questionId, childAnswer, skipForParent } = req.body;
      const lessonId = req.params.lessonId;
      
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Find the question
      const question = lesson.assessment?.questions.find(q => q.questionId === questionId);
      if (!question) {
        return res.status(400).json({ error: "Question not found" });
      }
      
      // Get attempt count for this question BEFORE this attempt
      const attemptCount = await storage.getAttemptCountForQuestion(lessonId, questionId);
      const currentAttempt = attemptCount + 1;
      
      // Handle skip for parent intervention
      if (skipForParent) {
        // Record as skipped attempt
        await storage.createLessonAttempt({
          lessonInstanceId: lessonId,
          childId: lesson.childId,
          questionId,
          childAnswer: childAnswer || "[SKIPPED FOR PARENT REVIEW]",
          correctAnswer: String(question.correctAnswer),
          isCorrect: false,
          attemptNumber: currentAttempt,
          misconceptionTag: "skipped_for_parent",
          explanationForChild: "Skipped for parent to review later",
          hint: null,
          nextAction: "parent_review",
        });
        
        return res.json({
          isCorrect: true, // Allow progression
          attemptNumber: currentAttempt,
          message: "Got it! A parent will help you with this one later.",
          skippedForParent: true,
          correctAnswer: String(question.correctAnswer),
        });
      }
      
      let isCorrect = false;
      let aiValidationFeedback: string | null = null;
      
      // Determine validation mode based on attempt number
      // Attempt 1: strict, Attempt 2: fuzzy, Attempt 3+: lenient
      let validationMode: 'strict' | 'fuzzy' | 'lenient' = 'strict';
      if (currentAttempt === 2) {
        validationMode = 'fuzzy';
      } else if (currentAttempt >= 3) {
        validationMode = 'lenient';
      }
      
      // Check if this question uses AI validation (open-ended answers)
      if (question.useAIValidation && question.answerCriteria) {
        const aiResult = await validateAnswerWithAI(
          question.prompt,
          childAnswer,
          question.answerCriteria,
          lesson.subject,
          validationMode
        );
        isCorrect = aiResult.isCorrect;
        aiValidationFeedback = aiResult.feedback;
      } else {
        // Use flexible matching with number word conversion and spelling tolerance
        // For non-AI questions, also progressively loosen matching
        if (validationMode === 'strict') {
          isCorrect = answersMatch(childAnswer, String(question.correctAnswer));
        } else {
          // Fuzzy/lenient: even more tolerant matching
          const normalizedChild = childAnswer.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const normalizedCorrect = String(question.correctAnswer).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          
          // Check if one contains the other or they're similar
          isCorrect = normalizedChild === normalizedCorrect ||
            normalizedChild.includes(normalizedCorrect) ||
            normalizedCorrect.includes(normalizedChild) ||
            answersMatch(childAnswer, String(question.correctAnswer));
        }
      }
      
      let hintData = null;
      if (!isCorrect) {
        // Generate AI hint for wrong answer
        const child = await storage.getChildById(lesson.childId);
        hintData = await adaptiveEngine.generateHintForWrongAnswer({
          question: question.prompt,
          correctAnswer: question.correctAnswer,
          childAnswer,
          gradeBand: child?.grade || "K",
          modeUsed: lesson.modeUsed,
          subject: lesson.subject,
        });
      }
      
      // Record the attempt
      await storage.createLessonAttempt({
        lessonInstanceId: lessonId,
        childId: lesson.childId,
        questionId,
        childAnswer,
        correctAnswer: String(question.correctAnswer),
        isCorrect,
        attemptNumber: currentAttempt,
        misconceptionTag: hintData?.misconceptionTag,
        explanationForChild: hintData?.explanationForChild,
        hint: hintData?.hint,
        nextAction: hintData?.nextAction,
      });
      
      // Record learning signal for curriculum progression
      try {
        const { progressionEngine } = await import("./progressionEngine");
        await progressionEngine.recordLearningSignal(lesson.childId, "QUESTION_ATTEMPT", {
          lessonInstanceId: lessonId,
          questionId,
          attemptNumber: currentAttempt,
          isCorrect,
          hintLevel: !isCorrect && hintData ? currentAttempt : undefined,
        });
      } catch (signalError) {
        console.error("Failed to record learning signal:", signalError);
      }
      
      // Build response
      const successMessage = aiValidationFeedback || "Great job! You got it right!";
      const failMessage = aiValidationFeedback || hintData?.explanationForChild || "Let's try again!";
      
      // After 3 failed attempts, show the correct answer
      const showCorrectAnswer = !isCorrect && currentAttempt >= 3;
      // After 4 failed attempts, allow skip
      const allowSkip = !isCorrect && currentAttempt >= 4;
      
      res.json({
        isCorrect,
        attemptNumber: currentAttempt,
        message: isCorrect ? successMessage : failMessage,
        hint: isCorrect ? null : hintData?.hint,
        nextAction: isCorrect ? null : hintData?.nextAction,
        validationMode,
        // Show correct answer after attempt 3
        correctAnswer: showCorrectAnswer ? String(question.correctAnswer) : undefined,
        showCorrectAnswer,
        // Allow skip after attempt 4
        allowSkip,
      });
    } catch (error: any) {
      console.error("Error submitting attempt:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Complete a lesson
  app.post("/api/adaptive/lessons/:lessonId/complete", requireAuth, async (req: any, res) => {
    try {
      const lessonId = req.params.lessonId;
      
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Calculate accuracy from attempts
      const attempts = await storage.getAttemptsForLesson(lessonId);
      const correctAttempts = attempts.filter(a => a.isCorrect).length;
      const totalQuestions = lesson.assessment?.questions?.length || 1;
      const accuracy = totalQuestions > 0 ? (correctAttempts / totalQuestions) * 100 : 100;
      
      const result = await adaptiveEngine.completeLesson(lessonId);
      
      // Clear progress state on lesson completion
      await storage.clearLessonProgress(lessonId);
      
      // Check if this lesson is linked to a journey tile and complete it
      let journeyTileResult = null;
      try {
        const journeyData = await storage.getJourneyData(lesson.childId);
        if (journeyData) {
          const linkedTile = journeyData.tiles.find(t => t.lessonInstanceId === lessonId);
          if (linkedTile && linkedTile.status !== "COMPLETED") {
            // Mark tile as completed
            const completedTile = await storage.updateJourneyTile(linkedTile.id, {
              status: "COMPLETED",
              completedAt: new Date()
            });

            // Update world progress
            const worldProgress = await storage.getChildWorldProgress(lesson.childId, linkedTile.worldId);
            if (worldProgress) {
              const newTilesCompleted = worldProgress.tilesCompleted + 1;
              const newCurrentTile = linkedTile.tileNumber + 1;
              
              await storage.updateChildWorldProgress(lesson.childId, linkedTile.worldId, {
                tilesCompleted: newTilesCompleted,
                currentTile: newCurrentTile,
              });
            }

            // Unlock next tile
            const tiles = await storage.getJourneyTiles(lesson.childId, linkedTile.worldId);
            const nextTile = tiles.find(t => t.tileNumber === linkedTile.tileNumber + 1);
            if (nextTile && nextTile.status === "LOCKED") {
              await storage.updateJourneyTile(nextTile.id, { status: "CURRENT" });
            }

            // Check for tool reward
            let awardedTool = null;
            if (linkedTile.rewardToolId) {
              try {
                awardedTool = await storage.awardWorldTool(
                  lesson.childId, 
                  linkedTile.rewardToolId, 
                  linkedTile.tileNumber,
                  lessonId
                );
              } catch (toolErr) {
                console.log("Tool already awarded or error:", toolErr);
              }
            }

            // Check for world completion
            const allTiles = await storage.getJourneyTiles(lesson.childId, linkedTile.worldId);
            const completedCount = allTiles.filter(t => t.status === "COMPLETED").length;
            const world = journeyData.currentWorld;
            
            let worldCompleted = false;
            if (world && completedCount >= world.tilesCount) {
              await storage.updateChildWorldProgress(lesson.childId, linkedTile.worldId, {
                status: "COMPLETED",
                completedAt: new Date(),
              });
              worldCompleted = true;

              // Unlock next world
              const allWorlds = await storage.getAllWorlds();
              const currentWorldIndex = allWorlds.findIndex(w => w.id === linkedTile.worldId);
              if (currentWorldIndex >= 0 && currentWorldIndex < allWorlds.length - 1) {
                const nextWorld = allWorlds[currentWorldIndex + 1];
                await storage.initializeChildWorldProgress(lesson.childId, nextWorld.id);
              }
              
              // Create activity event for world completion (Social World)
              try {
                await storage.createActivityEvent({
                  childId: lesson.childId,
                  eventType: "CHALLENGE_COMPLETED",
                  metadata: {
                    worldId: linkedTile.worldId,
                    worldName: world?.name || linkedTile.worldId,
                    type: "world_completion",
                  },
                  visibility: "BUDDIES_ONLY",
                });
              } catch (activityErr) {
                console.log("Activity event creation error for world:", activityErr);
              }
            }

            journeyTileResult = {
              tileCompleted: true,
              tileNumber: linkedTile.tileNumber,
              awardedTool,
              worldCompleted,
            };
          }
        }
      } catch (journeyErr) {
        console.log("Journey tile completion check error:", journeyErr);
      }
      
      // Check if this lesson is linked to a Daily Queue item and complete it
      let dailyQueueResult = null;
      try {
        // Search all queues to find the one with this lesson (handles cross-day completion)
        const dailyQueue = await storage.findQueueByLessonInstanceId(lesson.childId, lessonId);
        if (dailyQueue) {
          const linkedItem = dailyQueue.items.find(item => item.lessonInstanceId === lessonId);
          if (linkedItem && linkedItem.status !== "COMPLETED") {
            const updatedItems = dailyQueue.items.map(item => {
              if (item.id === linkedItem.id) {
                return { 
                  ...item, 
                  status: "COMPLETED" as const,
                  completedAt: new Date().toISOString()
                };
              }
              return item;
            });
            
            const completedCount = updatedItems.filter(i => i.status === "COMPLETED").length;
            const allComplete = updatedItems.every(i => i.status === "COMPLETED" || i.status === "SKIPPED");
            
            await storage.updateDailyQueue(dailyQueue.id, {
              items: updatedItems,
              completedItems: completedCount,
              status: allComplete ? "COMPLETED" : "IN_PROGRESS",
              completedAt: allComplete ? new Date() : undefined,
            });
            
            dailyQueueResult = {
              itemCompleted: true,
              queueProgress: `${completedCount}/${dailyQueue.totalItems}`,
              queueCompleted: allComplete,
            };
          }
        }
      } catch (queueErr) {
        console.log("Daily queue item completion check error:", queueErr);
      }
      
      // NOTE: Lesson completion is not auto-posted to activity feed.
      // Children can manually share completed lessons via the "Share with Buddies" feature.
      
      // Update skill mastery based on lesson performance
      try {
        const { progressionEngine } = await import("./progressionEngine");
        const hintsUsed = attempts.filter(a => a.hint && !a.isCorrect).length;
        
        // Record session time signal
        await progressionEngine.recordLearningSignal(lesson.childId, "SESSION_TIME", {
          lessonInstanceId: lessonId,
          timeSpentSeconds: (result.pointsEarned || 10) * 60, // Estimate based on points
        });
        
        // Update mastery if we know the skill
        if (lesson.targetSkillName) {
          const allSkills = await storage.getAllSkills();
          const matchedSkill = allSkills.find(s => 
            s.name === lesson.targetSkillName || 
            s.name.toLowerCase().replace(/_/g, ' ') === lesson.targetSkillName.toLowerCase().replace(/_/g, ' ')
          );
          
          if (matchedSkill) {
            // contextTag identifies the problem framing this lesson represents. Without
            // varied contexts the kid can't earn promotion past DEVELOPING (mastery-real
            // logic in progressionEngine.updateChildMastery). Prefer the template id;
            // fall back to mode+difficulty so AI-generated lessons still register a
            // distinct context per (mode, difficulty) tuple.
            const contextTag =
              lesson.lessonTemplateId ||
              `ai:${lesson.modeUsed}:${lesson.difficultyUsed}`;
            await progressionEngine.updateChildMastery(
              lesson.childId,
              matchedSkill.id,
              {
                isCorrect: accuracy >= 70,
                confidence: accuracy,
                hintsUsed,
                contextTag,
              }
            );
          }
        }
      } catch (masteryError) {
        console.error("Failed to update skill mastery:", masteryError);
      }
      
      res.json({
        message: "Great job completing your lesson!",
        pointsEarned: result.pointsEarned,
        accuracy: Math.round(accuracy),
        journeyProgress: {
          journeyPosition: result.newJourneyPosition,
          growthPoints: result.newGrowthPoints,
        },
        progression: result.progression,
        journeyTile: journeyTileResult,
        dailyQueue: dailyQueueResult,
      });
    } catch (error: any) {
      console.error("Error completing lesson:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Skip a lesson (child wants to come back later)
  app.post("/api/adaptive/lessons/:lessonId/skip", requireAuth, async (req: any, res) => {
    try {
      const lessonId = req.params.lessonId;
      const { reason } = req.body;
      
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const skippedLesson = await storage.skipLessonInstance(lessonId, reason);
      
      res.json({
        message: "Lesson skipped! You can come back to it later.",
        lesson: skippedLesson,
      });
    } catch (error: any) {
      console.error("Error skipping lesson:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Resume a skipped lesson
  app.post("/api/adaptive/lessons/:lessonId/resume", requireAuth, async (req: any, res) => {
    try {
      const lessonId = req.params.lessonId;
      
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (lesson.status !== "SKIPPED") {
        return res.status(400).json({ error: "This lesson is not skipped" });
      }
      
      const resumedLesson = await storage.resumeSkippedLesson(lessonId);
      
      res.json({
        message: "Ready to continue your lesson!",
        lesson: resumedLesson,
      });
    } catch (error: any) {
      console.error("Error resuming lesson:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get skipped lessons for a child
  app.get("/api/children/:childId/skipped-lessons", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization - parent or child themselves
      if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const skippedLessons = await storage.getSkippedLessonsForChild(childId);
      
      res.json({
        skippedLessons,
        count: skippedLessons.length,
      });
    } catch (error: any) {
      console.error("Error getting skipped lessons:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Generate text-to-speech audio for an adaptive lesson
  app.post("/api/adaptive/lessons/:lessonId/audio", requireAuth, async (req: any, res) => {
    try {
      const lessonId = req.params.lessonId;
      const { stepType, stepContent } = req.body;
      
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // Authorization
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Build script based on what step is being read
      const scriptParts: string[] = [];
      const teachPhase = lesson.teachPhase as any;
      
      if (stepType === "concept" && teachPhase?.conceptExplanation) {
        // Read the concept explanation and vocabulary
        scriptParts.push(teachPhase.conceptExplanation);
        
        if (teachPhase.vocabulary && teachPhase.vocabulary.length > 0) {
          scriptParts.push("Here are some new words to learn:");
          teachPhase.vocabulary.forEach((v: any) => {
            scriptParts.push(`${v.term} means ${v.definition}.`);
          });
        }
      } else if (stepType === "worked_example" && teachPhase?.workedExample) {
        // Read the worked example problem
        scriptParts.push(teachPhase.workedExample.problem);
        scriptParts.push("Let me show you how to solve this step by step!");
      } else if (stepType === "worked_example_step" && stepContent) {
        // Read a specific step
        scriptParts.push(stepContent);
      } else if (stepType === "worked_example_conclusion" && teachPhase?.workedExample?.answer) {
        // Read the celebration answer
        scriptParts.push("Great job watching and learning!");
        scriptParts.push(teachPhase.workedExample.answer);
        scriptParts.push("Now it's your turn to try!");
      } else if (stepType === "instruction" && stepContent) {
        // Read a practice instruction
        scriptParts.push("Your turn!");
        scriptParts.push(stepContent);
      } else if (stepType === "question" && stepContent) {
        // Read a question
        scriptParts.push(stepContent);
      } else if (stepType === "full") {
        // Read the entire lesson from beginning
        scriptParts.push(`Let's learn about ${lesson.title}!`);
        scriptParts.push(lesson.objective || "");
        
        if (teachPhase?.conceptExplanation) {
          scriptParts.push(teachPhase.conceptExplanation);
        }
        
        if (teachPhase?.vocabulary && teachPhase.vocabulary.length > 0) {
          scriptParts.push("Here are some new words:");
          teachPhase.vocabulary.forEach((v: any) => {
            scriptParts.push(`${v.term} means ${v.definition}.`);
          });
        }
        
        if (teachPhase?.workedExample) {
          scriptParts.push(teachPhase.workedExample.problem);
          teachPhase.workedExample.steps?.forEach((step: any) => {
            scriptParts.push(`Step ${step.stepNumber}: ${step.instruction}`);
          });
          scriptParts.push(teachPhase.workedExample.answer);
        }
      } else {
        // Fallback - read provided content
        if (stepContent) {
          scriptParts.push(stepContent);
        } else {
          scriptParts.push(`Let's learn about ${lesson.title}!`);
        }
      }
      
      const fullScript = scriptParts.filter(p => p).join(' ');
      
      if (!fullScript.trim()) {
        return res.status(400).json({ error: "No content to read" });
      }
      
      // Generate TTS using OpenAI with a friendly voice
      const mp3Response = await openaiDirect.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: fullScript,
        speed: 0.9, // Slightly slower for young learners
      });
      
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
      });
      res.send(buffer);
    } catch (error: any) {
      console.error("Error generating lesson audio:", error);
      res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
  });
  
  // ----- Karaoke audio cache helpers -----
  // Hash that uniquely identifies a synthesized passage. Same text + voice + speed = same
  // hash = cache hit. Without this cache every read-along play burns an OpenAI round-trip;
  // with it, only the first one does. Critical cost guardrail (see Phase 1 infra audit).
  const audioContentHash = (text: string, voice: string, speed: string | number) =>
    createHash("sha256").update(`${voice}|${speed}|${text.trim()}`).digest("hex");

  // Synthesize a passage (or return a cache hit). Used by both the legacy
  // `/api/adaptive/lessons/:lessonId/audio-with-timestamps` endpoint and the v2
  // `/api/audio-cache` POST endpoint.
  async function synthesizeAndCache(text: string, opts?: { voice?: string; speed?: number }) {
    const voice = opts?.voice ?? "nova";
    const speed = opts?.speed ?? 0.9;
    const speedStr = String(speed);
    const contentHash = audioContentHash(text, voice, speedStr);

    const cached = await storage.getAudioCacheByHash(contentHash);
    if (cached) {
      // Return the cached row's audio. For Phase 1 we serve audio inline as base64 from the
      // audioUrl when it was stored that way, OR re-fetch from object storage when migrated.
      // Right now audioUrl holds a `data:audio/mpeg;base64,…` URI for simplicity.
      await storage.touchAudioCachePlayback(cached.id);
      return {
        cacheId: cached.id,
        audioBase64: cached.audioUrl.startsWith("data:audio/mpeg;base64,")
          ? cached.audioUrl.slice("data:audio/mpeg;base64,".length)
          : cached.audioUrl, // future: object-storage URL
        wordTimestamps: cached.wordTimestamps,
        duration: cached.durationMs ? cached.durationMs / 1000 : 0,
        cached: true,
      };
    }

    // Cache miss — synthesize.
    const mp3Response = await openaiDirect.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      speed,
    });
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());

    const audioFile = new File([audioBuffer], "speech.mp3", { type: "audio/mpeg" });
    const transcription = await openaiDirect.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    });
    const wordTimestamps =
      (transcription as any).words?.map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
      })) ?? [];
    const durationSec = (transcription as any).duration ?? 0;
    const audioBase64 = audioBuffer.toString("base64");

    // Store as a base64 data URI in audioUrl for now. When we migrate to object storage,
    // upload the buffer to a bucket and store the GCS/S3 URL here instead — no API change.
    const { id } = await storage.createAudioCache({
      contentHash,
      text,
      voice,
      speed: speedStr,
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      audioBytes: audioBuffer.byteLength,
      durationMs: Math.round(durationSec * 1000),
      wordTimestamps,
    });

    return {
      cacheId: id,
      audioBase64,
      wordTimestamps,
      duration: durationSec,
      cached: false,
    };
  }

  // GET /api/audio-cache/:id — fetch a cached audio + timestamps payload by id.
  // Consumed by the v2 KaraokeText component (client/src/hooks/useKaraoke.ts).
  app.get("/api/audio-cache/:id", requireAuth, async (req: any, res) => {
    try {
      const cached = await storage.getAudioCacheById(req.params.id);
      if (!cached) return res.status(404).json({ error: "Audio not found" });

      const audioBase64 = cached.audioUrl.startsWith("data:audio/mpeg;base64,")
        ? cached.audioUrl.slice("data:audio/mpeg;base64,".length)
        : cached.audioUrl;

      await storage.touchAudioCachePlayback(cached.id);

      res.json({
        audio: audioBase64,
        audioType: "audio/mpeg",
        wordTimestamps: cached.wordTimestamps,
        duration: cached.durationMs ? cached.durationMs / 1000 : 0,
      });
    } catch (error: any) {
      console.error("Error fetching audio cache:", error);
      res.status(500).json({ error: error.message || "Failed to fetch audio" });
    }
  });

  // POST /api/audio-cache — synthesize (or hit cache) and return id + payload.
  // Used during lesson template authoring and by clients that want to ensure a passage
  // is cached for later playback. Body: { text: string, voice?: string, speed?: number }.
  app.post("/api/audio-cache", requireAuth, async (req: any, res) => {
    try {
      const { text, voice, speed } = req.body ?? {};
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "No text provided" });
      }
      if (text.length > 4000) {
        // OpenAI TTS hard cap is 4096 chars; we leave a small margin.
        return res.status(413).json({ error: "Text too long (max 4000 chars)" });
      }
      const result = await synthesizeAndCache(text, { voice, speed });
      res.json({
        id: result.cacheId,
        audio: result.audioBase64,
        audioType: "audio/mpeg",
        wordTimestamps: result.wordTimestamps,
        duration: result.duration,
        cached: result.cached,
      });
    } catch (error: any) {
      console.error("Error in /api/audio-cache:", error);
      res.status(500).json({ error: error.message || "Failed to synthesize audio" });
    }
  });

  // ----- Mastery checks (separate from practice) -----
  // Build a fresh mastery check for a child + skill. Items come from the template's
  // checkpoint or challenge bank, NOT the practice (formative) bank.
  app.post("/api/mastery-check/build", requireAuth, async (req: any, res) => {
    try {
      const { childId, skillId, skillName, templateId, tier, itemCount } = req.body ?? {};
      if (!childId || !skillId || !skillName) {
        return res.status(400).json({ error: "childId, skillId, skillName required" });
      }
      // Authorization: parent must own this child, or child must be self.
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { buildMasteryCheck } = await import("./masteryCheck");
      const result = await buildMasteryCheck({
        childId,
        skillId,
        skillName,
        templateId,
        tier,
        itemCount,
      });
      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/mastery-check/build:", error);
      res.status(400).json({ error: error.message || "Failed to build mastery check" });
    }
  });

  // Score a completed mastery check and feed the verdict into the progression engine.
  app.post("/api/mastery-check/:lessonId/score", requireAuth, async (req: any, res) => {
    try {
      const lesson = await storage.getLessonInstanceById(req.params.lessonId);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { scoreMasteryCheck } = await import("./masteryCheck");
      const verdict = await scoreMasteryCheck(lesson.id);

      // Feed the verdict into the progression engine. The mastery-check verdict counts
      // as exactly one attempt against the kid's success record for this skill, but it's
      // a heavily weighted attempt — it's the only thing that gates promotion past
      // DEVELOPING because the gates also require varied contexts and spacing.
      if (lesson.targetSkillName) {
        const allSkills = await storage.getAllSkills();
        const matchedSkill = allSkills.find(
          (s) =>
            s.name === lesson.targetSkillName ||
            s.name.toLowerCase().replace(/_/g, " ") === lesson.targetSkillName.toLowerCase().replace(/_/g, " "),
        );
        if (matchedSkill) {
          const { progressionEngine } = await import("./progressionEngine");
          await progressionEngine.updateChildMastery(lesson.childId, matchedSkill.id, {
            isCorrect: verdict.passed,
            confidence: verdict.accuracy * 100,
            contextTag: lesson.lessonTemplateId
              ? `mastery-check:${lesson.lessonTemplateId}`
              : `mastery-check:${lesson.modeUsed}`,
          });
        }
      }

      res.json(verdict);
    } catch (error: any) {
      console.error("Error in /api/mastery-check/score:", error);
      res.status(500).json({ error: error.message || "Failed to score mastery check" });
    }
  });

  // ----- Intervention engine -----
  // Reads recent learning signals and tells the lesson player what to do RIGHT NOW.
  // Replaces the previous pattern where signals were collected but never consumed.

  // Get a recommendation for a lesson in progress. Player polls this after each outcome
  // (or whenever it wants a fresh suggestion). Response shape mirrors the intervention
  // engine's InterventionRecommendation type.
  app.get("/api/intervention/recommend/:lessonId", requireAuth, async (req: any, res) => {
    try {
      const lesson = await storage.getLessonInstanceById(req.params.lessonId);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(lesson.childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const { recommendIntervention } = await import("./interventionEngine");
      const rec = await recommendIntervention({
        childId: lesson.childId,
        lessonInstanceId: lesson.id,
      });
      res.json(rec);
    } catch (error: any) {
      console.error("Error in /api/intervention/recommend:", error);
      res.status(500).json({ error: error.message || "Failed to recommend intervention" });
    }
  });

  // Manual "I'm stuck" / "Take a break" — the kid told us directly. We honor it AND
  // record it as a learning signal so the temperament model picks it up over time.
  app.post("/api/intervention/manual", requireAuth, async (req: any, res) => {
    try {
      const { lessonId, request } = req.body ?? {};
      if (!lessonId || (request !== "stuck" && request !== "break")) {
        return res.status(400).json({ error: "lessonId and request ('stuck' | 'break') required" });
      }
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { progressionEngine } = await import("./progressionEngine");
      await progressionEngine.recordLearningSignal(
        lesson.childId,
        request === "stuck" ? "MANUAL_STUCK" : "MANUAL_BREAK",
        {
          lessonInstanceId: lesson.id,
          expressedFrustration: request === "stuck",
        },
      );

      const { manualInterventionAction } = await import("./interventionEngine");
      res.json(manualInterventionAction(request));
    } catch (error: any) {
      console.error("Error in /api/intervention/manual:", error);
      res.status(500).json({ error: error.message || "Failed to process intervention" });
    }
  });

  // Legacy endpoint kept for backwards compatibility — now goes through the cache so
  // repeat reads of the same passage are free. Lesson-scoped authorization preserved.
  app.post("/api/adaptive/lessons/:lessonId/audio-with-timestamps", requireAuth, async (req: any, res) => {
    try {
      const lessonId = req.params.lessonId;
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "No text provided" });
      }

      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      if (req.session.childId && req.session.childId !== lesson.childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = await synthesizeAndCache(text);
      res.json({
        audio: result.audioBase64,
        audioType: "audio/mpeg",
        wordTimestamps: result.wordTimestamps,
        duration: result.duration,
      });
    } catch (error: any) {
      console.error("Error generating audio with timestamps:", error);
      res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
  });
  
  // Get child's journey progress
  app.get("/api/adaptive/journey/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child || !child.settings) {
        return res.status(404).json({ error: "Child not found" });
      }
      
      const settings = child.settings;
      res.json({
        journeyStage: settings.journeyStage || 1,
        journeyPosition: settings.journeyPosition || 0,
        growthPoints: settings.growthPoints || 0,
        nextMilestone: ((settings.journeyStage || 1) * 10) - (settings.journeyPosition || 0),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update learner profile
  app.patch("/api/adaptive/profile/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const { readingStage, mathStage, preferredModes, sessionLengthMinutes } = req.body;
      
      // Only parents can update learner profile
      if (!req.session.userId) {
        return res.status(403).json({ error: "Only parents can update learner profile" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateLearnerProfile(childId, {
        readingStage,
        mathStage,
        preferredModes,
        sessionLengthMinutes,
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CURRICULUM PROGRESSION ROUTES
  // ============================================

  // Get curriculum progression context for a child
  app.get("/api/curriculum/progression/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      
      const { progressionEngine } = await import("./progressionEngine");
      const context = await progressionEngine.getProgressionContext(childId, child.grade);
      
      res.json(context);
    } catch (error: any) {
      console.error("Error fetching progression context:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get next skill recommendations for a child
  app.get("/api/curriculum/next-skills/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const subject = req.query.subject as string | undefined;
      
      // Authorization
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      
      const { progressionEngine } = await import("./progressionEngine");
      const recommendations = await progressionEngine.getNextSkillRecommendations(
        childId,
        child.grade,
        subject,
        5
      );
      
      res.json({ recommendations });
    } catch (error: any) {
      console.error("Error fetching next skills:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Record a learning signal during a lesson
  app.post("/api/curriculum/signals/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const { signalType, data } = req.body;
      
      // Authorization (only the child themselves can record signals)
      if (req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (!signalType || !data) {
        return res.status(400).json({ error: "signalType and data are required" });
      }
      
      const { progressionEngine } = await import("./progressionEngine");
      await progressionEngine.recordLearningSignal(childId, signalType, data);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error recording learning signal:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get learning profile for a child
  app.get("/api/curriculum/learning-profile/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { progressionEngine } = await import("./progressionEngine");
      const profile = await progressionEngine.getLearningProfileForAI(childId);
      
      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching learning profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // JOURNEY WORLD SYSTEM ROUTES
  // ============================================

  // Get journey data for a child
  app.get("/api/journey/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization: allow parent or impersonated child
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          // Check if impersonating
          if (req.session.impersonatingChildId !== childId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
      } else if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const journeyData = await storage.getJourneyData(childId);
      if (!journeyData) {
        return res.status(404).json({ error: "Journey data not available" });
      }

      res.json(journeyData);
    } catch (error: any) {
      console.error("Error fetching journey data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Start a journey tile (generate lesson and link to tile)
  app.post("/api/journey/tiles/:tileId/start", requireAuth, async (req: any, res) => {
    try {
      const tileId = req.params.tileId;
      const { childId } = req.body;
      
      // Authorization
      if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          if (req.session.impersonatingChildId !== childId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
      }

      // Get the tile
      const tile = await storage.getJourneyTileById(tileId);
      if (!tile) {
        return res.status(404).json({ error: "Tile not found" });
      }

      if (tile.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (tile.status === "LOCKED") {
        return res.status(400).json({ error: "This tile is locked" });
      }

      if (tile.status === "COMPLETED") {
        return res.status(400).json({ error: "This tile is already completed" });
      }

      // If tile already has a lesson, return it
      if (tile.lessonInstanceId) {
        return res.json({ 
          tile,
          lessonInstanceId: tile.lessonInstanceId,
          message: "Resuming existing lesson"
        });
      }

      // Generate a new lesson for this tile
      const lessonInstance = await adaptiveEngine.buildLessonInstance(childId, tile.subject);
      
      // Link lesson to tile
      await storage.updateJourneyTile(tileId, { 
        lessonInstanceId: lessonInstance.id 
      });

      res.json({
        tile: { ...tile, lessonInstanceId: lessonInstance.id },
        lessonInstanceId: lessonInstance.id,
        message: "Lesson created for tile"
      });
    } catch (error: any) {
      console.error("Error starting journey tile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Complete a journey tile (called after lesson completion)
  app.post("/api/journey/tiles/:tileId/complete", requireAuth, async (req: any, res) => {
    try {
      const tileId = req.params.tileId;
      const { childId } = req.body;
      
      // Authorization
      if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tile = await storage.getJourneyTileById(tileId);
      if (!tile || tile.childId !== childId) {
        return res.status(404).json({ error: "Tile not found" });
      }

      if (tile.status === "COMPLETED") {
        return res.json({ tile, message: "Tile already completed" });
      }

      // Mark tile as completed
      const completedTile = await storage.updateJourneyTile(tileId, {
        status: "COMPLETED",
        completedAt: new Date()
      });

      // Update world progress
      const worldProgress = await storage.getChildWorldProgress(childId, tile.worldId);
      if (worldProgress) {
        const newTilesCompleted = worldProgress.tilesCompleted + 1;
        const newCurrentTile = tile.tileNumber + 1;
        
        await storage.updateChildWorldProgress(childId, tile.worldId, {
          tilesCompleted: newTilesCompleted,
          currentTile: newCurrentTile,
        });
      }

      // Unlock next tile
      const tiles = await storage.getJourneyTiles(childId, tile.worldId);
      const nextTile = tiles.find(t => t.tileNumber === tile.tileNumber + 1);
      if (nextTile && nextTile.status === "LOCKED") {
        await storage.updateJourneyTile(nextTile.id, { status: "CURRENT" });
      }

      // Check for tool reward
      let awardedTool = null;
      if (tile.rewardToolId) {
        awardedTool = await storage.awardWorldTool(
          childId, 
          tile.rewardToolId, 
          tile.tileNumber,
          tile.lessonInstanceId || undefined
        );
      }

      // Check for world completion
      const world = await storage.getWorldBySlug(tile.worldId);
      const allTiles = await storage.getJourneyTiles(childId, tile.worldId);
      const completedCount = allTiles.filter(t => t.status === "COMPLETED").length;
      
      let worldCompleted = false;
      if (world && completedCount >= world.tilesCount) {
        await storage.updateChildWorldProgress(childId, tile.worldId, {
          status: "COMPLETED",
          completedAt: new Date(),
        });
        worldCompleted = true;

        // Unlock next world
        const allWorlds = await storage.getAllWorlds();
        const currentWorldIndex = allWorlds.findIndex(w => w.id === tile.worldId);
        if (currentWorldIndex >= 0 && currentWorldIndex < allWorlds.length - 1) {
          const nextWorld = allWorlds[currentWorldIndex + 1];
          await storage.initializeChildWorldProgress(childId, nextWorld.id);
        }
      }

      res.json({
        tile: completedTile,
        awardedTool,
        worldCompleted,
        message: worldCompleted ? "World completed! New world unlocked!" : "Tile completed!"
      });
    } catch (error: any) {
      console.error("Error completing journey tile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all worlds
  app.get("/api/journey/worlds", requireAuth, async (req: any, res) => {
    try {
      const worlds = await storage.getAllWorlds();
      res.json(worlds);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get world tools
  app.get("/api/journey/worlds/:worldId/tools", requireAuth, async (req: any, res) => {
    try {
      const tools = await storage.getWorldTools(req.params.worldId);
      res.json(tools);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get child's earned tools
  app.get("/api/journey/children/:childId/tools", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      
      // Authorization
      if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const tools = await storage.getChildEarnedTools(childId);
      res.json(tools);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // DAILY QUEUE (LEARNING OS) ROUTES
  // ============================================

  // Get or generate today's learning queue
  app.get("/api/daily-queue/:childId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      // Authorization
      if (req.session.childId && req.session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(childId);
        if (!child || child.parentId !== req.session.userId) {
          if (req.session.impersonatingChildId !== childId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
      }

      const { getOrCreateDailyQueue } = await import("./dailyQueueEngine");
      const queue = await getOrCreateDailyQueue(childId, date);
      
      res.json(queue);
    } catch (error: any) {
      console.error("Error fetching daily queue:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update a queue item status (start, complete, skip)
  app.patch("/api/daily-queue/:queueId/items/:itemId", requireAuth, async (req: any, res) => {
    try {
      const { queueId, itemId } = req.params;
      const { status } = req.body;
      
      if (!["IN_PROGRESS", "COMPLETED", "SKIPPED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const queue = await storage.getDailyQueueById(queueId);
      if (!queue) {
        return res.status(404).json({ error: "Queue not found" });
      }

      // Authorization - check if child session matches
      if (req.session.childId && req.session.childId !== queue.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Authorization - check if parent owns this child
      if (req.session.userId) {
        const child = await storage.getChildById(queue.childId);
        if (!child || child.parentId !== req.session.userId) {
          if (req.session.impersonatingChildId !== queue.childId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
      }

      const { updateQueueItemStatus } = await import("./dailyQueueEngine");
      const updated = await updateQueueItemStatus(queueId, itemId, status);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating queue item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Start a lesson from a queue item
  app.post("/api/daily-queue/:queueId/items/:itemId/start-lesson", requireAuth, async (req: any, res) => {
    try {
      const { queueId, itemId } = req.params;

      const queue = await storage.getDailyQueueById(queueId);
      if (!queue) {
        return res.status(404).json({ error: "Queue not found" });
      }

      // Authorization
      if (req.session.childId && req.session.childId !== queue.childId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.session.userId) {
        const child = await storage.getChildById(queue.childId);
        if (!child || child.parentId !== req.session.userId) {
          if (req.session.impersonatingChildId !== queue.childId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
      }

      const item = queue.items.find(i => i.id === itemId);
      if (!item) {
        return res.status(404).json({ error: "Queue item not found" });
      }

      if (item.lessonInstanceId) {
        return res.json({ lessonInstanceId: item.lessonInstanceId, message: "Resuming existing lesson" });
      }

      if (!item.skillId || !item.subject) {
        return res.status(400).json({ error: "Item does not have a skill to start" });
      }

      // Generate lesson for this skill
      const lessonInstance = await adaptiveEngine.buildLessonInstance(
        queue.childId,
        item.subject,
        item.skillId
      );

      // Link lesson to queue item
      const updatedItems = queue.items.map(i => {
        if (i.id === itemId) {
          return { ...i, lessonInstanceId: lessonInstance.id, status: "IN_PROGRESS" as const };
        }
        return i;
      });

      await storage.updateDailyQueue(queueId, {
        items: updatedItems,
        status: "IN_PROGRESS",
        startedAt: queue.startedAt || new Date(),
      });

      res.json({
        lessonInstanceId: lessonInstance.id,
        message: "Lesson created from queue item"
      });
    } catch (error: any) {
      console.error("Error starting lesson from queue:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Regenerate queue for a specific date (force new queue)
  app.post("/api/daily-queue/:childId/regenerate", requireAuth, async (req: any, res) => {
    try {
      const childId = req.params.childId;
      const date = req.body.date || new Date().toISOString().split('T')[0];
      
      // Only parents can regenerate queues
      if (!req.session.userId) {
        return res.status(403).json({ error: "Only parents can regenerate queues" });
      }
      
      const child = await storage.getChildById(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete existing queue for this date
      const existingQueue = await storage.getDailyQueue(childId, date);
      if (existingQueue) {
        await storage.updateDailyQueue(existingQueue.id, { status: "REGENERATED" as any });
      }

      // Generate new queue
      const { generateDailyQueue } = await import("./dailyQueueEngine");
      const items = await generateDailyQueue(childId, date);
      const newQueue = await storage.createDailyQueue({
        childId,
        date,
        items,
        totalItems: items.length,
      });
      
      res.json(newQueue);
    } catch (error: any) {
      console.error("Error regenerating queue:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SOCIAL WORLD V1 - BUDDY SYSTEM ROUTES
  // ============================================

  // Search for children by username to add as buddies
  app.get("/api/social/search", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }

      const results = await storage.searchChildrenByUsername(q, childId);
      
      // Filter out existing buddies and pending requests
      const buddies = await storage.getActiveBuddies(childId);
      const buddyIds = new Set(buddies.map(b => b.id));
      
      const filtered = results.filter(r => !buddyIds.has(r.id));
      
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send buddy request
  app.post("/api/social/buddies/request", requireAuth, async (req: any, res) => {
    try {
      const requesterId = req.session.childId;
      if (!requesterId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { receiverUsername } = req.body;
      if (!receiverUsername) {
        return res.status(400).json({ error: "Receiver username required" });
      }

      // Find the receiver
      const receiver = await storage.getChildByUsername(receiverUsername);
      if (!receiver) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already buddies or request exists
      const existing = await storage.getBuddyLinkBetweenChildren(requesterId, receiver.id);
      if (existing) {
        if (existing.status === "ACTIVE") {
          return res.status(400).json({ error: "Already buddies" });
        }
        if (existing.status !== "DECLINED") {
          return res.status(400).json({ error: "Buddy request already pending" });
        }
      }

      const link = await storage.createBuddyRequest(requesterId, receiver.id);
      res.json({ success: true, buddyLink: link });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get my buddies list
  app.get("/api/social/buddies", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const buddies = await storage.getActiveBuddies(childId);
      res.json(buddies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending buddy requests for child to accept
  app.get("/api/social/buddies/pending", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const pending = await storage.getPendingBuddyRequestsForChild(childId);
      res.json(pending);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get buddy requests waiting for parent approval
  app.get("/api/social/buddies/waiting", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const waiting = await storage.getBuddiesWaitingForApproval(childId);
      res.json(waiting);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept buddy request (as receiver child)
  app.post("/api/social/buddies/:buddyLinkId/accept", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { buddyLinkId } = req.params;
      const link = await storage.getBuddyLinkById(buddyLinkId);
      
      if (!link || link.receiverId !== childId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await storage.acceptBuddyRequest(buddyLinkId);
      res.json({ success: true, buddyLink: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Decline buddy request (as receiver child)
  app.post("/api/social/buddies/:buddyLinkId/decline", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { buddyLinkId } = req.params;
      const link = await storage.getBuddyLinkById(buddyLinkId);
      
      if (!link || link.receiverId !== childId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await storage.declineBuddyRequest(buddyLinkId, "RECEIVER");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove buddy
  app.delete("/api/social/buddies/:buddyLinkId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { buddyLinkId } = req.params;
      const link = await storage.getBuddyLinkById(buddyLinkId);
      
      if (!link || (link.requesterId !== childId && link.receiverId !== childId)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.removeBuddy(buddyLinkId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SOCIAL WORLD V1 - ACTIVITY FEED ROUTES
  // ============================================

  // Get activity feed (own + buddies)
  app.get("/api/social/feed", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const feed = await storage.getActivityFeedForChild(childId, limit);
      res.json(feed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add reaction to activity
  app.post("/api/social/feed/:activityId/react", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { activityId } = req.params;
      const { reactionType } = req.body;

      // Validate reaction type - only 5 pre-approved reactions for child safety
      const validReactions = ["NICE_WORK", "SO_COOL", "GREAT_JOB", "AMAZING", "WAY_TO_GO"];
      if (!validReactions.includes(reactionType)) {
        return res.status(400).json({ error: "Invalid reaction type" });
      }

      // Check if activity exists and is visible to this child
      const activity = await storage.getActivityEventById(activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // Verify child can see this activity (either their own or a buddy's)
      if (activity.childId !== childId) {
        const buddies = await storage.getActiveBuddies(childId);
        if (!buddies.some(b => b.id === activity.childId)) {
          return res.status(403).json({ error: "Cannot react to this activity" });
        }
      }

      const reaction = await storage.addReaction(activityId, childId, reactionType);
      res.json(reaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove reaction
  app.delete("/api/social/reactions/:reactionId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      // Note: In production, verify the reaction belongs to this child
      await storage.removeReaction(req.params.reactionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Share a badge to the activity feed
  app.post("/api/social/share/badge", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { badgeSlug, badgeName, badgeCategory } = req.body;
      if (!badgeSlug || !badgeName) {
        return res.status(400).json({ error: "Badge details required" });
      }

      // Verify child actually earned this badge
      const earnedBadges = await storage.getEarnedBadges(childId);
      const hasEarnedBadge = earnedBadges.some(eb => eb.badge.slug === badgeSlug);
      
      if (!hasEarnedBadge) {
        return res.status(403).json({ error: "You haven't earned this badge yet!" });
      }

      // Create activity event for the shared badge
      const event = await storage.createActivityEvent({
        childId,
        eventType: "BADGE_SHARED",
        metadata: {
          badgeSlug,
          badgeName,
          badgeCategory,
        },
        visibility: "BUDDIES_ONLY",
      });

      res.json({ success: true, event });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Share a completed lesson to activity feed
  app.post("/api/social/share/lesson", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { lessonId, lessonTitle, subject, accuracy, pointsEarned } = req.body;
      if (!lessonId || !lessonTitle) {
        return res.status(400).json({ error: "Lesson details required" });
      }

      // Verify child actually completed this lesson
      const lesson = await storage.getLessonInstanceById(lessonId);
      if (!lesson || lesson.childId !== childId) {
        return res.status(403).json({ error: "Lesson not found or not yours" });
      }
      
      if (lesson.status !== "COMPLETED") {
        return res.status(400).json({ error: "Lesson not completed yet" });
      }

      // Create activity event for the shared lesson
      const event = await storage.createActivityEvent({
        childId,
        eventType: "LESSON_COMPLETED",
        subjectArea: subject,
        metadata: {
          lessonId,
          lessonTitle,
          accuracy: accuracy || 0,
          pointsEarned: pointsEarned || 0,
        },
        visibility: "BUDDIES_ONLY",
      });

      res.json({ success: true, event });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SOCIAL WORLD V1 - PARENT OVERSIGHT ROUTES
  // ============================================

  // Get pending buddy requests for parent approval
  app.get("/api/parent/social/buddy-requests", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const pending = await storage.getPendingBuddyRequestsForParent(parentId);
      
      // Transform to include frontend-expected fields
      const transformed = pending.map(p => ({
        id: p.id,
        requesterId: p.requesterId,
        receiverId: p.receiverId,
        status: p.status,
        requesterApproved: !!p.requesterParentApprovedAt,
        receiverApproved: !!p.receiverParentApprovedAt,
        createdAt: p.createdAt,
        requester: {
          id: p.requester.id,
          name: p.requester.name,
          username: p.requester.username,
          avatarTraits: (p.requester as any).avatarTraits || null,
        },
        receiver: {
          id: p.receiver.id,
          name: p.receiver.name,
          username: p.receiver.username,
          avatarTraits: (p.receiver as any).avatarTraits || null,
        },
        myChildRole: p.isRequesterChild ? "requester" : "receiver",
        myChildId: p.isRequesterChild ? p.requester.id : p.receiver.id,
        myChildName: p.isRequesterChild ? p.requester.name : p.receiver.name,
      }));
      
      res.json(transformed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve buddy request (as parent)
  app.post("/api/parent/social/buddy-requests/:buddyLinkId/approve", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const { buddyLinkId } = req.params;
      const link = await storage.getBuddyLinkById(buddyLinkId);
      
      if (!link) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Verify this parent owns either the requester or receiver child
      const requester = await storage.getChildById(link.requesterId);
      const receiver = await storage.getChildById(link.receiverId);
      
      const ownsRequester = requester?.parentId === parentId;
      const ownsReceiver = receiver?.parentId === parentId;
      
      if (!ownsRequester && !ownsReceiver) {
        return res.status(403).json({ error: "Not your child's request" });
      }

      // Determine which parent role to use based on the link status
      // This handles the sibling case where the same parent owns both children
      let isRequesterParent: boolean;
      if (link.status === "PENDING_REQUESTER_APPROVAL") {
        // Requester's parent needs to approve
        if (!ownsRequester) {
          return res.status(400).json({ error: "Waiting for requester's parent approval" });
        }
        isRequesterParent = true;
      } else if (link.status === "PENDING_RECEIVER_APPROVAL") {
        // Receiver's parent needs to approve
        if (!ownsReceiver) {
          return res.status(400).json({ error: "Waiting for receiver's parent approval" });
        }
        isRequesterParent = false;
      } else {
        return res.status(400).json({ error: "This request is not waiting for parent approval" });
      }

      const updated = await storage.approveBuddyRequestByParent(buddyLinkId, isRequesterParent);
      res.json({ success: true, buddyLink: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Decline buddy request (as parent)
  app.post("/api/parent/social/buddy-requests/:buddyLinkId/decline", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const { buddyLinkId } = req.params;
      const link = await storage.getBuddyLinkById(buddyLinkId);
      
      if (!link) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Verify this parent owns either the requester or receiver child
      const requester = await storage.getChildById(link.requesterId);
      const receiver = await storage.getChildById(link.receiverId);
      
      let declinedBy = "";
      if (requester?.parentId === parentId) {
        declinedBy = "REQUESTER_PARENT";
      } else if (receiver?.parentId === parentId) {
        declinedBy = "RECEIVER_PARENT";
      } else {
        return res.status(403).json({ error: "Not your child's request" });
      }

      const updated = await storage.declineBuddyRequest(buddyLinkId, declinedBy);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get child's buddy list (for parent)
  app.get("/api/parent/children/:childId/buddies", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const { childId } = req.params;
      const child = await storage.getChildById(childId);
      
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Not your child" });
      }

      const buddies = await storage.getActiveBuddies(childId);
      res.json(buddies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get child's activity events (for parent)
  app.get("/api/parent/children/:childId/activity", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const { childId } = req.params;
      const child = await storage.getChildById(childId);
      
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Not your child" });
      }

      const events = await storage.getChildActivityEvents(childId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get reactions received by child (for parent)
  app.get("/api/parent/children/:childId/reactions", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const { childId } = req.params;
      const child = await storage.getChildById(childId);
      
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Not your child" });
      }

      const reactions = await storage.getChildReactionsReceived(childId);
      res.json(reactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get child's journey preview (for parent to see what child is learning)
  app.get("/api/parent/children/:childId/journey-preview", requireAuth, async (req: any, res) => {
    try {
      const parentId = req.session.userId;
      if (!parentId || req.session.role !== "PARENT") {
        return res.status(403).json({ error: "Parent access only" });
      }

      const { childId } = req.params;
      const child = await storage.getChildById(childId);
      
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ error: "Not your child" });
      }

      const preview = await storage.getJourneyPreviewForParent(childId);
      res.json(preview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // BUDDY PROFILE ROUTES
  // ============================================

  // Get buddy profile (anyone can view if they are buddies)
  app.get("/api/buddy-profile/:childId", requireAuth, async (req: any, res) => {
    try {
      // Get viewer's child ID from either direct login or parent impersonation
      const viewerChildId = req.session.childId || req.session.impersonation?.childId;
      const { childId } = req.params;
      
      // Allow viewing own profile or buddy profiles
      if (viewerChildId && viewerChildId !== childId) {
        // Check if they are buddies
        const buddies = await storage.getActiveBuddies(viewerChildId);
        const isBuddy = buddies.some(b => b.id === childId);
        if (!isBuddy) {
          return res.status(403).json({ error: "You can only view your buddies' profiles" });
        }
      }

      // Get child info
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }

      // Get or create profile
      let profile = await storage.getBuddyProfile(childId);
      if (!profile) {
        profile = await storage.createBuddyProfile(childId);
      }

      // Get profile reactions
      const reactions = await storage.getProfileReactions(childId);

      // Get recent activity
      const recentActivity = await storage.getChildActivityEvents(childId, 5);

      // Get earned badges
      const earnedBadges = await storage.getEarnedBadges(childId);

      // Get progression stats
      const avatarState = await storage.getAvatarState(childId);

      res.json({
        child: {
          id: child.id,
          name: child.name,
          username: child.username,
          grade: child.grade,
          avatarTraits: (child as any).avatarTraits || null,
        },
        profile,
        reactions,
        recentActivity,
        earnedBadges: earnedBadges.map(eb => ({
          id: eb.id,
          earnedAt: eb.earnedAt,
          badge: eb.badge,
        })),
        stats: avatarState ? {
          level: avatarState.level,
          xp: avatarState.currentXP,
        } : null,
        isOwnProfile: viewerChildId === childId,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update own buddy profile
  app.patch("/api/buddy-profile", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { theme, accentColor, identityTags, learningStyles, funFacts, favoriteSubjects, topBuddyIds } = req.body;

      // Validate topBuddyIds are actual buddies
      if (topBuddyIds && Array.isArray(topBuddyIds) && topBuddyIds.length > 0) {
        const buddies = await storage.getActiveBuddies(childId);
        const buddyIds = buddies.map(b => b.id);
        for (const id of topBuddyIds) {
          if (!buddyIds.includes(id)) {
            return res.status(400).json({ error: "Selected top buddies must be your actual buddies" });
          }
        }
        if (topBuddyIds.length > 3) {
          return res.status(400).json({ error: "Maximum 3 top buddies allowed" });
        }
      }

      // Get or create profile first
      let profile = await storage.getBuddyProfile(childId);
      if (!profile) {
        profile = await storage.createBuddyProfile(childId);
      }

      // Update profile
      const updated = await storage.updateBuddyProfile(childId, {
        theme,
        accentColor,
        identityTags,
        learningStyles,
        funFacts,
        favoriteSubjects,
        topBuddyIds,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add reaction to profile
  app.post("/api/buddy-profile/:childId/react", requireAuth, async (req: any, res) => {
    try {
      const reactorChildId = req.session.childId;
      if (!reactorChildId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { childId } = req.params;
      const { reactionType } = req.body;

      // Cannot react to own profile
      if (reactorChildId === childId) {
        return res.status(400).json({ error: "Cannot react to your own profile" });
      }

      // Must be buddies
      const buddies = await storage.getActiveBuddies(reactorChildId);
      const isBuddy = buddies.some(b => b.id === childId);
      if (!isBuddy) {
        return res.status(403).json({ error: "You can only react to your buddies' profiles" });
      }

      // Valid reaction types
      const validReactions = ["NICE", "SO_COOL", "INSPIRING"];
      if (!validReactions.includes(reactionType)) {
        return res.status(400).json({ error: "Invalid reaction type" });
      }

      const reaction = await storage.addProfileReaction(childId, reactorChildId, reactionType);
      res.json(reaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // BUDDY POKES
  // ============================================

  // Get all notifications (pokes + reactions received)
  app.get("/api/social/notifications/all", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      // Get unacknowledged pokes
      const pokes = await storage.getUnacknowledgedPokes(childId);
      
      // Get recent reactions on the child's activity (last 20)
      const reactions = await storage.getReactionsForChildActivity(childId, 20);

      // Format into unified notification structure
      const pokeNotifications = pokes.map(p => ({
        id: p.id,
        type: "WAVE" as const,
        fromChildId: p.senderChildId,
        fromChildName: p.sender.name,
        fromChildAvatarTraits: (p.sender as any).avatarTraits || null,
        createdAt: p.createdAt,
        acknowledged: false,
        metadata: null,
      }));

      const reactionNotifications = reactions.map((r: any) => ({
        id: r.id,
        type: "REACTION" as const,
        fromChildId: r.childId,
        fromChildName: r.reactor.name,
        fromChildAvatarTraits: r.reactor?.avatarTraits || null,
        createdAt: r.createdAt,
        acknowledged: true, // Reactions don't need acknowledgement
        metadata: {
          reactionType: r.reactionType,
          activityEventId: r.activityEventId,
          activityEventType: (r.activity.metadata as any)?.type || r.activity.eventType,
        },
      }));

      // Combine and sort by date, most recent first
      const allNotifications = [...pokeNotifications, ...reactionNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30);

      res.json({
        notifications: allNotifications,
        unreadCount: pokes.length, // Unread = unacknowledged pokes
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get notifications (unacknowledged pokes) - legacy endpoint
  app.get("/api/social/notifications", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const pokes = await storage.getUnacknowledgedPokes(childId);
      res.json(pokes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a poke to a buddy
  app.post("/api/social/buddies/:buddyChildId/poke", requireAuth, async (req: any, res) => {
    try {
      const senderChildId = req.session.childId;
      if (!senderChildId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { buddyChildId } = req.params;

      // Cannot poke yourself
      if (senderChildId === buddyChildId) {
        return res.status(400).json({ error: "Cannot poke yourself" });
      }

      // Must be active buddies
      const buddies = await storage.getActiveBuddies(senderChildId);
      const buddy = buddies.find(b => b.id === buddyChildId);
      if (!buddy) {
        return res.status(403).json({ error: "You can only poke active buddies" });
      }

      // Get the buddy link
      const buddyLink = await storage.getBuddyLinkBetweenChildren(senderChildId, buddyChildId);
      if (!buddyLink || buddyLink.status !== "ACTIVE") {
        return res.status(403).json({ error: "Buddy connection not active" });
      }

      // Check rate limit (can only poke once per hour per buddy)
      const canPoke = await storage.canSendPoke(buddyLink.id, senderChildId);
      if (!canPoke) {
        return res.status(429).json({ error: "You already waved at this buddy recently. Try again in about an hour!" });
      }

      const poke = await storage.sendPoke(buddyLink.id, senderChildId, buddyChildId);
      res.json(poke);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Acknowledge a poke (wave back)
  app.post("/api/social/notifications/:pokeId/acknowledge", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { pokeId } = req.params;

      const result = await storage.acknowledgePoke(pokeId, childId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check if can poke a specific buddy
  app.get("/api/social/buddies/:buddyChildId/can-poke", requireAuth, async (req: any, res) => {
    try {
      const senderChildId = req.session.childId;
      if (!senderChildId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { buddyChildId } = req.params;

      // Get the buddy link
      const buddyLink = await storage.getBuddyLinkBetweenChildren(senderChildId, buddyChildId);
      if (!buddyLink || buddyLink.status !== "ACTIVE") {
        return res.json({ canPoke: false, reason: "Not active buddies" });
      }

      const canPoke = await storage.canSendPoke(buddyLink.id, senderChildId);
      res.json({ canPoke, reason: canPoke ? null : "Already poked recently" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AI TEACHER ENDPOINTS
  // ============================================

  // Send message to AI Teacher
  app.post("/api/ai-teacher/message", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { 
        message, 
        lessonInstanceId, 
        inputMode, 
        sessionId: existingSessionId,
        lessonTitle: clientLessonTitle,
        lessonSubject: clientLessonSubject,
        lessonObjective: clientLessonObjective,
        currentStep: clientCurrentStep,
        currentPhase: clientCurrentPhase,
      } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get child data for personalization
      const child = await storage.getChildById(childId);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }

      // Get or create session
      let session;
      if (existingSessionId) {
        session = await storage.getAiTeacherSession(existingSessionId);
        if (!session || session.childId !== childId) {
          return res.status(404).json({ error: "Session not found" });
        }
      } else if (lessonInstanceId) {
        // Try to get existing active session for this lesson
        session = await storage.getActiveSessionForLesson(childId, lessonInstanceId);
        if (!session) {
          // Get lesson context
          const lesson = await storage.getLessonInstanceById(lessonInstanceId);
          session = await storage.createAiTeacherSession({
            childId,
            lessonInstanceId,
            subject: lesson?.subject,
            currentStep: lesson?.progressStepIndex || 0,
          });
        }
      } else {
        // General help mode - get or create active session
        session = await storage.getActiveSessionForChild(childId);
        if (!session) {
          session = await storage.createAiTeacherSession({ childId });
        }
      }

      // Save child's message
      await storage.createAiTeacherMessage({
        sessionId: session.id,
        role: "child",
        content: message,
        inputMode: inputMode || "text",
      });

      // Update session with current step info from client for tracking
      if (clientCurrentStep !== undefined || clientCurrentPhase !== undefined) {
        // Convert phase to step number for tracking (rough approximation)
        const phaseToStep: Record<string, number> = {
          concept: 1,
          worked_example: 2,
          worked_example_step: 3,
          worked_example_conclusion: 4,
          instruction: 5,
          practice: 6,
          question: 7,
          complete: 8,
        };
        const stepNum = phaseToStep[clientCurrentPhase || "concept"] || 0;
        await storage.updateAiTeacherSession(session.id, { currentStep: stepNum });
      }

      // Get conversation history for context
      const conversationHistory = await storage.getMessagesForSession(session.id);

      // Build personalization context
      const settings = child.settings;
      const grade = child.grade;
      const gradeNum = grade === "K" ? 0 : parseInt(grade) || 1;
      
      // Adjust language complexity by grade
      const vocabularyLevel = gradeNum <= 1 ? "very simple words (K-1 level)" 
        : gradeNum <= 2 ? "simple words (1-2 grade level)"
        : "grade-appropriate vocabulary (3-5 grade level)";
      
      const sentenceLength = gradeNum <= 1 ? "very short sentences (5-8 words max)"
        : gradeNum <= 2 ? "short sentences (8-12 words)"
        : "moderate sentences (12-20 words)";

      // Learning style adaptations
      const learningStyleGuides: Record<string, string> = {
        "HANDS_ON_MONTESSORI": "Use physical/tactile examples. Suggest touching, counting, or building things.",
        "BALANCED": "Mix explanations with hands-on suggestions and visuals.",
        "DIGITAL_LIGHT": "Focus on discussion and exploration rather than screen activities.",
      };
      const learningGuide = learningStyleGuides[settings?.learningStyle || "BALANCED"] || learningStyleGuides["BALANCED"];

      // Faith mode integration
      const faithModeGuides: Record<string, string> = {
        "FULL_DISCIPLESHIP": "Weave in scripture references and Jesus-centered encouragement naturally.",
        "FAITH_FORWARD": "Include occasional faith-based encouragement when relevant.",
        "VALUES_ONLY": "Focus on character values like kindness, honesty, and perseverance.",
      };
      const faithGuide = faithModeGuides[settings?.faithMode || "FAITH_FORWARD"] || faithModeGuides["FAITH_FORWARD"];

      // Confidence adaptation
      const confidence = settings?.confidence || 50;
      const encouragementLevel = confidence < 40 
        ? "Give extra encouragement and celebrate every small step. Be very patient and reassuring."
        : confidence > 70 
        ? "Offer appropriate challenge and acknowledge their confidence."
        : "Balance encouragement with gentle guidance.";

      // Dyslexia support
      const dyslexiaInstructions = settings?.dyslexiaSupport
        ? "IMPORTANT: This child has dyslexia support enabled. Use very short sentences. Avoid complex words. Break down instructions into tiny steps."
        : "";

      // Get lesson context - prefer real-time values from client, fallback to DB
      let lessonContext = "";
      if (clientLessonTitle || session.lessonInstanceId) {
        // Use client-provided real-time context if available
        const lessonTitle = clientLessonTitle;
        const lessonSubject = clientLessonSubject;
        const lessonObjective = clientLessonObjective;
        const stepDescription = clientCurrentStep;
        const phase = clientCurrentPhase;
        
        // Build context from client values or fetch from DB as fallback
        if (lessonTitle) {
          lessonContext = `
Current lesson: "${lessonTitle}"
Subject: ${lessonSubject || "Unknown"}
Objective: ${lessonObjective || "Learning new concepts"}
${stepDescription ? `Current activity: ${stepDescription}` : ""}
${phase ? `Phase: ${phase === "concept" ? "Learning new concept" : phase === "practice" ? "Practice time" : phase === "question" ? "Assessment question" : phase}` : ""}`;
        } else if (session.lessonInstanceId) {
          // Fallback to DB if no client context
          const lesson = await storage.getLessonInstanceById(session.lessonInstanceId);
          if (lesson) {
            lessonContext = `
Current lesson: "${lesson.title}"
Subject: ${lesson.subject}
Objective: ${lesson.objective}`;
          }
        }
      }

      // Build system prompt for AI Teacher
      const systemPrompt = `You are a warm, patient AI Teacher helping ${child.name}, a ${grade === "K" ? "Kindergarten" : `Grade ${grade}`} student.

COMMUNICATION STYLE:
- Use ${vocabularyLevel}
- Use ${sentenceLength}
- ${learningGuide}
- ${faithGuide}
- ${encouragementLevel}
${dyslexiaInstructions}

BEHAVIOR RULES:
1. Always be encouraging and positive - never criticize
2. Break down complex ideas into tiny, manageable steps
3. Use lots of examples from everyday life
4. If the child seems confused, try explaining differently
5. Celebrate their efforts, not just correct answers
6. Keep responses short and focused - young children have short attention spans
7. Use simple analogies they can relate to (toys, animals, family, nature)
8. If they're stuck, ask guiding questions instead of giving answers directly
${lessonContext ? `
CURRENT LESSON CONTEXT:
${lessonContext}
Help the child with questions related to this lesson.` : ""}

Remember: You're talking to a young child. Be warm, patient, and make learning fun!`;

      // Build conversation messages for OpenAI
      const openaiMessages: Array<{role: "system" | "user" | "assistant", content: string}> = [
        { role: "system", content: systemPrompt }
      ];

      // Add conversation history
      for (const msg of conversationHistory) {
        openaiMessages.push({
          role: msg.role === "child" ? "user" : "assistant",
          content: msg.content,
        });
      }

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm here to help! What would you like to learn about?";

      // Save AI response
      const savedAssistantMessage = await storage.createAiTeacherMessage({
        sessionId: session.id,
        role: "teacher",
        content: aiResponse,
        outputMode: "text",
      });

      // Get the child's message that was just saved (most recent child message)
      const allMessages = await storage.getMessagesForSession(session.id);
      const userMessages = allMessages.filter(m => m.role === "child");
      const lastUserMessage = userMessages[userMessages.length - 1];

      res.json({
        sessionId: session.id,
        userMessage: lastUserMessage ? {
          id: lastUserMessage.id,
          role: "child",
          content: lastUserMessage.content,
          createdAt: lastUserMessage.createdAt,
        } : null,
        assistantMessage: {
          id: savedAssistantMessage.id,
          role: "assistant",
          content: aiResponse,
          createdAt: savedAssistantMessage.createdAt,
        },
      });
    } catch (error: any) {
      console.error("AI Teacher error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get chat history for a session
  app.get("/api/ai-teacher/session/:sessionId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const session = await storage.getAiTeacherSession(req.params.sessionId);
      if (!session || session.childId !== childId) {
        return res.status(404).json({ error: "Session not found" });
      }

      const messages = await storage.getMessagesForSession(session.id);

      res.json({
        session,
        messages,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get session by lesson instance ID
  app.get("/api/ai-teacher/session/lesson/:lessonInstanceId", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const session = await storage.getActiveSessionForLesson(req.params.lessonInstanceId);
      if (!session) {
        return res.status(404).json({ error: "No active session found" });
      }
      
      if (session.childId !== childId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getMessagesForSession(session.id);

      res.json({
        session: {
          id: session.id,
          status: session.status,
        },
        messages: messages.map(m => ({
          id: m.id,
          role: m.role === "teacher" ? "assistant" : "child",
          content: m.content,
          createdAt: m.createdAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Text-to-speech for AI responses
  app.post("/api/ai-teacher/speak", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      // Generate speech using OpenAI TTS
      const mp3Response = await openaiDirect.audio.speech.create({
        model: "tts-1",
        voice: "shimmer", // Warm, friendly voice
        input: text,
      });

      // Convert to buffer and send as base64
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      const base64Audio = buffer.toString("base64");

      res.json({
        audio: base64Audio,
        format: "mp3",
      });
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // End AI Teacher session
  app.post("/api/ai-teacher/session/:sessionId/end", requireAuth, async (req: any, res) => {
    try {
      const childId = req.session.childId || req.session.impersonation?.childId;
      if (!childId) {
        return res.status(403).json({ error: "Child access only" });
      }

      const session = await storage.getAiTeacherSession(req.params.sessionId);
      if (!session || session.childId !== childId) {
        return res.status(404).json({ error: "Session not found" });
      }

      const endedSession = await storage.endAiTeacherSession(session.id);
      res.json({ session: endedSession });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PARENT COMMUNITY API ENDPOINTS
  // ============================================

  // Get current parent's community profile
  app.get("/api/community/profile", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      const profile = await storage.getParentProfile(req.session.userId);
      res.json({ profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update parent community profile
  app.post("/api/community/profile", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const existing = await storage.getParentProfile(req.session.userId);
      
      if (existing) {
        const profile = await storage.updateParentProfile(req.session.userId, req.body);
        res.json({ profile });
      } else {
        const profile = await storage.createParentProfile({
          userId: req.session.userId,
          firstName: req.body.firstName,
          ...req.body,
        });
        res.json({ profile });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Discover families by location/interests
  app.get("/api/community/discover", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const { state, city, limit, offset } = req.query;
      const families = await storage.discoverFamilies({
        userId: req.session.userId,
        state: state as string,
        city: city as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      res.json({ families });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get families connected via buddy links
  app.get("/api/community/buddy-families", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const families = await storage.getFamiliesWithBuddyConnections(req.session.userId);
      res.json({ families });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get community groups (with optional filters)
  app.get("/api/community/groups", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const { groupType, state, city, limit, offset } = req.query;
      const groups = await storage.getCommunityGroups({
        groupType: groupType as string,
        state: state as string,
        city: city as string,
        userId: req.session.userId,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      res.json({ groups });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's joined groups
  app.get("/api/community/my-groups", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const groups = await storage.getUserGroups(req.session.userId);
      res.json({ groups });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific group
  app.get("/api/community/groups/:groupId", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const group = await storage.getCommunityGroup(req.params.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const membership = await storage.getGroupMembership(group.id, req.session.userId);
      const members = await storage.getGroupMembers(group.id, "ACTIVE");
      
      res.json({ group, membership, memberCount: members.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new community group
  app.post("/api/community/groups", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const { name, description, groupType, city, state, topics, isPrivate, requiresApproval } = req.body;
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const group = await storage.createCommunityGroup({
        name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description,
        groupType: groupType || "VIRTUAL",
        city,
        state,
        topics,
        isPrivate: isPrivate ?? false,
        requiresApproval: requiresApproval ?? true,
        createdBy: req.session.userId,
      });
      
      // Add creator as ACTIVE ADMIN member directly (bypass approval requirement)
      await storage.addGroupCreatorAsMember(group.id, req.session.userId);
      
      res.json({ group });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Join a group
  app.post("/api/community/groups/:groupId/join", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const existing = await storage.getGroupMembership(req.params.groupId, req.session.userId);
      if (existing) {
        return res.status(400).json({ error: "Already a member or pending" });
      }
      
      const membership = await storage.joinGroup(req.params.groupId, req.session.userId);
      res.json({ membership });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Leave a group
  app.post("/api/community/groups/:groupId/leave", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      await storage.leaveGroup(req.params.groupId, req.session.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get group posts
  app.get("/api/community/groups/:groupId/posts", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const membership = await storage.getGroupMembership(req.params.groupId, req.session.userId);
      if (!membership || membership.status !== "ACTIVE") {
        return res.status(403).json({ error: "Must be a group member to view posts" });
      }
      
      const { postType, sortBy, limit, offset } = req.query;
      const posts = await storage.getGroupPosts(req.params.groupId, {
        postType: postType as string,
        sortBy: sortBy as 'new' | 'active' | 'helpful',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      res.json({ posts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a post in a group
  app.post("/api/community/groups/:groupId/posts", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const membership = await storage.getGroupMembership(req.params.groupId, req.session.userId);
      if (!membership || membership.status !== "ACTIVE") {
        return res.status(403).json({ error: "Must be a group member to post" });
      }
      
      const { postType, title, content, resourceUrl } = req.body;
      const post = await storage.createGroupPost({
        groupId: req.params.groupId,
        authorId: req.session.userId,
        postType,
        title,
        content,
        resourceUrl,
      });
      
      res.json({ post });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific post with replies
  app.get("/api/community/posts/:postId", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const post = await storage.getGroupPost(req.params.postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      const membership = await storage.getGroupMembership(post.groupId, req.session.userId);
      if (!membership || membership.status !== "ACTIVE") {
        return res.status(403).json({ error: "Must be a group member to view posts" });
      }
      
      const replies = await storage.getPostReplies(req.params.postId);
      const hasVoted = await storage.hasVoted(req.session.userId, req.params.postId);
      
      res.json({ post, replies, hasVoted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a reply to a post
  app.post("/api/community/posts/:postId/replies", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const post = await storage.getGroupPost(req.params.postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      const membership = await storage.getGroupMembership(post.groupId, req.session.userId);
      if (!membership || membership.status !== "ACTIVE") {
        return res.status(403).json({ error: "Must be a group member to reply" });
      }
      
      const { content } = req.body;
      const reply = await storage.createPostReply({
        postId: req.params.postId,
        authorId: req.session.userId,
        content,
      });
      
      res.json({ reply });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle helpful vote on a post
  app.post("/api/community/posts/:postId/helpful", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const result = await storage.toggleHelpfulVote(req.session.userId, req.params.postId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get parent connections
  app.get("/api/community/connections", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const { status } = req.query;
      const connections = await storage.getParentConnections(req.session.userId, status as string);
      res.json({ connections });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending connection requests
  app.get("/api/community/connections/pending", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const requests = await storage.getPendingConnectionRequests(req.session.userId);
      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a connection request
  app.post("/api/community/connections", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const { receiverId, connectionSource, sourceId, message } = req.body;
      
      const existing = await storage.getConnectionBetween(req.session.userId, receiverId);
      if (existing) {
        return res.status(400).json({ error: "Connection already exists" });
      }
      
      const receiverProfile = await storage.getParentProfile(receiverId);
      if (!receiverProfile?.allowConnectionRequests) {
        return res.status(403).json({ error: "This parent is not accepting connection requests" });
      }
      
      const connection = await storage.sendConnectionRequest({
        requesterId: req.session.userId,
        receiverId,
        connectionSource,
        sourceId,
        message,
      });
      
      res.json({ connection });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Respond to a connection request
  app.post("/api/community/connections/:connectionId/respond", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const connection = await storage.getParentConnection(req.params.connectionId);
      if (!connection || connection.receiverId !== req.session.userId) {
        return res.status(404).json({ error: "Connection request not found" });
      }
      
      const { accept } = req.body;
      const updated = await storage.respondToConnectionRequest(req.params.connectionId, accept);
      res.json({ connection: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get messages for a connection
  app.get("/api/community/connections/:connectionId/messages", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const connection = await storage.getParentConnection(req.params.connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }
      
      if (connection.requesterId !== req.session.userId && connection.receiverId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to view these messages" });
      }
      
      if (connection.status !== "ACTIVE") {
        return res.status(403).json({ error: "Connection not active" });
      }
      
      const messages = await storage.getMessages(req.params.connectionId);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a message in a connection
  app.post("/api/community/connections/:connectionId/messages", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const connection = await storage.getParentConnection(req.params.connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }
      
      if (connection.requesterId !== req.session.userId && connection.receiverId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (connection.status !== "ACTIVE") {
        return res.status(403).json({ error: "Connection not active" });
      }
      
      const { content } = req.body;
      const message = await storage.sendMessage({
        connectionId: req.params.connectionId,
        senderId: req.session.userId,
        content,
      });
      
      res.json({ message });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ensure state group exists (auto-create)
  app.post("/api/community/ensure-state-group", requireAuth, async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(403).json({ error: "Parent access only" });
      }
      
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }
      
      const group = await storage.ensureStateGroup(state);
      res.json({ group });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
