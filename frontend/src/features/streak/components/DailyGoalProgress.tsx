import { motion } from "motion/react"
import { CAMERA_TASK_ICON, GAME_TASK_ICON, QUIZ_TASK_ICON } from "@/assets"
import { FF_FREDOKA } from "@/utils/constants"
import type { DailyActivityStatus } from "@/services/streak/types"

const TASKS = [
  { key: "cameraCompleted" as const, label: "AI Camera", screen: 2, icon: CAMERA_TASK_ICON },
  { key: "gameCompleted" as const, label: "Mini Game", screen: 4, icon: GAME_TASK_ICON },
  { key: "quizCompleted" as const, label: "Quiz", screen: 3, icon: QUIZ_TASK_ICON },
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

  const taskList = (
    <div className={compact ? "mb-2.5 space-y-2" : "mb-3 space-y-2"}>
      {TASKS.map(({ key, label, screen, icon }) => {
        const done = daily[key]
        const isNext = nextTask?.key === key
        return (
          <button
            key={key}
            type="button"
            disabled={done}
            onClick={() => !done && onNavigate?.(screen)}
            className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition active:scale-[0.99] ${
              done
                ? "border-[#7ED957]/50 bg-[#ecfdf3] shadow-sm"
                : isNext
                  ? "border-[#7ED957] bg-white shadow-md ring-2 ring-[#7ED957]/25"
                  : "border-[#c8ecd4] bg-white shadow-sm hover:border-[#7ED957]/40"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <img
                src={icon}
                alt=""
                className={`h-6 w-6 shrink-0 object-contain ${done ? "opacity-80" : ""}`}
                draggable={false}
                aria-hidden
              />
              <span className="truncate text-sm text-slate-700">{label}</span>
            </span>
            <span className={`shrink-0 text-sm ${done ? "text-[#2d6a4f]" : "text-slate-500"}`}>
              {done ? "1/1" : "0/1"}
            </span>
          </button>
        )
      })}
    </div>
  )

  const progressBlock = (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>
          {daily.completedCount}/{daily.totalCount} hoàn thành hôm nay
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className={
          compact
            ? "h-4 overflow-hidden rounded-full border border-[#b7e4c7] bg-[#e8f8ef]"
            : "h-2.5 overflow-hidden rounded-full bg-[#d8f3dc]"
        }
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${
            compact ? "bg-gradient-to-r from-[#7ED957] to-[#52b788]" : "bg-[#7ED957]"
          }`}
        />
      </div>
    </div>
  )

  if (compact) {
    return (
      <div>
        <p className="mb-2.5 text-base text-[#1b4332]" style={FF_FREDOKA}>
          Nhiệm vụ hôm nay
        </p>
        {taskList}
        <div className="mb-2.5">{progressBlock}</div>
        {nextTask && onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate(nextTask.screen)}
            className="w-full rounded-full bg-[#2dd62d] py-3 text-[15px] text-white shadow-sm active:scale-[0.99]"
            style={FF_FREDOKA}
          >
            Tiếp tục: {nextTask.label}
          </button>
        ) : daily.completedCount === daily.totalCount ? (
          <p className="text-center text-sm text-[#2d6a4f]">
            Đã hoàn thành tất cả nhiệm vụ hôm nay!
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
      <h3 className="mb-3 text-[15px] text-[#1b4332]" style={FF_FREDOKA}>
        Nhiệm vụ hôm nay
      </h3>
      {taskList}
      {progressBlock}
    </div>
  )
}
