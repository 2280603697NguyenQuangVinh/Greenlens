import { motion } from "motion/react"
import type { WasteBinConfig } from "@/features/camera/utils/wasteBins"

type BinCharacterProps = {
  bin: WasteBinConfig
  active: boolean
}

const BIN_BODY_H = 82

function BinLid({ lidClass }: { lidClass: string }) {
  return (
    <div className="relative mx-auto w-[82%]">
      <div className={`h-[9px] rounded-t-[9px] ${lidClass} shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]`} />
      <div
        className={`absolute -top-[6px] left-1/2 h-[7px] w-[36%] -translate-x-1/2 rounded-full border-2 border-[#1B4332]/20 ${lidClass}`}
      />
    </div>
  )
}

function BinFace({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-x-0 top-[15px] flex h-[14px] flex-col items-center justify-center">
      <div className="flex gap-[5px]">
        <span className="block h-[5px] w-[5px] rounded-full bg-[#1B4332]/85" />
        <span className="block h-[5px] w-[5px] rounded-full bg-[#1B4332]/85" />
      </div>
      <span className="mt-[1px] text-[10px] font-black leading-none text-[#1B4332]">
        {active ? "◡" : "−"}
      </span>
    </div>
  )
}

export function BinCharacter({ bin, active }: BinCharacterProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex h-[96px] w-full items-end justify-center">
        <motion.div
          className={`w-full max-w-[68px] rounded-[18px] border-[3px] p-[3px] ${
            active
              ? "border-[#FFD166] bg-white shadow-[0_0_0_2px_#FFD166,0_6px_14px_rgba(255,209,102,0.35)]"
              : "border-[#1B4332]/12 bg-white/70 shadow-sm"
          }`}
          style={{ height: BIN_BODY_H + 6 }}
          animate={active ? { y: [0, -3, 0] } : { y: 0 }}
          transition={
            active ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" } : { duration: 0.2 }
          }
        >
          <div
            className={`relative h-full overflow-hidden rounded-[14px] bg-gradient-to-b pt-1 ${bin.bodyClass} ${
              active ? "" : "saturate-[0.7] brightness-[0.94] opacity-85"
            }`}
          >
            <BinLid lidClass={bin.lidClass} />
            <BinFace active={active} />
            <div className="absolute bottom-[6px] left-1/2 flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-white/90 bg-white/95 text-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
              {bin.emoji}
            </div>
          </div>
        </motion.div>
      </div>

      <span
        className={`mt-2 flex h-[22px] w-full max-w-[68px] items-center justify-center rounded-full px-1 text-[10px] font-black leading-none ${
          active ? `${bin.chipClass} text-white` : "bg-[#E9ECEF] text-[#52796F]"
        }`}
      >
        {bin.subtitle}
      </span>
    </div>
  )
}
