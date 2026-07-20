import { useMemo, useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { QuizQuestion } from "@/services/greenLens"
import { wasteTypeEmoji, wasteTypeLabel } from "@/services/quiz/quizApi"
import { FF_QUIZ } from "@/utils/constants"
import { KIDS_PRIMARY_BUTTON_CLASS, KIDS_PRIMARY_BUTTON_STYLE, KIDS_SQUIRCLE } from "@/utils/kidsUiStyles"
import { BACKGROUND_IMAGE, MASCOT_IMAGE } from "@/assets"
import { CHECK_ICON, LETTER_X_ICON, QUIZ_TASK_ICON, XP_REWARD_ICON } from "@/assets/iconAssets"
import type { LocalQuizItem } from "@/utils/types"

const QUIZ_FONT = { ...FF_QUIZ } as const
const QUIZ_FONT_BOLD = { ...FF_QUIZ, fontWeight: 800 as const }
const QUIZ_FONT_SEMI = { ...FF_QUIZ, fontWeight: 600 as const }

const OPTION_LETTERS = ["A", "B", "C", "D"] as const

/** Nền khung câu hỏi + đáp án (cùng opacity) */
const QUIZ_SURFACE = "bg-white/[0.555]" as const

/** Màu badge tròn A/B/C/D + viền pastel nhẹ trên nền trắng */
const OPTION_STYLES = [
  {
    card: "bg-white/92 border-blue-200/70",
    badge: "bg-sky-400 text-white border-sky-300/80",
  },
  {
    card: "bg-white/92 border-pink-200/70",
    badge: "bg-rose-400 text-white border-rose-300/80",
  },
  {
    card: "bg-white/92 border-amber-200/70",
    badge: "bg-amber-400 text-white border-amber-300/80",
  },
  {
    card: "bg-white/92 border-red-200/70",
    badge: "bg-red-400 text-white border-red-300/80",
  },
] as const

const DECO = ["🌿", "🍃", "🌱", "☁️", "🦋", "🌸"] as const

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function mapQuestions(questions: QuizQuestion[]): LocalQuizItem[] {
  return questions.map((q) => {
    const indexed = q.options.map((text, index) => ({ text, index }))
    const shuffled = shuffleArray(indexed)
    const correctIndex = shuffled.findIndex((item) => item.index === q.correctIndex)

    return {
      q: q.question,
      e: q.emoji,
      o: shuffled.map((item: { text: string; index: number }) => item.text),
      a: correctIndex >= 0 ? correctIndex : 0,
      tip: q.tip,
    }
  })
}

type QuizMeta = {
  wasteType: string
}

type QuizCompleteResult = {
  xpEarned: number
  score?: number
}

type Props = {
  onBack: () => void
  busy: boolean
  loading?: boolean
  quizMeta?: QuizMeta | null
  apiQuestions: QuizQuestion[]
  onRetry?: () => Promise<boolean> | boolean
  onComplete: (correct: number, total: number) => Promise<QuizCompleteResult | null>
}

function QuizBackground() {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${BACKGROUND_IMAGE}")` }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(240,253,244,0.55) 0%, rgba(220,252,231,0.5) 45%, rgba(236,253,245,0.6) 100%)",
        }}
        aria-hidden
      />
      {DECO.map((emoji, i) => (
        <span
          key={emoji}
          className="absolute select-none pointer-events-none opacity-[0.18]"
          style={{
            fontSize: 22 + (i % 3) * 8,
            left: `${8 + i * 15}%`,
            top: `${6 + (i * 17) % 72}%`,
            transform: `rotate(${(i * 23) % 40 - 20}deg)`,
          }}
          aria-hidden
        >
          {emoji}
        </span>
      ))}
    </>
  )
}

function AnswerBorderFlash({ variant }: { variant: "correct" | "wrong" }) {
  const edge =
    variant === "correct"
      ? "rgba(34, 197, 94, 0.72)"
      : "rgba(239, 68, 68, 0.72)"
  const mid =
    variant === "correct"
      ? "rgba(74, 222, 128, 0.28)"
      : "rgba(252, 165, 165, 0.28)"

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[80]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.75, 0] }}
      transition={{ duration: 0.75, times: [0, 0.12, 0.35, 1], ease: "easeOut" }}
      aria-hidden
      style={{
        background: `
          linear-gradient(to bottom, ${edge} 0%, ${mid} 10%, transparent 22%),
          linear-gradient(to top, ${edge} 0%, ${mid} 10%, transparent 22%),
          linear-gradient(to right, ${edge} 0%, ${mid} 8%, transparent 18%),
          linear-gradient(to left, ${edge} 0%, ${mid} 8%, transparent 18%)
        `,
      }}
    />
  )
}

function QuizShell({
  children,
  className = "",
  borderFlash = null,
  flashKey = 0,
}: {
  children: ReactNode
  className?: string
  borderFlash?: "correct" | "wrong" | null
  flashKey?: number
}) {
  return (
    <div className={`relative h-full flex flex-col overflow-hidden ${className}`} style={QUIZ_FONT}>
      <QuizBackground />
      <AnimatePresence>
        {borderFlash ? <AnswerBorderFlash key={flashKey} variant={borderFlash} /> : null}
      </AnimatePresence>
      <div className="relative z-10 flex flex-col flex-1 min-h-0">{children}</div>
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 ${KIDS_PRIMARY_BUTTON_CLASS}`}
      style={{ ...QUIZ_FONT_BOLD, ...KIDS_PRIMARY_BUTTON_STYLE }}
    >
      {children}
    </button>
  )
}

export function QuizScreen({
  onBack,
  busy,
  loading = false,
  quizMeta = null,
  apiQuestions,
  onRetry,
  onComplete,
}: Props) {
  const QUIZ = useMemo(() => mapQuestions(apiQuestions), [apiQuestions])

  const [qi, setQi] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [showXP, setShowXP] = useState(false)
  const [xpPopup, setXpPopup] = useState("+10 XP")
  const [totalXP, setTotalXP] = useState(0)
  const [done, setDone] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [borderFlash, setBorderFlash] = useState<"correct" | "wrong" | null>(null)
  const [flashKey, setFlashKey] = useState(0)

  const q = QUIZ[qi]
  const topicLabel = quizMeta ? wasteTypeLabel(quizMeta.wasteType) : "Eco Quiz"
  const topicEmoji = quizMeta ? wasteTypeEmoji(quizMeta.wasteType) : "🧠"

  const answer = (i: number) => {
    if (sel !== null || busy || !q) return
    setSel(i)
    const isCorrect = i === q.a
    setBorderFlash(isCorrect ? "correct" : "wrong")
    setFlashKey((k) => k + 1)
    window.setTimeout(() => setBorderFlash(null), 580)
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount
    if (isCorrect) {
      setXpPopup("+10 XP")
      setShowXP(true)
      setTimeout(() => setShowXP(false), 1500)
    } else {
      setXpPopup("+5 XP")
      setShowXP(true)
      setTimeout(() => setShowXP(false), 1500)
    }
    setCorrectCount(nextCorrect)

    setTimeout(async () => {
      if (qi < QUIZ.length - 1) {
        setQi((n) => n + 1)
        setSel(null)
      } else {
        const res = await onComplete(nextCorrect, QUIZ.length)
        if (res) {
          setTotalXP(res.xpEarned)
          setFinalScore(res.score ?? nextCorrect * 10)
        }
        setDone(true)
      }
    }, 1600)
  }

  if (done) {
    return (
      <QuizShell className="items-center justify-center px-5 pt-15 sm:pt-20">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280 }}
          className="w-full max-w-sm rounded-[2rem] border border-white/50 bg-white/92 backdrop-blur-sm p-7 text-center shadow-[0_12px_40px_rgba(45,106,79,0.12)] mt-8"
        >
          <img src={MASCOT_IMAGE} alt="" className="mx-auto h-24 w-24 object-contain mb-3" />
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl text-green-800 mb-1" style={QUIZ_FONT_BOLD}>
            Làm tốt lắm!
          </h2>
          <p className="text-green-700/90 mb-5 text-sm" style={QUIZ_FONT_SEMI}>
            Em trả lời đúng {correctCount}/{QUIZ.length} câu
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-[1.25rem] border border-emerald-200/70 bg-emerald-50/90 px-4 py-4 shadow-[0_4px_16px_rgba(34,197,94,0.08)]">
              <div className="text-[11px] text-green-600 mb-0.5" style={QUIZ_FONT_SEMI}>
                Điểm số
              </div>
              <div className="text-2xl text-green-700" style={QUIZ_FONT_BOLD}>
                {finalScore}
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-amber-200/70 bg-amber-50/90 px-4 py-4 shadow-[0_4px_16px_rgba(245,158,11,0.08)]">
              <div
                className="text-[11px] text-amber-600 mb-0.5 flex items-center justify-center gap-1"
                style={QUIZ_FONT_SEMI}
              >
                <img src={XP_REWARD_ICON} alt="" className="h-4 w-4" />
                XP nhận được
              </div>
              <div className="text-2xl text-amber-500" style={QUIZ_FONT_BOLD}>
                +{totalXP}
              </div>
            </div>
          </div>

          <PrimaryButton onClick={onBack} disabled={busy}>
            Về trang chủ 🏠
          </PrimaryButton>
        </motion.div>
      </QuizShell>
    )
  }

  if (loading) {
    return (
      <QuizShell className="items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/50 bg-white/92 backdrop-blur-sm px-8 py-10 text-center shadow-[0_10px_32px_rgba(45,106,79,0.1)] w-full max-w-sm mt-8">
          <motion.img
            src={QUIZ_TASK_ICON}
            alt=""
            className="h-20 w-20 mx-auto mb-4 mt-8"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="text-xl text-green-800 mb-2" style={QUIZ_FONT_BOLD}>
            Đang tạo câu đố...
          </h2>
          <p className="text-sm text-green-700/85" style={QUIZ_FONT_SEMI}>
            Chuẩn bị 3 câu hỏi vui về môi trường cho em nhé!
          </p>
        </div>
      </QuizShell>
    )
  }

  if (!q) {
    return (
      <QuizShell className="items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/50 bg-white/92 backdrop-blur-sm px-6 py-8 text-center shadow-[0_10px_32px_rgba(45,106,79,0.1)] max-w-xs w-full">
          <div className="text-5xl mb-3">😅</div>
          <h2 className="text-xl text-green-800 mb-2" style={QUIZ_FONT_BOLD}>
            Chưa tải được câu đố
          </h2>
          <p className="text-sm text-green-700/85 mb-5" style={QUIZ_FONT_SEMI}>
            Hãy thử lại để bắt đầu phiên quiz mới
          </p>
          <div className="flex flex-col gap-3">
            {onRetry ? (
              <PrimaryButton onClick={() => void onRetry()} disabled={busy}>
                Thử lại
              </PrimaryButton>
            ) : null}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-4 rounded-[1.75rem] bg-white border border-emerald-200/70 text-green-700 active:scale-[0.97] shadow-[0_4px_16px_rgba(45,106,79,0.06)]"
              style={QUIZ_FONT_BOLD}
            >
              ← Về trang chủ
            </button>
          </div>
        </div>
      </QuizShell>
    )
  }

  return (
    <QuizShell borderFlash={borderFlash} flashKey={flashKey}>
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 1, y: 0, x: "-50%" }}
            animate={{ opacity: 0, y: -70 }}
            transition={{ duration: 1.2 }}
            className="absolute z-50 left-1/2 top-[38%] pointer-events-none"
          >
            <div
              className="text-2xl text-amber-500 drop-shadow-md px-4 py-1 rounded-full bg-white/90 border border-amber-200"
              style={QUIZ_FONT_BOLD}
            >
              {xpPopup} ⭐
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-[1rem] bg-white/95 flex items-center justify-center shadow-[0_4px_12px_rgba(45,106,79,0.08)] border border-emerald-100/70 active:scale-[0.97]"
          aria-label="Quay lại"
        >
          <span className="text-green-700 text-lg sm:text-xl" style={QUIZ_FONT_BOLD}>
            ←
          </span>
        </button>

        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2" style={QUIZ_FONT_BOLD}>
            <img src={QUIZ_TASK_ICON} alt="" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-green-800 text-base sm:text-lg">Eco Quiz</span>
          </div>
          <span
            className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/90 border border-green-200 px-3 py-0.5 sm:px-4 sm:py-1 text-[11px] sm:text-xs text-green-800 shadow-sm"
            style={QUIZ_FONT_SEMI}
          >
            {topicEmoji} Chủ đề: {topicLabel}
          </span>
        </div>

        <div
          className="rounded-[1rem] bg-white/95 border border-emerald-100/70 px-3 py-2 sm:px-3.5 sm:py-2.5 text-center min-w-[44px] sm:min-w-[52px] shadow-[0_4px_12px_rgba(45,106,79,0.08)]"
          style={QUIZ_FONT_BOLD}
        >
          <div className="text-[10px] sm:text-[11px] text-green-600 leading-none" style={QUIZ_FONT_SEMI}>
            Câu
          </div>
          <div className="text-sm sm:text-base text-green-800 leading-tight">
            {qi + 1}/{QUIZ.length}
          </div>
        </div>
      </div>

      {/* Progress dots + bar */}
      <div className="px-5 sm:px-6 pb-2 sm:pb-3 flex-shrink-0">
        <div className="flex justify-center gap-2 sm:gap-2.5 mb-2">
          {QUIZ.map((_, i) => (
            <div
              key={i}
              className={`h-2.5 sm:h-3 rounded-full transition-all duration-300 ${
                i < qi ? "w-8 sm:w-10 bg-green-500" : i === qi ? "w-10 sm:w-12 bg-green-400 ring-2 ring-green-200" : "w-2.5 sm:w-3 bg-white/80 border border-green-200"
              }`}
            />
          ))}
        </div>
        <div className="h-2.5 sm:h-3 bg-white/70 rounded-full overflow-hidden border border-green-100">
          <motion.div
            animate={{ width: `${((qi + 1) / QUIZ.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#4ADE80,#22C55E)" }}
          />
        </div>
      </div>

      {/* Question + answers */}
      <div className="flex-1 min-h-0 px-4 sm:px-5 pb-4 sm:pb-5 flex flex-col gap-2.5 sm:gap-4 overflow-y-auto justify-between">
        <motion.div
          key={qi}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
              className={`mt-6 sm:mt-10 ${KIDS_SQUIRCLE} border border-white/40 ${QUIZ_SURFACE} p-5 sm:p-6 flex-shrink-0 shadow-[0_8px_24px_rgba(45,106,79,0.08)]`}
        >
          <div className="flex justify-center mb-2 sm:mb-3">
            <span
              className={`inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-3xl ${QUIZ_SURFACE} border border-white/30 text-4xl sm:text-5xl`}
              role="img"
              aria-hidden
            >
              {q.e}
            </span>
          </div>
          <h3
            className="text-[17px] sm:text-[22px] text-green-900 text-center leading-snug sm:leading-relaxed px-1 sm:px-3"
            style={QUIZ_FONT_BOLD}
          >
            {q.q}
          </h3>
        </motion.div>

        {/* 4 options — 2 columns × 2 rows */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0 mt-auto pt-2 sm:pt-4 pb-2">
          {q.o.slice(0, 4).map((opt, i) => {
            const letter = OPTION_LETTERS[i] ?? String(i + 1)
            const baseStyle = OPTION_STYLES[i] ?? OPTION_STYLES[0]
            let cardBg = baseStyle.card
            let cardBorder = ""
            let textColor = "text-green-900"
            let badgeClass = baseStyle.badge

            if (sel !== null) {
              if (i === q.a) {
                cardBg = "bg-emerald-50/95"
                cardBorder = "border-emerald-300/80"
                textColor = "text-green-900"
              } else if (i === sel) {
                cardBg = "bg-orange-50/95"
                cardBorder = "border-orange-300/80"
                textColor = "text-orange-900"
              } else {
                cardBg = "bg-white/55"
                cardBorder = "border-transparent"
                textColor = "text-green-900/35"
              }
            }

            return (
              <motion.button
                key={`${qi}-${i}`}
                type="button"
                onClick={() => answer(i)}
                disabled={sel !== null || busy}
                whileTap={{ scale: 0.97 }}
                className={`relative min-h-[124px] sm:min-h-[128px] py-3.5 sm:py-4 px-3 sm:px-4 ${KIDS_SQUIRCLE} border-2 flex flex-col items-center justify-center gap-2 sm:gap-2.5 text-center transition-all shadow-[0_6px_20px_rgba(45,106,79,0.08)] ${cardBg} ${cardBorder}`}
              >
                <span
                  className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-sm sm:text-base ${badgeClass}`}
                  style={QUIZ_FONT_BOLD}
                >
                  {letter}
                </span>
                <span
                  className={`w-full text-[16px] sm:text-[16px] leading-snug sm:leading-normal line-clamp-3 px-0.5 ${textColor}`}
                  style={QUIZ_FONT_SEMI}
                >
                  {opt}
                </span>
                {sel !== null && i === q.a ? (
                  <img
                    src={CHECK_ICON}
                    alt=""
                    className="absolute top-2 right-2 h-4 w-4 sm:h-5 sm:w-5"
                  />
                ) : null}
                {sel !== null && i === sel && sel !== q.a ? (
                  <img
                    src={LETTER_X_ICON}
                    alt=""
                    className="absolute top-2 right-2 h-4 w-4 sm:h-5 sm:w-5"
                  />
                ) : null}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {sel !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[1.35rem] sm:rounded-[1.5rem] border border-amber-200/70 bg-amber-50/90 px-5 sm:px-6 py-4 sm:py-5 flex-shrink-0 shadow-[0_6px_20px_rgba(245,158,11,0.1)]"
            >
              <p
                className="text-green-900 text-sm sm:text-base leading-relaxed"
                style={QUIZ_FONT_SEMI}
              >
                💡 {q.tip}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </QuizShell>
  )
}
