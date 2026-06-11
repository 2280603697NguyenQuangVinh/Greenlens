import {
  toChildProfilePayload,
  type ChildProfileResponse,
} from "@/lib/avatarMapper";
import type { AvatarConfig } from "@/app/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const CHILD_PROFILES_PATH = `${API_BASE}/child-profiles`;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export function validateCharacterName(name: string): string | null {
  if (!name.trim()) {
    return "Character Name is required";
  }
  return null;
}

export async function createChildProfile(
  cfg: AvatarConfig,
  characterName: string,
): Promise<ChildProfileResponse> {
  const validationError = validateCharacterName(characterName);
  if (validationError) {
    throw new ValidationError(validationError);
  }

  const body = toChildProfilePayload(cfg, characterName);

  let res: Response;
  try {
    res = await fetch(CHILD_PROFILES_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new NetworkError("No internet connection. Please try again later.");
  }

  if (!res.ok) {
    throw new ApiError("Unable to create character profile. Please try again.");
  }

  return res.json() as Promise<ChildProfileResponse>;
}
