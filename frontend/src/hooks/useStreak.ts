import { useCallback, useEffect, useRef, useState } from "react"
import { fetchStreakBundle } from "@/services/streak/streakApi"
import { STREAK_REFRESH_EVENT } from "@/services/streak/localStreakStorage"
import type { StreakBundle } from "@/services/streak/types"

export function useStreak(refreshKey = 0) {
  const [data, setData] = useState<StreakBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevStreakRef = useRef<number | null>(null)
  const [streakIncreased, setStreakIncreased] = useState(false)
  const [rewardUnlocked, setRewardUnlocked] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const bundle = await fetchStreakBundle()
      const prev = prevStreakRef.current
      if (prev !== null && bundle.streak.currentStreak > prev) {
        setStreakIncreased(true)
      }
      if (
        prev !== null &&
        bundle.milestones.some(
          (m) => m.unlocked && bundle.streak.currentStreak >= m.day && prev < m.day,
        )
      ) {
        setRewardUnlocked(true)
      }
      prevStreakRef.current = bundle.streak.currentStreak
      setData(bundle)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu streak")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch, refreshKey])

  useEffect(() => {
    const onRefresh = () => {
      void refetch()
    }
    window.addEventListener(STREAK_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(STREAK_REFRESH_EVENT, onRefresh)
  }, [refetch])

  const clearAnimations = useCallback(() => {
    setStreakIncreased(false)
    setRewardUnlocked(false)
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    streakIncreased,
    rewardUnlocked,
    clearAnimations,
  }
}
