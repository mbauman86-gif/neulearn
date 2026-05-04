# Neulearn v2 components

The "v2" namespace holds the new visual rebuild born from `.stitch/BRIEF.md` + `.stitch/DESIGN.md`. These components live alongside the legacy components (`AdaptiveLessonPlayer.tsx`, `ChildHome.tsx`, etc.) so we can iterate on the new system without breaking the running app.

## Migration plan

1. Build the v2 components (in progress).
2. Behind a feature flag (`?v2=1` query param to start, then a child-settings toggle), route the lesson and home screens to v2 implementations.
3. Run alpha tests (Michael's son first, then 5-10 friends-and-family).
4. Once v2 is proven, retire the legacy components per screen.

## What's here

| Component | Purpose |
|---|---|
| `LessonPlayerCub/` | The Cub-register lesson player (K-2) — single transforming canvas, karaoke read-along, persistent affordances. Replaces `AdaptiveLessonPlayer.tsx` for K-2 grades. |
| `primitives/ProgressChip.tsx` | Five-segment Goal→Show→Try→Check→Done indicator. Reused on every lesson screen. |
| `primitives/CurrencyStrip.tsx` | Three-pill Depth/Explore/Comeback chrome. |
| `primitives/FaithLensButton.tsx` | Open-book glyph with warm-gold halo. Always visible, opt-in to reveal scripture + scholarly perspective. |
| `primitives/KaraokeText.tsx` | Word-level highlighted read-along. Soft warm-amber radial glow follows the voice. |
| `primitives/SpeedChip.tsx` | 0.7× / 0.85× / 1.0× speed selector for karaoke playback. |
| `primitives/StuckButton.tsx` + `BreakButton.tsx` | Bottom-chrome ghost-outline pills. |
| `primitives/ReadyAdvanceButton.tsx` | "Ready?" + circular amber arrow with gentle pulse. |
| `primitives/AriCub.tsx` | Placeholder Cub Ari illustration. **TODO: replace with commissioned-illustrator asset (see DESIGN.md §9.2).** |

## Design tokens

All components consume tokens from `tailwind.config.ts` under the `nl-*` namespace (`nl-canvas`, `nl-amber-500`, `nl-faith`, etc.). NEVER hard-code hex values in components — if a value's missing from the config, add it there.

## Fonts

Three font families are loaded in `client/index.html`:
- `font-nl-display` — Newsreader serif (headings, lesson goals)
- `font-nl-body` — Inter (chrome, UI labels)
- `font-nl-reading` — Atkinson Hyperlegible (lesson reading content, default for all body lesson text)

## TODOs (next pass)

- [ ] Other 5 screens: Lesson Player Wise, Today Cub, Today Wise, Parent Dashboard, Welcome
- [ ] Wire `KaraokeText` to a new `/api/audio-cache/:hash` endpoint backed by `lesson_audio_cache` table
- [ ] Wire intervention/anti-stuck signals into the lesson player
- [ ] Replace `AriCub` placeholder with commissioned illustration
- [ ] Add Spanish localization scaffolding
