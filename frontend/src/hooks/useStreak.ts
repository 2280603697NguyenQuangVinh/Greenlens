import { useCallback, useEffect, useRef, useState } from "react"
import { fetchStreakBundle } from "@/services/streak/streakApi"
import { STREAK_REFRESH_EVENT } from "@/services/streak/localStreakStorage"
import { getVietnamTodayKey } from "@/utils/appDate"
import type { RewardMilestone, StreakBundle } from "@/services/streak/types"

const MARK_SHOWN_KEY_PREFIX = "gl_streak_mark_shown_"

function wasStreakMarkShownToday(): boolean {
  return sessionStorage.getItem(MARK_SHOWN_KEY_PREFIX + getVietnamTodayKey()) === "1"
}

function setStreakMarkShownToday(): void {
  sessionStorage.setItem(MARK_SHOWN_KEY_PREFIX + getVietnamTodayKey(), "1")
}

function findNewlyUnlockedMilestone(
  milestones: RewardMilestone[],
  prevStreak: number,
  currentStreak: number,
): RewardMilestone | null {
  if (prevStreak >= currentStreak) return null
  const crossed = milestones
    .filter((m) => m.unlocked && m.day > prevStreak && m.day <= currentStreak)
    .sort((a, b) => b.day - a.day)
  return crossed[0] ?? null
}

export function useStreak(refreshKey = 0) {
  const [data, setData] = useState<StreakBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevStreakRef = useRef<number | null>(null)
  const prevDailyCompletedRef = useRef<number | null>(null)
  const refetchingRef = useRef(false)
  const [streakIncreased, setStreakIncreased] = useState(false)
  const [showStreakMark, setShowStreakMark] = useState(false)
  const [rewardUnlocked, setRewardUnlocked] = useState(false)
  const [unlockedMilestone, setUnlockedMilestone] = useState<RewardMilestone | null>(null)
  const [showXpFloat, setShowXpFloat] = useState(false)

  const refetch = useCallback(async (silent = false) => {
    if (refetchingRef.current) return
    refetchingRef.current = true
    if (!silent) setLoading(true)
    setError(null)
    try {
      const bundle = await fetchStreakBundle()
      const prev = prevStreakRef.current
      const prevDaily = prevDailyCompletedRef.current
      const completed = bundle.dailyActivity.completedCount
      const increased = prev !== null && bundle.streak.currentStreak > prev

      if (prev !== null && increased) {
        setStreakIncreased(true)
      }

      if (completed >= 1 && !wasStreakMarkShownToday()) {
        const justDidFirstTask = prevDaily !== null && prevDaily === 0
        const firstLoadWithTask = prevDaily === null

        if (justDidFirstTask || firstLoadWithTask) {
          setShowStreakMark(true)
          setStreakMarkShownToday()
        }
      }

      if (prev !== null) {
        const milestone = findNewlyUnlockedMilestone(
          bundle.milestones,
          prev,
          bundle.streak.currentStreak,
        )
        if (milestone) {
          setRewardUnlocked(true)
          setUnlockedMilestone(milestone)
          if (milestone.day === 3) setShowXpFloat(true)
        }
      }
      prevDailyCompletedRef.current = completed
      prevStreakRef.current = bundle.streak.currentStreak
      setData(bundle)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu streak")
    } finally {
      refetchingRef.current = false
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch, refreshKey])

  useEffect(() => {
    const onRefresh = () => {
      void refetch(true)
    }
    window.addEventListener(STREAK_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(STREAK_REFRESH_EVENT, onRefresh)
  }, [refetch])

  const clearAnimations = useCallback(() => {
    setStreakIncreased(false)
    setShowStreakMark(false)
    setRewardUnlocked(false)
    setUnlockedMilestone(null)
    setShowXpFloat(false)
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    streakIncreased,
    showStreakMark,
    rewardUnlocked,
    unlockedMilestone,
    showXpFloat,
    clearAnimations,
  }
}
