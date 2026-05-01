# Neulearn - Christian Homeschool Curriculum Web App

## Overview
Neulearn is an AI-powered Christian homeschool curriculum web application for K-5 students, offering a Parent Dashboard and a child-friendly learning portal. It focuses on a Gospel-centered worldview, hands-on learning, scripture integration, and covers Reading, Math, Science, and Character. The project aims to provide personalized, faith-integrated education for children aged 5-11.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (SPA, Vite).
- **UI**: shadcn/ui (Radix UI + Tailwind CSS) with "New York" style, custom theming, and responsive mobile-first design.
- **Styling**: Tailwind CSS, dual typography (Inter/Roboto for parents, Nunito/Quicksand for children).
- **State Management**: TanStack Query for server state, custom AuthProvider, React hooks for local state.
- **Routing**: wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.

### Backend
- **Framework**: Express.js with TypeScript (Node.js) as a REST API.
- **Session Management**: PostgreSQL-backed sessions using `express-session` and `connect-pg-simple`.
- **Authentication**: Separate paths for Parent (email/password) and Child (username/PIN), with role-based access control and Parent impersonation ("View as Child").
- **API Structure**: RESTful endpoints for authentication, child management, curriculum, tasks, progress, and object storage.
- **Object Storage**: Replit App Storage for avatar uploads via presigned URLs.

### Database
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM (schema-first, type-safe queries).
- **Schema**: Core tables include `users`, `children`, `child_settings`, `plans`, `tasks`, `quizzes`, `reward_state`, `devotionals`. UUIDs for primary keys, JSON columns, timestamps.
- **Migrations**: Drizzle Kit.

### AI Integration
- **Provider**: OpenAI API via Replit AI proxy.
- **Features**: Adaptive Lesson Generation (I Do → We Do → You Do pedagogy), Daily Devotionals, AI Hint System, Voice Input & AI Answer Validation (semantic validation), Lion Teacher.
- **AI Prompt Structure**: System context defines Christian homeschool curriculum generator, child context (name, grade, faith mode, learning style), JSON output format, age-appropriate language.
- **Content Customization**: Supports various faith modes and learning styles, subject filtering.
- **Ari the Lion Teacher**: An animated lion character named "Ari" that guides children through lessons conversationally.
  - **Components**: `LionCharacter.tsx` (SVG), `LionTeacher.tsx` (interactive UI).
  - **Growth Stages**: Cub "Ari" (levels 1-5), Young "Ari" (6-15), Adult "King Ari" (16-25), Wise "Wise Ari" (26+).
  - **Expressions**: happy, teaching, thinking, celebrating, encouraging, listening, speaking.
  - **Features**: Voice input (Web Speech API), TTS output (OpenAI TTS), speech bubble UI, lip-sync animation.
  - **Integration**: Renders in AdaptiveLessonPlayer, fetches child level from progression API.
  - **API**: Uses `/api/ai-teacher/message` and `/api/ai-teacher/speak` endpoints.

### Gamification & Progression (Phase 1)
- **Progression**: XP for lesson completion, level-ups, badge awards, item unlocks.
- **API**: Endpoints for progression state and item equipping.

### Journey Board Game System (Phase 2)
- **World System**: 4 themed worlds (Forest, Ocean, Galaxy, Desert) with 20 tiles each.
- **Tile System**: Each tile represents a lesson, with states (LOCKED, CURRENT, COMPLETED).
- **Mystery Subject**: Tiles reveal a random subject (Math, Reading, Character) upon starting.
- **Tool Rewards**: Themed tools unlocked at milestone tiles.
- **Integration**: Lesson completion advances journey progress.
- **Visual Design**: Candy Land-style with winding paths, colorful circular tiles, themed decorations, and an animated character marker.

### Avatar Customization System
- **Components**: `AvatarRenderer.tsx` (SVG), `AvatarBuilderDialog.tsx` (UI).
- **Traits Schema**: 8 customizable categories (skinTone, hairStyle, hairColor, eyeStyle, eyeColor, mouthStyle, topStyle, topColor).
- **Storage**: Avatar traits stored as JSON in the `children` table.
- **SVG Rendering**: Enhanced realistic avatar system with gradients for shading and textures, reflections, and facial definition.
- **Integration**: Avatars displayed in ChildHome and JourneyMap.
- **API**: `GET/PATCH /api/children/:id/avatar/traits`.

### Lesson Resume Feature
- **Progress Tracking**: Auto-saves progress on step advancement and question submission.
- **Schema Fields**: `lesson_instances` table stores `progress_step_index`, `progress_state` (JSON), and `last_interaction_at`.
- **Resume Flow**: Restores lesson state upon return. Progress cleared on completion.

### Social World V1 - Safe Buddy System
- **Safety Model**: Parent approval required from both sides for active buddy links. No direct messaging. Only pre-written reactions allowed. Siblings are auto-buddied.
- **BuddyLink States**: PENDING_REQUESTER_APPROVAL, PENDING_RECEIVER, PENDING_RECEIVER_APPROVAL, ACTIVE, DECLINED.
- **Activity Events**: Auto-generated for lesson completion, badges earned, world completion. Manual badge sharing.
- **Visibility Options**: BUDDIES_ONLY (default), PRIVATE.
- **API Endpoints**: For searching children, sending/accepting requests, fetching buddies, activity feed, reactions, sharing badges, and parent approvals.

### Buddy Profiles
- **Schema**: `buddy_profiles` table with theme, accentColor, identityTags, learningStyles, funFacts, favoriteSubjects, topBuddyIds.
- **Profile Reactions**: `profile_reactions` for encouragements.
- **Themes**: forest, ocean, galaxy, desert.
- **Customization**: Pre-defined selections only (no free text).
- **Security**: Viewing restricted to own profile or active buddies.

### Buddy Pokes (Wave Feature)
- **Schema**: `buddy_pokes` table.
- **Purpose**: Safe way for buddies to say "Hi!" (no chat).
- **Safety Features**: Active buddy links only, no custom text, rate-limited (1 poke per buddy per hour), recipient acknowledgment only.
- **UI/UX**: "Wave at [Name]" button, notifications, "Wave Back" button.
- **API Endpoints**: For getting notifications, sending waves, acknowledging pokes, and checking rate limits.

### Curriculum Progression System
- **Prerequisite Graph**: Skills have prerequisite dependencies enforced via `skill_edges` table. Children only see skills they're ready for.
- **Skill Selection**: `progressionEngine.selectNextSkillForLesson()` picks next skill based on prerequisites met + mastery levels.
- **Mastery Tracking**: `child_skill_progress` table tracks 5-state mastery levels (NOT_STARTED → DEVELOPING → PROFICIENT → FLUENT → TRANSFER), evidence counts, success rates. TRANSFER requires demonstrating skill application in varied contexts (95%+ success rate with 5+ attempts).
- **Learning Signals**: Engagement data (attempts, hints used, time spent, voice confidence) collected during lessons via `learning_signals` table.
- **Learning Profile**: Aggregated learning patterns per child (`child_learning_profile` table) with strengths, struggles, hint usage patterns.
- **AI Personalization**: Lesson generation prompts include child's learning profile context for adaptive content.
- **Year-End Goals**: `year_end_goals` table with grade-level objectives. Progress tracked via milestones.
- **Curriculum Seeding**: On startup, seeds 72 strands, 150+ skills with comprehensive cross-grade prerequisite chains for Math (90+ skills), Reading (60+ skills), and Character (30+ skills) for grades K-5.
- **API Endpoints**:
  - `GET /api/curriculum/progression/:childId` - Progression context with ready skills, needs-review skills, year goal progress.
  - `GET /api/children/:childId/mastery` - Skill mastery snapshot by subject.
- **Components**:
  - `CurriculumProgressWidget.tsx` - Parent dashboard widget showing year-end goal progress, current focus, ready skills.
  - `SkillMasteryWidget.tsx` - Subject-by-subject mastery breakdown.

### Daily Queue (Learning OS)
- **Purpose**: Organizes daily learning into structured sections: Core Learning, Spiral Review, Apply, and Devotional.
- **Schema**: `daily_queues` table stores generated learning plans with queue items as JSON.
- **Queue Structure**:
  - **Core Learning** (2 items/day): New skills based on prerequisites. Prioritizes continuing DEVELOPING skills before starting new ones.
  - **Spiral Review** (2 items/day): Skills needing reinforcement (7+ days since last practice or flagged for review).
  - **Apply** (1 item/day): Transfer-level practice for FLUENT skills to work toward TRANSFER mastery.
  - **Devotional**: Daily scripture and reflection (if enabled in settings).
- **Subject Balancing**: Max 2 skills per subject per day to ensure variety.
- **Item States**: PENDING, IN_PROGRESS, COMPLETED, SKIPPED.
- **API Endpoints**:
  - `GET /api/daily-queue/:childId` - Get or generate today's learning queue.
  - `PATCH /api/daily-queue/:queueId/items/:itemId` - Update item status (start, complete, skip).
  - `POST /api/daily-queue/:childId/regenerate` - Parent-only: Force regenerate queue.
- **Engine**: `server/dailyQueueEngine.ts` handles queue generation and skill selection algorithms.

### Parent Portal
- **Layout**: Sidebar navigation using shadcn sidebar components.
- **Pages**: Home (dashboard), Lessons (placeholder), Community (placeholder), Settings (Billing, Parent Profile).
- **Components**: `ParentLayout.tsx` wraps all parent routes with sidebar.
- **Journey Preview Feature**: Parents can see their children's upcoming lesson subjects and current progress on the Home page.
  - **API**: `GET /api/parent/children/:childId/journey-preview` returns current world, tile, lesson details, and upcoming tiles.
  - **UI**: `JourneyPreviewCard.tsx` - Collapsible card showing world progress, current lesson goal/skill/scripture, and upcoming subjects.
  - **Privacy**: Mystery preserved for children - parents see pre-assigned subjects but children discover them tile-by-tile.
- **Curriculum Goals Section**: Shows year-end goal progress for each child using `CurriculumProgressWidget`.

## External Dependencies

- **Core**: React, TypeScript, Express.js, Vite.
- **Database**: PostgreSQL (Neon), Drizzle ORM, `@neondatabase/serverless`.
- **UI**: Radix UI, Tailwind CSS, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Auth/Security**: `bcrypt`, `connect-pg-simple`.
- **State/Routing**: `@tanstack/react-query`, `wouter`.
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`.
- **AI**: `openai` SDK.
- **Assets**: Google Fonts CDN.