export interface AvatarConfig {
  characterName: string
  gender: number
  skin: number
  hair: number
  eyes: number
  outfit: number
}

export interface ScanDisplay {
  n: string
  e: string
  cat: string
  catC: string
  bg: string
  guide: string
}

export interface LocalQuizItem {
  q: string
  e: string
  o: string[]
  a: number
  tip: string
}
