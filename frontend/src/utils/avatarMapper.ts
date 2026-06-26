import { getLevelFromXp } from "@/utils/levelProgress"

export interface ChildProfileRequest {
  characterName: string;
  gender: "male" | "female";
  hair: string;
  eyes: string;
  outfit: string;
  avatarPreview: string;
}

export interface ChildProfileResponse {
  childId: string;
  cognitoSub?: string;
  characterName: string;
  gender: "male" | "female";
  hair: string;
  eyes: string;
  outfit: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  rewards: string[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toChildProfilePayload(
  cfg: AvatarConfig,
  characterName: string,
): ChildProfileRequest {
  return {
    characterName: characterName.trim(),
    gender: cfg.gender === 1 ? "female" : "male",
    hair: `hair_${pad2(cfg.hair)}`,
    eyes: `eyes_${pad2(cfg.eyes + 1)}`,
    outfit: `outfit_${pad2(cfg.outfit)}`,
    avatarPreview: `character_preview_${pad2(cfg.outfit)}`,
  };
}

function parseIndexedAsset(value: string, fallback = 0): number {
  const match = value.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : fallback;
}

export function childProfileResponseToUserProfile(
  res: ChildProfileResponse,
): UserProfile {
  return {
    badgeId: res.childId,
    characterName: res.characterName,
    cognitoSub: res.cognitoSub?.trim() || undefined,
    gender: res.gender === "female" ? 1 : 0,
    skin: 0,
    hair: parseIndexedAsset(res.hair, 1),
    eyes: Math.max(0, parseIndexedAsset(res.eyes, 1) - 1),
    outfit: parseIndexedAsset(res.outfit, 1),
    xp: res.xp,
    level: getLevelFromXp(res.xp),
    streak: res.streak,
    dailyScansCompleted: 0,
    dailyScansTarget: 3,
    recentActivity: [],
  };
}
