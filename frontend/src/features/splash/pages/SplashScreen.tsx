import { motion } from "motion/react"
import { BRAND_MINT_BG, FF_FREDOKA, FF_COMFORTAA } from "@/utils/constants"
import { getUiAsset } from "@/assets"

const LOGO = getUiAsset("GreenLens Kids.png")

export function SplashScreen() {
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center px-8 text-center"
      style={{ backgroundColor: BRAND_MINT_BG }}
    >
      <motion.img
        src={LOGO}
        alt="GreenLens Kids"
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="block w-full max-w-[300px] h-auto"
      />

      <motion.h1
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="mt-6 text-3xl font-black text-green-800"
        style={FF_FREDOKA}
      >
        GreenLens Kids
      </motion.h1>
      <p className="mt-2 text-sm text-green-700 font-semibold" style={FF_COMFORTAA}>
        Đang chuẩn bị hành trình xanh cho các bé...
      </p>

      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        className="mt-6 flex items-center gap-2 text-green-700"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
      </motion.div>
    </div>
  )
}
