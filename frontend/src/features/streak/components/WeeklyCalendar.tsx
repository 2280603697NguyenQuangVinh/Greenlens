import {
  getDayLabels,
  getTodayWeekIndex,
  getWeekDayState,
  type WeekDayState,
} from "@/features/streak/utils/streakUi"
import { CHECK_ICON, LETTER_X_ICON } from "@/assets"

const STATE_STYLES: Record<WeekDayState, string> = {
  completed: "bg-[#ecfdf3] border-[#7ED957]",
  current: "bg-[#FFD166] border-[#f4a261] ring-1 ring-[#f4a261]",
  today: "bg-[#ecfdf3] border-[#52b788] ring-2 ring-[#7ED957]/40",
  upcoming: "bg-white border-slate-200",
  missed: "bg-[#fff0ed] border-[#ffb4a2]",
}

const STATE_LABELS: Record<WeekDayState, string> = {
  completed: "Đã học",
  current: "Hôm nay — chưa xong",
  today: "Hôm nay",
  upcoming: "Sắp tới",
  missed: "Đã bỏ lỡ",
}

export function WeeklyCalendar({
  weeklyProgress,
  currentStreak = 0,
  todayCompletedCount = 0,
  todayTotalCount = 3,
  compact = false,
}: {
  weeklyProgress: boolean[]
  currentStreak?: number
  todayCompletedCount?: number
  todayTotalCount?: number
  compact?: boolean
}) {
  const labels = getDayLabels()
  const todayIndex = getTodayWeekIndex()
  const dotSize = compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11"

  return (
    <div
      className={
        compact
          ? ""
          : "rounded-2xl border-2 border-[#a8e6b8] bg-white p-3 shadow-sm"
      }
    >
      <h3 className="mb-2.5 text-sm text-[#1b4332] sm:text-base">
        Theo dõi 7 ngày
      </h3>
      <div className="flex justify-between gap-0.5 sm:gap-1">
        {labels.map((label, index) => {
          const state = getWeekDayState(
            index,
            weeklyProgress,
            todayIndex,
            currentStreak,
            todayCompletedCount,
            todayTotalCount,
          )
          const style = STATE_STYLES[state]
          const isToday = index === todayIndex

          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`${compact ? "text-[10px] sm:text-[11px]" : "text-xs"} ${
                  isToday ? "text-[#2d6a4f]" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              <div
                className={`flex items-center justify-center rounded-full border-2 ${dotSize} ${style}`}
                title={STATE_LABELS[state]}
                aria-label={`${label}: ${STATE_LABELS[state]}`}
              >
                {state === "completed" ? (
                  <img
                    src={CHECK_ICON}
                    alt=""
                    className={`object-contain ${compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6"}`}
                    draggable={false}
                    aria-hidden
                  />
                ) : state === "missed" ? (
                  <img
                    src={LETTER_X_ICON}
                    alt=""
                    className={`object-contain ${compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6"}`}
                    draggable={false}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
