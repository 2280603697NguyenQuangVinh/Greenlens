import { FF_COMFORTAA } from "@/utils/constants"
import type { AvatarConfig } from "@/utils/types"
import { AvatarPreview } from "@/features/avatar/components/AvatarPreview"
import { getUiAsset } from "@/assets"
import { unlockSupertonicOnGesture } from "@/services/supertonic/preload"

const NAV_HOME = getUiAsset("dashbroad homescreen.png")
const NAV_QUIZ = getUiAsset("dashbroad quiz.png")
const NAV_CAMERA = getUiAsset("dashbroad camera.png")
const NAV_MINIGAME = getUiAsset("dashbroad minigame.png")

function NavIconImage({ src, alt, active }: { src: string; alt: string; active: boolean }) {
  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-opacity ${active ? "opacity-100" : "opacity-65"}`}>
      <img src={src} alt={alt} className="h-6 w-6 object-contain" />
    </span>
  )
}

export function BottomNav({ screen, go, avatarCfg }: { screen: number; go: (s: number) => void; avatarCfg?: AvatarConfig }) {
  return (
    <div className="flex-shrink-0 bg-white border-t-2 border-green-100 flex items-center justify-around px-2 py-2 shadow-lg" style={{ height: 76 }}>
      <button onClick={() => go(1)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${screen === 1 ? "bg-green-50 text-green-600" : "text-gray-400"}`}>
        <NavIconImage src={NAV_HOME} alt="Trang Chủ" active={screen === 1} />
        <span className="text-[10px] font-semibold" style={FF_COMFORTAA}>Trang Chủ</span>
      </button>
      <button onClick={() => go(3)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${screen === 3 ? "bg-green-50 text-green-600" : "text-gray-400"}`}>
        <NavIconImage src={NAV_QUIZ} alt="Câu Đố" active={screen === 3} />
        <span className="text-[10px] font-semibold" style={FF_COMFORTAA}>Câu Đố</span>
      </button>
      <button
        type="button"
        onClick={() => {
          void unlockSupertonicOnGesture()
          go(2)
        }}
        className="relative -top-5 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-300 border-4 border-white"
      >
        <img src={NAV_CAMERA} alt="Camera" className="h-8 w-8 object-contain drop-shadow-sm" />
      </button>
      <button onClick={() => go(4)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${screen === 4 ? "bg-green-50 text-green-600" : "text-gray-400"}`}>
        <NavIconImage src={NAV_MINIGAME} alt="Mini Game" active={screen === 4} />
        <span className="text-[10px] font-semibold" style={FF_COMFORTAA}>Mini Game</span>
      </button>
      <button onClick={() => go(5)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${screen === 5 ? "bg-green-50 text-green-600" : "text-gray-400"}`}>
        {avatarCfg ? (
          <span className="h-8 w-8 rounded-full border border-green-200 bg-green-50 flex items-center justify-center overflow-hidden">
            <AvatarPreview cfg={avatarCfg} size={32} rounded />
          </span>
        ) : (
          <span className={`h-8 w-8 rounded-full border border-green-200 bg-green-50 ${screen === 5 ? "opacity-100" : "opacity-65"}`} />
        )}
        <span className="text-[10px] font-semibold" style={FF_COMFORTAA}>Hồ Sơ</span>
      </button>
    </div>
  )
}
