# Neulearn — Design System

Source of truth for visual language. Generated from `.stitch/BRIEF.md`. Every screen Stitch generates references this document.

---

## 1. Brand foundations

**Identity:** Neulearn is a serious tool for kids that respects them. Warm, considered, unhurried, intellectually generous. The opposite of "edutainment."

**Atmosphere:** parchment + ink + warm sun. A well-loved book. A premium puzzle game. A children's library that smells of paper and quiet ambition.

**Anti-patterns (zero tolerance):**
- Primary-color saturation, neon, gradient noise
- Cartoon mascot tropes (oversized eyes, googly bounce)
- Confetti/glitter/sticker celebrations
- Generic edtech card grids
- Speech-bubble-everywhere AI assistants
- Religious imagery beyond a single subtle Faith Lens glyph
- Comparative framing of any kind

---

## 2. Color tokens

All colors specified as semantic roles. Hex values are calibrated for cream-and-ink baseline at WCAG AA minimum.

### Surface

| Token | Hex | Use |
|---|---|---|
| `surface.canvas` | `#F5EFE2` | Primary canvas — warm cream/parchment. The default everywhere. |
| `surface.canvas.dim` | `#EBE3D2` | Recessed surface (e.g., chrome, sidebar). |
| `surface.raised` | `#FBF7EC` | Cards, modals, lifted elements. |
| `surface.dyslexia` | `#FAF1D9` | Slightly warmer cream for dyslexia mode. |
| `surface.ink` | `#1F1A14` | Inverse surface — dark mode / wise register accents. |

### Ink (text and lines)

| Token | Hex | Use |
|---|---|---|
| `ink.primary` | `#2A2520` | Body text — deep warm charcoal, never pure black. |
| `ink.secondary` | `#5C5346` | Secondary text, captions. |
| `ink.tertiary` | `#8C8273` | Tertiary, placeholder, meta. |
| `ink.inverse` | `#F5EFE2` | Text on dark surfaces. |
| `ink.dyslexia` | `#332A1F` | Slightly stronger contrast for dyslexia mode. |

### Primaries (muted, considered)

Saturation pulled back ~20% from typical SaaS palettes. Each is a semantic family.

| Token | Hex | Family | Semantic role |
|---|---|---|---|
| `amber.50` | `#FBF1DC` | Ari amber | Surface tint |
| `amber.200` | `#F2CF82` | | Hover/highlight |
| `amber.500` | `#C8923A` | | Primary action, Ari accents |
| `amber.700` | `#8E6526` | | Strong emphasis |
| `moss.50` | `#E9EFE0` | Forest moss | Surface tint (growth/life) |
| `moss.200` | `#B5C99B` | | Subdued positive |
| `moss.500` | `#6F8A52` | | Mastery, "Depth" currency |
| `moss.700` | `#4D6238` | | Strong success |
| `slate.50` | `#E2E7EC` | Slate blue | Surface tint (focus/water) |
| `slate.200` | `#9FB1C0` | | Calm element |
| `slate.500` | `#496478` | | Focus, Parent register |
| `slate.700` | `#2F4253` | | Wise register |

### Reserved accent

| Token | Hex | Use |
|---|---|---|
| `faith.gold` | `#D6A85B` | **RESERVED** — Faith Lens only. Never appears anywhere else in the system so it carries semantic meaning. |
| `faith.gold.glow` | `rgba(214, 168, 91, 0.18)` | Faith Lens halo / button background. |

### Currencies

Each reward currency gets one assigned color from the existing palette — no extra palette work required.

| Currency | Token | Color |
|---|---|---|
| Depth | `moss.500` | Forest moss — "stick with it / grow deep roots" |
| Explore | `slate.500` | Slate blue — "wander / wide horizon" |
| Comeback | `amber.500` | Ari amber — "courage to return" |

### Karaoke highlight

Not a solid block. A soft warm glow that travels with the voice.

| Token | Value | Use |
|---|---|---|
| `karaoke.glow` | `radial-gradient(ellipse at center, rgba(214, 168, 91, 0.35) 0%, rgba(214, 168, 91, 0.0) 80%)` | Behind the active word; not a rectangle. |
| `karaoke.text` | `#2A2520` | Active word inherits ink.primary, weight bumps to 600. |
| `karaoke.dim` | `#8C8273` | Already-read words fade to ink.tertiary. |

### Status

| Token | Hex | Use |
|---|---|---|
| `status.success` | `#6F8A52` | (= moss.500) |
| `status.warning` | `#C19236` | Tonal sibling of amber.500, slightly more orange. |
| `status.error` | `#A14A3A` | Muted terracotta. Never bright red. |
| `status.info` | `#496478` | (= slate.500) |

---

## 3. Typography

### Font stack

**Display (headings, hero text):** `"Fraunces", Georgia, serif`
- Reasoning: Fraunces is a contemporary literary serif with optical sizing, soft humanist feel, available on Google Fonts. It signals "serious book" without being austere. Reads beautifully at large sizes; paired with a clean body sans, it gives Neulearn a publishing-house quality that no edtech competitor has. Avoids the "kid app" trap that Söhne (too tech) and Inter Display (too SaaS) would risk.

**Body:** `"Inter", system-ui, sans-serif`
- Reasoning: Highest readability sans available; humanist forms work with Fraunces; hyper-mature default; free.

**Reading content (lessons, story passages):** `"Atkinson Hyperlegible", "Inter", sans-serif`
- Reasoning: Atkinson Hyperlegible was designed by the Braille Institute for low-vision and dyslexic readers. Distinguishes confusable letterforms (b/d, p/q, I/l/1) without looking like accessibility-utility. Used as the default for all body lesson text — accessibility-first as a baseline, not a mode.

**Dyslexia mode:** `"OpenDyslexic", "Atkinson Hyperlegible", sans-serif`
- Reasoning: OpenDyslexic adds bottom-weighting that helps some dyslexic readers. Polarizing — not all dyslexic readers prefer it. We expose both in the dyslexia settings; default is Atkinson Hyperlegible (which already runs everywhere as body lesson font).

**Numbers / data:** `"Inter", "JetBrains Mono", sans-serif` with tabular figures (`font-variant-numeric: tabular-nums`).

### Scale (per register)

Type scale tightens as register matures. Same hierarchy, different absolute sizes.

| Role | Cub (K-2) | Young (3-5) | Wise (6-8) |
|---|---|---|---|
| Display XL (hero) | 56 / 1.05 | 48 / 1.05 | 40 / 1.1 |
| Display L | 44 / 1.1 | 36 / 1.15 | 30 / 1.2 |
| Heading L | 32 / 1.2 | 26 / 1.25 | 22 / 1.3 |
| Heading M | 24 / 1.3 | 20 / 1.35 | 18 / 1.4 |
| Body L (read-along default) | 22 / 1.6 | 18 / 1.6 | 16 / 1.6 |
| Body M | 18 / 1.6 | 16 / 1.6 | 14 / 1.6 |
| Caption | 14 / 1.5 | 13 / 1.5 | 12 / 1.5 |

Format: `size_px / line-height_unitless`.

### Spacing rules within type

- **Letter spacing:** body text gets `0.01em` baseline; dyslexia mode pushes to `0.04em`. Never tighten body type below `0em`.
- **Word spacing:** body `0.05em` baseline; dyslexia mode `0.15em`.
- **Paragraph spacing:** 1× line-height between paragraphs (not 0.5×). Generous.
- **Max measure (line length):** 60-70 characters for body; 50-60 in dyslexia mode.
- **Bold:** semantic only. Use it to mark required action, not for decoration.

---

## 4. Spacing & density

Base unit: `4px`. All spacing is `4 × n`.

### Spacing scale

| Token | Value | Use |
|---|---|---|
| `space.1` | 4 | Tight gap (icon ↔ label) |
| `space.2` | 8 | Within a tight cluster |
| `space.3` | 12 | Compact group |
| `space.4` | 16 | Default gap |
| `space.6` | 24 | Section internal |
| `space.8` | 32 | Section-to-section |
| `space.12` | 48 | Major rhythm |
| `space.16` | 64 | Hero / generous breath |
| `space.24` | 96 | Page breath in Cub register |

### Density per register

| Aspect | Cub (K-2) | Young (3-5) | Wise (6-8) |
|---|---|---|---|
| Page padding (mobile) | 24 | 20 | 16 |
| Page padding (desktop) | 64 | 48 | 32 |
| Section gap | space.16 (64) | space.12 (48) | space.8 (32) |
| Card padding | space.8 (32) | space.6 (24) | space.4 (16) |
| Button height | 64 | 56 | 48 |
| Touch target min | 48×48 | 44×44 | 44×44 |
| Cards per viewport (mobile) | 1 | 2 | 3 |

### Radius

| Token | Value | Use |
|---|---|---|
| `radius.xs` | 4 | Inline pills |
| `radius.sm` | 8 | Small chips, badges |
| `radius.md` | 12 | Buttons, inputs |
| `radius.lg` | 16 | Cards (Wise) |
| `radius.xl` | 24 | Cards (Young) |
| `radius.2xl` | 32 | Cards (Cub), modals |
| `radius.full` | 9999 | Avatars, currency chips |

Cub register skews to the larger radii; Wise skews smaller.

### Elevation

Soft, warm shadows — never sharp. Always paired with a thin top border highlight to suggest "lit from above by warm sun."

| Token | Shadow |
|---|---|
| `elevation.0` | none |
| `elevation.1` | `0 1px 2px rgba(31,26,20,0.05), 0 0 0 1px rgba(31,26,20,0.04)` |
| `elevation.2` | `0 4px 12px rgba(31,26,20,0.07), 0 0 0 1px rgba(31,26,20,0.04)` |
| `elevation.3` | `0 12px 28px rgba(31,26,20,0.09), 0 0 0 1px rgba(31,26,20,0.04)` |

---

## 5. Motion

**Philosophy:** mechanical-but-warm, like a well-oiled hinge. Everything happens slightly slower than the kid expects. Slowness signals intentionality.

### Easing

| Token | Curve | Use |
|---|---|---|
| `ease.standard` | `cubic-bezier(0.4, 0.1, 0.2, 1)` | Default for everything. |
| `ease.entrance` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Things appearing. |
| `ease.exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | Things leaving. |
| `ease.celebration` | `cubic-bezier(0.34, 1.32, 0.64, 1)` | Held overshoot for celebrations. NEVER spring/bouncy. |

### Duration

| Token | ms | Use |
|---|---|---|
| `duration.instant` | 80 | Hover states, simple toggles |
| `duration.short` | 200 | Default UI feedback |
| `duration.medium` | 360 | In-place transformations |
| `duration.long` | 600 | Lesson canvas transformations |
| `duration.celebration` | 1200 | Held celebration moment |

### Forbidden

- Spring physics with bounce
- Anything > 1.05× scale on hover
- Confetti, particle systems
- Wiggle, shake, jiggle
- Auto-playing decorative animations

---

## 6. Iconography

**Style:** Custom, line-based, 1.5px stroke, slightly hand-touched but disciplined. Outlined by default; warm-fill states for active/selected.

**Library baseline:** Phosphor Icons (Regular weight) as fallback while custom set is illustrated. Replace with custom set as we author it.

**Sizes:** 16, 20, 24, 32, 48 (only). Never arbitrary.

### Reserved iconography

- **Faith Lens glyph:** an open-book + small radiating-light motif. Ink.primary stroke. No cross, no other religious symbology. The gold accent halo behind the icon is what signals it.
- **Three-currency icons:** see Section 8.
- **Karaoke trigger:** speaker + soft sound-wave.

---

## 7. Component primitives

These appear consistently across screens. Each must be specified, not improvised.

### 7.1 Ari (the lion companion)

Four maturity stages. Same character DNA, distinct rendering.

| Stage | Grades | Render | Voice | Frequency |
|---|---|---|---|---|
| **Cub Ari** | K-1 | Warm illustrated lion. Round shapes. Soft amber palette. Big eyes (warm round, not Disney googly). Children's-book-illustration quality. | Cheerful, encouraging, simple. "Let's try this." | Constant companion. On most screens. |
| **Young Ari** | 2-3 | Refined. Less round. Slightly more anatomical proportions. More detail in mane texture. | Confident, friendly, direct. "Here's how this works." | Frequent but less foreground. |
| **Adult Ari** | 4-6 | Elegantly stylized. Geometric clarity. Minimal palette. Less cartoon, more illustration. | Calmer. Treats kid as capable. "What angle do you want to try?" | Occasional. Appears on key moments. |
| **Wise Ari** | 7-8+ | Minimalist ink-and-color. Almost iconic. Limited palette (mostly amber + ink). Could be a single fluid line drawing. | Respectful, sage-like. Adult-adjacent. "There's an interesting question here." | Rare. Only at meaningful moments. |

**Composition rule:** Cub Ari occupies up to 25% of viewport in hero moments. Wise Ari rarely exceeds 80×80. Less Ari = more maturity.

**State expressions per stage** (used in screens AND eventually as reaction stickers): celebrating, thinking, encouraging, listening, "I see you," tough one, trying my best, ready, proud, waiting.

**Render notes for Stitch:** describe Ari as "an illustrated lion companion in the visual register of the Where the Wild Things Are sensibility — illustrated, never cartoony — at [stage] maturity, in a [emotion] expression." Avoid 3D, avoid Disney, avoid emoji-style.

### 7.2 Karaoke read-along

Wraps any text element. Default-on for K-2, pre-readers, and dyslexia mode; opt-in for fluent readers.

**Visual spec:**
- Inactive text: `ink.primary`, normal weight.
- Active word: weight 600, soft warm glow behind it (`karaoke.glow`), traveling with audio playback.
- Already-read words: fade to `ink.tertiary`.
- The glow is a radial gradient, NOT a yellow rectangle. Should feel like sunlight following the voice.
- Tap any word → plays it in isolation, glow pulses once.
- Tap a play icon (small, near the text block) → plays the whole block.

**Speed control:** small chip in chrome with three states — `0.7×` (decoding) / `0.85×` (default for K-2) / `1.0×` (default for 3-5+). No exposed slider.

**Pacing:** glow transitions from word to word use `ease.standard`, `duration.short` (200ms). NOT linear — slight ease-in/ease-out on each transition gives the feel of breath.

### 7.3 Faith Lens

The doorway to Christian perspective on the current topic. Always present, never imposing.

**Glyph:** open-book icon with a small radiating-light motif. 24px default size. Stroke in `ink.primary`. Surrounded by a soft circular halo of `faith.gold.glow` (the only place this color appears).

**Placement:**
- Lesson player: bottom-right of the persistent affordance row, alongside "I'm stuck" and "Take a break."
- Today screen / Child Home: top-right of any subject card where applicable.
- Parent dashboard: as a subtle adornment on items where faith perspective is available.
- NEVER full-screen takeover. NEVER auto-popup unless `FAITH_FORWARD` or `FULL_DISCIPLESHIP` mode is active.

**Reveal:** tapping the button reveals an inline panel below the active content (NOT a modal):
- Scripture passage in Fraunces, slightly larger than body, with verse reference in `ink.tertiary` caption style.
- Perspective text in body type (Atkinson Hyperlegible), 2-3 sentences, scholarly-charitable register.
- "Go deeper" link styled as a subtle text link with `faith.gold` underline.
- Karaoke read-along works on Faith Lens content like any other text.

**Mode auto-display rules** — Faith content is NEVER hidden. The Faith Lens button is ALWAYS present on every content screen in every mode. The mode controls *how prominently* faith content surfaces in the lesson body, not whether it's available.

**Parent-facing mode labels** (use these in UI copy — NEVER use "hidden," "off," "disabled," or "no faith"):

| Schema name | Parent-facing label | What the parent sees | What the child sees |
|---|---|---|---|
| `VALUES_ONLY` | **"Subtle"** | "Christian frame present as a tap-to-explore Faith Lens on every screen — never auto-shown in the lesson body." | The Faith Lens button always glows softly in chrome. The lesson body reads as character-virtues without explicit scripture. Child taps to explore the Bible perspective whenever they're curious. |
| `FAITH_FORWARD` | **"Woven in"** | "A brief Faith Lens teaser appears alongside lessons; full perspective opens on tap." | A one-line teaser sits adjacent to the lesson; tap the Faith Lens for the full passage. |
| `FULL_DISCIPLESHIP` | **"Centered"** | "Faith integrated throughout each lesson — scripture and Jesus-centered perspective in the lesson body." | Faith Lens panel is open by default in the lesson; collapsible. |

The default for new accounts is **Subtle**. Three valid choices, all with full Faith Lens availability.

### 7.4 Persistent progress chip

Top-of-lesson chip showing where the student is in the current lesson.

**Layout:** A horizontal row of 5 small dots/segments labeled Goal → Show → Try → Check → Done. Active segment fills `amber.500`; completed segments fill `moss.500`; future segments are `ink.tertiary` outline-only.

**Behavior:** tappable. Tapping a completed segment scrolls (or transforms canvas) back to that step. Future segments are not tappable.

**Density per register:**
- Cub: 8px dots, 12px gap, with text labels below.
- Young: 6px dots, 10px gap, labels visible.
- Wise: 4px segments connected as a line, label only on the active one.

### 7.5 Three-currency reward strip

Small chrome element showing earned currencies. Top of Child Home; top-right of lesson player.

**Layout:** Three pill-shaped chips, side by side. Each chip: icon + number. No bars, no progress bars. Just current value.

**Icons (resolved from Section 12 question):**
- **Depth** — a tree-roots motif (downward growing roots). Color: `moss.500`. Connotes "stuck with it / grew deep."
- **Explore** — a compass-rose motif (small, simple). Color: `slate.500`. Connotes "ventured out."
- **Comeback** — a returning-bird motif (a single bird in flight). Color: `amber.500`. Connotes "found the courage to return."

These icons must be CUSTOM-DRAWN at small (16-20px) sizes — Phosphor fallbacks won't carry the meaning. They become brand-defining alongside Ari.

**Tap:** opens a small panel showing the kid's running totals and what each currency unlocks.

### 7.6 Dyslexia-aware baseline

These rules apply to ALL screens by default, regardless of mode:

- Body text minimum 16px (Cub: 22px).
- Letter-spacing ≥0.01em on body text.
- Line-height ≥1.5 on body text; 1.6 on lesson reading content.
- Maximum measure 60-70 characters per line.
- Cream surface (`surface.canvas`) base — never pure white.
- No timed assessments anywhere.
- Voice answers as a first-class input alongside typing.

**Dyslexia mode** (parent toggle) layers ON TOP:
- Background switches to `surface.dyslexia`.
- Letter-spacing pushes to 0.04em, word-spacing to 0.15em.
- Optional OpenDyslexic font.
- Karaoke read-along defaults to `0.7×` speed.
- Reading text gets soft cream-and-amber color overlay options (light dyslexic readers benefit from tinted reading surfaces).

### 7.7 Lesson canvas (single-transforming)

The lesson is one canvas that transforms in place. Not a stack of cards.

**Anatomy:**
- Top chrome: progress chip (left) | three-currency strip (right) | Faith Lens (right edge)
- Center: the active step (Goal / Show / Try / Check / Done) — generous breath, single focal element.
- Bottom chrome: persistent affordances — "I'm stuck" (left) | "Take a break" (left) | speed control (right) | next-step gentle nudge appears here when ready.

**Transitions between steps:** in-place crossfade with subtle scale (0.97 → 1.0) over `duration.medium`. Karaoke audio finishing IS the cue. No "Next" buttons unless the kid genuinely needs to confirm.

**Anti-stuck transformation:** when the engine pivots to a simpler version, the canvas softly transforms — the step morphs to the easier prerequisite, and Ari speaks gently ("Let's try a different way"). No pop-up, no shame moment.

### 7.8 Ari reaction stickers

V1 expressive layer for kid-to-kid communication.

**Set composition:** ~25 emotional states × 4 maturity stages = ~100 illustrations.
**Style:** matches the corresponding Ari maturity stage — Cub stickers warm and goofy; Wise stickers calm and knowing.
**Render in chats:** 96×96 inline; tappable to play a soft animation (a held expression breath, NOT a bounce).
**Locked vs unlocked:** kid sees their current Ari stage stickers fully colored; future-stage stickers appear in a quiet recessed treatment with a subtle "unlocks at [stage]" tooltip. Don't taunt, just hint.

---

## 8. Register transitions (visual examples)

### Cub register (K-2)

- Page padding: 24-64
- Hero illustration of Cub Ari can fill 25% viewport
- Single focal element per screen
- Display XL hero text in Fraunces, 56px
- Touch targets min 48×48
- Body text 22px Atkinson Hyperlegible, line-height 1.6
- Cards: radius 32 (`radius.2xl`), elevation 2
- Karaoke read-along: default-on, 0.85× speed
- Voice answers: default
- Three-currency strip: visible but secondary; no number bombast

### Young register (3-5)

- Page padding: 20-48
- Ari appears smaller and less foreground (60×60 sticker-sized in chrome)
- 2-3 focal elements per screen
- Display L hero text in Fraunces, 36px
- Touch targets min 44×44
- Body text 18px, line-height 1.6
- Cards: radius 24 (`radius.xl`), elevation 1-2
- Karaoke read-along: opt-in for fluent readers, default-on for dyslexia mode

### Wise register (6-8)

- Page padding: 16-32
- Ari rarely visible — 32-48px when present, only at meaningful moments
- Information-dense — 3+ focal elements okay
- Display L hero text in Fraunces, 30px (yes, smaller than Cub — adult interfaces don't shout)
- Touch targets min 44×44
- Body text 16px Inter, line-height 1.6
- Cards: radius 16 (`radius.lg`), elevation 1
- Karaoke read-along: opt-in only, never auto-on (unless dyslexia mode)
- Tools-led: real input fields, code blocks, charts, citations
- Adult-adjacent voice — "Pick the angle you want to investigate"
- Three-currency strip: tucked into a small toolbar, not hero

---

## 9. Open questions — resolved

### 9.1 Display font choice

**Decided:** **Fraunces** for display, **Inter** for body, **Atkinson Hyperlegible** for reading content.

Reasoning:
- Fraunces is a contemporary literary serif — signals "serious book," not "tech app." Optical sizing handles 12-96px gracefully. Available on Google Fonts.
- Inter is the most readable humanist sans available, free, ubiquitous.
- Atkinson Hyperlegible was designed for dyslexic and low-vision readers but reads beautifully for everyone — using it as the default lesson reading font (not just dyslexia mode) makes accessibility a baseline, not a feature.
- Söhne is too tech-bro; Inter Display is too SaaS; a literary serif is the differentiator.

### 9.2 Cub Ari illustration approach

**Recommended:** **Commissioned illustrator** for the hero set (Cub through Wise, key emotions). AI-assisted variants for the long-tail sticker emotions.

Reasoning:
- Ari is the brand's hero. AI-generated illustrations carry a generic "AI look" that 2026 audiences detect immediately. A single great illustrator gives Neulearn a distinct voice no competitor can match.
- Rough cost: ~$8K-$15K for the four-stage hero set (one illustrator, 2-3 weeks). Long-tail stickers can be generated in the same style by AI tools fine-tuned on the hero set, reviewed by the illustrator.
- Reference illustrators to consider (style references, not endorsements): Oliver Jeffers, Jon Klassen, Carson Ellis, Christoph Niemann (for the Wise stage).
- For the Stitch generation phase: render Ari as **placeholder illustrations in a children's-book-illustration style** until the real assets land. Stitch should describe the character's intent, not its final form.

### 9.3 Three-currency icons

**Resolved in Section 7.5:**
- Depth → tree-roots motif
- Explore → compass-rose motif
- Comeback → returning-bird motif

These are small, semantic, restrained — distinct enough to read at 16-20px, never feel like XP slot machines.

### 9.4 K-2 vs 6-8 transition trigger

**Decided:** Automatic by grade, with a parent-side override for kids whose maturity is meaningfully different from grade.

Reasoning:
- Grade is the cleanest default and respects the Montessori principle that progress is internal (a 4th-grader-by-age might be at 2nd-grade-reading and 6th-grade-math; the register shouldn't whipsaw).
- Adding a reading-level signal sounds smart but in practice creates inconsistency — the same kid would see different visual language on Reading vs. Math. Bad UX.
- Parents who know their kid is mature for their age (or vice versa) can shift the register one band up or down. Not subject-level, holistic.

---

## 10. Quick reference for Stitch generation

When prompting Stitch, always include:

```
DESIGN SYSTEM:
- Platform: Web, mobile-first, responsive to desktop
- Palette: Cream parchment surface (#F5EFE2), deep warm charcoal text (#2A2520), muted amber/honey primary (#C8923A — Ari family), forest moss for mastery (#6F8A52), slate blue for focus (#496478), warm-light gold reserved for Faith Lens (#D6A85B)
- Typography: Fraunces serif for display, Inter sans for body, Atkinson Hyperlegible for reading content, generous letter and line spacing
- Atmosphere: warm, considered, unhurried — "well-loved book" / "premium puzzle game" / "children's library that smells of paper"
- Anti-patterns: no primary-color saturation, no cartoon mascots, no glitter, no edtech grids
- Motion: deliberate, warm, slightly slower than expected; no spring/bounce
- Radius: generous in K-2 (32px cards), tighter in 6-8 (16px)
- Reference vibe: Monument Valley restraint + Stardew Valley companionability + Headspace calm + literary publishing-house quality
```

For Ari, always describe the maturity stage explicitly: "illustrated lion companion in the [Cub/Young/Adult/Wise] stage — [warm round / refined / geometrically stylized / minimalist ink-and-color]."

For karaoke read-along: "soft warm-amber glow behind the active word, NOT a yellow highlight rectangle; previous words fade to a softer ink tone."

For Faith Lens: "subtle open-book icon surrounded by a soft warm-gold halo, never imposing, occupying its own corner with breathing room."

For three-currency strip: "three small pill chips with custom semantic icons (tree-roots / compass-rose / returning-bird), restrained, never bombastic."
