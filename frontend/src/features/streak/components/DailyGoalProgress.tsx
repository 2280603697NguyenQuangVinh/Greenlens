import { motion } from "motion/react"
import { Camera, Gamepad2, Brain, CheckCircle2 } from "lucide-react"
import { FF_FREDOKA } from "@/utils/constants"
import type { DailyActivityStatus } from "@/services/streak/types"

const TASKS = [
  { key: "cameraCompleted" as const, label: "Camera", screen: 2, icon: Camera },
  { key: "gameCompleted" as const, label: "Trò chơi", screen: 4, icon: Gamepad2 },
  { key: "quizCompleted" as const, label: "Câu đố", screen: 3, icon: Brain },
] as const

export function DailyGoalProgress({
  daily,
  onNavigate,
  compact = false,
}: {
  daily: DailyActivityStatus
  onNavigate?: (screen: number) => void
  compact?: boolean
}) {
  const pct = Math.round((daily.completedCount / daily.totalCount) * 100)
  const nextTask = TASKS.find((t) => !daily[t.key])

  if (compact) {
    return (
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-base font-black text-[#1b4332]" style={FF_FREDOKA}>
            🎯 Nhiệm vụ hôm nay
          </p>
          <span className="shrink-0 rounded-full bg-[#d8f3dc] px-2.5 py-1 text-xs font-black text-[#1b4332]">
            {daily.completedCount}/{daily.totalCount} · {pct}%
          </span>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {TASKS.map(({ key, label, screen, icon: Icon }) => {
            const done = daily[key]
            const isNext = nextTask?.key === key
            return (
              <button
                key={key}
                type="button"
                disabled={done}
                onClick={() => !done && onNavigate?.(screen)}
                className={`flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-1 py-3 transition active:scale-[0.98] ${
                  done
                    ? "border-[#7ED957] bg-[#ecfdf3]"
                    : isNext
                      ? "border-[#52b788] bg-white ring-2 ring-[#7ED957]/40"
                      : "border-[#cfe8d4] bg-white"
                }`}
              >
                <Icon size={22} className={done ? "text-[#7ED957]" : "text-[#2d6a4f]"} />
                <span className="text-xs font-black text-slate-700">{label}</span>
                {done ? (
                  <CheckCircle2 size={18} className="text-[#7ED957]" />
                ) : (
                  <span className={`text-xs font-bold ${isNext ? "text-[#2d6a4f]" : "text-slate-400"}`}>
                    0/1
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="mb-2.5 h-4 overflow-hidden rounded-full border border-[#b7e4c7] bg-[#e8f8ef]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full bg-gradient-to-r from-[#7ED957] to-[#52b788]"
          />
        </div>
        {nextTask && onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate(nextTask.screen)}
            className="w-full rounded-full bg-[#2dd62d] py-3 text-[15px] font-black text-white shadow-sm active:scale-[0.99]"
            style={FF_FREDOKA}
          >
            Tiếp tục: {nextTask.label} ▶
          </button>
        ) : daily.completedCount === daily.totalCount ? (
          <p className="text-center text-sm font-bold text-[#2d6a4f]">
            Đã hoàn thành tất cả nhiệm vụ hôm nay! 🎉
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
      <h3 className="mb-3 text-[15px] font-black text-[#1b4332]" style={FF_FREDOKA}>
        🎯 Nhiệm vụ hôm nay
      </h3>
      <div className="mb-3 space-y-2">
        {TASKS.map(({ key, label, screen, icon: Icon }) => {
          const done = daily[key]
          return (
            <button
              key={key}
              type="button"
              disabled={done}
              onClick={() => !done && onNavigate?.(screen)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left ${
                done ? "bg-[#ecfdf3] opacity-80" : "bg-[#f0fdf4] hover:ring-2 hover:ring-[#7ED957]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-[#2d6a4f]" />
                <span className="text-sm font-bold text-slate-700">{label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-black">
                <span>{done ? "1/1" : "0/1"}</span>
                {done ? <CheckCircle2 size={18} className="text-[#7ED957]" /> : null}
              </div>
            </button>
          )
        })}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
          <span>{daily.completedCount}/{daily.totalCount} hoàn thành hôm nay</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#d8f3dc]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full bg-[#7ED957]"
          />
        </div>
      </div>
    </div>
  )
}
