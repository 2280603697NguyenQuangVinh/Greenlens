import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { GAME_POOL, BINS, ITEM_POS, FF_FREDOKA, FF_COMFORTAA } from "@/utils/constants"

type GameEndResult = {
  score: number
  correctCount: number
  wrongCount: number
  durationSeconds: number
}

type Props = {
  onBack: () => void
  busy: boolean
  onGameEnd: (result: GameEndResult) => Promise<void>
}

export function GameScreen({ onBack, busy, onGameEnd }: Props) {
  const getInitItems = () => GAME_POOL.slice(0, 4).map((x, i) => ({ ...x, id: i }))
  const [items, setItems] = useState(getInitItems)
  const [sel, setSel] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [time, setTime] = useState(60)
  const [feedback, setFb] = useState<{ msg: string; ok: boolean } | null>(null)
  const [over, setOver] = useState(false)
  const [nextId, setNextId] = useState(4)
  const submitted = useRef(false)

  useEffect(() => {
    if (over) return
    const iv = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          setOver(true)
          clearInterval(iv)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [over])

  useEffect(() => {
    if (over && !submitted.current) {
      submitted.current = true
      void onGameEnd({
        score,
        correctCount: Math.floor(score / 10),
        wrongCount,
        durationSeconds: Math.max(1, 60 - time),
      })
    }
  }, [over, score, wrongCount, time, onGameEnd])

  const flash = (msg: string, ok: boolean) => {
    setFb({ msg, ok })
    setTimeout(() => setFb(null), 1000)
  }

  const sort = (binIdx: number) => {
    if (sel === null || over) return
    const item = items.find((x) => x.id === sel)
    if (!item) return
    if (item.b === binIdx) {
      setScore((s) => s + 10)
      flash("Great! +10 🌟", true)
      const pool = GAME_POOL.filter((p) => !items.some((x) => x.e === p.e && x.id !== sel))
      const next = pool[nextId % pool.length]
      setNextId((n) => n + 1)
      setItems((prev) => prev.filter((x) => x.id !== sel).concat(next ? { ...next, id: Date.now() } : []))
    } else {
      setWrongCount((count) => count + 1)
      flash("Try again! ❌", false)
    }
    setSel(null)
  }

  const restart = () => {
    submitted.current = false
    setItems(getInitItems())
    setScore(0)
    setWrongCount(0)
    setTime(60)
    setOver(false)
    setSel(null)
    setNextId(4)
  }

  return (
    <div className="h-full flex flex-col bg-[#F0FDF4]">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-white shadow-sm flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
          <span className="text-gray-600">←</span>
        </button>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-lg ${time <= 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`} style={{ ...FF_FREDOKA, fontWeight: 700 }}>
          <span>⏱</span>
          <span>{String(time).padStart(2, "0")}s</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 text-amber-600 font-bold text-lg" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
          <span>⭐</span>
          <span>{score}</span>
        </div>
      </div>

      <div className="flex-1 relative px-4 py-2" style={{ minHeight: 0 }}>
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-2xl font-bold text-white text-sm shadow-lg" style={{ ...FF_FREDOKA, fontWeight: 700, backgroundColor: feedback.ok ? "#16A34A" : "#DC2626" }}>
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {over && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-40 bg-black/60 rounded-2xl flex items-center justify-center flex-col gap-4 backdrop-blur-sm">
              <div className="text-5xl">⏰</div>
              <h3 className="text-white text-2xl font-bold" style={{ ...FF_FREDOKA, fontWeight: 700 }}>Time&apos;s Up!</h3>
              <div className="text-amber-400 text-4xl font-bold" style={{ ...FF_FREDOKA, fontWeight: 700 }}>Score: {score}</div>
              {busy && <p className="text-white/80 text-sm">Đang lưu điểm...</p>}
              <button onClick={restart} className="bg-white text-green-600 font-bold text-base px-8 py-3 rounded-2xl active:scale-95 transition-transform flex items-center gap-2" style={FF_FREDOKA}>
                <span>🔄</span> Play Again
              </button>
              <button onClick={onBack} className="text-white/70 text-sm font-semibold" style={FF_COMFORTAA}>← Back to Home</button>
            </motion.div>
          )}
        </AnimatePresence>

        {items.map((item, idx) => {
          const pos = ITEM_POS[idx % ITEM_POS.length]
          const isSelected = item.id === sel
          return (
            <motion.button
              key={item.id}
              onClick={() => setSel(isSelected ? null : item.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`absolute flex flex-col items-center gap-1 p-3 rounded-3xl bg-white transition-all active:scale-90 ${isSelected ? "shadow-2xl" : "shadow-lg"}`}
              style={{
                ...pos,
                border: isSelected ? "3px solid #FBBF24" : "2px solid #e5e7eb",
                boxShadow: isSelected ? "0 0 20px #FBBF2466, 0 8px 20px #0002" : undefined,
                animation: `float${idx % 3} ${2.5 + idx * 0.4}s ease-in-out infinite`,
              }}
            >
              <span style={{ fontSize: 36 }}>{item.e}</span>
              <span className="text-xs font-bold text-gray-600" style={FF_COMFORTAA}>{item.n}</span>
            </motion.button>
          )
        })}
      </div>

      <div className="flex-shrink-0 px-3 pb-3 pt-2 flex gap-2">
        {BINS.map((bin, i) => (
          <button
            key={i}
            onClick={() => sort(i)}
            className={`flex-1 rounded-2xl py-3 px-2 flex flex-col items-center gap-1 border-[3px] active:scale-95 transition-all ${sel !== null ? "scale-105 shadow-lg" : ""}`}
            style={{ backgroundColor: bin.bg, borderColor: bin.bdr }}
          >
            <div className="text-2xl">🗑️</div>
            <span className="text-base">{bin.i}</span>
            <span className="text-[10px] font-bold leading-tight text-center" style={{ ...FF_FREDOKA, color: bin.c }}>{bin.l}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float1 { 0%,100%{transform:translateY(-5px)} 50%{transform:translateY(8px)} }
        @keyframes float2 { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}
