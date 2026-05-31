import type { UserProfile } from "@/lib/api"
import { Mascot } from "../components/Mascot"
import { BottomNav } from "../components/BottomNav"
import { FF_FREDOKA } from "../constants"
import type { AvatarConfig } from "../types"

const BG = new URL("../../assets/Example Images/background.png", import.meta.url).href

export function ProfileScreen({
  cfg,
  go,
  profile,
  onEditAvatar,
  onLogout,
}: {
  cfg: AvatarConfig
  go: (s: number) => void
  profile: UserProfile
  onEditAvatar: () => void
  onLogout: () => void
}) {
  const xp = profile.xp || 1280
  const xpMax = 2500
  const xpPct = Math.min(100, Math.round((xp / xpMax) * 100))
  const badgeCards = [
    { title: "Quét Rác\nLần Đầu", date: "05/11/2026", unlocked: true, icon: "♻️" },
    { title: "Siêu Sao\nCâu Đố", date: "Chưa h/thành", unlocked: false, icon: "⭐" },
    { title: "Vua Trò\nChơi", date: "Chưa h/thành", unlocked: false, icon: "👑" },
    { title: "Nhà Vệ\nSinh Nhỏ", date: "Chưa h/thành", unlocked: false, icon: "🧹" },
    { title: "Thách Thức\n7 ngày", date: "Chưa h/thành", unlocked: false, icon: "📅" },
    { title: "Vệ Sĩ Cây\nXanh", date: "Chưa h/thành", unlocked: false, icon: "🛡️" },
  ]

  return (
    <div className="h-full flex flex-col" style={{ backgroundImage: `url("${BG}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="px-4 pt-5 pb-3 text-center">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-black text-[#285f2e] drop-shadow-sm" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
            Hồ Sơ Của Em
          </h1>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-[#ef4444] px-3 py-1.5 text-xs font-bold text-white active:scale-95"
          >
            Đăng xuất
          </button>
        </div>

        <div className="mx-auto mt-4 h-40 w-40 rounded-full border-2 border-[#1d4120] bg-[#6fa26f] flex items-center justify-center overflow-hidden">
          <Mascot cfg={cfg} size={152} />
        </div>
        <button
          type="button"
          onClick={onEditAvatar}
          className="-mt-12 ml-[68%] flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1d4120] bg-[#5f915f] text-2xl active:scale-95"
          title="Chỉnh sửa avatar"
        >
          ✎
        </button>

        <h2 className="mt-2 text-[22px] font-black text-black">Nguyễn Văn P</h2>

        <div className="mx-1 mt-3 rounded-full border-[3px] border-red-500 bg-[#d3d3d3] p-1">
          <div className="relative h-7 overflow-hidden rounded-full bg-[#d3d3d3]">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#7edd55]" style={{ width: `${xpPct}%` }} />
            <div className="absolute inset-0 flex items-center justify-between px-3 text-[12px] font-black text-black">
              <span>Cấp 3</span>
              <span>{xp} / {xpMax} XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="grid grid-cols-3 gap-3">
          {badgeCards.map((b, i) => (
            <div
              key={i}
              className={`relative rounded-3xl border border-slate-200 px-2 py-3 text-center ${
                b.unlocked ? "bg-[#d9eebf]" : "bg-[#aab8ac]/60 opacity-70"
              }`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d8d8d8] text-4xl">
                {b.icon}
              </div>
              <p className="mt-2 whitespace-pre-line text-[13px] font-bold leading-tight">{b.title}</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-700">{b.date}</p>
              {!b.unlocked && <div className="absolute right-2 top-2 text-2xl">🔒</div>}
            </div>
          ))}
        </div>

        <button
          onClick={() => go(1)}
          className="mx-auto mt-4 block rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700"
        >
          ← Về Trang Chủ
        </button>
        <button
          type="button"
          onClick={onEditAvatar}
          className="mx-auto mt-2 block rounded-full bg-[#22c55e] px-4 py-2 text-sm font-bold text-white active:scale-95"
        >
          Chỉnh sửa Avatar
        </button>
      </div>

      <BottomNav screen={5} go={go} avatarCfg={cfg} />
    </div>
  )
}
