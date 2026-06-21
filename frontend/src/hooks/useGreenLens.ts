import { useCallback, useState } from "react"
import {
  api,
  clearSession,
  loadStoredProfile,
  saveSession,
  type ClassificationResult,
  type QuizQuestion,
  type UserProfile,
} from "@/services/greenLens"
import type { AvatarConfig } from "@/utils/types"
import {
  setupChildProfile,
  ValidationError,
  ApiError,
  NetworkError,
} from "@/services/childProfile"
import { setChildId } from "@/services/childProfileStorage"
import { getAuthToken, setAuthToken } from "@/services/authToken"
import { speakBrowser, mapWasteCategoryKey } from "@/utils/browserSpeech"
import type { AiCameraResult } from "@/services/aiCamera"

export function useGreenLens() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadStoredProfile())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [lastScan, setLastScan] = useState<ClassificationResult | null>(null)

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
        gender: avatar.gender,
        skin: avatar.skin,
        hair: avatar.hair,
        eyes: avatar.eyes,
        outfit: avatar.outfit,
        xp: res.xp,
        level: res.level,
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
      const quiz = await run(() => api.getQuiz(res.result.categoryKey || res.result.category))
      if (quiz) setQuizQuestions(quiz)
      return res.result
    },
    [run],
  )

  const completeQuiz = useCallback(
    async (correctCount: number, totalCount: number) => {
      const res = await run(() => api.completeQuiz(correctCount, totalCount))
      if (!res) return null
      setProfile(res.profile)
      return res
    },
    [run],
  )

  const submitGame = useCallback(
    async (score: number) => {
      if (!profile) return null
      const res = await run(() => api.submitGame(profile.badgeId, score))
      if (!res) return null
      if (res.profile) setProfile(res.profile)
      return res
    },
    [profile, run],
  )

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return
    speakBrowser(text)
  }, [])

  const handleCameraResult = useCallback(async (result: AiCameraResult) => {
    setError(null)
    try {
      const categoryKey = mapWasteCategoryKey(result.wasteCategory)
      const quiz = await api.getQuiz(categoryKey)
      setQuizQuestions(quiz)
    } catch {
      // Quiz preload is optional — don't show errors like "Not Found" on the app shell.
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setProfile(null)
    setQuizQuestions([])
    setLastScan(null)
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
    updateAvatar,
    setError,
  }
}
