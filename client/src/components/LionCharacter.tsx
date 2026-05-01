import { useMemo } from "react";

export type LionGrowthStage = "cub" | "young" | "adult" | "wise";
export type LionExpression = "happy" | "teaching" | "thinking" | "celebrating" | "encouraging" | "listening" | "speaking";

interface LionCharacterProps {
  stage: LionGrowthStage;
  expression: LionExpression;
  size?: number;
  className?: string;
  isSpeaking?: boolean;
}

const stageColors = {
  cub: {
    mane: "#D4A056",
    maneDark: "#B8863C",
    maneLight: "#E8C486",
    fur: "#F5D89A",
    furDark: "#DFC07A",
    furLight: "#FFF0C8",
    nose: "#4A3728",
    eyes: "#2D1810",
  },
  young: {
    mane: "#C9923D",
    maneDark: "#A67629",
    maneLight: "#E0B060",
    fur: "#EACF8A",
    furDark: "#D4B66A",
    furLight: "#FCE8B8",
    nose: "#3D2D22",
    eyes: "#241510",
  },
  adult: {
    mane: "#B8802E",
    maneDark: "#956520",
    maneLight: "#D49848",
    fur: "#E0C67A",
    furDark: "#C8AA5A",
    furLight: "#F5DFA5",
    nose: "#352518",
    eyes: "#1C100A",
  },
  wise: {
    mane: "#A87528",
    maneDark: "#855B1A",
    maneLight: "#C49040",
    fur: "#D8BE72",
    furDark: "#C0A252",
    furLight: "#EED898",
    nose: "#2D1F14",
    eyes: "#180C06",
  },
};

const maneScales = {
  cub: 0.3,
  young: 0.6,
  adult: 0.9,
  wise: 1.0,
};

const bodyScales = {
  cub: 0.7,
  young: 0.85,
  adult: 1.0,
  wise: 1.05,
};

export function LionCharacter({
  stage,
  expression,
  size = 200,
  className = "",
  isSpeaking = false,
}: LionCharacterProps) {
  const colors = stageColors[stage];
  const maneScale = maneScales[stage];
  const bodyScale = bodyScales[stage];
  
  const gradientId = useMemo(() => `lion-${Math.random().toString(36).substr(2, 9)}`, []);

  const getEyeExpression = () => {
    switch (expression) {
      case "happy":
      case "celebrating":
        return (
          <>
            <path d="M70 95 Q75 90, 80 95" stroke={colors.eyes} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M120 95 Q125 90, 130 95" stroke={colors.eyes} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case "thinking":
        return (
          <>
            <ellipse cx="75" cy="95" rx="8" ry="10" fill="white" />
            <ellipse cx="75" cy="93" rx="5" ry="6" fill={colors.eyes} />
            <ellipse cx="73" cy="91" rx="2" ry="2" fill="white" />
            <ellipse cx="125" cy="95" rx="8" ry="10" fill="white" />
            <ellipse cx="127" cy="93" rx="5" ry="6" fill={colors.eyes} />
            <ellipse cx="125" cy="91" rx="2" ry="2" fill="white" />
          </>
        );
      case "teaching":
      case "speaking":
        return (
          <>
            <ellipse cx="75" cy="95" rx="9" ry="11" fill="white" />
            <ellipse cx="75" cy="95" rx="6" ry="7" fill={colors.eyes} />
            <ellipse cx="73" cy="93" rx="2" ry="2" fill="white" />
            <ellipse cx="125" cy="95" rx="9" ry="11" fill="white" />
            <ellipse cx="125" cy="95" rx="6" ry="7" fill={colors.eyes} />
            <ellipse cx="123" cy="93" rx="2" ry="2" fill="white" />
          </>
        );
      case "encouraging":
        return (
          <>
            <ellipse cx="75" cy="95" rx="10" ry="12" fill="white" />
            <ellipse cx="77" cy="95" rx="6" ry="8" fill={colors.eyes} />
            <ellipse cx="75" cy="92" rx="3" ry="3" fill="white" />
            <ellipse cx="125" cy="95" rx="10" ry="12" fill="white" />
            <ellipse cx="127" cy="95" rx="6" ry="8" fill={colors.eyes} />
            <ellipse cx="125" cy="92" rx="3" ry="3" fill="white" />
          </>
        );
      case "listening":
        return (
          <>
            <ellipse cx="75" cy="95" rx="8" ry="10" fill="white" />
            <ellipse cx="75" cy="95" rx="5" ry="6" fill={colors.eyes} />
            <ellipse cx="73" cy="93" rx="2" ry="2" fill="white" />
            <ellipse cx="125" cy="95" rx="8" ry="10" fill="white" />
            <ellipse cx="125" cy="95" rx="5" ry="6" fill={colors.eyes} />
            <ellipse cx="123" cy="93" rx="2" ry="2" fill="white" />
          </>
        );
      default:
        return (
          <>
            <ellipse cx="75" cy="95" rx="8" ry="10" fill="white" />
            <ellipse cx="75" cy="95" rx="5" ry="6" fill={colors.eyes} />
            <ellipse cx="73" cy="93" rx="2" ry="2" fill="white" />
            <ellipse cx="125" cy="95" rx="8" ry="10" fill="white" />
            <ellipse cx="125" cy="95" rx="5" ry="6" fill={colors.eyes} />
            <ellipse cx="123" cy="93" rx="2" ry="2" fill="white" />
          </>
        );
    }
  };

  const getMouthExpression = () => {
    const speakingOffset = isSpeaking ? Math.sin(Date.now() / 100) * 3 : 0;
    
    switch (expression) {
      case "happy":
        return (
          <path d="M85 125 Q100 140, 115 125" stroke={colors.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
        );
      case "celebrating":
        return (
          <>
            <path d="M80 122 Q100 145, 120 122" stroke={colors.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="100" cy="132" rx="12" ry="8" fill="#FF6B6B" opacity="0.6" />
          </>
        );
      case "thinking":
        return (
          <path d="M90 128 Q100 132, 110 128" stroke={colors.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
        );
      case "teaching":
      case "speaking":
        return (
          <>
            <ellipse cx="100" cy={128 + speakingOffset} rx="10" ry={isSpeaking ? 8 + Math.abs(speakingOffset) : 6} fill={colors.nose} />
            <ellipse cx="100" cy={130 + speakingOffset} rx="6" ry={isSpeaking ? 4 + Math.abs(speakingOffset / 2) : 3} fill="#8B4D5A" />
          </>
        );
      case "encouraging":
        return (
          <path d="M82 123 Q100 142, 118 123" stroke={colors.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
        );
      case "listening":
        return (
          <ellipse cx="100" cy="128" rx="6" ry="4" fill={colors.nose} />
        );
      default:
        return (
          <path d="M85 125 Q100 138, 115 125" stroke={colors.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
        );
    }
  };

  const getEyebrows = () => {
    switch (expression) {
      case "thinking":
        return (
          <>
            <path d="M62 78 Q75 72, 88 78" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M112 78 Q125 72, 138 78" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case "celebrating":
        return (
          <>
            <path d="M62 82 Q75 76, 88 82" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M112 82 Q125 76, 138 82" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case "encouraging":
        return (
          <>
            <path d="M62 80 Q75 74, 88 78" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M112 78 Q125 74, 138 80" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <path d="M62 80 Q75 76, 88 80" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M112 80 Q125 76, 138 80" stroke={colors.maneDark} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };

  const getBodyPose = () => {
    switch (expression) {
      case "celebrating":
        return (
          <g transform={`translate(0, ${10 * (1 - bodyScale)})`}>
            <ellipse cx="100" cy="200" rx={50 * bodyScale} ry={40 * bodyScale} fill={`url(#${gradientId}-body)`} />
            <ellipse cx="60" cy="180" rx={12 * bodyScale} ry={30 * bodyScale} fill={`url(#${gradientId}-paw)`} transform="rotate(-30, 60, 180)" />
            <ellipse cx="140" cy="180" rx={12 * bodyScale} ry={30 * bodyScale} fill={`url(#${gradientId}-paw)`} transform="rotate(30, 140, 180)" />
            <ellipse cx="70" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="130" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
          </g>
        );
      case "teaching":
        return (
          <g transform={`translate(0, ${10 * (1 - bodyScale)})`}>
            <ellipse cx="100" cy="200" rx={50 * bodyScale} ry={40 * bodyScale} fill={`url(#${gradientId}-body)`} />
            <ellipse cx="55" cy="190" rx={12 * bodyScale} ry={25 * bodyScale} fill={`url(#${gradientId}-paw)`} transform="rotate(-15, 55, 190)" />
            <ellipse cx="150" cy="175" rx={12 * bodyScale} ry={30 * bodyScale} fill={`url(#${gradientId}-paw)`} transform="rotate(45, 150, 175)" />
            <ellipse cx="70" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="130" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
          </g>
        );
      case "thinking":
        return (
          <g transform={`translate(0, ${10 * (1 - bodyScale)})`}>
            <ellipse cx="100" cy="200" rx={50 * bodyScale} ry={40 * bodyScale} fill={`url(#${gradientId}-body)`} />
            <ellipse cx="55" cy="195" rx={12 * bodyScale} ry={25 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="135" cy="160" rx={12 * bodyScale} ry={25 * bodyScale} fill={`url(#${gradientId}-paw)`} transform="rotate(60, 135, 160)" />
            <ellipse cx="70" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="130" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
          </g>
        );
      default:
        return (
          <g transform={`translate(0, ${10 * (1 - bodyScale)})`}>
            <ellipse cx="100" cy="200" rx={50 * bodyScale} ry={40 * bodyScale} fill={`url(#${gradientId}-body)`} />
            <ellipse cx="55" cy="195" rx={12 * bodyScale} ry={25 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="145" cy="195" rx={12 * bodyScale} ry={25 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="70" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
            <ellipse cx="130" cy="240" rx={15 * bodyScale} ry={12 * bodyScale} fill={`url(#${gradientId}-paw)`} />
          </g>
        );
    }
  };

  const getAccessories = () => {
    if (stage === "wise") {
      return (
        <g>
          <path d="M70 30 L100 10 L130 30 L120 30 L100 18 L80 30 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
          <circle cx="100" cy="28" r="5" fill="#E74C3C" />
          <circle cx="85" cy="26" r="3" fill="#3498DB" />
          <circle cx="115" cy="26" r="3" fill="#2ECC71" />
        </g>
      );
    }
    return null;
  };

  const getTail = () => {
    const tailLength = 30 + (maneScale * 20);
    return (
      <g>
        <path 
          d={`M150 200 Q${170 + tailLength * 0.3} 190, ${160 + tailLength * 0.5} 170 Q${155 + tailLength * 0.6} 150, ${165 + tailLength * 0.7} 140`}
          stroke={colors.fur}
          strokeWidth={8 * bodyScale}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse 
          cx={165 + tailLength * 0.7} 
          cy={135} 
          rx={10 * maneScale + 5} 
          ry={8 * maneScale + 4} 
          fill={colors.mane}
        />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={size * 1.3}
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${gradientId}-mane`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={colors.maneLight} />
          <stop offset="50%" stopColor={colors.mane} />
          <stop offset="100%" stopColor={colors.maneDark} />
        </radialGradient>
        <radialGradient id={`${gradientId}-face`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={colors.furLight} />
          <stop offset="60%" stopColor={colors.fur} />
          <stop offset="100%" stopColor={colors.furDark} />
        </radialGradient>
        <radialGradient id={`${gradientId}-body`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={colors.furLight} />
          <stop offset="60%" stopColor={colors.fur} />
          <stop offset="100%" stopColor={colors.furDark} />
        </radialGradient>
        <radialGradient id={`${gradientId}-paw`} cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={colors.furLight} />
          <stop offset="70%" stopColor={colors.fur} />
          <stop offset="100%" stopColor={colors.furDark} />
        </radialGradient>
      </defs>

      {getTail()}
      {getBodyPose()}

      {maneScale > 0.2 && (
        <g transform={`translate(${100 - 100 * maneScale}, ${50 - 30 * maneScale}) scale(${0.5 + maneScale * 0.5})`}>
          <ellipse cx="100" cy="100" rx={80} ry={75} fill={`url(#${gradientId}-mane)`} />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 100 + Math.cos(rad) * 70;
            const y = 100 + Math.sin(rad) * 65;
            const tuftSize = 15 + (i % 3) * 5;
            return (
              <ellipse
                key={angle}
                cx={x}
                cy={y}
                rx={tuftSize}
                ry={tuftSize * 1.2}
                fill={colors.mane}
                transform={`rotate(${angle}, ${x}, ${y})`}
              />
            );
          })}
        </g>
      )}

      <ellipse cx="100" cy="100" rx="55" ry="50" fill={`url(#${gradientId}-face)`} />

      <ellipse cx="65" cy="60" rx="18" ry="15" fill={colors.fur} />
      <ellipse cx="65" cy="60" rx="12" ry="10" fill={colors.furLight} />
      <ellipse cx="135" cy="60" rx="18" ry="15" fill={colors.fur} />
      <ellipse cx="135" cy="60" rx="12" ry="10" fill={colors.furLight} />

      {getEyebrows()}
      {getEyeExpression()}

      <ellipse cx="100" cy="112" rx="12" ry="10" fill={colors.nose} />
      <ellipse cx="100" cy="110" rx="6" ry="4" fill={colors.furLight} opacity="0.4" />

      <path d="M100 118 L100 122" stroke={colors.nose} strokeWidth="2" />

      {getMouthExpression()}

      <g opacity="0.7">
        {[-25, -15, -5, 5, 15, 25].map((offset, i) => (
          <line
            key={`whisker-l-${i}`}
            x1="55"
            y1={115 + (i % 3) * 5}
            x2={25 + offset}
            y2={110 + (i % 3) * 8}
            stroke={colors.furDark}
            strokeWidth="1.5"
          />
        ))}
        {[-25, -15, -5, 5, 15, 25].map((offset, i) => (
          <line
            key={`whisker-r-${i}`}
            x1="145"
            y1={115 + (i % 3) * 5}
            x2={175 - offset}
            y2={110 + (i % 3) * 8}
            stroke={colors.furDark}
            strokeWidth="1.5"
          />
        ))}
      </g>

      {getAccessories()}

      {expression === "celebrating" && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={`sparkle-${i}`} opacity="0.8">
              <path
                d={`M${30 + i * 35} ${20 + (i % 2) * 15} l3 -8 l3 8 l8 -3 l-8 3 l3 8 l-3 -8 l-8 3 z`}
                fill="#FFD700"
              />
            </g>
          ))}
        </>
      )}

      {expression === "thinking" && (
        <g>
          <circle cx="160" cy="50" r="8" fill="white" stroke="#DDD" strokeWidth="1" />
          <circle cx="175" cy="35" r="12" fill="white" stroke="#DDD" strokeWidth="1" />
          <circle cx="195" cy="20" r="18" fill="white" stroke="#DDD" strokeWidth="1" />
          <text x="195" y="25" textAnchor="middle" fontSize="16" fill="#666">?</text>
        </g>
      )}
    </svg>
  );
}

export default LionCharacter;
