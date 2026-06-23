import { useRef, useState } from "react"
import type { ClassificationResult } from "@/services/greenLens"
import { FF_FREDOKA, MOCK_SCAN_IMAGE } from "@/utils/constants"
import { useCameraStream } from "@/features/scanner/hooks/useCameraStream"

const MIN_LOADING_MS = 1000
const SPEECH_UNLOCK_PRIMER = " "
const LOADING_MASCOT_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <circle cx="80" cy="80" r="72" fill="#bbf7d0"/>
    <circle cx="80" cy="72" r="38" fill="#34d399"/>
    <circle cx="66" cy="68" r="6" fill="#064e3b"/>
    <circle cx="94" cy="68" r="6" fill="#064e3b"/>
    <path d="M61 88c6 9 13 13 19 13s13-4 19-13" fill="none" stroke="#064e3b" stroke-width="6" stroke-linecap="round"/>
    <rect x="48" y="106" width="64" height="28" rx="14" fill="#10b981"/>
    <path d="M64 120h32" stroke="#ecfdf5" stroke-width="6" stroke-linecap="round"/>
  </svg>`,
)}`

type Props = {
  onBack: () => void
  busy: boolean
  onAnalyze: (base64: string) => Promise<ClassificationResult | null>
  onSpeak: (text: string) => Promise<void>
  onGoQuiz: () => void
  scanResult: ClassificationResult | null
}

export function ScannerScreen({ onBack, busy, onAnalyze, onSpeak, onGoQuiz, scanResult }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const {
    videoRef,
    canvasRef,
    isStarting,
    isReady,
    error: cameraError,
    restart,
    stop,
    captureToDataUrl,
  } = useCameraStream()

  const showLoading = () => setIsLoading(true)
  const hideLoading = () => setIsLoading(false)

  const unlockSpeechSynthesis = async () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    await new Promise<void>((resolve) => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(SPEECH_UNLOCK_PRIMER)
      utterance.lang = "vi-VN"
      utterance.volume = 0
      utterance.rate = 1
      utterance.pitch = 1
      let finished = false
      const done = () => {
        if (finished) return
        finished = true
        resolve()
      }
      utterance.onend = done
      utterance.onerror = done
      try {
        window.speechSynthesis.resume()
        window.speechSynthesis.speak(utterance)
        window.setTimeout(done, 220)
      } catch {
        done()
      }
    })
  }

  const runAnalyzeWithMinLoading = async (imageBase64: string) => {
    showLoading()
    try {
      const [result] = await Promise.all([
        onAnalyze(imageBase64),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, MIN_LOADING_MS)
        }),
      ])
      return result
    } finally {
      hideLoading()
    }
  }

  const doCapture = async () => {
    if (busy || isLoading) return
    void unlockSpeechSynthesis()
    const captured = captureToDataUrl() ?? MOCK_SCAN_IMAGE
    setCapturedImage(captured)
    const result = await runAnalyzeWithMinLoading(captured)
    if (!result) return
    stop()
    setShowInfo(true)
  }

  const onPickFromGallery = async (file: File | null) => {
    if (!file || busy || isLoading) return
    void unlockSpeechSynthesis()
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
    if (!dataUrl) return

    setCapturedImage(dataUrl)
    const result = await runAnalyzeWithMinLoading(dataUrl)
    if (!result) return
    stop()
    setShowInfo(true)
  }

  const handleRetake = async () => {
    setShowInfo(false)
    setCapturedImage(null)
    await restart()
  }

  const result = scanResult

  return (
    <div className="h-full relative overflow-hidden bg-black">
      {!showInfo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img
          src={capturedImage ?? MOCK_SCAN_IMAGE}
          alt="Captured preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {!showInfo && (
        <>
          <button
            onClick={onBack}
            className="absolute left-3 top-3 z-10 h-14 w-14 rounded-2xl bg-white/70 text-3xl font-black text-black shadow-md"
          >
            ⌂
          </button>

          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-10">
            <button
              onClick={() => {
                void unlockSpeechSynthesis()
                fileInputRef.current?.click()
              }}
              disabled={busy || isLoading}
              className="h-14 w-14 rounded-2xl bg-[#d5d5d5] text-2xl shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              🖼️
            </button>
            <button
              onClick={doCapture}
              disabled={busy || isLoading || !isReady}
              className="h-20 w-20 rounded-full border-4 border-white bg-[#e8e8e8] shadow-lg active:scale-95 disabled:opacity-60"
            >
              <span className="sr-only">capture</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void onPickFromGallery(e.target.files?.[0] ?? null)
              e.currentTarget.value = ""
            }}
          />

          {(isStarting || !isReady || cameraError) && (
            <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-2xl bg-black/60 px-4 py-2 text-center text-sm text-white">
              {cameraError
                ? `Không mở được camera: ${cameraError}`
                : isStarting
                  ? "Đang bật camera..."
                  : "Đang chờ camera sẵn sàng..."}
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <img
              src={LOADING_MASCOT_SRC}
              alt="Animated mascot"
              className="mx-auto mb-4 h-24 w-24 animate-bounce"
            />
            <p className="text-xl font-black text-[#065f46]" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
              Để mình xem đây là loại rác gì nhé...
            </p>
            <div className="mx-auto mt-5 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
          </div>
        </div>
      )}

      {showInfo && (
        <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[2rem] bg-[#c6e8d7] p-4">
          <div className="rounded-[1.5rem] bg-[#eaeaea] px-4 py-5 text-center">
            <h2 className="text-[42px] font-black leading-none text-black" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
              {result ? `${result.emoji} ${result.label}` : "🗑️ Chưa nhận diện"}
            </h2>
            <p className="mt-1 text-[42px] font-black text-[#0a8f44]">
              Loại rác: {result?.category ?? "Đang cập nhật"}
            </p>

            <div className="mt-4 space-y-2 text-[34px] leading-tight">
              <p>🗂️ <strong>Thùng rác</strong></p>
              <p className="text-[30px]">Phân loại theo hướng dẫn AI</p>
              <p className="mt-2">⏳ <strong>Thời gian phân hủy</strong></p>
              <p className="text-[30px]">Dựa theo loại vật liệu được nhận diện</p>
              <p className="mt-2">🤝 <strong>Gợi ý</strong></p>
              <p className="text-[30px]">{result?.guide ?? "Hãy chụp ảnh rõ hơn để phân tích chính xác."}</p>
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={() => (result?.guide ? onSpeak(result.guide) : Promise.resolve())}
              className="w-full rounded-2xl bg-white py-2 text-[24px] font-black text-[#14532d]"
              style={{ ...FF_FREDOKA, fontWeight: 700 }}
            >
              🔊 Đọc hướng dẫn
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => void handleRetake()}
              className="rounded-2xl bg-[#d9d9d9] py-2 text-[42px] font-black text-black"
              style={{ ...FF_FREDOKA, fontWeight: 700 }}
            >
              ↻ Chụp lại
            </button>
            <button
              onClick={onGoQuiz}
              className="rounded-2xl bg-[#08c557] py-2 text-[42px] font-black text-white"
              style={{ ...FF_FREDOKA, fontWeight: 700 }}
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
