"use client"
import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { loadSavedProfile, loadStoredProfile } from "@/services/greenLens"
import { useGreenLens } from "@/hooks/useGreenLens"
import { hasActiveSession, hasSavedChild } from "@/services/childProfileStorage"
import { BRAND_MINT_BG, FF_COMFORTAA } from "@/utils/constants"
import type { AvatarConfig } from "@/utils/types"
import { AvatarScreen } from "@/features/avatar/pages/AvatarScreen"
import { SplashScreen } from "@/features/splash/pages/SplashScreen"
import { AdminLoginScreen } from "@/features/auth/pages/AdminLoginScreen"
import { DashboardScreen } from "@/features/dashboard/pages/DashboardScreen"
import CameraModule from "@/features/camera/pages/CameraModule"
import { QuizScreen } from "@/features/quiz/pages/QuizScreen"
import { GameScreen } from "@/features/game/pages/GameScreen"
import { ProfileScreen } from "@/features/profile/pages/ProfileScreen"

// ---------------------------------------------------------------------------
// Auth phase types
// ---------------------------------------------------------------------------

/** "splash" = startup, "avatar" = setup/edit avatar, "app" = main screens */
type AppPhase = "splash" | "avatar" | "app"
type AvatarFlow = "startup" | "profile"

function profileToCfg(profile: {
  characterName?: string
  gender: number
  skin: number
  hair: number
  eyes: number
  outfit: number
}): AvatarConfig {
  return {
    characterName: profile.characterName ?? "",
    gender: profile.gender,
    skin: profile.skin,
    hair: profile.hair,
    eyes: profile.eyes,
    outfit: profile.outfit,
  }
}

const DEFAULT_CFG: AvatarConfig = {
  characterName: "",
  gender: 0,
  skin: 0,
  hair: 1,
  eyes: 0,
  outfit: 1,
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const gl = useGreenLens()
  const stored = loadStoredProfile()
  const savedChild = loadSavedProfile()
  const initialTargetPhase: Exclude<AppPhase, "splash"> =
    hasActiveSession() ? "app" : "avatar"

  const [phase, setPhase] = useState<AppPhase>("splash")
  const [avatarFlow, setAvatarFlow] = useState<AvatarFlow>("startup")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [screen, setScreen] = useState(1)   // main app screens (1–5)
  const [streakRefreshKey, setStreakRefreshKey] = useState(0)
  const [cfg, setCfg] = useState<AvatarConfig>(
    stored
      ? profileToCfg(stored)
      : savedChild
        ? profileToCfg(savedChild)
        : DEFAULT_CFG,
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase(initialTargetPhase)
    }, 1300)
    return () => window.clearTimeout(timer)
  }, [initialTargetPhase])

  useEffect(() => {
    if (gl.profile && phase === "app") setCfg(profileToCfg(gl.profile))
  }, [gl.profile, phase])

  useEffect(() => {
    if (phase !== "app" || screen !== 3 || !gl.profile) return
    if (gl.quizQuestions.length > 0 || gl.quizLoading) return
    void gl.loadQuiz()
  }, [phase, screen, gl.profile, gl.quizQuestions.length, gl.quizLoading, gl.loadQuiz])

  // If profile is cleared while in app, move back to avatar setup
  useEffect(() => {
    if (!gl.profile && phase === "app") setPhase("avatar")
  }, [gl.profile, phase])

  const go = useCallback((s: number) => {
    setScreen(s)
    if (s === 1) setStreakRefreshKey((k) => k + 1)
  }, [])

  const handleSaveAvatar = async (finalCfg: AvatarConfig) => {
    if (avatarFlow === "profile") {
      setCfg(finalCfg)
      const ok = await gl.updateAvatar(finalCfg)
      if (ok) {
        setScreen(5)
        setPhase("app")
      }
      return
    }

    setCfg(finalCfg)
    const ok = gl.profile
      ? await gl.updateAvatar(finalCfg)
      : await gl.createProfile(finalCfg)
    if (ok) {
      setScreen(1)
      setPhase("app")
    }
  }

  const handleEditAvatarFromProfile = () => {
    setAvatarFlow("profile")
    setPhase("avatar")
  }

  const handleCancelAvatarEdit = () => {
    setPhase("app")
    setScreen(5)
  }

  const handleOpenAdminLogin = () => {
    setShowAdminLogin(true)
  }

  const handleCloseAdminLogin = () => {
    setShowAdminLogin(false)
  }

  const handleAdminPasswordLogin = (password: string) => {
    if (password === "admin123") {
      setAdminAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    gl.logout()
    const saved = loadSavedProfile()
    setCfg(saved ? profileToCfg(saved) : DEFAULT_CFG)
    setPhase("avatar")
    setScreen(1)
    setAvatarFlow("startup")
    setShowAdminLogin(false)
    setAdminAuthenticated(false)
  }

  const handleContinueSaved = async () => {
    const ok = await gl.continueSession()
    if (ok) {
      setScreen(1)
      setPhase("app")
    }
  }

  // ---- UI shell ----
  return (
    <div
      className="min-h-screen flex flex-col items-center p-0 sm:p-4 gap-2 overflow-auto"
      style={{
        background:
          phase === "splash"
            ? BRAND_MINT_BG
            : "linear-gradient(135deg,#BBF7D0 0%,#A7F3D0 30%,#D1FAE5 60%,#ECFDF5 100%)",
      }}
    >
      {phase !== "splash" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {["🌿", "🍃", "🌱", "🌿", "🍀", "🌲"].map((e, i) => (
            <div
              key={i}
              className="absolute text-2xl opacity-20 select-none"
              style={{ left: `${10 + i * 16}%`, top: `${5 + i * 15}%`, transform: `rotate(${i * 37}deg)`, fontSize: 20 + i * 4 }}
            >
              {e}
            </div>
          ))}
        </div>
      )}

      {phase !== "splash" && gl.error && (
        <p className="text-red-600 text-xs px-4 text-center max-w-md" style={FF_COMFORTAA}>
          {gl.error}
        </p>
      )}

      <div
        className="relative w-full max-w-[430px] min-h-screen sm:min-h-[860px] sm:rounded-[28px] sm:shadow-2xl overflow-hidden"
        style={{ background: phase === "splash" ? BRAND_MINT_BG : "#F0FDF4" }}
      >
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: phase === "splash" ? BRAND_MINT_BG : "#F0FDF4" }}
          >
            <AnimatePresence mode="wait">
              {phase === "splash" && (
                <motion.div
                  key="splash"
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <SplashScreen />
                </motion.div>
              )}

              {/* ===== AVATAR CREATION ===== */}
              {phase === "avatar" && (
                <motion.div key="avatar" className="absolute inset-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <AvatarScreen
                    cfg={cfg}
                    setCfg={setCfg}
                    busy={gl.busy}
                    error={gl.error}
                    onSave={handleSaveAvatar}
                    onClearError={() => gl.setError(null)}
                    onCancel={avatarFlow === "profile" ? handleCancelAvatarEdit : undefined}
                    onAdminLogin={handleOpenAdminLogin}
                    adminAuthenticated={adminAuthenticated}
                    isStartupFlow={avatarFlow === "startup"}
                    savedCharacterName={
                      avatarFlow === "startup" && hasSavedChild()
                        ? savedChild?.characterName?.trim() || "Nhân vật của em"
                        : undefined
                    }
                    onContinueSaved={
                      avatarFlow === "startup" && hasSavedChild()
                        ? handleContinueSaved
                        : undefined
                    }
                  />
                </motion.div>
              )}

              {/* ===== MAIN APP SCREENS ===== */}
              {phase === "app" && screen === 1 && gl.profile && (
                <motion.div key="s1" className="absolute inset-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <DashboardScreen
                    cfg={cfg}
                    go={go}
                    profile={gl.profile}
                    streakRefreshKey={streakRefreshKey}
                  />
                </motion.div>
              )}
              {phase === "app" && screen === 2 && gl.profile && (
                <motion.div key="s2" className="absolute inset-0" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}>
                  <CameraModule
                    avatarCfg={cfg}
                    onBack={() => go(1)}
                    onGoQuiz={() => go(3)}
                    onResult={gl.handleCameraResult}
                  />
                </motion.div>
              )}
              {phase === "app" && screen === 3 && gl.profile && (
                <motion.div key="s3" className="absolute inset-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <QuizScreen
                    busy={gl.busy}
                    loading={gl.quizLoading}
                    apiQuestions={gl.quizQuestions}
                    onBack={() => go(1)}
                    onComplete={async (correct, total) => {
                      const res = await gl.completeQuiz(correct, total)
                      return res?.xpEarned ?? null
                    }}
                  />
                </motion.div>
              )}
              {phase === "app" && screen === 4 && gl.profile && (
                <motion.div key="s4" className="absolute inset-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <GameScreen
                    busy={gl.busy}
                    onBack={() => go(1)}
                    onGameEnd={async (result) => { await gl.submitGame(result) }}
                  />
                </motion.div>
              )}
              {phase === "app" && screen === 5 && gl.profile && (
                <motion.div key="s5" className="absolute inset-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <ProfileScreen
                    cfg={cfg}
                    go={go}
                    profile={gl.profile}
                    onEditAvatar={handleEditAvatarFromProfile}
                    onLogout={handleLogout}
                    onAdminLogin={handleOpenAdminLogin}
                    adminAuthenticated={adminAuthenticated}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {(phase === "avatar" || phase === "app") && showAdminLogin ? (
              <AdminLoginScreen
                onClose={handleCloseAdminLogin}
                onSubmit={handleAdminPasswordLogin}
              />
            ) : null}
          </div>
      </div>

      {/* Avatar phase label */}
      {phase === "avatar" && (
        <p className="text-green-700 text-xs font-semibold opacity-70" style={FF_COMFORTAA}>
          {avatarFlow === "startup" && hasSavedChild() ? "🎮 Chọn nhân vật" : "🎨 Tạo nhân vật"}
        </p>
      )}
    </div>
  )
}
