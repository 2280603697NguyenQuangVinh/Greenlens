"use client"
import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { loadStoredProfile } from "@/lib/api"
import { useGreenLens } from "@/hooks/useGreenLens"
import { SCREEN_LABELS, FF_FREDOKA, FF_COMFORTAA } from "./constants"
import type { AvatarConfig } from "./types"
import { AvatarScreen } from "./screens/AvatarScreen"
import { SplashScreen } from "./screens/SplashScreen"
import { AdminLoginScreen } from "./screens/AdminLoginScreen"
import { DashboardScreen } from "./screens/DashboardScreen"
import { ScannerScreen } from "./screens/ScannerScreen"
import { QuizScreen } from "./screens/QuizScreen"
import { GameScreen } from "./screens/GameScreen"
import { ProfileScreen } from "./screens/ProfileScreen"

// ---------------------------------------------------------------------------
// Auth phase types
// ---------------------------------------------------------------------------

/** "splash" = startup, "avatar" = setup/edit avatar, "app" = main screens */
type AppPhase = "splash" | "avatar" | "app"
type AvatarFlow = "startup" | "profile"

function profileToCfg(profile: { gender: number; skin: number; hair: number; eyes: number; outfit: number }): AvatarConfig {
  return { gender: profile.gender, skin: profile.skin, hair: profile.hair, eyes: profile.eyes, outfit: profile.outfit }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const gl = useGreenLens()
  const stored = loadStoredProfile()
  const initialTargetPhase: Exclude<AppPhase, "splash"> = "avatar"

  const [phase, setPhase] = useState<AppPhase>("splash")
  const [avatarFlow, setAvatarFlow] = useState<AvatarFlow>("startup")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [screen, setScreen] = useState(1)   // main app screens (1–5)
  const [cfg, setCfg] = useState<AvatarConfig>(
    stored ? profileToCfg(stored) : { gender: 0, skin: 0, hair: 1, eyes: 0, outfit: 1 }
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase(initialTargetPhase)
    }, 1300)
    return () => window.clearTimeout(timer)
  }, [initialTargetPhase])

  useEffect(() => {
    if (gl.profile) setCfg(profileToCfg(gl.profile))
  }, [gl.profile])

  // If profile is cleared while in app, move back to avatar setup
  useEffect(() => {
    if (!gl.profile && phase === "app") setPhase("avatar")
  }, [gl.profile, phase])

  const go = useCallback((s: number) => setScreen(s), [])

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
      : await gl.register(String(Math.floor(100000 + Math.random() * 900000)), finalCfg)
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
    setPhase("avatar")
    setScreen(1)
    setAvatarFlow("startup")
    setShowAdminLogin(false)
    setAdminAuthenticated(false)
  }

  // ---- UI shell ----
  return (
    <div
      className="min-h-screen flex flex-col items-center p-0 sm:p-4 gap-2 overflow-auto"
      style={{ background: "linear-gradient(135deg,#BBF7D0 0%,#A7F3D0 30%,#D1FAE5 60%,#ECFDF5 100%)" }}
    >
      {/* Decorative background leaves */}
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

      {phase !== "splash" ? (
        <div className="text-green-800 font-bold text-sm flex items-center gap-2 opacity-80" style={FF_FREDOKA}>
          🌍 GreenLens Kids
          {gl.busy && <span className="text-xs font-normal opacity-70">· đang xử lý...</span>}
        </div>
      ) : null}

      {phase !== "splash" && gl.error && (
        <p className="text-red-600 text-xs px-4 text-center max-w-md" style={FF_COMFORTAA}>
          {gl.error}
        </p>
      )}

      {/* Responsive app container (no rigid phone mockup frame) */}
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[860px] sm:rounded-[28px] sm:shadow-2xl overflow-hidden bg-[#F0FDF4]">
          <div className="absolute inset-0 overflow-hidden" style={{ background: "#F0FDF4" }}>
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
                    onCancel={avatarFlow === "profile" ? handleCancelAvatarEdit : undefined}
                    onAdminLogin={handleOpenAdminLogin}
                    adminAuthenticated={adminAuthenticated}
                  />
                </motion.div>
              )}

              {/* ===== MAIN APP SCREENS ===== */}
              {phase === "app" && screen === 1 && gl.profile && (
                <motion.div key="s1" className="absolute inset-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <DashboardScreen cfg={cfg} go={go} profile={gl.profile} />
                </motion.div>
              )}
              {phase === "app" && screen === 2 && gl.profile && (
                <motion.div key="s2" className="absolute inset-0" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}>
                  <ScannerScreen
                    busy={gl.busy}
                    onBack={() => go(1)}
                    onAnalyze={gl.analyzeImage}
                    onSpeak={gl.speak}
                    onGoQuiz={() => go(3)}
                    scanResult={gl.lastScan}
                  />
                </motion.div>
              )}
              {phase === "app" && screen === 3 && gl.profile && (
                <motion.div key="s3" className="absolute inset-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <QuizScreen
                    busy={gl.busy}
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
                    onGameEnd={async (score) => { await gl.submitGame(score) }}
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

      {/* Screen dots (only for app phase) */}
      {phase === "app" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-green-700 text-xs font-semibold opacity-70" style={FF_COMFORTAA}>
            {SCREEN_LABELS[screen] ?? ""}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => (gl.profile ? go(i) : undefined)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  screen === i ? "bg-green-600 w-7" : "bg-green-300 hover:bg-green-400 w-2.5"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Avatar phase label */}
      {phase === "avatar" && (
        <p className="text-green-700 text-xs font-semibold opacity-70" style={FF_COMFORTAA}>
          🎨 Tạo nhân vật
        </p>
      )}
    </div>
  )
}
