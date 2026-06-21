import { motion } from "motion/react"
import type { AiCameraResult } from "@/services/aiCamera"

function shortenForKids(text: string, maxLen = 120): string {
  const trimmed = text.trim()
  if (!trimmed) return ""
  const first = trimmed.split(/(?<=[.!?])\s+/)[0] ?? trimmed
  const body = first.length <= maxLen ? first : `${first.slice(0, maxLen - 1).trim()}…`
  return body.endsWith(".") || body.endsWith("!") || body.endsWith("…") ? body : `${body}.`
}

type StoryCard = {
  title: string
  accentClass: string
  body: string
  bg: string
}

type Props = {
  result: AiCameraResult
}

export function StoryCardStack({ result }: Props) {
  const cards: StoryCard[] = [
    {
      title: "Robo Mách Con",
      accentClass: "bg-[#64B5F6]",
      body: shortenForKids(result.recyclingInstruction),
      bg: "bg-[#E3F2FD] border-[#90CAF9]",
    },
    {
      title: "Ý Tưởng Tái Sử Dụng",
      accentClass: "bg-[#FFB74D]",
      body: shortenForKids(result.reuseSuggestion),
      bg: "bg-[#FFF4E6] border-[#FFCC80]",
    },
    {
      title: "Siêu Năng Lực Bảo Vệ Trái Đất",
      accentClass: "bg-[#81C784]",
      body: shortenForKids(result.environmentalImpact),
      bg: "bg-[#E8F5E9] border-[#A5D6A7]",
    },
  ].filter((card) => card.body)

  if (!cards.length) return null

  return (
    <div className="mb-1 space-y-2">
      {cards.map((card, index) => (
        <motion.article
          key={card.title}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 + index * 0.08, type: "spring", stiffness: 240, damping: 22 }}
          className={`rounded-[22px] border-2 p-3 shadow-[0_4px_14px_rgba(0,0,0,0.05)] ${card.bg}`}
        >
          <div className="flex items-start gap-2.5">
            <span className={`mt-1.5 h-8 w-1 shrink-0 rounded-full ${card.accentClass}`} />
            <div className="min-w-0 flex-1">
              <h4 className="text-[14px] font-black text-[#1B4332]">{card.title}</h4>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-[#2D3748]">
                {card.body}
              </p>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
