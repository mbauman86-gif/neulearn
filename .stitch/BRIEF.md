# Neulearn — Stitch Design Brief

This is the strategic input for design system synthesis. The stitch-design skill will use it to generate `.stitch/DESIGN.md`, then high-fidelity screens.

---

## 1. Product summary

Neulearn is a K-8 adaptive learning platform — Montessori-style, mastery-first, family-only safety. It teaches real skills (reading, math, writing, science, character, Spanish), adapts to each child's temperament and interests, and ties every lesson to real-world relevance. The ambition is a paradigm shift in how learning happens, not a better school app.

The current UI feels corny and too young. We are rebuilding to a **high-end game feel** that takes the learner seriously across the full K-8 range, with graceful register transitions that mirror the child's growth.

---

## 2. Editorial stance (must show through every pixel)

- **Foundation: non-denominational, Jesus-centered Christian.** Visible in the product, never imposed. A Faith Lens primitive (described below) is always one tap away on every content screen. Faith mode controls *automatic* display, never availability.
- **Apolitical.** No partisan symbolism, no culture-war coding, no political imagery. If a contested topic appears in content, it's presented neutrally and at age-appropriate depth.
- **Freedom to explore.** Curiosity about other ideas, traditions, and worldviews is welcomed, never penalized.
- **Real-world relevance.** Every lesson visibly connects to something the child can use, build, observe, or create. The visual system should make real-world connection feel central, not bolted on.
- **Montessori multi-level.** A child can be at different grade levels per subject. The UI must NEVER frame the child as "behind" or compare them to others. Progress is internal and personal.

---

## 3. Audience registers (K-8, three bands)

The system uses a single design language that transitions register across three bands. Same brand DNA, different tone.

| Band | Grades | Visual register | Voice register | Density |
|---|---|---|---|---|
| **Cub** | K-2 | Warm, illustrated, generous whitespace, large touch targets, bigger typography, rounder forms, more visual cues. Quality bar: high-end children's book illustration (Where the Wild Things Are, Oliver Jeffers), NEVER preschool app. | Cheerful, encouraging, simple. "Let's try this." | Spacious; one focal element per screen. |
| **Young** | 3-5 | Refined, slightly more detail, more text relative to image, still warm. Mid-density. Shapes lose some roundness. | Confident, friendly, direct. "Here's how this works." | Comfortable; 2-3 focal elements. |
| **Wise** | 6-8 | Sophisticated, refined-game-companion quality. Sparse, considered. Grown typography, considered iconography. Treats student as serious learner. | Respectful, calm, intellectually honest. Adult-adjacent. "Pick the angle you want to investigate." | Information-dense; tools-led. |

**The child should never see the same visual surface as a different-grade kid.** Register switches automatically based on grade. A 7th grader seeing a cartoon mascot is a brand failure.

---

## 4. Visual direction

### What we ARE going for

- Monument Valley's restraint and atmosphere
- Alto's Adventure's mood and motion
- Duolingo's recent redesign (sophistication without coldness)
- Headspace's calm
- Apple's child UI in iOS (warm but premium)
- Stardew Valley's UI (companionable game language)

### What we are NOT

- Khan Kids / ABCmouse aesthetic (mascot-heavy preschool)
- Primary-color neon (yellow/red/blue saturation maxed out)
- Generic edtech (Coursera, Udemy)
- Cartoon mascot tropes (oversized eyes, googly bounce animations)
- Chat-bubble-everywhere AI assistants
- Glitter/confetti/sticker celebrations

### Concrete preliminary palette (refine in DESIGN.md)

- **Base** — warm off-white (cream / parchment), not pure white. Reduces glare, improves dyslexia readability, signals warmth.
- **Ink** — deep warm charcoal for text (not pure black). Less harsh, more bookish.
- **Primaries** — muted, considered: a warm amber/honey (Ari's color family), a forest/moss green (growth, life), a deep slate blue (focus, water). Saturation pulled back ~20% from typical SaaS palettes.
- **Accents** — used sparingly, never on entire surfaces.
- **Faith** — a subtle warm-light gold reserved for Faith Lens moments. Never used elsewhere so it carries semantic meaning.

### Typography

- **Display** — a confident, slightly literary sans (e.g., Söhne, Inter Display, or a custom cut). NOT Nunito, NOT Quicksand — both feel too "kid app."
- **Body** — humanist sans, clean and high-readability (Inter, IBM Plex Sans).
- **Reading content** — opt-in dyslexia-friendly mode swaps to OpenDyslexic / Atkinson Hyperlegible, with generous letter and line spacing, cream background.
- **Scale** — generous in K-2 surfaces, tightening through 6-8.
- **Weight** — semantic, not decorative. Bold means something.

### Motion

- Deliberate, slow, satisfying. Easing curves should feel mechanical-but-warm, like a well-oiled hinge.
- Avoid bouncy / spring-loaded / cartoony micro-interactions.
- Page transitions: not slide-in/slide-out — prefer in-place transformation when possible.
- Celebrations: a held moment, not a confetti explosion.

### Iconography

- Custom, line-based, with optional warm fill states. Slightly hand-touched but disciplined.
- No cute / mascot-style icons. No "speech bubble with sparkles."

---

## 5. System primitives (must appear consistently across screens)

### Ari (the lion companion)

Ari grows with the user. Same character, four maturity stages — each visually distinct, not just "bigger version."

- **Cub Ari** (K-1): warm, illustrated, round, soft palette. Cheerful encouraging voice.
- **Young Ari** (2-3): refined, slightly more anatomical, less round.
- **Adult Ari** (4-6): elegantly stylized illustration. Geometric clarity. Calmer.
- **Wise Ari** (7-8+): minimalist ink-and-color. Almost iconic. Appears LESS often — only at meaningful moments. Voice is respectful, sage-like.

**Design principle:** by Wise stage, Ari is more like an occasional advisor than a constant pal. The growth-out itself is a teaching moment about what maturity feels like.

### Karaoke read-along (system primitive, not a feature)

- Word-level highlighting synced to TTS audio. Every text element in the design system inherits this capability.
- Default-on for K-2, pre-readers, and dyslexia mode.
- Adjustable speed: 0.7x / 0.85x / 1.0x (decoding-friendly default for new readers).
- Tap a word to hear it in isolation. Tap "play" on a passage to read the whole block with highlighting.
- For pre-readers, this IS a literacy tool — brain learns sound-to-symbol mapping passively. Treat it as pedagogy, not accessibility.
- Must look intentional and beautiful, not utility-grade. Highlight should feel like a soft warm glow following the voice, not a yellow rectangle from a 90s screen reader.

### Faith Lens

- A small, discoverable, never-imposing button on every content screen. Subtle iconography (open-book glyph, with breathing room).
- Tap → reveals: a relevant scripture, a 2-3 sentence non-denominational scholarly perspective (Wes Huff / Tim Keller register), and an optional "Go deeper" link.
- Faith content is NEVER hidden. The Faith Lens button is ALWAYS present on every content screen.
- Mode controls how prominently faith content surfaces in the lesson body, NOT availability:
  - **Subtle** (`VALUES_ONLY` in code, "Subtle" to parents) → Faith Lens button always glows in chrome; lesson body reads character-virtues; child taps Faith Lens whenever curious.
  - **Woven in** (`FAITH_FORWARD`) → brief teaser auto-shown next to lessons; tap reveals full.
  - **Centered** (`FULL_DISCIPLESHIP`) → faith integrated throughout the lesson body; Faith Lens panel open by default.
- NEVER use the words "hidden," "off," "disabled," or "no faith" in any UI copy describing modes. The Christian foundation is always present in every mode.
- Visually marked by the warm-light gold accent reserved for this purpose.

### Persistent progress chip

- Top of every lesson screen. Shows: Goal → Show → Try → Check → Done.
- Tappable to revisit any completed step.
- Communicates "where am I in this lesson" at a glance — kid never wonders.

### Three-currency reward surface

The kid earns three kinds of points, displayed in a small trio in the chrome:

- **Depth** (stick-with-it / mastery)
- **Explore** (variety / new topics)
- **Comeback** (returning to skipped items)

Each currency feeds Ari's growth and unlocks pursuit content. The mix itself is a temperament signal.

### Dyslexia-aware baseline

- Generous letter and line spacing as default, not a mode (mode pushes further).
- Cream background option in dyslexia mode.
- Dyslexia-friendly font option (OpenDyslexic / Atkinson Hyperlegible).
- No timed assessments anywhere in the product.
- Voice answers as first-class input, not bolted-on.

---

## 6. Lesson flow architecture (replaces "stacked cards" model)

The current lesson UI is clunky — kids aren't sure how it works. The new model:

- **Single transforming canvas.** The lesson lives on one canvas that morphs as the child progresses. A worked example transforms into a practice problem; a question transforms into a celebration. Fewer screen-to-screen transitions, more in-place transformation.
- **Auto-advance with "ready?" pauses.** Most "Next" buttons are killed. When karaoke audio finishes a step, the canvas breathes for a beat and offers the next step gently. Karaoke pacing IS the lesson rhythm.
- **Persistent affordances.** "I'm stuck," "Take a break," and the Faith Lens are always reachable in the same chrome position. Never buried in menus.
- **Anti-stuck branching is visible.** When the engine pivots to a simpler version, the canvas softly transforms — no shame moment, no pop-up, no "you got it wrong." Just: "Let's try a different way."

---

## 7. Social model (V1) — Facebook Messenger Kids style

Kids CAN have friends outside the family in V1, but the safety architecture is strict:

- **Parents add contacts.** Kids cannot search, discover, or initiate contact with other kids. The friendship request originates on the parent side.
- **Mutual parent approval.** Both parents must approve every friendship link before it activates.
- **Total parent visibility.** Every message, reaction, activity event, and shared item is visible to both parents on the dashboard, always. Communicated to the kid as transparency, not surveillance.
- **No public profile.** Kids are never discoverable by adults or other kids outside their parent-approved graph.
- **No adult contact** with kids outside their own parents and approved teachers.
- **Sibling auto-buddy** stays — siblings linked automatically.
- **Cross-family push partners, leaderboards, and group projects** are still DEFERRED to V2 — what's enabled in V1 is one-on-one parent-mediated friendships and the activity feed. Larger collaboration patterns wait until the core engine is real.

### Age-gated communication tiers

Inside an approved friendship, kids can communicate at progressively richer tiers. Default unlock is age-driven; parents can override either direction. Parent visibility is preserved at every tier.

| Tier | Content | Default unlock | When |
|---|---|---|---|
| 0 | Activity feed (lesson completions, badges, world progress) | All ages | V1 |
| 1 | Pre-written messages + reactions | All ages | V1 |
| 2 | **Ari reaction stickers** (brand-owned, curated, evolves with Ari's maturity stage) | All ages | V1 |
| 3 | Curated GIF library (~200 vetted safe) | Age 3rd grade+, parent override | V1.1 fast follow |
| 4 | Limited free-text + ML moderation (Perspective API or similar) | Age 6th grade+, parent override | V2 |
| 5 | Voice messages with transcription review | Age 6th grade+, parent must explicitly enable | V2.1+ |

**Ari reaction stickers are the hero of V1.** A curated set of ~20-30 illustrations of Ari at each maturity stage (cub / young / adult / wise), in different emotional states (celebrating, thinking, trying-my-best, tough one, I-see-you, etc.). Total ~80-120 illustrations as a one-time brand asset. Kids unlock new sticker styles as Ari evolves — creates a hook into the maturity arc.

Sticker design must hold the same quality bar as the rest of the visual system (high-end illustration, not cartoon mascot). They are part of the brand DNA, not a feature.

---

## 8. Bounce-and-return mechanics (visible in design)

- Every queue item has a "Save for later" affordance — no shame, no penalty.
- A "Later" shelf is visible to the kid; coming back is celebrated visually with a small Ari moment + Comeback bonus.
- After 3 skips of the same skill, the next attempt is auto-prefixed by an easier prerequisite, framed as "Let's try a different way" — never as failure.
- Subject-swap budget shown as a small chrome element (~3 swaps before gentle prompt).

---

## 9. First four screens to generate

1. **Child Home (Today)** — the daily queue with Core Learning / Spiral Review / Apply / Devotional sections. Ari greets at appropriate stage. Three-currency strip visible. Faith Lens accessible. Karaoke read-along on every text element.
2. **Lesson Player** — single transforming canvas. Persistent progress chip. Karaoke as lesson rhythm. "I'm stuck" / "Take a break" / Faith Lens always available. Anti-stuck transitions in-place.
3. **Parent Dashboard** — child progress, mastery snapshot, skipped items (3+), curriculum goals, journey preview, plus a subtle parent-side Faith Lens on items where it adds context. Calmer, more grown register.
4. **Welcome / First-Run** — Ari introduction + age detection + Faith Lens introduction (parent decides default mode + visibility) + dyslexia mode option + Spanish/second-language pick.

Generate K-2 and 6-8 register variants of Child Home and Lesson Player to verify register transitions work.

---

## 10. Accessibility & i18n

- WCAG AA minimum on color contrast (cream-and-charcoal default already passes).
- All interactive elements ≥44×44pt touch targets in K-2 register.
- Karaoke read-along functions as both a learning tool and a screen-reader-style accessibility primitive.
- Spanish localization from V1 (Michael's kids are bilingual; Spanish is the default second language). Design system must accommodate ~30% string expansion.

---

## 11. What we explicitly avoid

- Cartoon mascot tropes (oversized eyes, anthropomorphic-everything, googly bounce)
- Primary-color saturation
- Confetti/glitter/sticker celebrations
- "Hey buddy!" voice
- Speech-bubble-everywhere AI assistants
- "Level up!" full-screen takeovers
- Generic edtech card grids
- Religious imagery beyond a single subtle Faith Lens glyph
- Political symbolism of any kind
- Comparative framing ("Sarah is on Level 5, you're on Level 3")

---

## 12. Open questions for design synthesis

- **Display font choice** — Söhne vs. Inter Display vs. a literary serif companion for headlines? Recommend three options in DESIGN.md with reasoning.
- **Cub Ari illustration vendor** — illustrated lion is the brand-defining asset. Recommend approach (commissioned illustrator vs. AI-assisted-then-refined vs. stock-style-adapted).
- **Three-currency icons** — should be distinctive enough to read at small size, restrained enough not to feel like XP slot machines. Propose three.
- **K-2 vs 6-8 transition trigger** — automatic by grade only, or also by reading-level signal? Default to grade unless a strong reason otherwise.
