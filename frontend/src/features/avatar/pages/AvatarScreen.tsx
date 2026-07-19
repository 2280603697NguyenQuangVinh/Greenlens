import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { RefreshCw, Save, Sparkles, Play } from "lucide-react"
import { validateCharacterName } from "@/services/childProfile"
import { FF_QUIZ } from "@/utils/constants"
import { KIDS_PRIMARY_BUTTON_CLASS, KIDS_PRIMARY_BUTTON_STYLE, KIDS_SQUIRCLE } from "@/utils/kidsUiStyles"
import type { AvatarConfig } from "@/utils/types"
import { getHairOptionList, getOutfitOptionList, getUiAsset, EYE_COLOR_LAYERS } from "@/assets"
import { AvatarPreview } from "@/features/avatar/components/AvatarPreview"

// ---------------------------------------------------------------------------
// Eye color overlay config
// ---------------------------------------------------------------------------

const EYE_COLORS = [
  { label: "Đen", image: EYE_COLOR_LAYERS[0] },
  { label: "Nâu", image: EYE_COLOR_LAYERS[1] },
  { label: "Xanh\nDương", image: EYE_COLOR_LAYERS[2] },
] as const

const AVATAR_FONT = { ...FF_QUIZ } as const
const AVATAR_FONT_BOLD = { ...FF_QUIZ, fontWeight: 800 as const }
const AVATAR_FONT_SEMI = { ...FF_QUIZ, fontWeight: 600 as const }
const AVATAR_WORDMARK = getUiAsset("GreenLens Kids wordmark.png")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 0 | 1 | 2 | 3  // Giới tính / Tóc / Mắt / Áo

type Props = {
  cfg: AvatarConfig
  setCfg: (c: AvatarConfig) => void
  busy: boolean
  error: string | null
  onSave: (cfg: AvatarConfig) => void
  onClearError?: () => void
  onCancel?: () => void
  isStartupFlow?: boolean
  savedCharacterName?: string
  savedCfg?: AvatarConfig
  onContinueSaved?: () => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AvatarScreen({
  cfg,
  setCfg,
  busy,
  error,
  onSave,
  onClearError,
  onCancel,
  isStartupFlow = true,
  savedCharacterName,
  savedCfg,
  onContinueSaved,
}: Props) {
  const [tab, setTab] = useState<Tab>(0)
  const [localError, setLocalError] = useState<string | null>(null)
  const TAB_LABELS = ["Giới tính", "Tóc", "Mắt", "Áo"]
  const displayError = localError ?? error

  const handleSaveClick = () => {
    const validationError = validateCharacterName(cfg.characterName)
    if (validationError) {
      setLocalError(validationError)
      onClearError?.()
      return
    }

    setLocalError(null)
    onClearError?.()
    onSave(cfg)
  }

  const handleRandom = () => {
    const gender = Math.floor(Math.random() * 2)  // 0=male, 1=female
    const hair   = Math.floor(Math.random() * 5) + 1
    const outfit = Math.floor(Math.random() * 5) + 1
    const eyes   = Math.floor(Math.random() * 3)
    setCfg({ ...cfg, gender, hair, outfit, eyes })
  }

  const renderOptions = () => {
    // --- Giới tính ---
    if (tab === 0) {
      const genderOptions = [
        { value: 0 as const, label: "Nam", accent: "border-blue-400 bg-blue-50/80" },
        { value: 1 as const, label: "Nữ", accent: "border-blue-400 bg-blue-50/80" },
      ]
      return (
        <div className="px-4 pb-2">
          <div className="mx-auto grid max-w-[420px] grid-cols-2 gap-4">
            {genderOptions.map(({ value, label, accent }) => {
              const selected = cfg.gender === value
              const previewCfg: AvatarConfig = {
                ...cfg,
                gender: value,
                hair: 1,
                outfit: 1,
                eyes: 0,
              }
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCfg({ ...cfg, gender: value })}
                  className={`flex flex-col items-center rounded-[1.75rem] border-2 px-3 py-4 transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(45,106,79,0.06)] ${
                    selected ? `${accent} shadow-[0_6px_20px_rgba(59,130,246,0.12)]` : "border-slate-200/70 bg-white"
                  }`}
                >
                  <AvatarPreview cfg={previewCfg} size={118} />
                  <span className="mt-1 text-sm font-bold text-slate-700" style={AVATAR_FONT_BOLD}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    // --- Tóc ---
    if (tab === 1) {
      const hairList = getHairOptionList(cfg.gender)
      return (
        <div className="grid grid-cols-3 gap-3 px-2">
          {hairList.map((src, i) => {
            const selected = cfg.hair === i + 1
            return (
              <button
                key={i}
                onClick={() => setCfg({ ...cfg, hair: i + 1 })}
                className={`flex flex-col items-center rounded-[1.75rem] overflow-hidden border-2 transition-all active:scale-[0.97] bg-white shadow-[0_4px_16px_rgba(45,106,79,0.06)] ${
                  selected ? "border-emerald-300/80 shadow-[0_6px_20px_rgba(34,197,94,0.12)]" : "border-slate-200/70"
                }`}
              >
                <img src={src} alt={`Kiểu ${i + 1}`} className="w-full h-20 object-contain" />
                <span className="text-[11px] font-bold text-slate-600 py-1" style={AVATAR_FONT_SEMI}>
                  Kiểu {i + 1}
                </span>
              </button>
            )
          })}
        </div>
      )
    }

    // --- Mắt ---
    if (tab === 2) {
      return (
        <div className="px-4">
          <p className="text-center text-sm text-slate-500 mb-4" style={AVATAR_FONT_SEMI}>
            Chọn màu mắt cho nhân vật
          </p>
          <div className="grid grid-cols-3 gap-3">
            {EYE_COLORS.map(({ label, image }, i) => {
              const selected = cfg.eyes === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCfg({ ...cfg, eyes: i })}
                  className={`flex flex-col items-center gap-2 py-5 px-3 rounded-[1.75rem] border-2 transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(45,106,79,0.06)] ${
                    selected ? "border-emerald-300/80 bg-emerald-50/80 shadow-[0_6px_20px_rgba(34,197,94,0.1)]" : "border-slate-200/70 bg-white"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-[#e8f8ef]/80 shadow-inner">
                    <img
                      src={image}
                      alt=""
                      className="h-7 w-10 object-contain"
                      draggable={false}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight whitespace-pre-line" style={AVATAR_FONT_SEMI}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    // --- Áo ---
    const outfitList = getOutfitOptionList(cfg.gender)
    return (
      <div className="grid grid-cols-3 gap-3 px-2">
        {outfitList.map((src, i) => {
          const selected = cfg.outfit === i + 1
          return (
            <button
              key={i}
              onClick={() => setCfg({ ...cfg, outfit: i + 1 })}
              className={`flex flex-col items-center rounded-[1.75rem] overflow-hidden border-2 transition-all active:scale-[0.97] bg-white shadow-[0_4px_16px_rgba(45,106,79,0.06)] ${
                selected ? "border-emerald-300/80 shadow-[0_6px_20px_rgba(34,197,94,0.12)]" : "border-slate-200/70"
              }`}
            >
              <img src={src} alt={`Kiểu ${i + 1}`} className="w-full h-20 object-contain" />
              <span className="text-[11px] font-bold text-slate-600 py-1" style={AVATAR_FONT_SEMI}>
                {`Kiểu ${i + 1}`}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ ...AVATAR_FONT, background: "#e8f8ef" }}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 font-bold active:scale-95 flex-shrink-0"
            title="Quay lại hồ sơ"
          >
            ←
          </button>
        ) : null}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
          <img
            src={AVATAR_WORDMARK}
            alt="GreenLens Kids"
            className="h-9 w-9 object-contain object-center pointer-events-none select-none"
            draggable={false}
          />
        </div>
        <h1 className="min-w-0 flex-1 text-green-800 text-base font-black leading-tight" style={{ ...AVATAR_FONT_BOLD, fontWeight: 700 }}>
          {isStartupFlow ? (
            <>Hãy Tạo Nhân Vật Cho Riêng Bản Thân Nào!</>
          ) : (
            <>Chỉnh Sửa Nhân Vật</>
          )}
        </h1>
      </div>

      {isStartupFlow && savedCharacterName && savedCfg && onContinueSaved ? (
        <div className={`mx-4 mb-3 ${KIDS_SQUIRCLE} border border-emerald-200/70 bg-white/95 p-5 shadow-[0_8px_24px_rgba(45,106,79,0.08)]`}>
          <p className="text-center text-sm font-bold text-slate-700 mb-3" style={AVATAR_FONT_SEMI}>
            Chào lại, <span className="text-green-700">{savedCharacterName}</span>!
          </p>
          <div className="flex justify-center mb-3">
            <AvatarPreview cfg={savedCfg} size={96} rounded />
          </div>
          <button
            type="button"
            onClick={onContinueSaved}
            disabled={busy}
            className={`w-full py-4 ${KIDS_PRIMARY_BUTTON_CLASS} font-black text-base flex items-center justify-center gap-2`}
            style={{ ...AVATAR_FONT_BOLD, fontWeight: 700, ...KIDS_PRIMARY_BUTTON_STYLE }}
          >
            <Play size={18} />
            {busy ? "Đang vào game..." : "Tiếp tục chơi"}
          </button>
          <p className="mt-3 text-center text-[11px] font-semibold text-slate-500" style={AVATAR_FONT_SEMI}>
            hoặc tạo nhân vật mới bên dưới
          </p>
        </div>
      ) : null}

      <div className="px-4 pb-2">
        <label className="block text-xs font-bold text-slate-600 mb-1" style={AVATAR_FONT_SEMI}>
          Tên nhân vật
        </label>
        <input
          type="text"
          value={cfg.characterName}
          onChange={(e) => {
            setLocalError(null)
            onClearError?.()
            setCfg({ ...cfg, characterName: e.target.value })
          }}
          placeholder="Ví dụ: Gấu Xanh"
          disabled={busy}
          className="w-full rounded-[1.25rem] border border-slate-200/80 px-5 py-3.5 text-sm font-semibold focus:border-emerald-300 outline-none disabled:opacity-60 bg-white shadow-[0_4px_16px_rgba(45,106,79,0.04)]"
          style={AVATAR_FONT_SEMI}
        />
      </div>

      {/* Model preview */}
      <div className="flex justify-center items-center py-3 bg-white/60">
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(cfg)}
            initial={{ scale: 0.93, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative"
          >
            <AvatarPreview cfg={cfg} size={170} rounded />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2">
        <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm border border-slate-200">
          {TAB_LABELS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i as Tab)}
              className={`flex-1 py-2 text-xs font-black rounded-full transition-all ${
                tab === i
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              style={AVATAR_FONT_BOLD}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="pb-4 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.18 }}
          >
            {renderOptions()}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {displayError && (
        <p className="flex-shrink-0 px-4 text-center text-red-500 text-xs mb-1" style={AVATAR_FONT_SEMI}>
          {displayError}
        </p>
      )}

      {/* Bottom buttons */}
      <div className="flex-shrink-0 border-t border-white/50 bg-[#e8f8ef] px-4 pb-5 pt-2 flex gap-3">
        <button
          type="button"
          onClick={handleRandom}
          disabled={busy}
          className="flex-1 py-4 rounded-[1.75rem] font-black text-base flex items-center justify-center gap-2 border border-emerald-300/60 text-green-700 bg-white active:scale-[0.97] transition-transform disabled:opacity-60 shadow-[0_4px_16px_rgba(45,106,79,0.06)]"
          style={AVATAR_FONT_BOLD}
        >
          <RefreshCw size={18} />
          Ngẫu nhiên
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={busy}
          className={`flex-1 py-4 ${KIDS_PRIMARY_BUTTON_CLASS} font-black text-base flex items-center justify-center gap-2`}
          style={{ ...AVATAR_FONT_BOLD, fontWeight: 700, ...KIDS_PRIMARY_BUTTON_STYLE }}
        >
          {isStartupFlow ? <Sparkles size={18} /> : <Save size={18} />}
          {busy ? "Đang lưu..." : isStartupFlow ? "Start Adventure" : "Lưu"}
        </button>
      </div>
    </div>
  )
}
