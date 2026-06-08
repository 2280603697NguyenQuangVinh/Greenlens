import { useRef, useState } from "react"
import type { ClassificationResult } from "@/lib/api"
import { FF_FREDOKA, MOCK_SCAN_IMAGE } from "../constants"
import { useCameraStream } from "@/hooks/useCameraStream"

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

  const doCapture = async () => {
    if (busy) return
    const captured = captureToDataUrl() ?? MOCK_SCAN_IMAGE
    setCapturedImage(captured)
    const result = await onAnalyze(captured)
    if (!result) return
    stop()
    setShowInfo(true)
  }

  const onPickFromGallery = async (file: File | null) => {
    if (!file || busy) return
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
    if (!dataUrl) return

    setCapturedImage(dataUrl)
    const result = await onAnalyze(dataUrl)
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
              onClick={() => fileInputRef.current?.click()}
              className="h-14 w-14 rounded-2xl bg-[#d5d5d5] text-2xl shadow-md"
            >
              🖼️
            </button>
            <button
              onClick={doCapture}
              disabled={busy || !isReady}
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
