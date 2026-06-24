import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { QuizQuestion } from "@/services/greenLens"
import { FALLBACK_QUIZ, FF_FREDOKA, FF_COMFORTAA } from "@/utils/constants"
import type { LocalQuizItem } from "@/utils/types"

function mapQuestions(questions: QuizQuestion[]): LocalQuizItem[] {
  return questions.map((q) => ({
    q: q.question,
    e: q.emoji,
    o: [...q.options],
    a: q.correctIndex,
    tip: q.tip,
  }))
}

type Props = {
  onBack: () => void
  busy: boolean
  loading?: boolean
  apiQuestions: QuizQuestion[]
  onComplete: (correct: number, total: number) => Promise<number | null>
}

export function QuizScreen({ onBack, busy, loading = false, apiQuestions, onComplete }: Props) {
  const QUIZ = useMemo(
    () => (apiQuestions.length > 0 ? mapQuestions(apiQuestions) : FALLBACK_QUIZ),
    [apiQuestions],
  )

  const [qi, setQi] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [showXP, setShowXP] = useState(false)
  const [totalXP, setTotalXP] = useState(0)
  const [done, setDone] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const q = QUIZ[qi]

  const answer = (i: number) => {
    if (sel !== null || busy || !q) return
    setSel(i)
    const isCorrect = i === q.a
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount
    if (isCorrect) {
      setShowXP(true)
      setTotalXP((t) => t + 10)
      setTimeout(() => setShowXP(false), 1500)
    } else {
      setTotalXP((t) => t + 5)
    }
    setCorrectCount(nextCorrect)

    setTimeout(async () => {
      if (qi < QUIZ.length - 1) {
        setQi((n) => n + 1)
        setSel(null)
      } else {
        const earned = await onComplete(nextCorrect, QUIZ.length)
        if (earned !== null) setTotalXP(earned)
        setDone(true)
      }
    }, 1600)
  }

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#F0FDF4] px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-center">
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-green-700 mb-2" style={{ ...FF_FREDOKA, fontWeight: 700 }}>Nicely Done!</h2>
          <p className="text-gray-500 mb-6" style={FF_COMFORTAA}>You answered all {QUIZ.length} questions</p>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl px-8 py-5 mb-8 inline-block">
            <div className="text-amber-400 text-sm font-semibold mb-1" style={FF_COMFORTAA}>XP Earned</div>
            <div className="text-5xl font-bold text-amber-500" style={{ ...FF_FREDOKA, fontWeight: 700 }}>+{totalXP} ⭐</div>
          </div>
          <button
            onClick={onBack}
            disabled={busy}
            className="w-full py-4 rounded-3xl text-white font-bold text-lg active:scale-95 transition-transform"
            style={{ ...FF_FREDOKA, fontWeight: 700, background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
          >
            Back to Home 🏠
          </button>
        </motion.div>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#F0FDF4] px-6">
        <p style={FF_COMFORTAA}>Hãy quét rác trước để tạo quiz phù hợp.</p>
        <button onClick={onBack} className="mt-4 px-6 py-3 rounded-2xl bg-green-600 text-white font-bold">← Home</button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#F0FDF4] relative overflow-hidden">
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 1, y: 0, x: "-50%" }}
            animate={{ opacity: 0, y: -80 }}
            transition={{ duration: 1.2 }}
            className="absolute z-50 left-1/2 top-1/2 pointer-events-none"
            style={{ ...FF_FREDOKA, fontWeight: 700 }}
          >
            <div className="text-2xl font-bold text-amber-400 drop-shadow-lg">+10 XP ⭐</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <button type="button" onClick={onBack} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          <span className="text-gray-600">←</span>
        </button>
        <h2 className="text-green-700 font-bold text-base" style={{ ...FF_FREDOKA, fontWeight: 700 }}>🧠 Eco Quiz</h2>
        <div className="bg-amber-100 text-amber-600 text-sm font-bold px-3 py-1 rounded-full" style={FF_FREDOKA}>
          {qi + 1}/{QUIZ.length}
        </div>
      </div>

      {loading ? (
        <p className="px-4 pb-2 text-center text-xs font-semibold text-green-700" style={FF_COMFORTAA}>
          Đang tải câu đố từ server...
        </p>
      ) : null}

      <div className="px-4 mb-4 flex-shrink-0">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${((qi + 1) / QUIZ.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#22C55E,#FBBF24)" }}
          />
        </div>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-4 overflow-hidden">
        <motion.div key={qi} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-3xl p-5 shadow-md flex-shrink-0">
          <div className="flex justify-center mb-3">
            <span style={{ fontSize: 56 }}>{q.e}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 text-center leading-snug" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
            {q.q}
          </h3>
        </motion.div>

        <div className="flex flex-col gap-3 flex-1">
          {q.o.map((opt, i) => {
            let bg = "bg-white",
              border = "border-gray-200",
              text = "text-gray-700"
            if (sel !== null) {
              if (i === q.a) {
                bg = "bg-green-500"
                border = "border-green-500"
                text = "text-white"
              } else if (i === sel && sel !== q.a) {
                bg = "bg-red-500"
                border = "border-red-500"
                text = "text-white"
              }
            }
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => answer(i)}
                disabled={sel !== null || busy}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-4 px-5 rounded-2xl border-2 font-bold text-base text-left flex items-center justify-between transition-all ${bg} ${border} ${text} shadow-sm`}
                style={{ ...FF_FREDOKA, fontWeight: 600 }}
              >
                <span>{opt}</span>
                {sel !== null && i === q.a && <span>✓</span>}
                {sel !== null && i === sel && sel !== q.a && <span>✗</span>}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {sel !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex-shrink-0 mb-4">
              <p className="text-green-700 text-sm font-semibold" style={FF_COMFORTAA}>💡 {q.tip}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
