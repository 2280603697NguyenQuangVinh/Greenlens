import type { AvatarConfig } from "@/utils/types"

type GenderKey = "male" | "female"
const GENDER_KEYS: readonly GenderKey[] = ["male", "female"]

const EYES_LAYER = [
  new URL("./Character/eyes color/black.png", import.meta.url).href,
  new URL("./Character/eyes color/brown.png", import.meta.url).href,
  new URL("./Character/eyes color/blue.png", import.meta.url).href,
]

const GENDER_OPTION = new URL(
  "./Character/male/gender/gender-option.png",
  import.meta.url,
).href

const GENDER_ICON = {
  male: GENDER_OPTION,
  female: GENDER_OPTION,
} as const

const MALE_HAIR = [
  new URL("./Character/male/hair/hair_1.png", import.meta.url).href,
  new URL("./Character/male/hair/hair_2.png", import.meta.url).href,
  new URL("./Character/male/hair/hair_3.png", import.meta.url).href,
  new URL("./Character/male/hair/hair_4.png", import.meta.url).href,
  new URL("./Character/male/hair/hair_5.png", import.meta.url).href,
]

const MALE_CLOTHES = [
  new URL("./Character/male/clothes/clothes_1.png", import.meta.url).href,
  new URL("./Character/male/clothes/clothes_2.png", import.meta.url).href,
  new URL("./Character/male/clothes/clothes_3.png", import.meta.url).href,
  new URL("./Character/male/clothes/clothes_4.png", import.meta.url).href,
  new URL("./Character/male/clothes/clothes_5.png", import.meta.url).href,
]

const MALE_MODEL_MODULES = import.meta.glob(
  "./Character/male/model/model_*.png",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>

const buildModelMap = (modules: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(modules)
      .map(([path, url]) => {
        const match = path.match(/model_(\d{2})\.png$/)
        return match ? [`model_${match[1]}`, url as string] : null
      })
      .filter((entry): entry is [string, string] => entry !== null),
  )

const MALE_MODEL_MAP = buildModelMap(MALE_MODEL_MODULES)

const FEMALE_HAIR = [
  new URL("./Character/female/hair/hair_1.png", import.meta.url).href,
  new URL("./Character/female/hair/hair_2.png", import.meta.url).href,
  new URL("./Character/female/hair/hair_3.png", import.meta.url).href,
  new URL("./Character/female/hair/hair_4.png", import.meta.url).href,
  new URL("./Character/female/hair/hair_5.png", import.meta.url).href,
]

const FEMALE_CLOTHES = [
  new URL("./Character/female/clothes/clothes_1.png", import.meta.url).href,
  new URL("./Character/female/clothes/clothes_2.png", import.meta.url).href,
  new URL("./Character/female/clothes/clothes_3.png", import.meta.url).href,
  new URL("./Character/female/clothes/clothes_4.png", import.meta.url).href,
  new URL("./Character/female/clothes/clothes_5.png", import.meta.url).href,
]

const FEMALE_MODEL_MODULES = import.meta.glob(
  "./Character/female/model/model_*.png",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>

const FEMALE_MODEL_MAP = buildModelMap(FEMALE_MODEL_MODULES)

const buildAssetList = (gender: GenderKey, kind: "hair" | "clothes") => {
  if (gender === "male") {
    return kind === "hair" ? MALE_HAIR : MALE_CLOTHES
  }
  return kind === "hair" ? FEMALE_HAIR : FEMALE_CLOTHES
}

const getModelMap = (gender: GenderKey) => (gender === "male" ? MALE_MODEL_MAP : FEMALE_MODEL_MAP)

export const AVATAR_BASES: Record<GenderKey, string> = {
  male: MALE_MODEL_MAP["model_00"] ?? MALE_MODEL_MAP[Object.keys(MALE_MODEL_MAP)[0]],
  female: FEMALE_MODEL_MAP["model_00"] ?? FEMALE_MODEL_MAP[Object.keys(FEMALE_MODEL_MAP)[0]],
}

export const AVATAR_HAIR: Record<GenderKey, string[]> = {
  male: buildAssetList("male", "hair"),
  female: buildAssetList("female", "hair"),
}

export const AVATAR_CLOTHES: Record<GenderKey, string[]> = {
  male: buildAssetList("male", "clothes"),
  female: buildAssetList("female", "clothes"),
}

export function getCompositeModel(gender: number, hairIndex: number, outfitIndex: number | null) {
  const key = GENDER_KEYS[gender] ?? "female"
  const hair = Math.max(0, Math.min(hairIndex, 5))
  const outfit = Math.max(0, Math.min(outfitIndex ?? 0, 5))
  const modelKey = `model_${outfit}${hair}`
  return getModelMap(key)[modelKey] ?? getModelMap(key)["model_00"]
}

export function getAvatarImages(cfg: AvatarConfig) {
  const gender = GENDER_KEYS[cfg.gender] ?? "female"
  const hairIndex = Math.max(0, Math.min(cfg.hair - 1, AVATAR_HAIR[gender].length - 1))
  const outfitIndex = Math.max(0, Math.min(cfg.outfit - 1, AVATAR_CLOTHES[gender].length - 1))
  const eyesIndex = Math.max(0, Math.min(cfg.eyes, EYES_LAYER.length - 1))
  return {
    base: AVATAR_BASES[gender],
    eyes: EYES_LAYER[eyesIndex] ?? EYES_LAYER[0],
    hair: AVATAR_HAIR[gender][hairIndex] ?? AVATAR_HAIR[gender][0],
    outfit: AVATAR_CLOTHES[gender][outfitIndex] ?? AVATAR_CLOTHES[gender][0],
  }
}

export function getFaceImage(gender: number) {
  const key = GENDER_KEYS[gender] ?? "female"
  return AVATAR_BASES[key]
}

export function getGenderIcon(gender: number) {
  const key = GENDER_KEYS[gender] ?? "female"
  return GENDER_ICON[key]
}

export function getHairOptionList(gender: number) {
  const key = GENDER_KEYS[gender] ?? "female"
  return AVATAR_HAIR[key]
}

export function getOutfitOptionList(gender: number) {
  const key = GENDER_KEYS[gender] ?? "female"
  return AVATAR_CLOTHES[key]
}

export function getModelHair(gender: number, hairIndex: number, outfitIndex: number = 0) {
  return getCompositeModel(gender, hairIndex, outfitIndex)
}

export function getModelOutfit(gender: number, outfitIndex: number, hairIndex: number = 0) {
  return getCompositeModel(gender, hairIndex, outfitIndex)
}
