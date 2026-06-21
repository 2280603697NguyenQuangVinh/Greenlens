import type { AiCameraResult } from "@/services/aiCamera"
import { ResultHeroCard } from "@/features/camera/components/result/ResultHeroCard"
import { BinCharacterPicker } from "@/features/camera/components/result/BinCharacterPicker"
import { ScanRewardBanner } from "@/features/camera/components/result/ScanRewardBanner"
import { StoryCardStack } from "@/features/camera/components/result/StoryCardStack"
import { ResultActionBar } from "@/features/camera/components/result/ResultActionBar"

type Props = {
  result: AiCameraResult
  capturedImage: string
  onRetake: () => void
  onQuiz?: () => void
}

export function CameraResultCard({ result, capturedImage, onRetake, onQuiz }: Props) {
  return (
    <>
      <ResultHeroCard result={result} capturedImage={capturedImage} />
      <BinCharacterPicker result={result} />
      <ScanRewardBanner />
      <p className="mb-2 text-center text-[12px] font-semibold text-[#95A5A6]">
        Vuốt xem thêm câu chuyện nhé
      </p>
      <StoryCardStack result={result} />
      <ResultActionBar onRetake={onRetake} onQuiz={onQuiz} />
    </>
  )
}
