import type { AvatarConfig } from "@/utils/types"
import { getAvatarImages } from "@/assets"
import { getLayerLayout } from "@/utils/avatarPreviewConfig"

type AvatarPreviewProps = {
  cfg: AvatarConfig
  size?: number
  rounded?: boolean
  className?: string
}

export function AvatarPreview({ cfg, size = 170, rounded = false, className = "" }: AvatarPreviewProps) {
  const preview = getAvatarImages(cfg)
  const layer = getLayerLayout(cfg)
  const stageSize = `${layer.stageScalePct}%`

  const buildLayerStyle = (layout: {
    widthPct: number
    topPct: number
    xPct: number
    offsetXPct?: number
    offsetYPct?: number
  }) => ({
    width: `${layout.widthPct}%`,
    left: `calc(${layout.xPct}% + ${layout.offsetXPct ?? 0}%)`,
    top: `calc(${layout.topPct}% + ${layout.offsetYPct ?? 0}%)`,
    transform: "translateX(-50%)",
  })

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size, minWidth: size, borderRadius: rounded ? 24 : 0 }}
    >
      <div className="relative" style={{ width: stageSize, height: stageSize }}>
        <img
          src={preview.base}
          alt="Avatar base"
          className="absolute inset-0 w-full h-full object-contain"
        />
        <img
          src={preview.eyes}
          alt="Avatar eyes"
          className="absolute pointer-events-none object-contain"
          style={buildLayerStyle(layer.eyes)}
        />
        <img
          src={preview.outfit}
          alt="Avatar outfit"
          className="absolute pointer-events-none object-contain"
          style={buildLayerStyle(layer.outfit)}
        />
        <img
          src={preview.hair}
          alt="Avatar hair"
          className="absolute pointer-events-none object-contain"
          style={buildLayerStyle(layer.hair)}
        />
      </div>
    </div>
  )
}

