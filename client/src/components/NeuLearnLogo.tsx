import horizontalLogoUrl from "@assets/Untitled design - 2025-11-29T094722.563_1764427699900.png";
import iconLogoUrl from "@assets/20251128_233810_0000_1764391136268.png";

interface NeuLearnLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "icon";
  className?: string;
}

export default function NeuLearnLogo({ 
  size = "md", 
  variant = "horizontal",
  className = "" 
}: NeuLearnLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14"
  };

  const logoSrc = variant === "horizontal" ? horizontalLogoUrl : iconLogoUrl;

  return (
    <img 
      src={logoSrc} 
      alt="Neulearn" 
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
      data-testid="img-neulearn-logo"
    />
  );
}
