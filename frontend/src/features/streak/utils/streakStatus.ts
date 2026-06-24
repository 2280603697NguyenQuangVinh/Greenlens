import type { BackendStreakResponse, StreakStatusInfo } from "@/services/streak/types"

/** Banner ngắn dưới streak card — hậu quả miss ngày / freeze. */
export function getStreakStatusBanner(status: StreakStatusInfo): string | null {
  switch (status.status) {
    case "Frozen":
      return `Chuỗi đang được bảo vệ! Còn ${status.freezeDaysRemaining} lần bảo vệ.`
    case "Expired":
      return "Chuỗi đã reset — làm nhiệm vụ hôm nay để bắt đầu lại!"
    case "NeedsCheckIn":
      return "Làm ít nhất 1 nhiệm vụ hôm nay để giữ chuỗi!"
    case "Active":
      if (status.missedDaysCoveredByFreeze > 0) {
        return `Đã dùng ${status.missedDaysCoveredByFreeze} ngày bảo vệ để giữ chuỗi.`
      }
      return null
    default:
      return null
  }
}

export function getStreakStatusMascotHint(status: StreakStatusInfo): string | null {
  switch (status.status) {
    case "Frozen":
      return "Nhớ quay lại học sớm nhé — lần bảo vệ chuỗi đang được dùng!"
    case "Expired":
      return "Đừng buồn! Bắt đầu lại chuỗi mới từ hôm nay nhé!"
    case "NeedsCheckIn":
      return "Hôm nay chưa check-in — hoàn thành 1 nhiệm vụ để giữ chuỗi!"
    default:
      return null
  }
}
