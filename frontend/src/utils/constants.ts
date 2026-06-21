import type { LocalQuizItem } from "./types"

export const SKINS = ["#FDDBB0", "#E8A87C", "#C97B48", "#8B5C3A", "#4A2F1A"]
export const HAIR_C = ["#1A1A1A", "#92680A", "#C62828", "#1565C0", "#2E7D32"]
export const EYE_C = ["#111827", "#1D4ED8", "#7C3AED", "#047857", "#92400E"]
export const SUIT_C = ["#16A34A", "#1D4ED8", "#B45309", "#DC2626", "#6D28D9"]

export const GENDER_O = [["👦", "Boy"], ["👧", "Girl"], ["🧒", "Enby"]] as const
export const HAIR_O = [["✂️", "Short"], ["〰", "Wavy"], ["⚡", "Spiky"], ["🎀", "Braids"], ["🔺", "Mohawk"]] as const
export const EYE_O = [["⚫", "Dark"], ["🔵", "Blue"], ["🟣", "Purple"], ["🟢", "Green"], ["🟤", "Brown"]] as const
export const OUTFIT_O = [["🌿", "Eco"], ["🌊", "Ocean"], ["☀️", "Sun"], ["🔥", "Fire"], ["✨", "Magic"]] as const

export const FALLBACK_QUIZ: LocalQuizItem[] = [
  { q: "Where does a plastic bottle go?", e: "🍶", o: ["♻️ Recycling", "🌿 Compost", "☠️ Hazardous"], a: 0, tip: "Plastic bottles can be recycled into brand-new products!" },
  { q: "What breaks down naturally in soil?", e: "🍂", o: ["🔋 Battery", "🌱 Biodegradable", "🧪 Synthetic"], a: 1, tip: "Natural waste feeds the soil and helps plants grow!" },
  { q: "Which is MOST dangerous in the trash?", e: "⚠️", o: ["📄 Paper", "🍌 Banana", "🔋 Battery"], a: 2, tip: "Old batteries contain toxic chemicals — never trash them!" },
]

export const GAME_POOL = [
  { n: "Bottle", e: "🍶", b: 0 }, { n: "Apple", e: "🍎", b: 1 }, { n: "Battery", e: "🔋", b: 2 },
  { n: "Cardboard", e: "📦", b: 0 }, { n: "Banana", e: "🍌", b: 1 }, { n: "Paint", e: "🎨", b: 2 },
  { n: "Glass Jar", e: "🫙", b: 0 }, { n: "Leaves", e: "🍃", b: 1 }, { n: "Syringe", e: "💉", b: 2 },
]

export const BINS = [
  { l: "Recycle", i: "♻️", c: "#2563EB", bg: "#EFF6FF", bdr: "#1D4ED8" },
  { l: "Organic", i: "🌿", c: "#16A34A", bg: "#F0FDF4", bdr: "#15803D" },
  { l: "Hazard", i: "☠️", c: "#DC2626", bg: "#FEF2F2", bdr: "#B91C1C" },
]

export const BADGES = [
  { n: "First Scan", e: "🔍", u: true }, { n: "Eco Rookie", e: "🌱", u: true },
  { n: "Quiz Star", e: "⭐", u: true }, { n: "Sort King", e: "♻️", u: true },
  { n: "Green Hero", e: "🦸", u: false }, { n: "Ocean Guard", e: "🌊", u: false },
  { n: "XP Legend", e: "🏆", u: false }, { n: "Earth Guard", e: "🌍", u: false },
]

export const FRIENDS = [
  { n: "Luna 🦋", xp: 1240, a: "🧒" }, { n: "Kai 🌊", xp: 1105, a: "👦" }, { n: "Aria 🌸", xp: 980, a: "👧" },
]

export const ITEM_POS = [
  { top: "8%", left: "8%" },
  { top: "8%", left: "54%" },
  { top: "48%", left: "6%" },
  { top: "46%", left: "52%" },
]

export const FF_FREDOKA = { fontFamily: "'Fredoka', sans-serif" }
export const FF_COMFORTAA = { fontFamily: "'Comfortaa', sans-serif" }
export const FF_NUNITO = { fontFamily: "'Nunito', sans-serif" }

/** Background mint from `GreenLens Kids.png` logo asset */
export const BRAND_MINT_BG = "#B9F3D0"

/** 1x1 PNG — valid base64 for mock scanner API */
export const MOCK_SCAN_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

export const SCREEN_LABELS = ["👤 Avatar Creator", "🏠 Dashboard", "📸 AI Camera", "🧠 Eco Quiz", "♻️ Sort Game", "🏅 Profile"]
