import { CheckCircle2, Circle } from "lucide-react"
import {
  getDayLabels,
  getTodayWeekIndex,
  getWeekDayState,
} from "@/features/streak/utils/streakUi"

const STATE_STYLES = {
  completed: "bg-[#7ED957] text-white border-[#2d8a3e]",
  current: "bg-[#FFD166] text-[#1b4332] border-[#f4a261] ring-1 ring-[#f4a261]",
  today: "bg-[#ecfdf3] text-[#2d6a4f] border-[#52b788] ring-2 ring-[#7ED957]/50",
  upcoming: "bg-white text-slate-400 border-slate-200",
  missed: "bg-[#ffb4a2] text-white border-[#e76f51]",
} as const

export function WeeklyCalendar({
  weeklyProgress,
  currentStreak = 0,
  todayHasActivity = false,
  compact = false,
}: {
  weeklyProgress: boolean[]
  currentStreak?: number
  todayHasActivity?: boolean
  compact?: boolean
}) {
  const labels = getDayLabels()
  const todayIndex = getTodayWeekIndex()
  const dotSize = compact ? "h-9 w-9" : "h-11 w-11"
  const iconSize = compact ? 18 : 22

  return (
    <div className={compact ? "" : "rounded-2xl bg-white/80 p-3 shadow-sm"}>
      {compact ? (
        <p className="mb-2 text-sm font-black text-[#1b4332]">📅 Tuần này</p>
      ) : (
        <h3 className="mb-3 text-base font-black text-[#1b4332]">📅 Theo dõi 7 ngày</h3>
      )}
      <div className="flex justify-between gap-1">
        {labels.map((label, index) => {
          const state = getWeekDayState(
            index,
            weeklyProgress,
            todayIndex,
            currentStreak,
            todayHasActivity,
          )
          const style = STATE_STYLES[state]
          const isToday = index === todayIndex

          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`font-bold ${compact ? "text-[11px]" : "text-xs"} ${
                  isToday ? "text-[#2d6a4f]" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              <div
                className={`flex items-center justify-center rounded-full border-2 ${dotSize} ${style}`}
                title={state === "today" ? "Hôm nay" : undefined}
              >
                {state === "completed" ? (
                  <CheckCircle2 size={iconSize} />
                ) : state === "missed" ? (
                  <span className="text-xs font-black">✕</span>
                ) : state === "today" ? (
                  <span className={`font-black ${compact ? "text-[11px]" : "text-xs"}`}>•</span>
                ) : (
                  <Circle
                    size={iconSize - 2}
                    className={state === "current" ? "opacity-80" : "opacity-35"}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
