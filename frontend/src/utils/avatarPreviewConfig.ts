import type { AvatarConfig } from "./types"

type LayerPlacement = {
  widthPct: number
  topPct: number
  xPct: number
  offsetXPct?: number
  offsetYPct?: number
}

type GenderLayout = {
  stageScalePct: number
  eyes: LayerPlacement
  hair: LayerPlacement
  outfit: LayerPlacement
}

export const LAYER_LAYOUT = {
  male: {
    stageScalePct: 88,
    eyes: { widthPct: 26.5, topPct: 42.5, xPct: 50, offsetXPct: 0, offsetYPct: 0 },
    hair: { widthPct: 64, topPct: 4, xPct: 50, offsetXPct: 0, offsetYPct: 0 },
    outfit: { widthPct: 51.75, topPct: 58, xPct: 49.75, offsetXPct: 0, offsetYPct: 0 },
  },
  female: {
    stageScalePct: 88,
    eyes: { widthPct: 24, topPct: 42.5, xPct: 50, offsetXPct: -0.03, offsetYPct: 0.05 },
    hair: { widthPct: 67, topPct: 4.5, xPct: 49, offsetXPct: 0, offsetYPct: 0 },
    outfit: { widthPct: 47, topPct: 58, xPct: 49.75, offsetXPct: 0, offsetYPct: 0 },
  },
} as const satisfies Record<"male" | "female", GenderLayout>

export function getLayerLayout(cfg: AvatarConfig) {
  return cfg.gender === 0 ? LAYER_LAYOUT.male : LAYER_LAYOUT.female
}

