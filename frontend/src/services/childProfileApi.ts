import {
  toChildProfilePayload,
  type ChildProfileResponse,
} from "@/utils/avatarMapper"
import type { AvatarConfig } from "@/utils/types"
import { ApiError, NetworkError, ValidationError } from "@/services/errors"
import { apiUrl } from "@/services/http"

export { ApiError, NetworkError, ValidationError }

const CHILD_PROFILES_PATH = apiUrl("/child-profiles")

export function validateCharacterName(name: string): string | null {
  if (!name.trim()) {
    return "Character Name is required"
  }
  return null
}

export async function createChildProfile(
  cfg: AvatarConfig,
  characterName: string,
): Promise<ChildProfileResponse> {
  const validationError = validateCharacterName(characterName)
  if (validationError) {
    throw new ValidationError(validationError)
  }

  const body = toChildProfilePayload(cfg, characterName)

  let res: Response
  try {
    res = await fetch(CHILD_PROFILES_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new NetworkError("No internet connection. Please try again later.")
  }

  if (!res.ok) {
    throw new ApiError("Unable to create character profile. Please try again.")
  }

  return res.json() as Promise<ChildProfileResponse>
}
