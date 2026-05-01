# Neulearn Design Guidelines

## Brand Identity

**Neulearn** is an AI-powered Christian homeschool curriculum platform for K-2 students. The brand combines modern learning technology with warm, approachable design.

## Brand Colors

### Primary Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Orange Start | #FFB432 | Gradient start, accents |
| Orange Mid | #FF8A27 | Gradient, warmth |
| Lime Mid | #90D18B | Gradient, growth/nature |
| Teal End | #00B7A2 | Primary UI accent, links, buttons |
| Text Primary | #0C3A3E | Headings, body text |
| Surface Light | #F8FAF9 | Page backgrounds |
| Surface Gray | #EBEEF0 | Input backgrounds, muted areas |

### Neulearn Gradient
```css
linear-gradient(90deg, #FFB432 0%, #FF8A27 30%, #90D18B 55%, #00B7A2 100%)
```

**Use gradient for:**
- Primary buttons
- Progress bars
- Logo displays
- Key highlights and callouts

### Kid UI Bright Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Kid Blue | #4FA3FF | Interactive elements |
| Kid Yellow | #FFD74A | Rewards, achievements |
| Kid Orange | #FF9B42 | Points, highlights |
| Kid Green | #00B7A2 | Success, progress |

## Typography

### Font Families
- **Headings:** Poppins Bold (modern, rounded)
- **Body:** Inter Regular/Medium (readable UI text)
- **Labels/Numbers:** Nunito (friendly for kids)

### Parent Experience
- Dashboard titles: `text-3xl font-heading font-semibold`
- Section headers: `text-xl font-heading`
- Body text: `text-base font-sans`
- Metadata: `text-sm text-muted-foreground`

### Child Experience
- Greeting: `text-4xl font-child font-bold`
- Task titles: `text-xl font-child font-semibold`
- Instructions: `text-lg font-child` (larger for K-2 readability)
- All text uses Nunito for friendly appearance

## Component Styling

### Buttons
**Primary (Gradient):**
```
bg-neulearn-gradient text-white rounded-lg shadow-md hover:shadow-lg
```

**Secondary/Outline:**
```
border-2 border-[var(--neulearn-teal)] text-[var(--neulearn-teal)] bg-white
```

**Ghost:**
```
border-transparent hover:bg-accent
```

### Inputs
- Background: `bg-[var(--neulearn-surface-gray)]`
- Border radius: `rounded-lg` (8-10px)
- Focus: `ring-2 ring-[var(--neulearn-teal)] border-[var(--neulearn-teal)]`
- Height: `h-9` (standard), `h-16` (child login)

### Cards
- Background: White (`bg-white`)
- Border: `border-card-border`
- Shadow: `shadow-sm` (subtle)
- Border radius: `rounded-xl`
- Title font: `font-heading`

### Progress Bars
- Track: `bg-muted rounded-full`
- Fill: `bg-neulearn-gradient` (always use gradient)
- Height: `h-3`
- Rounded ends

### Navigation
- Header: `bg-white shadow-sm border-b`
- Active items: Teal accent
- Section titles: Poppins font

## Logo Usage

- **Minimum size:** 48px height
- **Clear space:** Equal to height of lowercase "n"
- **Light backgrounds:** Full-color logo
- **Teal/dark backgrounds:** White version
- **Never:** Modify colors, distort, or alter arrow/outline

## Layout System

### Parent Dashboard
- Background: `bg-[var(--neulearn-surface-light)]`
- Header: `bg-white sticky shadow-sm`
- Max width: `max-w-7xl mx-auto`
- Padding: `px-4 md:px-8`
- Card grid: `grid md:grid-cols-2 lg:grid-cols-3 gap-6`

### Child Portal
- Background: Gradient `from-[var(--kid-blue)]/10 via-[var(--neulearn-surface-light)] to-[var(--kid-green)]/10`
- Max width: `max-w-4xl mx-auto`
- Single column on all devices
- Generous spacing: `space-y-6`

## Child Experience Guidelines

### Age-Appropriate Design (K-2, ages 5-8)
- Minimum touch target: 44x44px (prefer 64x64px)
- No text smaller than `text-lg`
- Maximum 3-4 tasks visible at once
- Single primary action per screen
- Minimal navigation depth

### Visual Feedback
- Immediate positive feedback on actions
- Large animated icons for loading
- Celebration graphics for completions
- Clear selected/active states

### Typography for Kids
- Short sentences (10 words max)
- Simple vocabulary
- Icons complement all text
- Large, friendly font (Nunito)

## CSS Variables Reference

```css
:root {
  --neulearn-orange-start: #FFB432;
  --neulearn-orange-mid: #FF8A27;
  --neulearn-lime-mid: #90D18B;
  --neulearn-teal: #00B7A2;
  --neulearn-text-primary: #0C3A3E;
  --neulearn-surface-light: #F8FAF9;
  --neulearn-surface-gray: #EBEEF0;
  --neulearn-gradient: linear-gradient(90deg, #FFB432 0%, #FF8A27 30%, #90D18B 55%, #00B7A2 100%);
  
  --kid-blue: #4FA3FF;
  --kid-yellow: #FFD74A;
  --kid-orange: #FF9B42;
  --kid-green: #00B7A2;
}
```

## Tailwind Utility Classes

```css
/* Brand utilities */
.bg-neulearn-gradient { background: var(--neulearn-gradient); }
.text-neulearn-gradient { /* gradient text effect */ }
.bg-neulearn-teal { background-color: var(--neulearn-teal); }
.text-neulearn-teal { color: var(--neulearn-teal); }
.bg-neulearn-surface { background-color: var(--neulearn-surface-light); }

/* Font utilities */
.font-heading { font-family: var(--font-heading); }
.font-label { font-family: var(--font-label); }

/* Kid color utilities */
.bg-kid-blue, .bg-kid-yellow, .bg-kid-orange, .bg-kid-green
.text-kid-blue, .text-kid-yellow, .text-kid-orange, .text-kid-green
```

## Icons

- Style: Soft-rounded geometric
- Colors: Brand palette only
- No sharp edges except arrow motif
- Source: Lucide React
- Parent UI: `w-5 h-5` to `w-6 h-6`
- Child UI: `w-8 h-8` minimum, `w-12 h-12` preferred
