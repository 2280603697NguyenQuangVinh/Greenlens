import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { RefreshCw, Save } from "lucide-react"
import { FF_FREDOKA, FF_COMFORTAA } from "../constants"
import type { AvatarConfig } from "../types"
import { getHairOptionList, getOutfitOptionList, getGenderIcon } from "../avatarAssets"
import { AvatarPreview } from "../components/AvatarPreview"

// ---------------------------------------------------------------------------
// Eye color overlay config
// ---------------------------------------------------------------------------

const EYE_COLORS = [
  { label: "Đen", color: null },                              // default — no overlay
  { label: "Nâu", color: "rgba(92, 51, 23, 0.55)" },
  { label: "Xanh\nDương", color: "rgba(25, 100, 220, 0.55)" },
]

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
  onCancel?: () => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AvatarScreen({ cfg, setCfg, busy, error, onSave, onCancel }: Props) {
  const [tab, setTab] = useState<Tab>(0)
  const TAB_LABELS = ["Giới tính", "Tóc", "Mắt", "Áo"]

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
      const genders = [
        { label: "", gender: 0 },
        { label: "",  gender: 1 },
      ]
      return (
        <div className="grid grid-cols-2 gap-4 px-4">
          {genders.map(({ label, gender }) => {
            const thumbSrc = getGenderIcon(gender)
            const selected = cfg.gender === gender
            return (
              <button
                key={label}
                onClick={() => setCfg({ ...cfg, gender })}
                className={`flex flex-col items-center gap-2 pt-3 pb-2 rounded-3xl border-[3px] transition-all active:scale-95 overflow-hidden ${
                  selected ? "border-green-500 shadow-lg bg-green-50" : "border-slate-200 bg-white"
                }`}
              >
                <img src={thumbSrc} alt={label} className="w-24 h-28 object-contain" />
                <span className="text-sm font-black text-slate-700 pb-1" style={FF_FREDOKA}>{label}</span>
              </button>
            )
          })}
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
                className={`flex flex-col items-center rounded-3xl overflow-hidden border-[3px] transition-all active:scale-95 bg-white ${
                  selected ? "border-green-500 shadow-lg" : "border-slate-200"
                }`}
              >
                <img src={src} alt={`Kiểu ${i + 1}`} className="w-full h-20 object-contain" />
                <span className="text-[11px] font-bold text-slate-600 py-1" style={FF_COMFORTAA}>
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
          <p className="text-center text-sm text-slate-500 mb-4" style={FF_COMFORTAA}>
            Chọn màu mắt cho nhân vật
          </p>
          <div className="grid grid-cols-3 gap-3">
            {EYE_COLORS.map(({ label, color }, i) => {
              const selected = cfg.eyes === i
              return (
                <button
                  key={i}
                  onClick={() => setCfg({ ...cfg, eyes: i })}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-3xl border-[3px] transition-all active:scale-95 ${
                    selected ? "border-green-500 bg-green-50 shadow-md" : "border-slate-200 bg-white"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-slate-300 shadow-inner"
                    style={{ backgroundColor: color ?? "#1A1A1A" }}
                  />
                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight whitespace-pre-line" style={FF_COMFORTAA}>
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
              className={`flex flex-col items-center rounded-3xl overflow-hidden border-[3px] transition-all active:scale-95 bg-white ${
                selected ? "border-green-500 shadow-lg" : "border-slate-200"
              }`}
            >
              <img src={src} alt={`Kiểu ${i + 1}`} className="w-full h-20 object-contain" />
              <span className="text-[11px] font-bold text-slate-600 py-1" style={FF_COMFORTAA}>
                {i < outfitList.length - 1 ? `Kiểu ${i + 1}` : "Mặc định"}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#e8f8ef" }}>
      {/* Header */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3 flex-shrink-0">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 font-bold active:scale-95"
            title="Quay lại hồ sơ"
          >
            ←
          </button>
        ) : null}
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <span style={{ fontSize: 20 }}>🌿</span>
        </div>
        <h1 className="text-green-800 text-base font-black leading-tight" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
          Hãy Tạo Nhân Vật Cho<br />Riêng Bản Thân Nào!
        </h1>
      </div>

      {/* Model preview */}
      <div className="flex justify-center items-center py-3 bg-white/60 flex-shrink-0">
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
      <div className="px-4 py-2 flex-shrink-0">
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
              style={FF_FREDOKA}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto pb-2 pt-2">
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

      {error && (
        <p className="px-4 text-center text-red-500 text-xs flex-shrink-0 mb-1" style={FF_COMFORTAA}>
          {error}
        </p>
      )}

      {/* Bottom buttons */}
      <div className="flex-shrink-0 px-4 pb-5 pt-2 flex gap-3">
        <button
          type="button"
          onClick={handleRandom}
          disabled={busy}
          className="flex-1 py-3.5 rounded-3xl font-black text-base flex items-center justify-center gap-2 border-2 border-green-400 text-green-700 bg-white active:scale-95 transition-transform disabled:opacity-60"
          style={FF_FREDOKA}
        >
          <RefreshCw size={18} />
          Ngẫu nhiên
        </button>
        <button
          type="button"
          onClick={() => onSave(cfg)}
          disabled={busy}
          className="flex-1 py-3.5 rounded-3xl font-black text-base flex items-center justify-center gap-2 text-white active:scale-95 transition-transform disabled:opacity-60 shadow-lg"
          style={{ ...FF_FREDOKA, fontWeight: 700, background: "linear-gradient(135deg,#22C55E,#16A34A)", boxShadow: "0 8px 20px #22C55E44" }}
        >
          <Save size={18} />
          {busy ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  )
}
