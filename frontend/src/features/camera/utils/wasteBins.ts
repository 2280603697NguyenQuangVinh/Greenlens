export type WasteBinId = "recycle" | "organic" | "general" | "hazard"

export type WasteBinConfig = {
  id: WasteBinId
  label: string
  subtitle: string
  emoji: string
  bodyClass: string
  lidClass: string
  chipClass: string
  glowClass: string
  match: (color: string, category: string) => boolean
}

export const WASTE_BINS: WasteBinConfig[] = [
  {
    id: "recycle",
    label: "Thùng Xanh lá",
    subtitle: "Tái chế",
    emoji: "♻️",
    bodyClass: "from-[#74C69D] to-[#40916C]",
    lidClass: "bg-[#2D6A4F]",
    chipClass: "bg-[#40916C]",
    glowClass: "shadow-[0_0_0_4px_#FFD166,0_0_24px_rgba(255,209,102,0.65)]",
    match: (color, category) =>
      /green|xanh lá|tái chế|recyclable/i.test(color) &&
      !/non|không/i.test(color) &&
      !/non|không tái/i.test(category),
  },
  {
    id: "organic",
    label: "Thùng Nâu",
    subtitle: "Hữu cơ",
    emoji: "🍂",
    bodyClass: "from-[#D4A574] to-[#8B5A2B]",
    lidClass: "bg-[#6F4E37]",
    chipClass: "bg-[#BC6C25]",
    glowClass: "shadow-[0_0_0_4px_#FFD166,0_0_24px_rgba(255,209,102,0.65)]",
    match: (color, category) =>
      /brown|nâu|organic|hữu/i.test(color) || /organic|hữu/i.test(category),
  },
  {
    id: "general",
    label: "Thùng Xám",
    subtitle: "Rác thường",
    emoji: "🗑️",
    bodyClass: "from-[#ADB5BD] to-[#495057]",
    lidClass: "bg-[#343A40]",
    chipClass: "bg-[#6C757D]",
    glowClass: "shadow-[0_0_0_4px_#FFD166,0_0_24px_rgba(255,209,102,0.65)]",
    match: (color, category) =>
      /gray|grey|xám|cam|orange|vàng|yellow|chung/i.test(color) ||
      /non-recyclable|nonrecyclable|không tái|general/i.test(category),
  },
  {
    id: "hazard",
    label: "Thùng Đỏ",
    subtitle: "Nguy hại",
    emoji: "⚠️",
    bodyClass: "from-[#F28482] to-[#C1121F]",
    lidClass: "bg-[#9D0208]",
    chipClass: "bg-[#E63946]",
    glowClass: "shadow-[0_0_0_4px_#FFD166,0_0_24px_rgba(255,209,102,0.65)]",
    match: (color, category) =>
      /red|đỏ|hazard|nguy/i.test(color) || /hazard|nguy/i.test(category),
  },
]

export function normalizeBinColor(value: string): string {
  return value.toLowerCase().replace(/^màu\s+/, "").trim()
}

export function resolveActiveBinId(binColor: string, wasteCategory: string): WasteBinId {
  const color = normalizeBinColor(binColor)
  const category = wasteCategory.toLowerCase()
  return WASTE_BINS.find((bin) => bin.match(color, category))?.id ?? "recycle"
}

export function getCategoryBadgeStyle(binId: WasteBinId): string {
  switch (binId) {
    case "recycle":
      return "bg-[#52B788] text-white"
    case "organic":
      return "bg-[#BC6C25] text-white"
    case "general":
      return "bg-[#6C757D] text-white"
    case "hazard":
      return "bg-[#E63946] text-white"
  }
}

export function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes("nguy") || lower.includes("hazard")) return "⚠️"
  if (lower.includes("hữu") || lower.includes("organic")) return "🍂"
  if (lower.includes("non") || lower.includes("không")) return "🗑️"
  if (lower.includes("recycl") || lower.includes("tái")) return "♻️"
  return "🗑️"
}
