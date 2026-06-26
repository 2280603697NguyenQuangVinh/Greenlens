import { motion, AnimatePresence } from "motion/react"
import { FF_FREDOKA } from "@/utils/constants"

export function RewardUnlockModal({
  open,
  title,
  imageUrl,
  onClose,
}: {
  open: boolean
  title: string
  imageUrl?: string
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Phần thưởng mới"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="w-full max-w-xs rounded-3xl border-4 border-[#7ED957] bg-white p-5 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-sm text-[#2d6a4f]">Phần thưởng mới!</p>
            <p className="mb-4 text-lg text-[#1b4332]" style={FF_FREDOKA}>
              {title}
            </p>
            {imageUrl ? (
              <motion.img
                initial={{ scale: 0.5, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
                src={imageUrl}
                alt=""
                className="mx-auto mb-4 h-20 w-20 object-contain"
                draggable={false}
              />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-[#2dd62d] py-3 text-[15px] text-white active:scale-[0.99]"
              style={FF_FREDOKA}
            >
              Tuyệt vời!
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
