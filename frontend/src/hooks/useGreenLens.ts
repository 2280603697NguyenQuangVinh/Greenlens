import { useCallback, useEffect, useState } from "react"
import {
  api,
  loadStoredProfile,
  logoutSession,
  saveSession,
  type ClassificationResult,
  type QuizQuestion,
  type UserProfile,
} from "@/services/greenLens"
import type { AvatarConfig } from "@/utils/types"
import {
  setupChildProfile,
  restoreChildSession,
  ValidationError,
  ApiError,
  NetworkError,
} from "@/services/childProfile"
import { hasActiveSession, setChildId, getStoredCognitoSub, getChildId } from "@/services/childProfileStorage"
import { getAuthToken, setAuthToken } from "@/services/authToken"
import { tryRefreshBearerToken } from "@/services/sessionAuth"
import { speakBrowser } from "@/utils/browserSpeech"
import type { AiCameraResult } from "@/services/aiCamera"
import {
  markDailyCameraComplete,
  markDailyGameComplete,
  markDailyQuizComplete,
} from "@/services/streak/dailyActivityStorage"
import { generateQuiz, completeQuizSession, type QuizSessionMeta } from "@/services/quiz/quizApi"
import { submitTrashSortResult } from "@/services/miniGame/miniGameApi"
import { getLevelFromXp } from "@/utils/levelProgress"

function applyXp(profile: UserProfile, xpDelta: number): UserProfile {
  const xp = Math.max(0, profile.xp + xpDelta)
  return { ...profile, xp, level: getLevelFromXp(xp) }
}

export function useGreenLens() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    hasActiveSession() ? loadStoredProfile() : null,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null)
  const [quizMeta, setQuizMeta] = useState<Pick<QuizSessionMeta, "wasteType" | "targetAge"> | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [lastScan, setLastScan] = useState<ClassificationResult | null>(null)

  useEffect(() => {
    if (!hasActiveSession()) return
    void (async () => {
      await tryRefreshBearerToken()
      const restored = await restoreChildSession()
      if (restored) setProfile(restored)
    })()
  }, [])

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      return null
    } finally {
      setBusy(false)
    }
  }, [])

  const register = useCallback(
    async (badgeId: string, avatar: AvatarConfig) => {
      const res = await run(() => api.register(badgeId, avatar))
      if (!res) return false
      saveSession(res.token, res.profile)
      setProfile(res.profile)
      return true
    },
    [run],
  )

  const createProfile = useCallback(async (avatar: AvatarConfig) => {
    setBusy(true)
    setError(null)
    try {
      const { token, profile: res } = await setupChildProfile(avatar, avatar.characterName)
      setAuthToken(token)
      setChildId(res.childId)

      const next: UserProfile = {
        badgeId: res.childId,
        characterName: res.characterName,
        cognitoSub: res.cognitoSub?.trim() || getStoredCognitoSub() || undefined,
        gender: avatar.gender,
        skin: avatar.skin,
        hair: avatar.hair,
        eyes: avatar.eyes,
        outfit: avatar.outfit,
        xp: res.xp,
        level: getLevelFromXp(res.xp),
        streak: res.streak,
        dailyScansCompleted: 0,
        dailyScansTarget: 3,
        recentActivity: [],
      }

      saveSession(token, next)
      setProfile(next)
      return true
    } catch (e) {
      if (e instanceof ValidationError || e instanceof ApiError || e instanceof NetworkError) {
        setError(e.message)
      } else {
        setError("Không tạo được nhân vật. Hãy thử lại nhé!")
      }
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const login = useCallback(
    async (badgeId: string) => {
      const res = await run(() => api.login(badgeId))
      if (!res) return false
      saveSession(res.token, res.profile)
      setProfile(res.profile)
      return true
    },
    [run],
  )

  const analyzeImage = useCallback(
    async (base64Image: string) => {
      const res = await run(() => api.analyze(base64Image))
      if (!res) return null
      setLastScan(res.result)
      if (res.profile) setProfile(res.profile)
      return res.result
    },
    [profile, run],
  )

  const loadQuiz = useCallback(
    async () => {
      const childId = profile?.badgeId ?? getChildId()
      if (!childId) return false

      setQuizLoading(true)
      setError(null)
      try {
        const session = await generateQuiz(childId)
        setQuizSessionId(session.sessionId)
        setQuizMeta({
          wasteType: session.wasteType,
          targetAge: session.targetAge,
        })
        setQuizQuestions(session.questions)
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không tải được câu đố.")
        return false
      } finally {
        setQuizLoading(false)
      }
    },
    [profile],
  )

  const completeQuiz = useCallback(
    async (correctCount: number, totalCount: number) => {
      if (!quizSessionId) {
        const xpEarned = correctCount * 10 + Math.max(0, totalCount - correctCount) * 5
        markDailyQuizComplete()
        setProfile((current) => {
          if (!current) return current
          const next = applyXp(current, xpEarned)
          const token = getAuthToken()
          if (token) saveSession(token, next)
          return next
        })
        return { xpEarned }
      }

      setBusy(true)
      setError(null)
      try {
        const res = await completeQuizSession(quizSessionId, correctCount)
        markDailyQuizComplete()
        setProfile((current) => {
          if (!current) return current
          const next = applyXp(current, res.xpAwarded)
          const token = getAuthToken()
          if (token) saveSession(token, next)
          return next
        })
        setQuizSessionId(null)
        return { xpEarned: res.xpAwarded, score: res.score }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không lưu được kết quả quiz.")
        return null
      } finally {
        setBusy(false)
      }
    },
    [quizSessionId],
  )

  const resetQuizSession = useCallback(() => {
    setQuizSessionId(null)
    setQuizMeta(null)
    setQuizQuestions([])
  }, [])

  const submitGame = useCallback(
    async (payload: {
      score: number
      correctCount: number
      wrongCount: number
      durationSeconds: number
    }) => {
      if (!profile) return null

      setBusy(true)
      setError(null)
      try {
        const res = await submitTrashSortResult({
          childId: profile.badgeId,
          correctCount: payload.correctCount,
          wrongCount: payload.wrongCount,
          durationSeconds: payload.durationSeconds,
          completedFromDailyActivity: true,
        })
        markDailyGameComplete()
        setProfile((current) => {
          if (!current) return current
          const next = applyXp(current, res.xpAwarded)
          const token = getAuthToken()
          if (token) saveSession(token, next)
          return next
        })
        return { xpEarned: res.xpAwarded }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không lưu được điểm game.")
        return null
      } finally {
        setBusy(false)
      }
    },
    [profile],
  )

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return
    speakBrowser(text)
  }, [])

  const handleCameraResult = useCallback(async (_result: AiCameraResult) => {
    setError(null)
    markDailyCameraComplete()
  }, [])

  const logout = useCallback(() => {
    logoutSession()
    setProfile(null)
    setQuizQuestions([])
    setQuizSessionId(null)
    setLastScan(null)
  }, [])

  const continueSession = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const restored = await restoreChildSession()
      if (!restored) {
        setError("Không tải được nhân vật. Hãy thử lại nhé!")
        return false
      }

      const token = await tryRefreshBearerToken()
      if (!token) {
        setError(
          "Không đăng nhập lại được. Hãy tạo nhân vật mới hoặc kiểm tra backend đang chạy.",
        )
        return false
      }

      setProfile(restored)
      setError(null)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được nhân vật.")
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const updateAvatar = useCallback(
    async (avatar: AvatarConfig) => {
      if (!profile) return false
      const next: UserProfile = {
        ...profile,
        characterName: avatar.characterName.trim() || profile.characterName,
        gender: avatar.gender,
        skin: avatar.skin,
        hair: avatar.hair,
        eyes: avatar.eyes,
        outfit: avatar.outfit,
      }
      const token = getAuthToken()
      if (token) {
        saveSession(token, next)
      } else {
        sessionStorage.setItem("gl_profile", JSON.stringify(next))
      }
      setProfile(next)
      return true
    },
    [profile],
  )

  return {
    profile,
    busy,
    error,
    quizQuestions,
    quizMeta,
    quizLoading,
    lastScan,
    register,
    createProfile,
    login,
    analyzeImage,
    completeQuiz,
    submitGame,
    speak,
    handleCameraResult,
    logout,
    continueSession,
    loadQuiz,
    resetQuizSession,
    updateAvatar,
    setError,
  }
}
