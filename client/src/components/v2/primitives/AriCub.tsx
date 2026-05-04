/**
 * Cub Ari — placeholder.
 *
 * The illustrated Cub Ari is a brand-defining asset that should be commissioned from a
 * children's-book illustrator (see .stitch/DESIGN.md §9.2). This SVG is a temporary stand-in
 * with the right SHAPE and SCALE so layouts don't shift when the real asset lands.
 *
 * Style references for the eventual commission: Where the Wild Things Are, Oliver Jeffers,
 * Jon Klassen. Warm illustrated, NOT cartoony, NOT 3D, NO Disney googly eyes.
 *
 * TODO(commission): replace this placeholder with the real Cub Ari illustration once authored.
 */
import type { CSSProperties } from "react";

export interface AriCubProps {
  /** Optional Tailwind size classes (default 40 = w-40 h-40). */
  readonly className?: string;
  /** Inline style override for fine-tuning placement. */
  readonly style?: CSSProperties;
}

export function AriCub({ className = "w-40 h-40", style }: AriCubProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label="Ari, an illustrated lion cub companion"
      className={className}
      style={style}
      data-testid="v2-ari-cub-placeholder"
    >
      {/* Soft amber wash behind the figure */}
      <defs>
        <radialGradient id="ari-cub-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#F2CF82" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F2CF82" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ari-cub-mane" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E2A75D" />
          <stop offset="100%" stopColor="#C8923A" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="92" rx="76" ry="60" fill="url(#ari-cub-glow)" />
      {/* Mane — soft round shape, hand-drawn feel */}
      <circle cx="80" cy="86" r="48" fill="url(#ari-cub-mane)" />
      {/* Face base */}
      <ellipse cx="80" cy="92" rx="34" ry="32" fill="#FBE5BD" />
      {/* Eyes — closed/curious, NOT googly. Hand-touched ink lines. */}
      <path
        d="M 64 86 Q 68 82, 72 86"
        stroke="#2A2520"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 88 86 Q 92 82, 96 86"
        stroke="#2A2520"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nose */}
      <ellipse cx="80" cy="100" rx="3.5" ry="2.5" fill="#2A2520" />
      {/* Mouth — gentle curve */}
      <path
        d="M 76 106 Q 80 110, 84 106"
        stroke="#2A2520"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tiny ears poking through mane */}
      <circle cx="58" cy="62" r="6" fill="#C8923A" />
      <circle cx="58" cy="62" r="3" fill="#E2A75D" />
      <circle cx="102" cy="62" r="6" fill="#C8923A" />
      <circle cx="102" cy="62" r="3" fill="#E2A75D" />
    </svg>
  );
}
