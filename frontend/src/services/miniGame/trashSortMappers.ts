import type { TrashCategory } from "@/utils/constants"

import type { TrashSortItem } from "./miniGameApi"

export type GamePoolItem = {
  key: string
  n: string
  b: number
  category: TrashCategory
  iconSrc: string
}

const CATEGORY_TO_BIN_INDEX: Record<TrashCategory, number> = {
  Recyclable: 0,
  Organic: 1,
  Hazardous: 2,
}

function normalizeCategory(raw: string): TrashCategory | null {
  const value = raw.trim()
  if (value === "Recyclable" || value === "Organic" || value === "Hazardous") {
    return value
  }

  const lower = value.toLowerCase()
  if (lower === "recyclable") return "Recyclable"
  if (lower === "organic") return "Organic"
  if (lower === "hazardous") return "Hazardous"
  return null
}

export function mapTrashSortApiItems(items: TrashSortItem[]): GamePoolItem[] {
  const mapped: GamePoolItem[] = []

  for (const item of items) {
    const category = normalizeCategory(item.category)
    const iconSrc = item.iconUrl?.trim()
    if (!category || !iconSrc) continue

    mapped.push({
      key: item.itemId,
      n: item.name,
      b: CATEGORY_TO_BIN_INDEX[category],
      category,
      iconSrc,
    })
  }

  return mapped
}
