import { useMemo, useState, type ReactNode } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { QuizQuestion } from "@/services/greenLens"
import { wasteTypeEmoji, wasteTypeLabel } from "@/services/quiz/quizApi"
import { FF_QUIZ } from "@/utils/constants"
import { CHECK_ICON, LETTER_X_ICON, QUIZ_TASK_ICON, XP_REWARD_ICON } from "@/assets/iconAssets"
import type { LocalQuizItem } from "@/utils/types"

const QUIZ_FONT = { ...FF_QUIZ } as const
const QUIZ_FONT_BOLD = { ...FF_QUIZ, fontWeight: 800 as const }
const QUIZ_FONT_SEMI = { ...FF_QUIZ, fontWeight: 600 as const }

function QuizShell({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`h-full flex flex-col ${className}`}
      style={{ ...QUIZ_FONT, background: "#E8F8EF" }}
    >
      {children}
    </div>
  )
}

function mapQuestions(questions: QuizQuestion[]): LocalQuizItem[] {
  return questions.map((q) => ({
    q: q.question,
    e: q.emoji,
    o: [...q.options],
    a: q.correctIndex,
    tip: q.tip,
  }))
}

type QuizMeta = {
  wasteType: string
  targetAge: number
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

  const q = QUIZ[qi]
  const topicLabel = quizMeta ? wasteTypeLabel(quizMeta.wasteType) : "Eco Quiz"
  const topicEmoji = quizMeta ? wasteTypeEmoji(quizMeta.wasteType) : "🧠"

  const answer = (i: number) => {
    if (sel !== null || busy || !q) return
    setSel(i)
    const isCorrect = i === q.a
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
      <QuizShell className="items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="text-center w-full max-w-sm"
        >
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-3xl text-green-800 mb-2" style={QUIZ_FONT_BOLD}>
            Làm tốt lắm!
          </h2>
          <p className="text-green-700/90 mb-5 text-sm" style={QUIZ_FONT_SEMI}>
            Em trả lời đúng {correctCount}/{QUIZ.length} câu
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-3xl border-2 border-green-200 bg-white px-4 py-4">
              <div className="text-xs text-green-600 mb-1" style={QUIZ_FONT_SEMI}>
                Điểm số
              </div>
              <div className="text-3xl text-green-700" style={QUIZ_FONT_BOLD}>
                {finalScore}
              </div>
            </div>
            <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 px-4 py-4">
              <div
                className="text-xs text-amber-600 mb-1 flex items-center justify-center gap-1"
                style={QUIZ_FONT_SEMI}
              >
                <img src={XP_REWARD_ICON} alt="" className="h-4 w-4" />
                XP nhận được
              </div>
              <div className="text-3xl text-amber-500" style={QUIZ_FONT_BOLD}>
                +{totalXP}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="w-full py-4 rounded-3xl text-white text-lg active:scale-95 transition-transform disabled:opacity-60"
            style={{ ...QUIZ_FONT_BOLD, background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
          >
            Về trang chủ 🏠
          </button>
        </motion.div>
      </QuizShell>
    )
  }

  if (loading) {
    return (
      <QuizShell className="items-center justify-center px-6">
        <img src={QUIZ_TASK_ICON} alt="" className="h-20 w-20 mb-4 animate-pulse" />
        <h2 className="text-xl text-green-800 mb-2" style={QUIZ_FONT_BOLD}>
          Đang tạo câu đố...
        </h2>
        <p className="text-sm text-green-700/80 text-center" style={QUIZ_FONT_SEMI}>
          Đang tải câu hỏi phân loại rác cho em
        </p>
      </QuizShell>
    )
  }

  if (!q) {
    return (
      <QuizShell className="items-center justify-center px-6">
        <div className="text-5xl mb-4">😅</div>
        <h2 className="text-xl text-green-800 mb-2 text-center" style={QUIZ_FONT_BOLD}>
          Chưa tải được câu đố
        </h2>
        <p className="text-sm text-green-700/80 text-center mb-6" style={QUIZ_FONT_SEMI}>
          Hãy thử lại để bắt đầu phiên quiz mới
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={() => void onRetry()}
              disabled={busy}
              className="w-full py-4 rounded-3xl text-white text-base active:scale-95 disabled:opacity-60"
              style={{ ...QUIZ_FONT_BOLD, background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
            >
              Thử lại
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBack}
            className="w-full py-4 rounded-3xl bg-white border-2 border-green-300 text-green-700 text-base active:scale-95"
            style={QUIZ_FONT_BOLD}
          >
            ← Về trang chủ
          </button>
        </div>
      </QuizShell>
    )
  }

  return (
    <QuizShell className="relative overflow-hidden">
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 1, y: 0, x: "-50%" }}
            animate={{ opacity: 0, y: -80 }}
            transition={{ duration: 1.2 }}
            className="absolute z-50 left-1/2 top-1/2 pointer-events-none"
          >
            <div className="text-2xl text-amber-500 drop-shadow-lg" style={QUIZ_FONT_BOLD}>
              {xpPopup} ⭐
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-green-100 active:scale-95"
        >
          <span className="text-green-700">←</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-green-800 text-base flex items-center gap-1.5" style={QUIZ_FONT_BOLD}>
            <img src={QUIZ_TASK_ICON} alt="" className="h-5 w-5" />
            Eco Quiz
          </h2>
          <span className="text-[11px] text-green-700/80 mt-0.5" style={QUIZ_FONT_SEMI}>
            {topicEmoji} Chủ đề: {topicLabel}
            {quizMeta ? ` · ${quizMeta.targetAge} tuổi` : ""}
          </span>
        </div>
        <div
          className="bg-white text-green-700 text-sm px-3 py-1 rounded-full border border-green-200"
          style={QUIZ_FONT_BOLD}
        >
          {qi + 1}/{QUIZ.length}
        </div>
      </div>

      <div className="px-4 mb-3 flex-shrink-0">
        <div className="h-3 bg-white/80 rounded-full overflow-hidden border border-green-100">
          <motion.div
            animate={{ width: `${((qi + 1) / QUIZ.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#22C55E,#86EFAC)" }}
          />
        </div>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-3 overflow-hidden pb-4">
        <motion.div
          key={qi}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-5 shadow-md border-2 border-green-100 flex-shrink-0"
        >
          <div className="flex justify-center mb-3">
            <span style={{ fontSize: 52 }}>{q.e}</span>
          </div>
          <h3 className="text-lg text-green-900 text-center leading-snug" style={QUIZ_FONT_BOLD}>
            {q.q}
          </h3>
        </motion.div>

        <div className="flex flex-col gap-2.5 flex-1">
          {q.o.map((opt, i) => {
            let bg = "bg-white"
            let border = "border-green-100"
            let text = "text-green-900"

            if (sel !== null) {
              if (i === q.a) {
                bg = "bg-green-500"
                border = "border-green-600"
                text = "text-white"
              } else if (i === sel) {
                bg = "bg-red-400"
                border = "border-red-500"
                text = "text-white"
              } else {
                bg = "bg-white/70"
                border = "border-green-50"
                text = "text-green-700/50"
              }
            }

            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => answer(i)}
                disabled={sel !== null || busy}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3.5 px-4 rounded-2xl border-2 text-base text-left flex items-center justify-between transition-all ${bg} ${border} ${text} shadow-sm`}
                style={QUIZ_FONT_SEMI}
              >
                <span className="pr-2">{opt}</span>
                {sel !== null && i === q.a ? (
                  <img src={CHECK_ICON} alt="" className="h-5 w-5 flex-shrink-0" />
                ) : null}
                {sel !== null && i === sel && sel !== q.a ? (
                  <img src={LETTER_X_ICON} alt="" className="h-5 w-5 flex-shrink-0" />
                ) : null}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {sel !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-2 border-green-200 rounded-2xl px-4 py-3 flex-shrink-0"
            >
              <p className="text-green-800 text-sm leading-relaxed" style={QUIZ_FONT_SEMI}>
                💡 {q.tip}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </QuizShell>
  )
}
