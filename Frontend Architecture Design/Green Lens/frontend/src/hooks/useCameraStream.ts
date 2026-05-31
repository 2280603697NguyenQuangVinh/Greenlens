import { useCallback, useEffect, useRef, useState } from "react"

type UseCameraStreamOptions = {
  enabled?: boolean
}

export function useCameraStream({ enabled = true }: UseCameraStreamOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsReady(false)
  }, [])

  const start = useCallback(async () => {
    if (!enabled) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Thiết bị không hỗ trợ camera trình duyệt.")
      return
    }

    setIsStarting(true)
    setError(null)
    stop()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      setIsReady(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể truy cập camera."
      setError(msg)
      setIsReady(false)
    } finally {
      setIsStarting(false)
    }
  }, [enabled, stop])

  const restart = useCallback(async () => {
    await start()
  }, [start])

  const captureToDataUrl = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null

    const width = video.videoWidth || 0
    const height = video.videoHeight || 0
    if (width === 0 || height === 0) return null

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, width, height)
    return canvas.toDataURL("image/jpeg", 0.9)
  }, [])

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }
    void start()
    return () => {
      stop()
    }
  }, [enabled, start, stop])

  return {
    videoRef,
    canvasRef,
    isStarting,
    isReady,
    error,
    start,
    stop,
    restart,
    captureToDataUrl,
  }
}

