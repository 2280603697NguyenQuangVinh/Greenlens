import type { AvatarConfig } from "@/utils/types"
import { AvatarPreview } from "@/features/avatar/components/AvatarPreview"

export function Mascot({ cfg, size = 120, modelSrc }: { cfg: AvatarConfig; size?: number; modelSrc?: string }) {
  if (modelSrc) {
    return (
      <div className="relative" style={{ width: size, height: size * 1.22, minWidth: size }}>
        <img
          src={modelSrc}
          alt="Avatar preview"
          className="absolute inset-0 w-full h-full object-contain rounded-[28px]"
        />
      </div>
    )
  }

  return <AvatarPreview cfg={cfg} size={size} rounded />
}
