# Neulearn — Stitch Generated Screens (V1)

Generated 2026-05-04 using Google Stitch (`stitch.withgoogle.com`).
Project ID: `3741544355111671727`
Design System: `.stitch/DESIGN.md`
Strategic Input: `.stitch/BRIEF.md`

## Screens

| # | File | Register | Device | Purpose |
|---|---|---|---|---|
| 1 | `01_child-home-cub.png` / `.html` | Cub (K-2) | Mobile | Daily learning queue for a 6-year-old |
| 2 | `02_lesson-player-cub.png` / `.html` | Cub (K-2) | Mobile | Phonics digraph lesson with karaoke read-along |
| 3 | `03_parent-dashboard.png` / `.html` | Parent | Desktop | Parent dashboard for two children |
| 4 | `04_welcome-first-run.png` / `.html` | Parent | Mobile | First-run / onboarding |
| 5 | `05_child-home-wise.png` / `.html` | Wise (6-8) | Mobile | Daily learning queue for a 7th grader |
| 6 | `06_lesson-player-wise.png` / `.html` | Wise (6-8) | Mobile | Linear equations math lesson |

## How to view

- **PNG**: full-screen rendered preview of each screen (open in any image viewer)
- **HTML**: living code — open in a browser to interact, inspect, copy markup. Tailwind CDN-based, no build needed.

## Register comparison

Screens 1 & 5 are intentionally the same product flow (Today / Daily Queue) generated for different age bands to verify the K-2 → 6-8 register transition works. Same DNA, completely different feel:

- Cub (1): warm illustrated lion, large typography, generous breath, single focal element, illustrated icons, soft palette
- Wise (5): minimal-iconic Ari only, dense list, breadcrumbs, slate-dominant, mastery sparklines, project pursuits surface, adult-adjacent

Same comparison applies to 2 & 6 (Lesson Player Cub vs Wise).

## What to verify visually

- [ ] Cream parchment surface (#F5EFE2) — never pure white
- [ ] Warm charcoal text (#2A2520) — never pure black
- [ ] Faith Lens warm-gold (#D6A85B) appears ONLY on Faith Lens glyph + Devotional strips, nowhere else
- [ ] Cub Ari is illustrated children's-book quality, not cartoon mascot
- [ ] Wise Ari is rare and minimal-iconic
- [ ] Three-currency strip: Depth (tree-roots/moss), Explore (compass/slate), Comeback (bird/amber)
- [ ] Persistent progress chip on lesson screens
- [ ] Karaoke glow is soft warm radial, NOT a yellow rectangle
- [ ] Wise register looks like a serious tool, NOT kid app with bigger fonts
- [ ] Generous letter and line spacing throughout (dyslexia-aware baseline)
- [ ] No confetti, no glitter, no oversized eyes, no neon

## Next steps

- Review against the brief — note what works and what needs iteration
- Use `mcp__stitch__edit_screens` to refine specific screens with feedback
- Once direction is approved, use `react-components` skill to convert HTML to drop-in React components for the Vite/Tailwind/shadcn stack
