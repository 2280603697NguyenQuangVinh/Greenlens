export type AchievementId =
  | "first-scan"
  | "quiz-star"
  | "game-king"
  | "cleaner"
  | "challenge-7"
  | "tree-guard"

export interface AchievementDef {
  id: AchievementId
  title: string
  titleShort: string
  image: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-scan",
    title: "Quét Rác Lần Đầu",
    titleShort: "Quét Rác\nLần Đầu",
    image: new URL("./achievement/Thành tựu - Lần đầu quét rác.png", import.meta.url).href,
  },
  {
    id: "quiz-star",
    title: "Siêu Sao Câu Đố",
    titleShort: "Siêu Sao\nCâu Đố",
    image: new URL("./achievement/Thành tựu - Siêu sao câu đố.png", import.meta.url).href,
  },
  {
    id: "game-king",
    title: "Vua Trò Chơi",
    titleShort: "Vua Trò\nChơi",
    image: new URL("./achievement/Thành tựu - Vua trò chơi.png", import.meta.url).href,
  },
  {
    id: "cleaner",
    title: "Nhà Vệ Sinh Nhỏ",
    titleShort: "Nhà Vệ\nSinh Nhỏ",
    image: new URL("./achievement/Thành tựu - Nhà vệ sinh nhỏ.png", import.meta.url).href,
  },
  {
    id: "challenge-7",
    title: "Thách Thức 7 ngày",
    titleShort: "Thách Thức\n7 ngày",
    image: new URL("./achievement/Thành tựu - Thách thức 7 ngày.png", import.meta.url).href,
  },
  {
    id: "tree-guard",
    title: "Vệ Sĩ Cây Xanh",
    titleShort: "Vệ Sĩ Cây\nXanh",
    image: new URL("./achievement/Thành tựu - Vệ sĩ cây xanh.png", import.meta.url).href,
  },
]

export const DEFAULT_UNLOCKED: AchievementId[] = ["first-scan"]

export function getAchievement(id: AchievementId) {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
