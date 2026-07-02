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

export type TrashCategory = "Recyclable" | "Organic" | "Hazardous"

export const TRASH_ASSET_EXT = "png" // Change to "svg"/"jpg" if needed

// Add overrides when an item key and actual filename differ.
export const ITEM_FILE_OVERRIDES: Partial<Record<string, string>> = {
  tea_residue: "tea-bag",
}

const BIN_IMAGE_BASE_NAMES: Record<TrashCategory, string> = {
  Recyclable: "Recyclable (Green Bin)",
  Organic: "Organic (Brown Bin)",
  Hazardous: "Hazardous (Red Bin)",
}

function toCategoryFolder(category: TrashCategory): string {
  return category
}

export function getTrashItemImageSrc(category: TrashCategory, itemKey: string): string {
  const fileBase = ITEM_FILE_OVERRIDES[itemKey] ?? itemKey
  return `/src/assets/Trash Categoy/${toCategoryFolder(category)}/${fileBase}.${TRASH_ASSET_EXT}`
}

export function getTrashBinImageSrc(category: TrashCategory): string {
  const fileBase = BIN_IMAGE_BASE_NAMES[category]
  return `/src/assets/Trash Categoy/${toCategoryFolder(category)}/${fileBase}.${TRASH_ASSET_EXT}`
}

type TrashItemSeed = {
  key: string
  n: string
  b: number
  category: TrashCategory
}

const TRASH_ITEM_SEEDS: TrashItemSeed[] = [
  // Organic (Brown Bin)
  { key: "apple", n: "Táo", b: 1, category: "Organic" },
  { key: "leaves", n: "Lá cây", b: 1, category: "Organic" },
  { key: "banana_peel", n: "Vỏ chuối", b: 1, category: "Organic" },
  { key: "tea_residue", n: "Bã trà", b: 1, category: "Organic" },
  { key: "eggshell", n: "Vỏ trứng", b: 1, category: "Organic" },
  { key: "bread_core", n: "Bánh mì", b: 1, category: "Organic" },
  { key: "corn_cob", n: "Cùi ngô", b: 1, category: "Organic" },
  { key: "vegetable_stem", n: "Cuống rau", b: 1, category: "Organic" },
  { key: "leftover_food", n: "Thức ăn thừa", b: 1, category: "Organic" },
  { key: "fruit_seed", n: "Hạt trái cây", b: 1, category: "Organic" },

  // Recyclable (Green Bin)
  { key: "plastic_bottle", n: "Chai nhựa", b: 0, category: "Recyclable" },
  { key: "cardboard_box", n: "Thùng cardboard", b: 0, category: "Recyclable" },
  { key: "glass_bottle", n: "Bình thủy tinh", b: 0, category: "Recyclable" },
  { key: "aluminum_can", n: "Vỏ lon nhôm", b: 0, category: "Recyclable" },
  { key: "metal_bottle_cap", n: "Nắm chai", b: 0, category: "Recyclable" },
  { key: "milk_carton", n: "Hộp sữa giấy", b: 0, category: "Recyclable" },
  { key: "old_notebook", n: "Sách vở cũ", b: 0, category: "Recyclable" },
  { key: "office_paper", n: "Giấy văn phòng", b: 0, category: "Recyclable" },
  { key: "clean_nylon_bag", n: "Túi nilon sạch", b: 0, category: "Recyclable" },
  { key: "plastic_food_container", n: "Hộp đừng thức ăn", b: 0, category: "Recyclable" },

  // Hazardous (Red Bin)
  { key: "syringe", n: "Kim tiêm", b: 2, category: "Hazardous" },
  { key: "battery", n: "Pin", b: 2, category: "Hazardous" },
  { key: "paint_can", n: "Lọ sơn", b: 2, category: "Hazardous" },
  { key: "broken_bulb", n: "Bóng đèn bị vỡ", b: 2, category: "Hazardous" },
  { key: "pesticide", n: "Thuốc trừ sâu", b: 2, category: "Hazardous" },
  { key: "mercury_thermometer", n: "Nhiệt kế thủy ngân", b: 2, category: "Hazardous" },
  { key: "phone_battery", n: "Viên pin điện thoại", b: 2, category: "Hazardous" },
  { key: "cleaner_bottle", n: "Nước tẩy rửa", b: 2, category: "Hazardous" },
  { key: "nail_polish", n: "Chai sơn móng tay", b: 2, category: "Hazardous" },
  { key: "old_accumulator", n: "Bình ắc quy cũ", b: 2, category: "Hazardous" },
]

export const GAME_POOL = TRASH_ITEM_SEEDS.map((item) => ({
  ...item,
  iconSrc: getTrashItemImageSrc(item.category, item.key),
}))

export const BINS = [
  {
    id: "recyclable" as const,
    category: "Recyclable" as const,
    l: "Recyclable",
    lVi: "Tái chế",
    i: "R",
    binImageSrc: getTrashBinImageSrc("Recyclable"),
    c: "#166534",
    bg: "#DCFCE7",
    bdr: "#16A34A",
  },
  {
    id: "organic" as const,
    category: "Organic" as const,
    l: "Organic",
    lVi: "Hữu cơ",
    i: "O",
    binImageSrc: getTrashBinImageSrc("Organic"),
    c: "#78350F",
    bg: "#FDE68A",
    bdr: "#B45309",
  },
  {
    id: "hazardous" as const,
    category: "Hazardous" as const,
    l: "Hazardous",
    lVi: "Nguy hại",
    i: "H",
    binImageSrc: getTrashBinImageSrc("Hazardous"),
    c: "#991B1B",
    bg: "#FEE2E2",
    bdr: "#DC2626",
  },
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
/** Eco Quiz & Vietnamese body copy — Nunito has full Vietnamese glyph support */
export const FF_QUIZ = { fontFamily: "'Nunito', 'Comfortaa', sans-serif" }

/** Background mint from `GreenLens Kids.png` logo asset */
export const BRAND_MINT_BG = "#B9F3D0"

/** 1x1 PNG — valid base64 for mock scanner API */
export const MOCK_SCAN_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

export const SCREEN_LABELS = ["👤 Avatar Creator", "🏠 Dashboard", "📸 AI Camera", "🧠 Eco Quiz", "♻️ Sort Game", "🏅 Profile"]
