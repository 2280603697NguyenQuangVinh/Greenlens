import type { ReactNode } from "react"
import { Clock, Factory, Globe, Trash2 } from "lucide-react"
import type { AiCameraResult } from "@/services/aiCamera"

const CATEGORY_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  recycle: { bg: "bg-emerald-50", text: "text-emerald-800", accent: "bg-emerald-500" },
  organic: { bg: "bg-amber-50", text: "text-amber-900", accent: "bg-amber-700" },
  hazard: { bg: "bg-red-50", text: "text-red-800", accent: "bg-red-500" },
  general: { bg: "bg-gray-50", text: "text-gray-800", accent: "bg-gray-500" },
}

const BIN_COLOR_VI: Record<string, string> = {
  gray: "Xám",
  grey: "Xám",
  xám: "Xám",
  green: "Xanh lá",
  "xanh lá": "Xanh lá",
  brown: "Nâu",
  nâu: "Nâu",
  red: "Đỏ",
  đỏ: "Đỏ",
  blue: "Xanh dương",
  "xanh dương": "Xanh dương",
  orange: "Cam",
  cam: "Cam",
  yellow: "Vàng",
  vàng: "Vàng",
}

const WASTE_BINS = [
  {
    id: "recycle",
    bg: "bg-emerald-500",
    ring: "ring-emerald-700",
    match: (color: string, category: string) =>
      /green|xanh lá|tái chế|recyclable/i.test(color) &&
      !/non|không/i.test(color) &&
      !/non|không tái/i.test(category),
  },
  {
    id: "organic",
    bg: "bg-amber-700",
    ring: "ring-amber-900",
    match: (color: string, category: string) =>
      /brown|nâu|organic|hữu/i.test(color) || /organic|hữu/i.test(category),
  },
  {
    id: "general",
    bg: "bg-gray-500",
    ring: "ring-gray-700",
    match: (color: string, category: string) =>
      /gray|grey|xám|cam|orange|vàng|yellow|chung/i.test(color) ||
      /non-recyclable|không tái|general/i.test(category),
  },
  {
    id: "hazard",
    bg: "bg-red-500",
    ring: "ring-red-700",
    match: (color: string, category: string) =>
      /red|đỏ|hazard|nguy/i.test(color) || /hazard|nguy/i.test(category),
  },
] as const

function normalizeBinColor(value: string): string {
  return value.toLowerCase().replace(/^màu\s+/, "").trim()
}

function formatBinColorLabel(binColor: string): string {
  const key = normalizeBinColor(binColor)
  return BIN_COLOR_VI[key] ?? binColor
}

function getCategoryStyle(category: string) {
  const lower = category.toLowerCase()
  if (lower.includes("non") || lower.includes("không")) return CATEGORY_STYLES.general
  if (lower.includes("hữu") || lower.includes("organic")) return CATEGORY_STYLES.organic
  if (lower.includes("nguy") || lower.includes("hazard")) return CATEGORY_STYLES.hazard
  if (lower.includes("recycl")) return CATEGORY_STYLES.recycle
  return CATEGORY_STYLES.general
}

type Props = {
  result: AiCameraResult
}

export function CameraResultCard({ result }: Props) {
  const style = getCategoryStyle(result.wasteCategory)
  const emoji = result.emoji ?? "🗑️"
  const binColorLabel = formatBinColorLabel(result.binColor)

  return (
    <div className={`rounded-2xl p-4 mb-4 shadow-sm ${style.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className={`text-2xl font-black ${style.text}`}>{result.wasteName}</h3>
          <p className={`text-sm font-bold ${style.text} opacity-80`}>
            Loại rác: {result.wasteCategory}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoTile
          label="Thùng rác"
          value={`Màu ${binColorLabel}`}
          binColor={result.binColor}
          wasteCategory={result.wasteCategory}
        />
        <InfoTile
          icon={<Clock size={18} className="text-gray-600" />}
          label="Hướng dẫn"
          value={result.recyclingInstruction}
          small
        />
        <InfoTile
          icon={<Factory size={18} className="text-gray-600" />}
          label="Tái sử dụng"
          value={result.reuseSuggestion}
          small
        />
        <InfoTile
          icon={<Globe size={18} className="text-gray-600" />}
          label="Tác động"
          value={result.environmentalImpact}
          small
        />
      </div>
    </div>
  )
}

function InfoTile({
  icon,
  label,
  value,
  binColor,
  wasteCategory,
  small,
}: {
  icon?: ReactNode
  label: string
  value: string
  binColor?: string
  wasteCategory?: string
  small?: boolean
}) {
  const normalizedBin = normalizeBinColor(binColor ?? value)
  const category = (wasteCategory ?? "").toLowerCase()

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      {binColor !== undefined && (
        <div className="mb-2 flex justify-center gap-1.5">
          {WASTE_BINS.map((bin) => {
            const isActive = bin.match(normalizedBin, category)
            return (
              <div
                key={bin.id}
                className={`flex h-10 w-7 items-center justify-center rounded-full transition-all ${bin.bg} ${
                  isActive
                    ? `scale-110 opacity-100 ring-4 ${bin.ring} shadow-md`
                    : "scale-95 opacity-30"
                }`}
                aria-hidden={!isActive}
                title={isActive ? value : undefined}
              >
                <Trash2 size={14} className="text-white" strokeWidth={2.5} />
              </div>
            )
          })}
        </div>
      )}
      {!binColor && icon && (
        <div className="mb-1 flex items-center justify-center gap-1">{icon}</div>
      )}
      <p className="text-center text-xs text-gray-600">{label}</p>
      <p
        className={`mt-0.5 text-center font-semibold text-gray-700 ${
          small ? "text-[11px] leading-tight" : "text-sm"
        } ${binColor !== undefined ? "text-gray-900" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}
