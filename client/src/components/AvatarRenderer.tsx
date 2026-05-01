import { useMemo } from "react";
import type { AvatarTraits } from "@shared/schema";

interface AvatarRendererProps {
  traits: AvatarTraits;
  size?: number;
  className?: string;
}

// Enhanced skin colors with shadow and highlight variants
const skinColors: Record<string, { base: string; shadow: string; highlight: string; blush: string }> = {
  light: { base: "#FFE4D0", shadow: "#E8C9B3", highlight: "#FFF5ED", blush: "#FFB5B5" },
  fair: { base: "#F5D4B8", shadow: "#DABB9E", highlight: "#FFEDE0", blush: "#FFAAAA" },
  medium: { base: "#DEB887", shadow: "#C49B6E", highlight: "#F2D4B0", blush: "#E89898" },
  tan: { base: "#C4A67C", shadow: "#A88A60", highlight: "#E0C9A6", blush: "#D88888" },
  brown: { base: "#A67B5B", shadow: "#8A6245", highlight: "#C99F7F", blush: "#C07878" },
  dark: { base: "#8B5A2B", shadow: "#704620", highlight: "#A87A4B", blush: "#A06868" },
};

// Enhanced hair colors with gradient variants
const hairColors: Record<string, { base: string; dark: string; light: string; shine: string }> = {
  blonde: { base: "#F0D58C", dark: "#D4B86E", light: "#FFF0B3", shine: "#FFFAD1" },
  brown: { base: "#8B4513", dark: "#5D2E0A", light: "#A65E2E", shine: "#C47A42" },
  black: { base: "#1C1C1C", dark: "#0A0A0A", light: "#3D3D3D", shine: "#5A5A5A" },
  red: { base: "#B33B24", dark: "#8B2A18", light: "#D44E35", shine: "#E86E55" },
  auburn: { base: "#922724", dark: "#6B1B19", light: "#B33530", shine: "#D04843" },
  gray: { base: "#9E9E9E", dark: "#757575", light: "#BDBDBD", shine: "#E0E0E0" },
  blue: { base: "#5DADE2", dark: "#3498DB", light: "#85C1E9", shine: "#AED6F1" },
  pink: { base: "#FF69B4", dark: "#DB4D97", light: "#FF8CC6", shine: "#FFAED8" },
  purple: { base: "#9B59B6", dark: "#7D3C98", light: "#BB8FCE", shine: "#D7BDE2" },
};

const eyeColors: Record<string, { iris: string; dark: string; light: string }> = {
  brown: { iris: "#654321", dark: "#3D2817", light: "#8B6914" },
  blue: { iris: "#3498DB", dark: "#2171B5", light: "#7EC8E3" },
  green: { iris: "#27AE60", dark: "#1E8449", light: "#58D68D" },
  hazel: { iris: "#8E7618", dark: "#6B5810", light: "#B8A042" },
  amber: { iris: "#FF8C00", dark: "#CC7000", light: "#FFB347" },
  gray: { iris: "#708090", dark: "#536878", light: "#9EB0C0" },
};

const clothingColors: Record<string, { base: string; dark: string; light: string }> = {
  red: { base: "#E74C3C", dark: "#C0392B", light: "#F1948A" },
  blue: { base: "#3498DB", dark: "#2171B5", light: "#85C1E9" },
  green: { base: "#27AE60", dark: "#1E8449", light: "#58D68D" },
  yellow: { base: "#F1C40F", dark: "#D4AC0D", light: "#F7DC6F" },
  purple: { base: "#9B59B6", dark: "#7D3C98", light: "#BB8FCE" },
  pink: { base: "#E91E63", dark: "#C2185B", light: "#F48FB1" },
  orange: { base: "#E67E22", dark: "#CA6F1E", light: "#F0B27A" },
  white: { base: "#ECF0F1", dark: "#BDC3C7", light: "#FFFFFF" },
  gray: { base: "#95A5A6", dark: "#7F8C8D", light: "#BFC9CA" },
  black: { base: "#2C3E50", dark: "#1A252F", light: "#566573" },
  brown: { base: "#8D6E63", dark: "#6D4C41", light: "#A1887F" },
  rainbow: { base: "url(#rainbow)", dark: "url(#rainbow-dark)", light: "url(#rainbow-light)" },
};

export function AvatarRenderer({ traits, size = 128, className = "" }: AvatarRendererProps) {
  const skin = skinColors[traits.skinTone] || skinColors.medium;
  const hair = hairColors[traits.hairColor] || hairColors.brown;
  const eye = eyeColors[traits.eyeColor] || eyeColors.brown;
  const top = clothingColors[traits.topColor] || clothingColors.blue;
  const bottom = clothingColors[traits.bottomColor] || clothingColors.blue;
  const shoe = clothingColors[traits.shoeColor] || clothingColors.white;

  // Unique ID for gradients to avoid conflicts when multiple avatars on page
  const gradientId = useMemo(() => `avatar-${Math.random().toString(36).substr(2, 9)}`, []);

  const hairElement = useMemo(() => {
    const renderHairStrands = (basePoints: string[], color: string) => (
      <>
        {basePoints.map((d, i) => (
          <path key={i} d={d} stroke={hair.dark} strokeWidth="1" fill="none" opacity="0.3" />
        ))}
      </>
    );

    switch (traits.hairStyle) {
      case "short":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="30%" stopColor={hair.light} />
                <stop offset="70%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M30 30 C30 14, 44 8, 64 8 C84 8, 98 14, 98 30 L98 38 C98 38, 88 24, 64 24 C40 24, 30 38, 30 38 Z" fill={`url(#${gradientId}-hair)`} />
            {renderHairStrands([
              "M40 15 Q42 22, 44 28", "M50 12 Q52 20, 54 26", "M64 10 Q64 18, 64 24",
              "M78 12 Q76 20, 74 26", "M88 15 Q86 22, 84 28"
            ], hair.dark)}
            <path d="M35 32 Q40 28, 45 32 Q50 36, 55 32 Q60 28, 64 32 Q68 36, 73 32 Q78 28, 83 32 Q88 36, 93 32" stroke={hair.light} strokeWidth="2" fill="none" opacity="0.5" />
          </g>
        );
      case "long":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="20%" stopColor={hair.light} />
                <stop offset="60%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M28 30 C28 12, 44 6, 64 6 C84 6, 100 12, 100 30 L100 45 C100 45, 88 26, 64 26 C40 26, 28 45, 28 45 Z" fill={`url(#${gradientId}-hair)`} />
            <path d="M28 45 Q26 65, 30 85 Q34 95, 38 85 L35 50" fill={`url(#${gradientId}-hair)`} />
            <path d="M100 45 Q102 65, 98 85 Q94 95, 90 85 L93 50" fill={`url(#${gradientId}-hair)`} />
            {renderHairStrands([
              "M30 50 Q32 70, 34 82", "M34 48 Q36 68, 38 80",
              "M94 48 Q92 68, 90 80", "M98 50 Q96 70, 94 82",
              "M45 10 Q46 18, 48 24", "M64 8 Q64 16, 64 22", "M83 10 Q82 18, 80 24"
            ], hair.dark)}
            <path d="M32 55 Q38 52, 36 65" stroke={hair.shine} strokeWidth="3" fill="none" opacity="0.6" />
            <path d="M96 55 Q90 52, 92 65" stroke={hair.shine} strokeWidth="3" fill="none" opacity="0.6" />
          </g>
        );
      case "curly":
        return (
          <g>
            <defs>
              <radialGradient id={`${gradientId}-curl`} cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </radialGradient>
            </defs>
            <circle cx="38" cy="22" r="14" fill={`url(#${gradientId}-curl)`} />
            <circle cx="54" cy="16" r="13" fill={`url(#${gradientId}-curl)`} />
            <circle cx="74" cy="16" r="13" fill={`url(#${gradientId}-curl)`} />
            <circle cx="90" cy="22" r="14" fill={`url(#${gradientId}-curl)`} />
            <circle cx="32" cy="38" r="11" fill={`url(#${gradientId}-curl)`} />
            <circle cx="96" cy="38" r="11" fill={`url(#${gradientId}-curl)`} />
            <circle cx="64" cy="12" r="10" fill={`url(#${gradientId}-curl)`} />
            {[38, 54, 74, 90, 32, 96, 64].map((cx, i) => (
              <circle key={i} cx={cx - 3} cy={[22, 16, 16, 22, 38, 38, 12][i] - 3} r="3" fill={hair.shine} opacity="0.5" />
            ))}
          </g>
        );
      case "braids":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.light} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M30 30 C30 14, 44 8, 64 8 C84 8, 98 14, 98 30 L98 38 C98 38, 88 24, 64 24 C40 24, 30 38, 30 38 Z" fill={`url(#${gradientId}-hair)`} />
            <path d="M32 42 Q28 55, 26 70 Q24 85, 30 90" fill={`url(#${gradientId}-hair)`} stroke={hair.dark} strokeWidth="1" />
            <path d="M96 42 Q100 55, 102 70 Q104 85, 98 90" fill={`url(#${gradientId}-hair)`} stroke={hair.dark} strokeWidth="1" />
            <path d="M28 50 L34 55 M28 60 L34 65 M28 70 L34 75 M28 80 L34 85" stroke={hair.dark} strokeWidth="2" opacity="0.4" />
            <path d="M100 50 L94 55 M100 60 L94 65 M100 70 L94 75 M100 80 L94 85" stroke={hair.dark} strokeWidth="2" opacity="0.4" />
            <circle cx="30" cy="92" r="6" fill={hair.base} stroke={hair.dark} strokeWidth="1" />
            <circle cx="98" cy="92" r="6" fill={hair.base} stroke={hair.dark} strokeWidth="1" />
          </g>
        );
      case "ponytail":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="30%" stopColor={hair.light} />
                <stop offset="70%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M30 30 C30 14, 44 8, 64 8 C84 8, 98 14, 98 30 L98 38 C98 38, 88 24, 64 24 C40 24, 30 38, 30 38 Z" fill={`url(#${gradientId}-hair)`} />
            <ellipse cx="64" cy="10" rx="16" ry="10" fill={hair.base} />
            <path d="M52 4 Q64 -12, 76 4 L72 28 L56 28 Z" fill={`url(#${gradientId}-hair)`} />
            {renderHairStrands([
              "M56 6 Q58 12, 58 24", "M64 2 Q64 10, 64 22", "M72 6 Q70 12, 70 24"
            ], hair.dark)}
            <ellipse cx="64" cy="6" rx="8" ry="4" fill={hair.light} opacity="0.5" />
          </g>
        );
      case "spiky":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-spike`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={hair.dark} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.light} />
              </linearGradient>
            </defs>
            <polygon points="36,34 44,4 52,34" fill={`url(#${gradientId}-spike)`} />
            <polygon points="50,32 58,0 68,32" fill={`url(#${gradientId}-spike)`} />
            <polygon points="60,32 70,2 80,32" fill={`url(#${gradientId}-spike)`} />
            <polygon points="76,34 84,4 92,34" fill={`url(#${gradientId}-spike)`} />
            {[44, 58, 70, 84].map((x, i) => (
              <line key={i} x1={x} y1={[4, 0, 2, 4][i] + 8} x2={x} y2={[4, 0, 2, 4][i] + 18} stroke={hair.shine} strokeWidth="2" opacity="0.6" />
            ))}
          </g>
        );
      case "bun":
        return (
          <g>
            <defs>
              <radialGradient id={`${gradientId}-bun`} cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </radialGradient>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.light} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M30 30 C30 14, 44 8, 64 8 C84 8, 98 14, 98 30 L98 38 C98 38, 88 24, 64 24 C40 24, 30 38, 30 38 Z" fill={`url(#${gradientId}-hair)`} />
            <circle cx="64" cy="6" r="16" fill={`url(#${gradientId}-bun)`} />
            <path d="M54 4 Q64 8, 74 4 Q68 12, 64 12 Q60 12, 54 4" fill={hair.dark} opacity="0.3" />
            <ellipse cx="58" cy="0" rx="4" ry="3" fill={hair.shine} opacity="0.5" />
          </g>
        );
      case "pigtails":
        return (
          <g>
            <defs>
              <radialGradient id={`${gradientId}-puff`} cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </radialGradient>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.light} />
                <stop offset="50%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M30 30 C30 14, 44 8, 64 8 C84 8, 98 14, 98 30 L98 38 C98 38, 88 24, 64 24 C40 24, 30 38, 30 38 Z" fill={`url(#${gradientId}-hair)`} />
            <circle cx="26" cy="36" r="14" fill={`url(#${gradientId}-puff)`} />
            <circle cx="102" cy="36" r="14" fill={`url(#${gradientId}-puff)`} />
            <circle cx="20" cy="30" rx="3" ry="3" fill={hair.shine} opacity="0.5" />
            <circle cx="96" cy="30" rx="3" ry="3" fill={hair.shine} opacity="0.5" />
          </g>
        );
      default:
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hair.shine} />
                <stop offset="30%" stopColor={hair.light} />
                <stop offset="70%" stopColor={hair.base} />
                <stop offset="100%" stopColor={hair.dark} />
              </linearGradient>
            </defs>
            <path d="M30 30 C30 14, 44 8, 64 8 C84 8, 98 14, 98 30 L98 38 C98 38, 88 24, 64 24 C40 24, 30 38, 30 38 Z" fill={`url(#${gradientId}-hair)`} />
          </g>
        );
    }
  }, [traits.hairStyle, hair, gradientId]);

  const eyeElements = useMemo(() => {
    const baseY = 44;
    const leftX = 50;
    const rightX = 78;
    
    const renderDetailedEye = (cx: number, cy: number, isLeft: boolean) => (
      <g>
        {/* Eye white with subtle gradient */}
        <ellipse cx={cx} cy={cy} rx="9" ry="7" fill="white" />
        <ellipse cx={cx} cy={cy} rx="9" ry="7" fill={`url(#${gradientId}-eye-shadow)`} opacity="0.3" />
        
        {/* Iris with depth */}
        <circle cx={cx + (isLeft ? 1 : -1)} cy={cy + 1} r="5" fill={eye.iris} />
        <circle cx={cx + (isLeft ? 1 : -1)} cy={cy + 1} r="5" fill={`url(#${gradientId}-iris-gradient)`} opacity="0.5" />
        
        {/* Pupil */}
        <circle cx={cx + (isLeft ? 1 : -1)} cy={cy + 1} r="2.5" fill="#000" />
        
        {/* Eye shine/reflection */}
        <circle cx={cx + (isLeft ? 2.5 : -0.5)} cy={cy - 1} r="2" fill="white" opacity="0.9" />
        <circle cx={cx + (isLeft ? 0 : 2)} cy={cy + 2} r="1" fill="white" opacity="0.5" />
        
        {/* Upper eyelid line */}
        <path d={`M${cx - 9} ${cy - 2} Q${cx} ${cy - 8}, ${cx + 9} ${cy - 2}`} stroke={skin.shadow} strokeWidth="2" fill="none" />
        
        {/* Eyelashes */}
        <g stroke={hair.dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
          <line x1={cx - 7} y1={cy - 4} x2={cx - 9} y2={cy - 8} />
          <line x1={cx - 4} y1={cy - 6} x2={cx - 5} y2={cy - 10} />
          <line x1={cx} y1={cy - 7} x2={cx} y2={cy - 11} />
          <line x1={cx + 4} y1={cy - 6} x2={cx + 5} y2={cy - 10} />
          <line x1={cx + 7} y1={cy - 4} x2={cx + 9} y2={cy - 8} />
        </g>
      </g>
    );

    switch (traits.eyeStyle) {
      case "round":
        return (
          <g>
            {renderDetailedEye(leftX, baseY, true)}
            {renderDetailedEye(rightX, baseY, false)}
          </g>
        );
      case "almond":
        return (
          <g>
            <ellipse cx={leftX} cy={baseY} rx="10" ry="5" fill="white" />
            <ellipse cx={rightX} cy={baseY} rx="10" ry="5" fill="white" />
            <circle cx={leftX + 1} cy={baseY} r="4" fill={eye.iris} />
            <circle cx={rightX - 1} cy={baseY} r="4" fill={eye.iris} />
            <circle cx={leftX + 1} cy={baseY} r="2" fill="#000" />
            <circle cx={rightX - 1} cy={baseY} r="2" fill="#000" />
            <circle cx={leftX + 2} cy={baseY - 1} r="1.5" fill="white" opacity="0.9" />
            <circle cx={rightX} cy={baseY - 1} r="1.5" fill="white" opacity="0.9" />
            <path d={`M${leftX - 10} ${baseY} Q${leftX} ${baseY - 6}, ${leftX + 10} ${baseY}`} stroke={skin.shadow} strokeWidth="1.5" fill="none" />
            <path d={`M${rightX - 10} ${baseY} Q${rightX} ${baseY - 6}, ${rightX + 10} ${baseY}`} stroke={skin.shadow} strokeWidth="1.5" fill="none" />
          </g>
        );
      case "big":
        return (
          <g>
            <circle cx={leftX - 2} cy={baseY} r="12" fill="white" />
            <circle cx={rightX + 2} cy={baseY} r="12" fill="white" />
            <circle cx={leftX} cy={baseY + 2} r="7" fill={eye.iris} />
            <circle cx={rightX} cy={baseY + 2} r="7" fill={eye.iris} />
            <circle cx={leftX} cy={baseY + 2} r="4" fill="#000" />
            <circle cx={rightX} cy={baseY + 2} r="4" fill="#000" />
            <circle cx={leftX + 3} cy={baseY - 1} r="3" fill="white" opacity="0.9" />
            <circle cx={rightX + 3} cy={baseY - 1} r="3" fill="white" opacity="0.9" />
            <circle cx={leftX - 1} cy={baseY + 4} r="1.5" fill="white" opacity="0.5" />
            <circle cx={rightX - 1} cy={baseY + 4} r="1.5" fill="white" opacity="0.5" />
            <g stroke={hair.dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
              <line x1={leftX - 10} y1={baseY - 8} x2={leftX - 13} y2={baseY - 14} />
              <line x1={leftX - 5} y1={baseY - 10} x2={leftX - 6} y2={baseY - 16} />
              <line x1={leftX} y1={baseY - 11} x2={leftX} y2={baseY - 17} />
              <line x1={leftX + 5} y1={baseY - 10} x2={leftX + 6} y2={baseY - 16} />
              <line x1={rightX - 5} y1={baseY - 10} x2={rightX - 6} y2={baseY - 16} />
              <line x1={rightX} y1={baseY - 11} x2={rightX} y2={baseY - 17} />
              <line x1={rightX + 5} y1={baseY - 10} x2={rightX + 6} y2={baseY - 16} />
              <line x1={rightX + 10} y1={baseY - 8} x2={rightX + 13} y2={baseY - 14} />
            </g>
          </g>
        );
      case "sleepy":
        return (
          <g>
            <path d={`M${leftX - 8} ${baseY} Q${leftX} ${baseY - 5}, ${leftX + 8} ${baseY}`} stroke={eye.iris} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M${rightX - 8} ${baseY} Q${rightX} ${baseY - 5}, ${rightX + 8} ${baseY}`} stroke={eye.iris} strokeWidth="4" fill="none" strokeLinecap="round" />
            <g stroke={hair.dark} strokeWidth="1" strokeLinecap="round" opacity="0.6">
              <line x1={leftX - 6} y1={baseY - 4} x2={leftX - 7} y2={baseY - 7} />
              <line x1={leftX} y1={baseY - 5} x2={leftX} y2={baseY - 8} />
              <line x1={leftX + 6} y1={baseY - 4} x2={leftX + 7} y2={baseY - 7} />
              <line x1={rightX - 6} y1={baseY - 4} x2={rightX - 7} y2={baseY - 7} />
              <line x1={rightX} y1={baseY - 5} x2={rightX} y2={baseY - 8} />
              <line x1={rightX + 6} y1={baseY - 4} x2={rightX + 7} y2={baseY - 7} />
            </g>
          </g>
        );
      case "happy":
        return (
          <g>
            <path d={`M${leftX - 8} ${baseY + 2} Q${leftX} ${baseY - 6}, ${leftX + 8} ${baseY + 2}`} stroke={eye.iris} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M${rightX - 8} ${baseY + 2} Q${rightX} ${baseY - 6}, ${rightX + 8} ${baseY + 2}`} stroke={eye.iris} strokeWidth="4" fill="none" strokeLinecap="round" />
            <g stroke={hair.dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
              <line x1={leftX - 5} y1={baseY - 5} x2={leftX - 6} y2={baseY - 9} />
              <line x1={leftX} y1={baseY - 6} x2={leftX} y2={baseY - 10} />
              <line x1={leftX + 5} y1={baseY - 5} x2={leftX + 6} y2={baseY - 9} />
              <line x1={rightX - 5} y1={baseY - 5} x2={rightX - 6} y2={baseY - 9} />
              <line x1={rightX} y1={baseY - 6} x2={rightX} y2={baseY - 10} />
              <line x1={rightX + 5} y1={baseY - 5} x2={rightX + 6} y2={baseY - 9} />
            </g>
          </g>
        );
      case "sparkle":
        return (
          <g>
            <circle cx={leftX} cy={baseY} r="10" fill="white" />
            <circle cx={rightX} cy={baseY} r="10" fill="white" />
            <circle cx={leftX + 1} cy={baseY + 1} r="6" fill={eye.iris} />
            <circle cx={rightX - 1} cy={baseY + 1} r="6" fill={eye.iris} />
            <circle cx={leftX + 1} cy={baseY + 1} r="3" fill="#000" />
            <circle cx={rightX - 1} cy={baseY + 1} r="3" fill="#000" />
            {/* Multiple sparkle reflections */}
            <circle cx={leftX + 4} cy={baseY - 2} r="2.5" fill="white" opacity="0.95" />
            <circle cx={rightX + 2} cy={baseY - 2} r="2.5" fill="white" opacity="0.95" />
            <circle cx={leftX - 1} cy={baseY + 3} r="1.5" fill="white" opacity="0.7" />
            <circle cx={rightX - 3} cy={baseY + 3} r="1.5" fill="white" opacity="0.7" />
            <circle cx={leftX + 2} cy={baseY + 1} r="0.8" fill="white" opacity="0.5" />
            <circle cx={rightX} cy={baseY + 1} r="0.8" fill="white" opacity="0.5" />
            {/* Star sparkles around eyes */}
            <polygon points={`${leftX - 12},${baseY - 8} ${leftX - 11},${baseY - 6} ${leftX - 9},${baseY - 6} ${leftX - 10},${baseY - 4} ${leftX - 9},${baseY - 2} ${leftX - 11},${baseY - 3} ${leftX - 13},${baseY - 2} ${leftX - 12},${baseY - 4} ${leftX - 14},${baseY - 6} ${leftX - 12},${baseY - 6}`} fill="#FFD700" opacity="0.8" />
            <polygon points={`${rightX + 12},${baseY - 8} ${rightX + 11},${baseY - 6} ${rightX + 9},${baseY - 6} ${rightX + 10},${baseY - 4} ${rightX + 9},${baseY - 2} ${rightX + 11},${baseY - 3} ${rightX + 13},${baseY - 2} ${rightX + 12},${baseY - 4} ${rightX + 14},${baseY - 6} ${rightX + 12},${baseY - 6}`} fill="#FFD700" opacity="0.8" />
          </g>
        );
      default:
        return (
          <g>
            {renderDetailedEye(leftX, baseY, true)}
            {renderDetailedEye(rightX, baseY, false)}
          </g>
        );
    }
  }, [traits.eyeStyle, eye, skin, hair, gradientId]);

  const mouthElement = useMemo(() => {
    const baseY = 62;
    const lipDark = "#B84A4A";
    const lipMid = "#D45D5D";
    const lipLight = "#E88888";
    const tongueColor = "#E57373";
    const teethColor = "#FFFEF0";
    
    switch (traits.mouthStyle) {
      case "smile":
        return (
          <g>
            <path d={`M52 ${baseY} Q64 ${baseY + 12}, 76 ${baseY}`} fill="none" stroke={lipDark} strokeWidth="4" strokeLinecap="round" />
            <path d={`M54 ${baseY + 1} Q64 ${baseY + 10}, 74 ${baseY + 1}`} fill="none" stroke={lipMid} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case "grin":
        return (
          <g>
            <path d={`M48 ${baseY - 2} Q64 ${baseY + 16}, 80 ${baseY - 2}`} fill={lipDark} />
            <path d={`M50 ${baseY} Q64 ${baseY + 12}, 78 ${baseY}`} fill={teethColor} />
            <line x1="54" y1={baseY + 6} x2="74" y2={baseY + 6} stroke={lipLight} strokeWidth="2" />
            <path d={`M48 ${baseY - 2} Q64 ${baseY + 16}, 80 ${baseY - 2}`} fill="none" stroke={lipDark} strokeWidth="2" />
          </g>
        );
      case "small":
        return (
          <g>
            <path d={`M58 ${baseY + 2} Q64 ${baseY + 8}, 70 ${baseY + 2}`} fill="none" stroke={lipDark} strokeWidth="3" strokeLinecap="round" />
            <path d={`M59 ${baseY + 3} Q64 ${baseY + 6}, 69 ${baseY + 3}`} fill="none" stroke={lipMid} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
      case "open":
        return (
          <g>
            <ellipse cx="64" cy={baseY + 5} rx="9" ry="8" fill={lipDark} />
            <ellipse cx="64" cy={baseY + 8} rx="6" ry="4" fill={tongueColor} />
            <ellipse cx="64" cy={baseY + 2} rx="7" ry="3" fill={teethColor} />
            <ellipse cx="64" cy={baseY + 5} rx="9" ry="8" fill="none" stroke={lipDark} strokeWidth="2" />
          </g>
        );
      case "happy":
        return (
          <g>
            <path d={`M48 ${baseY - 2} Q64 ${baseY + 14}, 80 ${baseY - 2}`} fill={lipDark} />
            <path d={`M50 ${baseY} Q64 ${baseY + 10}, 78 ${baseY}`} fill={lipLight} />
            <path d={`M48 ${baseY - 2} Q64 ${baseY + 14}, 80 ${baseY - 2}`} fill="none" stroke={lipDark} strokeWidth="2" />
          </g>
        );
      case "surprised":
        return (
          <g>
            <ellipse cx="64" cy={baseY + 6} rx="7" ry="9" fill={lipDark} />
            <ellipse cx="64" cy={baseY + 8} rx="5" ry="5" fill="#8B3A3A" />
            <ellipse cx="64" cy={baseY + 6} rx="7" ry="9" fill="none" stroke={lipDark} strokeWidth="2" />
          </g>
        );
      default:
        return (
          <g>
            <path d={`M52 ${baseY} Q64 ${baseY + 12}, 76 ${baseY}`} fill="none" stroke={lipDark} strokeWidth="4" strokeLinecap="round" />
            <path d={`M54 ${baseY + 1} Q64 ${baseY + 10}, 74 ${baseY + 1}`} fill="none" stroke={lipMid} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
    }
  }, [traits.mouthStyle]);

  const topElement = useMemo(() => {
    const renderClothingWithShading = (mainPath: string, shadowPaths: string[] = []) => (
      <g>
        <defs>
          <linearGradient id={`${gradientId}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={top.light} />
            <stop offset="50%" stopColor={top.base} />
            <stop offset="100%" stopColor={top.dark} />
          </linearGradient>
        </defs>
        <path d={mainPath} fill={`url(#${gradientId}-top)`} />
        {shadowPaths.map((d, i) => (
          <path key={i} d={d} fill={top.dark} opacity="0.3" />
        ))}
      </g>
    );

    switch (traits.topStyle) {
      case "tshirt":
        return renderClothingWithShading(
          "M40 74 L34 78 L28 95 L44 95 L44 112 L84 112 L84 95 L100 95 L94 78 L88 74 L80 82 L48 82 Z",
          ["M44 82 L44 112 L54 112 L54 82 Z", "M78 95 L84 95 L84 112 L78 112 Z"]
        );
      case "sweater":
        return (
          <g>
            {renderClothingWithShading(
              "M40 74 L28 84 L22 108 L40 108 L40 112 L88 112 L88 108 L106 108 L100 84 L88 74 L80 82 L48 82 Z",
              ["M40 82 L40 112 L50 112 L50 82 Z"]
            )}
            <path d="M40 96 L88 96" stroke={top.dark} strokeWidth="3" opacity="0.4" />
            <path d="M40 102 L88 102" stroke={top.dark} strokeWidth="3" opacity="0.4" />
            <path d="M48 82 L80 82" stroke={top.light} strokeWidth="4" opacity="0.5" />
          </g>
        );
      case "dress":
        return (
          <g>
            {renderClothingWithShading(
              "M42 74 L36 82 L32 112 L38 128 L90 128 L96 112 L92 82 L86 74 L78 82 L50 82 Z",
              ["M50 82 L50 128 L60 128 L60 82 Z"]
            )}
            <path d="M36 100 Q64 105, 92 100" stroke={top.dark} strokeWidth="2" fill="none" opacity="0.3" />
          </g>
        );
      case "hoodie":
        return (
          <g>
            {renderClothingWithShading(
              "M36 74 L26 88 L22 112 L106 112 L102 88 L92 74 L82 84 L46 84 Z",
              ["M46 84 L46 112 L56 112 L56 84 Z"]
            )}
            <ellipse cx="64" cy="80" rx="16" ry="10" fill={top.base} />
            <path d="M54 92 L54 108 L74 108 L74 92 Q64 98, 54 92" fill={top.dark} opacity="0.5" />
            <path d="M54 92 L54 108 L74 108 L74 92 Q64 98, 54 92" fill="none" stroke={top.dark} strokeWidth="2" opacity="0.3" />
          </g>
        );
      case "vest":
        return (
          <g>
            <path d="M46 78 L46 112 L82 112 L82 78 L74 84 L54 84 Z" fill="#FFFFFF" />
            <path d="M54 84 L54 112 L64 112 L64 84 Z" fill="#E0E0E0" opacity="0.5" />
            <defs>
              <linearGradient id={`${gradientId}-vest`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={top.dark} />
                <stop offset="50%" stopColor={top.base} />
                <stop offset="100%" stopColor={top.light} />
              </linearGradient>
            </defs>
            <path d="M40 74 L34 82 L36 112 L48 112 L48 84 L44 78" fill={`url(#${gradientId}-vest)`} />
            <path d="M88 74 L94 82 L92 112 L80 112 L80 84 L84 78" fill={`url(#${gradientId}-vest)`} />
          </g>
        );
      case "overalls":
        return (
          <g>
            <path d="M46 78 L46 112 L82 112 L82 78 L74 86 L54 86 Z" fill="#FFFFFF" />
            <path d="M54 86 L54 112 L64 112 L64 86 Z" fill="#E0E0E0" opacity="0.4" />
            <defs>
              <linearGradient id={`${gradientId}-overall`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={top.light} />
                <stop offset="50%" stopColor={top.base} />
                <stop offset="100%" stopColor={top.dark} />
              </linearGradient>
            </defs>
            <path d="M40 88 L40 128 L54 128 L54 98 L74 98 L74 128 L88 128 L88 88 L74 86 L54 86 Z" fill={`url(#${gradientId}-overall)`} />
            <rect x="48" y="92" width="8" height="6" fill="#FFD700" rx="1" stroke="#D4A800" strokeWidth="1" />
            <rect x="72" y="92" width="8" height="6" fill="#FFD700" rx="1" stroke="#D4A800" strokeWidth="1" />
          </g>
        );
      default:
        return renderClothingWithShading(
          "M40 74 L34 78 L28 95 L44 95 L44 112 L84 112 L84 95 L100 95 L94 78 L88 74 L80 82 L48 82 Z",
          ["M44 82 L44 112 L54 112 L54 82 Z"]
        );
    }
  }, [traits.topStyle, top, gradientId]);

  const bottomElement = useMemo(() => {
    if (traits.topStyle === "dress" || traits.topStyle === "overalls") return null;
    
    const renderBottomWithShading = (mainPath: string) => (
      <g>
        <defs>
          <linearGradient id={`${gradientId}-bottom`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bottom.light} />
            <stop offset="50%" stopColor={bottom.base} />
            <stop offset="100%" stopColor={bottom.dark} />
          </linearGradient>
        </defs>
        <path d={mainPath} fill={`url(#${gradientId}-bottom)`} />
      </g>
    );

    switch (traits.bottomStyle) {
      case "pants":
        return renderBottomWithShading("M42 110 L40 130 L52 130 L56 118 L72 118 L76 130 L88 130 L86 110 Z");
      case "shorts":
        return renderBottomWithShading("M42 110 L40 122 L54 122 L58 114 L70 114 L74 122 L88 122 L86 110 Z");
      case "skirt":
        return renderBottomWithShading("M40 110 L34 130 L94 130 L88 110 Z");
      case "jeans":
        return (
          <g>
            {renderBottomWithShading("M42 110 L40 130 L52 130 L56 118 L72 118 L76 130 L88 130 L86 110 Z")}
            <line x1="48" y1="118" x2="48" y2="128" stroke="#5D6D7E" strokeWidth="1.5" opacity="0.5" />
            <line x1="80" y1="118" x2="80" y2="128" stroke="#5D6D7E" strokeWidth="1.5" opacity="0.5" />
            <rect x="54" y="115" width="6" height="4" fill="#D4A800" rx="1" />
          </g>
        );
      case "leggings":
        return renderBottomWithShading("M44 110 L42 130 L50 130 L54 118 L74 118 L78 130 L86 130 L84 110 Z");
      default:
        return renderBottomWithShading("M42 110 L40 130 L52 130 L56 118 L72 118 L76 130 L88 130 L86 110 Z");
    }
  }, [traits.bottomStyle, traits.topStyle, bottom, gradientId]);

  const shoeElement = useMemo(() => {
    const topY = traits.topStyle === "dress" ? 126 : 128;
    
    const renderShoeWithShading = (leftPath: string, rightPath: string) => (
      <g>
        <defs>
          <linearGradient id={`${gradientId}-shoe`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={shoe.light} />
            <stop offset="50%" stopColor={shoe.base} />
            <stop offset="100%" stopColor={shoe.dark} />
          </linearGradient>
        </defs>
        <path d={leftPath} fill={`url(#${gradientId}-shoe)`} />
        <path d={rightPath} fill={`url(#${gradientId}-shoe)`} />
      </g>
    );

    switch (traits.shoeStyle) {
      case "sneakers":
        return (
          <g>
            {renderShoeWithShading(
              `M36 ${topY - 2} Q36 ${topY + 4}, 46 ${topY + 4} Q56 ${topY + 4}, 56 ${topY - 2} Z`,
              `M72 ${topY - 2} Q72 ${topY + 4}, 82 ${topY + 4} Q92 ${topY + 4}, 92 ${topY - 2} Z`
            )}
            <path d={`M38 ${topY - 1} L40 ${topY - 3} L52 ${topY - 3} L54 ${topY - 1}`} fill="white" />
            <path d={`M74 ${topY - 1} L76 ${topY - 3} L88 ${topY - 3} L90 ${topY - 1}`} fill="white" />
            <circle cx="46" cy={topY} r="2" fill={shoe.dark} opacity="0.3" />
            <circle cx="82" cy={topY} r="2" fill={shoe.dark} opacity="0.3" />
          </g>
        );
      case "boots":
        return (
          <g>
            {renderShoeWithShading(
              `M36 ${topY - 10} L34 ${topY + 4} L56 ${topY + 4} L54 ${topY - 10} Z`,
              `M72 ${topY - 10} L70 ${topY + 4} L92 ${topY + 4} L90 ${topY - 10} Z`
            )}
            <line x1="36" y1={topY - 6} x2="54" y2={topY - 6} stroke={shoe.dark} strokeWidth="2" opacity="0.4" />
            <line x1="72" y1={topY - 6} x2="90" y2={topY - 6} stroke={shoe.dark} strokeWidth="2" opacity="0.4" />
          </g>
        );
      case "sandals":
        return (
          <g>
            <ellipse cx="46" cy={topY} rx="10" ry="4" fill={shoe.base} />
            <ellipse cx="82" cy={topY} rx="10" ry="4" fill={shoe.base} />
            <path d={`M40 ${topY - 4} Q46 ${topY - 2}, 52 ${topY - 4}`} stroke={shoe.dark} strokeWidth="3" fill="none" />
            <path d={`M76 ${topY - 4} Q82 ${topY - 2}, 88 ${topY - 4}`} stroke={shoe.dark} strokeWidth="3" fill="none" />
          </g>
        );
      case "mary_janes":
        return (
          <g>
            {renderShoeWithShading(
              `M36 ${topY - 2} Q36 ${topY + 4}, 46 ${topY + 4} Q56 ${topY + 4}, 56 ${topY - 2} Z`,
              `M72 ${topY - 2} Q72 ${topY + 4}, 82 ${topY + 4} Q92 ${topY + 4}, 92 ${topY - 2} Z`
            )}
            <circle cx="50" cy={topY - 2} r="3" fill="#FFD700" stroke="#D4A800" strokeWidth="1" />
            <circle cx="86" cy={topY - 2} r="3" fill="#FFD700" stroke="#D4A800" strokeWidth="1" />
          </g>
        );
      case "slippers":
        return (
          <g>
            <ellipse cx="46" cy={topY} rx="12" ry="6" fill={shoe.base} />
            <ellipse cx="82" cy={topY} rx="12" ry="6" fill={shoe.base} />
            <ellipse cx="46" cy={topY - 2} rx="10" ry="4" fill={shoe.light} opacity="0.5" />
            <ellipse cx="82" cy={topY - 2} rx="10" ry="4" fill={shoe.light} opacity="0.5" />
          </g>
        );
      default:
        return (
          <g>
            {renderShoeWithShading(
              `M36 ${topY - 2} Q36 ${topY + 4}, 46 ${topY + 4} Q56 ${topY + 4}, 56 ${topY - 2} Z`,
              `M72 ${topY - 2} Q72 ${topY + 4}, 82 ${topY + 4} Q92 ${topY + 4}, 92 ${topY - 2} Z`
            )}
          </g>
        );
    }
  }, [traits.shoeStyle, traits.topStyle, shoe, gradientId]);

  const accessoryElement = useMemo(() => {
    switch (traits.accessory) {
      case "glasses":
        return (
          <g>
            <circle cx="50" cy="44" r="11" fill="none" stroke="#333" strokeWidth="3" />
            <circle cx="78" cy="44" r="11" fill="none" stroke="#333" strokeWidth="3" />
            <path d="M61 44 L67 44" stroke="#333" strokeWidth="3" />
            <path d="M39 44 L30 40" stroke="#333" strokeWidth="3" />
            <path d="M89 44 L98 40" stroke="#333" strokeWidth="3" />
            <circle cx="50" cy="44" r="9" fill="white" opacity="0.1" />
            <circle cx="78" cy="44" r="9" fill="white" opacity="0.1" />
          </g>
        );
      case "headband":
        return (
          <g>
            <path d="M28 28 Q64 16, 100 28" stroke="#E91E63" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M30 28 Q64 18, 98 28" stroke="#F48FB1" strokeWidth="2" fill="none" opacity="0.6" />
          </g>
        );
      case "bow":
        return (
          <g>
            <ellipse cx="76" cy="18" rx="8" ry="5" fill="#E91E63" />
            <ellipse cx="92" cy="18" rx="8" ry="5" fill="#E91E63" />
            <circle cx="84" cy="20" r="5" fill="#C2185B" />
            <ellipse cx="76" cy="16" rx="4" ry="2" fill="#F48FB1" opacity="0.5" />
            <ellipse cx="92" cy="16" rx="4" ry="2" fill="#F48FB1" opacity="0.5" />
          </g>
        );
      case "hat":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-hat`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5DADE2" />
                <stop offset="100%" stopColor="#2471A3" />
              </linearGradient>
            </defs>
            <ellipse cx="64" cy="16" rx="32" ry="8" fill={`url(#${gradientId}-hat)`} />
            <path d="M42 16 L42 2 Q64 -8, 86 2 L86 16" fill={`url(#${gradientId}-hat)`} />
            <ellipse cx="64" cy="16" rx="32" ry="8" fill="none" stroke="#2471A3" strokeWidth="2" />
          </g>
        );
      case "crown":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-crown`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#D4A800" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFF0A0" />
              </linearGradient>
            </defs>
            <path d="M38 22 L44 6 L54 18 L64 2 L74 18 L84 6 L90 22 Z" fill={`url(#${gradientId}-crown)`} />
            <rect x="38" y="20" width="52" height="10" fill={`url(#${gradientId}-crown)`} />
            <circle cx="50" cy="25" r="3" fill="#E74C3C" />
            <circle cx="64" cy="25" r="3" fill="#3498DB" />
            <circle cx="78" cy="25" r="3" fill="#27AE60" />
            <path d="M38 22 L44 6 L54 18 L64 2 L74 18 L84 6 L90 22" fill="none" stroke="#D4A800" strokeWidth="2" />
          </g>
        );
      case "flowers":
        return (
          <g>
            {[36, 92].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="26" r="4" fill="#FF69B4" />
                <circle cx={cx - 4} cy="30" r="4" fill="#FF69B4" />
                <circle cx={cx + 4} cy="30" r="4" fill="#FF69B4" />
                <circle cx={cx - 3} cy="34" r="4" fill="#FF69B4" />
                <circle cx={cx + 3} cy="34" r="4" fill="#FF69B4" />
                <circle cx={cx} cy="30" r="4" fill="#FFD700" />
              </g>
            ))}
          </g>
        );
      case "stars":
        return (
          <g>
            <defs>
              <linearGradient id={`${gradientId}-star`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF0A0" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#D4A800" />
              </linearGradient>
            </defs>
            <polygon points="34,24 36,30 42,30 37,34 39,40 34,36 29,40 31,34 26,30 32,30" fill={`url(#${gradientId}-star)`} />
            <polygon points="94,24 96,30 102,30 97,34 99,40 94,36 89,40 91,34 86,30 92,30" fill={`url(#${gradientId}-star)`} />
          </g>
        );
      default:
        return null;
    }
  }, [traits.accessory, gradientId]);

  // Eyebrows based on hair color
  const eyebrowElement = useMemo(() => (
    <g>
      <path d="M42 34 Q50 30, 58 34" stroke={hair.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M70 34 Q78 30, 86 34" stroke={hair.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  ), [hair]);

  // Nose with subtle shading
  const noseElement = useMemo(() => (
    <g>
      <path d="M64 48 Q62 54, 64 56 Q66 54, 64 48" fill={skin.shadow} opacity="0.4" />
      <ellipse cx="60" cy="56" rx="2" ry="1.5" fill={skin.shadow} opacity="0.3" />
      <ellipse cx="68" cy="56" rx="2" ry="1.5" fill={skin.shadow} opacity="0.3" />
    </g>
  ), [skin]);

  return (
    <svg
      viewBox="0 0 128 140"
      width={size}
      height={size * 1.09375}
      className={className}
      data-testid="avatar-renderer"
    >
      <defs>
        {/* Shared gradients */}
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="17%" stopColor="#FF7F00" />
          <stop offset="33%" stopColor="#FFFF00" />
          <stop offset="50%" stopColor="#00FF00" />
          <stop offset="67%" stopColor="#0000FF" />
          <stop offset="83%" stopColor="#4B0082" />
          <stop offset="100%" stopColor="#8B00FF" />
        </linearGradient>
        
        {/* Skin gradient */}
        <radialGradient id={`${gradientId}-skin`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor={skin.highlight} />
          <stop offset="60%" stopColor={skin.base} />
          <stop offset="100%" stopColor={skin.shadow} />
        </radialGradient>
        
        {/* Eye shadow for depth */}
        <radialGradient id={`${gradientId}-eye-shadow`} cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        
        {/* Iris gradient for depth */}
        <radialGradient id={`${gradientId}-iris-gradient`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Body structure with shading */}
      {shoeElement}
      {bottomElement}
      {topElement}
      
      {/* Neck with shading */}
      <ellipse cx="64" cy="76" rx="12" ry="8" fill={`url(#${gradientId}-skin)`} />
      
      {/* Head with realistic shading */}
      <ellipse cx="64" cy="48" rx="32" ry="34" fill={`url(#${gradientId}-skin)`} />
      
      {/* Subtle jawline */}
      <path d="M36 58 Q64 78, 92 58" fill="none" stroke={skin.shadow} strokeWidth="1" opacity="0.3" />
      
      {/* Ears */}
      <ellipse cx="30" cy="48" rx="5" ry="8" fill={skin.base} />
      <ellipse cx="30" cy="48" rx="3" ry="5" fill={skin.shadow} opacity="0.3" />
      <ellipse cx="98" cy="48" rx="5" ry="8" fill={skin.base} />
      <ellipse cx="98" cy="48" rx="3" ry="5" fill={skin.shadow} opacity="0.3" />
      
      {/* Hands */}
      <ellipse cx="30" cy="95" rx="7" ry="5" fill={`url(#${gradientId}-skin)`} />
      <ellipse cx="98" cy="95" rx="7" ry="5" fill={`url(#${gradientId}-skin)`} />
      
      {/* Hair (rendered after head base but before face features) */}
      {hairElement}
      
      {/* Eyebrows */}
      {eyebrowElement}
      
      {/* Eyes */}
      {eyeElements}
      
      {/* Nose */}
      {noseElement}
      
      {/* Mouth */}
      {mouthElement}
      
      {/* Cheek blush */}
      <ellipse cx="38" cy="54" rx="6" ry="3" fill={skin.blush} opacity="0.4" />
      <ellipse cx="90" cy="54" rx="6" ry="3" fill={skin.blush} opacity="0.4" />
      
      {/* Face highlight */}
      <ellipse cx="52" cy="38" rx="8" ry="4" fill={skin.highlight} opacity="0.3" />
      <ellipse cx="76" cy="38" rx="8" ry="4" fill={skin.highlight} opacity="0.3" />
      
      {/* Accessory (rendered last to be on top) */}
      {accessoryElement}
    </svg>
  );
}

export function AvatarIcon({ traits, size = 32, className = "" }: AvatarRendererProps) {
  return (
    <div 
      className={`rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      data-testid="avatar-icon"
    >
      <AvatarRenderer traits={traits} size={size * 0.9} />
    </div>
  );
}
