import { ApiError, NetworkError } from "@/services/errors"
import { apiUrl } from "@/services/http"
import { ensureBearerToken, mapAuthErrorMessage } from "@/services/authToken"
import { getChildId } from "@/services/childProfileStorage"
import { segmentsToDisplayText, type SpeechSegment } from "@/utils/browserSpeech"

export interface AiCameraResult {
  wasteName: string
  wasteCategory: string
  binColor: string
  recyclingInstruction: string
  reuseSuggestion: string
  environmentalImpact: string
  emoji?: string
  confidence?: number
}

const ANALYZE_PATH = apiUrl("/ai-camera/analyze")

type BackendAiCameraAnalyzeResponse = {
  childId: string
  label: string
  confidence: number
  category: string
  binColor: string
  recycleGuide: string
  reuseSuggestion: string
  environmentImpact: string
  s3ImageKey: string
  s3Url: string
}

const WASTE_LABEL_VI: Record<string, string> = {
  bottle: "chai nhựa",
  plastic: "nhựa",
  "plastic bag": "túi nhựa",
  paper: "giấy",
  cardboard: "bìa carton",
  can: "lon",
  aluminium: "nhôm",
  aluminum: "nhôm",
  food: "thực phẩm",
  banana: "chuối",
  battery: "pin",
  diaper: "tã",
  trash: "rác thải",
}

const CATEGORY_VI: Record<string, string> = {
  recyclable: "Tái chế",
  organic: "Hữu cơ",
  hazardous: "Nguy hại",
  nonrecyclable: "Không tái chế",
}

const MOCK_RESULT: AiCameraResult = {
  wasteName: "Chai Nhựa",
  wasteCategory: "Tái Chế",
  binColor: "Xanh",
  recyclingInstruction:
    "Con hãy rửa sạch chai và bỏ vào thùng tái chế màu xanh nhé.",
  reuseSuggestion: "Tái sử dụng chai làm chậu cây nhỏ",
  environmentalImpact: "Giảm ô nhiễm nhựa, bảo vệ đại dương",
  emoji: "🥤",
  confidence: 97,
}

function capitalizeVi(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toLocaleUpperCase("vi") + trimmed.slice(1)
}

export function translateWasteLabel(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return trimmed
  const key = trimmed.toLowerCase()
  const translated = WASTE_LABEL_VI[key]
  if (translated) return capitalizeVi(translated)
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
    return trimmed
  }
  return trimmed
}

function translateCategory(category: string): string {
  const key = category.trim().toLowerCase().replace(/\s+/g, "")
  return CATEGORY_VI[key] ?? category
}

function localizeGuidanceText(text: string): string {
  let result = text
  const replacements: Array<[RegExp, string]> = [
    [/\bplastic bag\b/gi, "túi nhựa"],
    [/\bplastic\b/gi, "nhựa"],
    [/\bbottle\b/gi, "chai nhựa"],
    [/\bcardboard\b/gi, "bìa carton"],
    [/\baluminium\b/gi, "nhôm"],
    [/\baluminum\b/gi, "nhôm"],
    [/\bbattery\b/gi, "pin"],
    [/\bdiaper\b/gi, "tã"],
    [/\bbanana\b/gi, "chuối"],
    [/\bfood\b/gi, "thực phẩm"],
    [/\bcan\b/gi, "lon"],
    [/\bpaper\b/gi, "giấy"],
    [/\btrash\b/gi, "rác thải"],
  ]
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function ensureSentence(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`
}

function buildReuseSentence(reuse: string): string {
  const body = reuse.trim()
  if (!body) return ""
  if (/^(nếu|không|hãy|bỏ|con|tái)/i.test(body)) {
    return ensureSentence(body)
  }
  if (/^tái\s/i.test(body)) {
    return ensureSentence(`Con cũng có thể ${body.charAt(0).toLowerCase() + body.slice(1)}`)
  }
  return ensureSentence(`Con cũng có thể tái sử dụng: ${body}`)
}

export function buildMascotSpeechSegments(result: AiCameraResult): SpeechSegment[] {
  const name = translateWasteLabel(result.wasteName)
  const instruction = result.recyclingInstruction.trim()
  const reuse = result.reuseSuggestion.trim()

  const parts: string[] = [ensureSentence(`Đây là ${name}`)]

  if (instruction) {
    parts.push(ensureSentence(instruction))
  }

  if (reuse) {
    parts.push(buildReuseSentence(reuse))
  }

  return [{ lang: "vi", text: parts.join(" ") }]
}

export function buildMascotSpeech(result: AiCameraResult): string {
  return segmentsToDisplayText(buildMascotSpeechSegments(result))
}

function emojiForWaste(label: string, category: string): string {
  const text = `${label} ${category}`.toLowerCase()
  if (text.includes("nhựa") || text.includes("chai") || text.includes("lon")) return "🥤"
  if (text.includes("giấy") || text.includes("carton")) return "📦"
  if (text.includes("thủy tinh") || text.includes("chai")) return "🫙"
  if (text.includes("hữu") || text.includes("organic") || text.includes("thực phẩm")) return "🍎"
  if (text.includes("nguy") || text.includes("hazard") || text.includes("pin")) return "⚠️"
  if (text.includes("tái chế") || text.includes("recycle")) return "♻️"
  return "🗑️"
}

function mapBackendResponse(backend: BackendAiCameraAnalyzeResponse): AiCameraResult {
  const wasteName = translateWasteLabel(backend.label)
  const wasteCategory = translateCategory(backend.category)
  return {
    wasteName,
    wasteCategory,
    binColor: backend.binColor,
    recyclingInstruction: localizeGuidanceText(backend.recycleGuide),
    reuseSuggestion: localizeGuidanceText(backend.reuseSuggestion),
    environmentalImpact: localizeGuidanceText(backend.environmentImpact),
    confidence: backend.confidence,
    emoji: emojiForWaste(wasteName, wasteCategory),
  }
}

async function mockAnalyze(): Promise<AiCameraResult> {
  await new Promise((resolve) => setTimeout(resolve, 1800))
  return MOCK_RESULT
}

async function readErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  const record = body as { message?: string; detail?: string; title?: string }
  return (
    record.message?.trim() ||
    record.detail?.trim() ||
    record.title?.trim() ||
    res.statusText ||
    "Không phân tích được ảnh. Hãy thử chụp lại nhé!"
  )
}

export async function analyzeAiCameraImage(image: Blob | File): Promise<AiCameraResult> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return mockAnalyze()
  }

  const token = await ensureBearerToken()
  const childId = getChildId()
  if (!childId) {
    throw new NetworkError("Chưa có hồ sơ trẻ em. Hãy tạo nhân vật trước nhé!")
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  const form = new FormData()
  form.append("childId", childId)
  if (image instanceof File) {
    form.append("image", image, image.name || "image.jpg")
  } else {
    form.append("image", image, "image.jpg")
  }

  let res: Response
  try {
    res = await fetch(ANALYZE_PATH, {
      method: "POST",
      headers,
      body: form,
    })
  } catch {
    throw new NetworkError("Không kết nối được máy chủ. Kiểm tra mạng và thử lại nhé!")
  }

  if (!res.ok) {
    const raw = await readErrorMessage(res)
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  const backend = (await res.json()) as BackendAiCameraAnalyzeResponse
  return mapBackendResponse(backend)
}

