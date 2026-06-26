/** Ngày hôm nay theo giờ Việt Nam — khớp backend ChildStreakCalculator.GetVietnamToday(). */
export function getVietnamTodayKey(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  } catch {
    const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000)
    return shifted.toISOString().slice(0, 10)
  }
}

export function isSameDay(dateA: string | null | undefined, dateB: string): boolean {
  return Boolean(dateA && dateA.slice(0, 10) === dateB)
}

function formatDateKeyUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Noon Vietnam (UTC+7) as UTC instant — weekday math independent of browser TZ. */
function parseVietnamDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, 5, 0, 0))
}

/** T2=0 … CN=6 (tuần bắt đầu thứ Hai, theo lịch VN). */
export function getVietnamWeekDayIndex(dateKey?: string): number {
  const key = dateKey ?? getVietnamTodayKey()
  const utc = parseVietnamDateKey(key)
  return (utc.getUTCDay() + 6) % 7
}

export function getMondayKeyForWeek(dateKey?: string): string {
  const key = dateKey ?? getVietnamTodayKey()
  const dow = getVietnamWeekDayIndex(key)
  return addDaysToDateKey(key, -dow)
}

export function addDaysToDateKey(key: string, delta: number): string {
  const utc = parseVietnamDateKey(key)
  utc.setUTCDate(utc.getUTCDate() + delta)
  return formatDateKeyUtc(utc)
}
