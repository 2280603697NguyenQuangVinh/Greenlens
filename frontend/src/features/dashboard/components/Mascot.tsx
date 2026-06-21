import type { AvatarConfig } from "@/utils/types"
import { AvatarPreview } from "@/features/avatar/components/AvatarPreview"

export function Mascot({
  cfg,
  size = 120,
  rounded = false,
}: {
  cfg: AvatarConfig
  size?: number
  rounded?: boolean
}) {
  return <AvatarPreview cfg={cfg} size={size} rounded={rounded} />
}
