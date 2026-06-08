import { motion } from "motion/react"
import type { UserProfile } from "@/lib/api"
import { Mascot } from "../components/Mascot"
import { BottomNav } from "../components/BottomNav"
import { FF_FREDOKA } from "../constants"
import type { AvatarConfig } from "../types"

const BG = new URL("../../assets/Example Images/background.png", import.meta.url).href
const COFFEE = "☕"

export function DashboardScreen({
  cfg,
  go,
  profile,
}: {
  cfg: AvatarConfig
  go: (s: number) => void
  profile: UserProfile
}) {
  const xp = profile.xp || 1280
  const xpMax = 2500
  const xpPct = Math.min(100, Math.round((xp / xpMax) * 100))

  return (
    <div className="h-full flex flex-col" style={{ backgroundImage: `url("${BG}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <div className="h-16 w-16 rounded-full border-2 border-[#1b3a1b] bg-[#a8dcae] shadow-sm flex items-center justify-center overflow-hidden">
          <Mascot cfg={cfg} size={58} />
        </div>
        <h1 className="flex-1 text-[42px] font-black text-black tracking-tight leading-none" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
          Chào, Phúc!
        </h1>
        <div className="flex h-11 min-w-[136px] items-center gap-2 rounded-full bg-white px-3 shadow-sm">
          <div className="h-6 flex-1 rounded-full bg-[#d7f7bf] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.7 }}
              className="h-full rounded-full bg-[#7ED957]"
            />
          </div>
          <span className="text-xl font-black">1280</span>
          <span className="text-base font-black">XP</span>
          <span className="text-3xl leading-none">⭐</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <div className="mb-3 flex items-end gap-2">
          <span className="text-7xl leading-none">{COFFEE}</span>
          <div className="rounded-[28px] rounded-bl-sm border-2 border-black bg-[#f4f4f4] px-4 py-3 shadow-sm">
            <p className="text-[17px] font-bold leading-tight text-black">Chào Phúc! Sẵn sàng cho thử thách hôm nay chưa?🔥</p>
          </div>
        </div>

        <section className="mb-3 rounded-t-3xl bg-white/45 p-3">
          <div className="rounded-t-2xl bg-[#b8e4c7] px-3 py-2">
            <h2 className="text-[17px] font-black text-black leading-none" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
              Nhiệm Vụ Hôm Nay
            </h2>
            <div className="mt-2 h-28 w-52 rounded-[18px] bg-[#9fd6a6] p-3 flex items-center justify-center">
              <span className="text-6xl">♻️</span>
            </div>
          </div>
          <div className="rounded-[22px] bg-[#ebebeb] p-4">
            <h3 className="text-[17px] font-black leading-tight text-black" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
              Thử Thách Ngày 1: Chụp Ảnh Rác
            </h3>
            <p className="mt-2 text-[14px] leading-tight text-[#202020]">
              Hãy tìm 2 rác tái chế trong nhà và sử dụng Camera chụp chúng!
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-full bg-[#d5d5d5] px-3 py-1 text-[14px] font-black">🪙 +15 XP</span>
              <span className="rounded-full bg-[#d5d5d5] px-3 py-1 text-[14px] font-black">♻️ Quét Lần Đầu</span>
            </div>
            <button
              onClick={() => go(2)}
              className="mt-3 w-full rounded-full bg-[#2dd62d] py-2 text-[16px] font-black text-white active:scale-[0.99]"
              style={{ ...FF_FREDOKA, fontWeight: 700 }}
            >
              Bắt đầu ngay! ▶
            </button>
          </div>
        </section>

        <section className="mb-3 overflow-hidden rounded-3xl border-2 border-[#f2aa58] bg-[#ffd39b]">
          <h2 className="py-1 text-center text-[16px] font-black leading-none">Xếp Hạng</h2>
          {["1. Phúc", "2. Người A", "3. Người B"].map((name, idx) => (
            <div key={name} className={`flex items-center justify-between px-4 py-1 text-[17px] font-black ${idx === 0 ? "bg-[#b9f0af]" : ""}`}>
              <span>{name}</span>
              <span>1280 XP</span>
            </div>
          ))}
        </section>

        <section className="mb-2 overflow-hidden rounded-3xl border-2 border-[#3da9f5] bg-[#63b8ff]">
          <h2 className="py-2 text-center text-[16px] font-black">Huy Hiệu Của Phúc</h2>
          <div className="grid grid-cols-4 gap-3 px-3 pb-3">
            <div className="aspect-square rounded-full bg-[#d2eec7] border-2 border-[#a6c591] flex items-center justify-center text-5xl">♻️</div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-full bg-[#cccccc] border border-[#bbbbbb] flex items-center justify-center text-4xl">🔒</div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav screen={1} go={go} avatarCfg={cfg} />
    </div>
  )
}
