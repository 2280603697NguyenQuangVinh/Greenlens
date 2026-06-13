import type { AvatarConfig } from "@/utils/types";

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
