import type { AvatarData } from "./AvatarCustomizer";

interface AvatarPreviewProps {
  avatar: AvatarData;
  size?: number;
}

export function AvatarPreview({ avatar, size = 200 }: AvatarPreviewProps) {
  const { gender, skinColor, hairStyle, hairColor, clothingStyle, clothingColor, accessories } = avatar;

  const getHairPath = (style: number) => {
    switch (style) {
      case 1: // Short
        return "M30 28 C30 15 40 8 50 8 C60 8 70 15 70 28 C70 32 65 35 50 35 C35 35 30 32 30 28";
      case 2: // Long
        return "M25 28 C25 12 38 5 50 5 C62 5 75 12 75 28 C75 45 72 65 68 80 C65 90 55 95 50 95 C45 95 35 90 32 80 C28 65 25 45 25 28";
      case 3: // Curly
        return "M30 28 C30 15 40 8 50 8 C60 8 70 15 70 28 C70 35 65 38 50 38 C35 38 30 35 30 28";
      case 4: // Wavy
        return "M28 28 C28 15 38 8 50 8 C62 8 72 15 72 28 C72 35 68 38 50 38 C32 38 28 35 28 28";
      case 5: // Spiky
        return "M32 28 C32 15 40 8 50 8 C60 8 68 15 68 28 C68 33 64 36 50 36 C36 36 32 33 32 28";
      case 6: // Bald
        return "";
      default: return "M30 28 C30 15 40 8 50 8 C60 8 70 15 70 28 C70 32 65 35 50 35 C35 35 30 32 30 28";
    }
  };

  const getClothingPath = (style: number) => {
    switch (style) {
      case 1: // T-shirt
        return "M20 85 L30 70 L70 70 L80 85 L80 140 L20 140 Z";
      case 2: // V-neck
        return "M20 85 L30 70 L50 85 L70 70 L80 85 L80 140 L20 140 Z";
      case 3: // Hoodie
        return "M15 85 L25 65 L50 75 L75 65 L85 85 L85 140 L15 140 Z";
      case 4: // Polo
        return "M20 85 L30 70 L35 75 L50 70 L65 75 L70 70 L80 85 L80 140 L20 140 Z";
      case 5: // Tank top
        return "M25 85 L35 70 L50 75 L65 70 L75 85 L75 140 L25 140 Z";
      case 6: // Collared shirt
        return "M20 85 L30 70 L50 80 L70 70 L80 85 L80 140 L20 140 Z";
      default: return "M20 85 L30 70 L70 70 L80 85 L80 140 L20 140 Z";
    }
  };

  const getClothingLogo = (style: number) => {
    switch (style) {
      case 1: return "⭐";
      case 2: return "🐉";
      case 3: return "🦋";
      case 4: return "🌸";
      case 5: return "⚡";
      case 6: return "🌟";
      default: return "";
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 160" className="w-full h-full">
      {/* Background */}
      <rect width="100" height="160" fill="#f0f0f0" rx="10" />

      {/* Layer 1: Hair */}
      {hairStyle && hairColor && hairStyle !== 6 && (
        <path
          d={getHairPath(hairStyle)}
          fill={hairColor}
          stroke="#333"
          strokeWidth="1.5"
        />
      )}

      {/* Layer 2: Clothing (chest up, CV style) */}
      {clothingStyle && clothingColor && (
        <path
          d={getClothingPath(clothingStyle)}
          fill={clothingColor}
          stroke="#333"
          strokeWidth="2"
        />
      )}

      {/* Clothing Logo */}
      {clothingStyle && (
        <text
          x="50"
          y="110"
          textAnchor="middle"
          fontSize="16"
        >
          {getClothingLogo(clothingStyle)}
        </text>
      )}

      {/* Layer 3: Face */}
      <ellipse
        cx="50"
        cy="45"
        rx="20"
        ry="24"
        fill={skinColor || "#FFDBB4"}
        stroke="#333"
        strokeWidth="2"
      />

      {/* Eyes */}
      <circle cx="42" cy="42" r="2.5" fill="#333" />
      <circle cx="58" cy="42" r="2.5" fill="#333" />

      {/* Eyebrows */}
      <path d="M38 37 Q42 35 46 37" fill="none" stroke="#333" strokeWidth="1.5" />
      <path d="M54 37 Q58 35 62 37" fill="none" stroke="#333" strokeWidth="1.5" />

      {/* Nose */}
      <path d="M50 42 L50 48" stroke="#333" strokeWidth="1.5" />

      {/* Mouth */}
      <path
        d="M44 54 Q50 58 56 54"
        fill="none"
        stroke="#333"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Layer 4: Accessories */}
      {accessories && Object.entries(accessories).map(([id, acc]) => {
        if (acc.style) {
          switch (id) {
            case "hat":
              return (
                <g key={id}>
                  <ellipse cx="50" cy="18" rx="18" ry="6" fill="#333" />
                  <rect x="38" y="12" width="24" height="8" fill="#333" />
                </g>
              );
            case "glasses":
              return (
                <g key={id}>
                  <circle cx="42" cy="42" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
                  <circle cx="58" cy="42" r="6" fill="none" stroke="#333" strokeWidth="1.5" />
                  <line x1="48" y1="42" x2="52" y2="42" stroke="#333" strokeWidth="1.5" />
                </g>
              );
            case "sunglasses":
              return (
                <g key={id}>
                  <ellipse cx="42" cy="42" rx="7" ry="5" fill="#333" />
                  <ellipse cx="58" cy="42" rx="7" ry="5" fill="#333" />
                  <line x1="49" y1="42" x2="51" y2="42" stroke="#333" strokeWidth="2" />
                </g>
              );
            case "necklace":
              return (
                <path
                  key={id}
                  d="M35 68 Q50 78 65 68"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
              );
            case "earrings":
              return (
                <g key={id}>
                  <circle cx="30" cy="45" r="3" fill="#FFD700" />
                  <circle cx="70" cy="45" r="3" fill="#FFD700" />
                </g>
              );
            case "watch":
              return (
                <g key={id}>
                  <rect x="75" y="85" width="12" height="8" fill="#333" />
                  <rect x="78" y="87" width="6" height="4" fill="#FFF" />
                </g>
              );
            case "bracelet":
              return (
                <rect
                  key={id}
                  x="76"
                  y="95"
                  width="10"
                  height="3"
                  fill="#C0C0C0"
                />
              );
            case "scarf":
              return (
                <g key={id}>
                  <path d="M30 65 Q50 75 70 65" fill="none" stroke="#FF6B6B" strokeWidth="4" />
                  <path d="M70 65 L75 80" fill="none" stroke="#FF6B6B" strokeWidth="4" />
                </g>
              );
            case "bag":
              return (
                <g key={id}>
                  <rect x="72" y="90" width="15" height="20" fill="#8B4513" stroke="#333" strokeWidth="1" />
                  <path d="M75 90 Q79.5 85 84 90" fill="none" stroke="#333" strokeWidth="2" />
                </g>
              );
            default:
              return null;
          }
        }
        return null;
      })}
    </svg>
  );
}
