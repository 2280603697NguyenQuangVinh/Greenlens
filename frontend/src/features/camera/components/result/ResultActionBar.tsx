import { Camera, Gamepad2 } from "lucide-react"

type Props = {
  onRetake: () => void
  onQuiz?: () => void
}

export function ResultActionBar({ onRetake, onQuiz }: Props) {
  return (
    <div className={`flex gap-2.5 pt-0.5 ${onQuiz ? "flex-col sm:flex-row" : ""}`}>
      <button
        type="button"
        onClick={onRetake}
        className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#95D5B2] bg-white px-4 text-[14px] font-black text-[#2D6A4F] shadow-sm active:scale-[0.98]"
      >
        <Camera size={20} strokeWidth={2.5} />
        Chụp vật khác
      </button>
      {onQuiz && (
        <button
          type="button"
          onClick={onQuiz}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#52B788] to-[#40916C] px-4 text-[14px] font-black text-white shadow-[0_6px_20px_rgba(64,145,108,0.35)] active:scale-[0.98]"
        >
          <Gamepad2 size={20} strokeWidth={2.5} />
          Chơi thử thách
        </button>
      )}
    </div>
  )
}
