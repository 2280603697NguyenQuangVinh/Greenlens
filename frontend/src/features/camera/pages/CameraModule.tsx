import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera as CameraIcon, Image, Home } from "lucide-react";
import {
  analyzeAiCameraImage,
  buildCameraLoadingMascotSpeech,
  buildCameraLoadingMascotSpeechSegments,
  buildCameraUnavailableMascotSpeech,
  buildCameraUnavailableMascotSpeechSegments,
  buildIdleMascotSpeech,
  buildIdleMascotSpeechSegments,
  buildMascotSpeech,
  buildMascotSpeechSegments,
  type AiCameraResult,
} from "@/services/aiCamera";
import { prefetchSupertonicSpeech } from "@/services/supertonic";
import { loadStoredProfile } from "@/services/greenLens";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { FloatingMascot } from "@/features/camera/components/FloatingMascot";
import { CameraResultCard } from "@/features/camera/components/CameraResultCard";
import { fireScanConfetti } from "@/features/camera/utils/scanConfetti";
import { pickRandomMascotSpot, type MascotSpot } from "@/features/camera/utils/mascotSpots";
import type { AvatarConfig } from "@/utils/types";

const DEFAULT_AVATAR: AvatarConfig = {
  characterName: "",
  gender: 0,
  skin: 0,
  hair: 1,
  eyes: 0,
  outfit: 1,
};

/** Rough minimum for a real JPEG data URL (empty/mock payloads are much shorter). */
const MIN_IMAGE_DATA_LENGTH = 1000;

function formatCameraError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  if (
    lower.includes("permission") ||
    lower.includes("denied") ||
    lower.includes("notallowed")
  ) {
    return "Bạn chưa cho phép dùng camera. Hãy bật quyền camera trong cài đặt trình duyệt.";
  }
  if (lower.includes("notfound") || lower.includes("not found")) {
    return "Không tìm thấy camera trên thiết bị này.";
  }
  if (typeof window !== "undefined" && window.location.protocol === "http:") {
    return "Camera cần mở trang bằng https (không phải http).";
  }
  if (lower.includes("secure") || lower.includes("https")) {
    return "Camera cần mở trang bằng https (không phải http).";
  }
  return "Không thể mở camera trên trình duyệt này.";
}

function isValidImageDataUrl(dataUrl: string): boolean {
  if (!dataUrl.startsWith("data:image/")) return false;
  const base64 = dataUrl.split(",")[1] ?? "";
  return base64.length >= MIN_IMAGE_DATA_LENGTH;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function isSupportedUploadType(type: string | undefined): boolean {
  const normalized = type?.trim().toLowerCase() ?? "";
  return (
    normalized === "image/jpeg" ||
    normalized === "image/jpg" ||
    normalized === "image/pjpeg" ||
    normalized === "image/png"
  );
}

async function renderDataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
  const image = new Image();
  image.decoding = "async";

  const loadPromise = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Không đọc được ảnh đã chọn."));
  });

  image.src = dataUrl;
  await loadPromise;

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không thể xử lý ảnh đã chọn.");
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/jpeg", 0.92);
  });

  if (!blob) {
    throw new Error("Không thể chuyển ảnh sang định dạng phù hợp.");
  }

  return blob;
}

function profileToAvatar(profile: NonNullable<ReturnType<typeof loadStoredProfile>>): AvatarConfig {
  return {
    characterName: profile.characterName ?? "",
    gender: profile.gender,
    skin: profile.skin,
    hair: profile.hair,
    eyes: profile.eyes,
    outfit: profile.outfit,
  };
}

type CameraModuleProps = {
  onBack?: () => void;
  onGoQuiz?: () => void;
  onResult?: (result: AiCameraResult) => void | Promise<void>;
  avatarCfg?: AvatarConfig;
};

export default function CameraModule({
  onBack,
  onGoQuiz,
  onResult,
  avatarCfg: avatarCfgProp,
}: CameraModuleProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AiCameraResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const confettiKeyRef = useRef<string | null>(null);
  const [resultSpot, setResultSpot] = useState<MascotSpot | null>(null);
  const [suppressIdleGreeting, setSuppressIdleGreeting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isSupported,
    voicesReady,
    supertonicLoading,
    supertonicReady,
    supertonicFailed,
    speak,
    cancel,
    cancelPlayback,
    unlockAudio,
    playMascotVoice,
  } = useSpeechSynthesis();

  const handleUserGesture = useCallback(() => {
    void unlockAudio();
  }, [unlockAudio]);

  const avatarCfg = useMemo(() => {
    if (avatarCfgProp) return avatarCfgProp;
    const stored = loadStoredProfile();
    return stored ? profileToAvatar(stored) : DEFAULT_AVATAR;
  }, [avatarCfgProp]);

  const speechText = useMemo(
    () => (result ? buildMascotSpeech(result) : ""),
    [result],
  );

  const speechSegments = useMemo(
    () => (result ? buildMascotSpeechSegments(result) : []),
    [result],
  );

  useEffect(() => {
    if (!result || !capturedImage) return;
    const key = `${result.wasteName}-${result.confidence}`;
    if (confettiKeyRef.current === key) return;
    confettiKeyRef.current = key;
    fireScanConfetti();
  }, [result, capturedImage]);

  const displayName = avatarCfg.characterName?.trim() || "bạn";

  const idleSpeechText = useMemo(() => buildIdleMascotSpeech(displayName), [displayName]);

  const loadingSpeechText = useMemo(
    () => buildCameraLoadingMascotSpeech(displayName),
    [displayName],
  );

  const unavailableSpeechText = useMemo(
    () => buildCameraUnavailableMascotSpeech(displayName),
    [displayName],
  );

  const cameraUnavailable = Boolean(cameraError);

  const preCaptureSpeech = useMemo(() => {
    if (cameraUnavailable) {
      return {
        text: unavailableSpeechText,
        segments: buildCameraUnavailableMascotSpeechSegments(displayName),
        key: "pre-unavailable",
      };
    }
    if (cameraReady) {
      return {
        text: idleSpeechText,
        segments: buildIdleMascotSpeechSegments(displayName),
        key: "pre-ready",
      };
    }
    return {
      text: loadingSpeechText,
      segments: buildCameraLoadingMascotSpeechSegments(displayName),
      key: "pre-loading",
    };
  }, [
    cameraReady,
    cameraUnavailable,
    displayName,
    idleSpeechText,
    loadingSpeechText,
    unavailableSpeechText,
  ]);

  const showPreCaptureMascot = !capturedImage && !isProcessing;

  useEffect(() => {
    if (!supertonicReady || !showPreCaptureMascot) return

    const ttsText = preCaptureSpeech.segments[0]?.text.trim()
    if (!ttsText) return

    const timer = window.setTimeout(() => {
      void prefetchSupertonicSpeech(ttsText, { lang: "vi" })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [supertonicReady, showPreCaptureMascot, preCaptureSpeech.segments, preCaptureSpeech.key])

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function attachStream(mediaStream: MediaStream) {
      const video = videoRef.current;
      if (!video || cancelled) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = mediaStream;
      await video.play();
      setCameraReady(video.videoWidth > 0 && video.videoHeight > 0);
      setCameraError(null);
    }

    async function setupCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(formatCameraError("not supported"));
        setCameraReady(false);
        return;
      }

      const video = videoRef.current;
      const existingStream = video?.srcObject as MediaStream | null;
      if (
        existingStream?.active &&
        video &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        setCameraReady(true);
        setCameraError(null);
        return;
      }

      setCameraReady(false);
      setCameraError(null);

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        await attachStream(stream);
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          await attachStream(stream);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Không thể truy cập camera.";
          setCameraError(formatCameraError(message));
          setCameraReady(false);
        }
      }
    }

    if (!capturedImage && !result) {
      void setupCamera();
    }

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage, result]);

  const runAnalysis = useCallback(
    async (imageDataUrl: string, imageFile?: Blob | File) => {
      if (!isValidImageDataUrl(imageDataUrl)) {
        setError(
          "Không có ảnh hợp lệ. Hãy chọn ảnh từ thư viện hoặc thử chụp lại nhé!",
        );
        return;
      }

      setCapturedImage(imageDataUrl);
      setIsProcessing(true);
      setError(null);
      setResult(null);
      setResultSpot(null);
      cancelPlayback();

      try {
        const sourceBlob = imageFile ?? dataUrlToBlob(imageDataUrl);
        const shouldNormalizeToJpeg =
          Boolean(imageFile) || !isSupportedUploadType(sourceBlob.type);
        const imageBlob = shouldNormalizeToJpeg
          ? await renderDataUrlToJpegBlob(imageDataUrl)
          : sourceBlob;
        const analysis = await analyzeAiCameraImage(imageBlob);
        const resultSpeech = buildMascotSpeechSegments(analysis)[0]?.text
        if (resultSpeech) {
          void prefetchSupertonicSpeech(resultSpeech, { lang: "vi" });
        }
        setResult(analysis);
        setResultSpot(pickRandomMascotSpot());
        void playMascotVoice({
          label: analysis.wasteName,
          recycleGuide: analysis.recyclingInstruction,
          reuseSuggestion: analysis.reuseSuggestion,
          environmentImpact: analysis.environmentalImpact,
        });
        await onResult?.(analysis);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Không nhận ra được, bạn thử chụp lại nhé!";
        setError(message);
        setCapturedImage(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [cancelPlayback, onResult, playMascotVoice],
  );

  const handleCapture = () => {
    if (isProcessing) return;
    void unlockAudio();

    if (cameraUnavailable) {
      handleGalleryClick();
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera chưa sẵn sàng. Đợi một chút rồi thử lại nhé!");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    void runAnalysis(imgDataUrl);
  };

  const resetCamera = () => {
    cancel();
    setSuppressIdleGreeting(true);
    setCapturedImage(null);
    setResult(null);
    setResultSpot(null);
    confettiKeyRef.current = null;
    setError(null);
  };

  const handleGalleryClick = () => {
    void unlockAudio();
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isProcessing) return;
    void unlockAudio();

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      void runAnalysis(imageDataUrl, file);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const showResult = Boolean(
    capturedImage && result && isValidImageDataUrl(capturedImage),
  );

  return (
    <div
      className={`flex flex-col h-full bg-black relative font-['Nunito',sans-serif] ${showResult ? "" : "overflow-hidden"}`}
      onPointerDown={handleUserGesture}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!capturedImage && !isProcessing && onBack && (
        <div className="absolute top-4 left-4 z-50">
          <button
            type="button"
            onClick={onBack}
            className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center"
          >
            <Home size={24} className="text-white" />
          </button>
        </div>
      )}

      <div className={`flex-1 relative bg-gray-900 ${showResult ? "overflow-y-auto" : ""}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            const video = videoRef.current;
            if (video && video.videoWidth > 0) {
              setCameraReady(true);
              setCameraError(null);
            }
          }}
          className={`absolute inset-0 w-full h-full object-cover ${showResult || cameraUnavailable ? "hidden" : ""}`}
        />

        {cameraUnavailable && !capturedImage && !isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 px-6">
            <div className="w-full max-w-sm text-center text-white">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <CameraIcon size={40} className="text-white/70" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-black">Không mở được camera</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {cameraError}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Bạn vẫn có thể chọn ảnh từ thư viện để AI phân tích rác thải.
              </p>
              <button
                type="button"
                onClick={handleGalleryClick}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 py-3.5 text-sm font-black text-white shadow-lg active:scale-[0.98]"
              >
                <Image size={20} />
                Chọn ảnh từ thư viện
              </button>
            </div>
          </div>
        )}

        {!cameraUnavailable && !capturedImage && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <div className="relative w-64 h-64 border-4 border-teal-400 rounded-2xl z-10">
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400 text-4xl animate-pulse">
                🎯
              </div>
            </div>
          </div>
        )}

        {!cameraUnavailable && !cameraReady && !capturedImage && !isProcessing && (
          <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-2xl bg-black/60 px-4 py-2 text-sm text-white pointer-events-none">
            {supertonicLoading ? "Đang tải giọng mascot…" : "Đang bật camera..."}
          </div>
        )}

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-30"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-20 h-20 border-4 border-teal-400/30 border-t-teal-400 rounded-full"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400 text-2xl">
                  🔍
                </div>
              </div>
              <p className="text-white font-bold text-lg mt-6">Đang phân tích...</p>
              <p className="text-white/60 text-sm mt-2">AI đang nhận diện rác thải</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-4 top-20 z-40 rounded-2xl bg-red-500/90 px-4 py-3 text-center text-white shadow-lg"
            >
              <p className="font-bold text-sm leading-snug">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="mt-2 text-sm underline opacity-80"
              >
                Đóng
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResult && result && capturedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col z-40 bg-[#E8F8EF]"
              onPointerDown={handleUserGesture}
            >
              <div className="relative min-h-[48vh] max-h-[52vh] shrink-0">
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#F7FFF9]/90 via-transparent to-black/5" />
                </div>
                {resultSpot && (
                  <FloatingMascot
                    variant="result"
                    autoSpeak={false}
                    spot={resultSpot}
                    text={speechText}
                    speechSegments={speechSegments}
                    speechKey={`result-${result.wasteName}-${result.confidence}-${resultSpot.top}-${resultSpot.left ?? ""}-${resultSpot.right ?? ""}`}
                    isSupported={isSupported}
                    voicesReady={voicesReady}
                    supertonicReady={supertonicReady}
                    onSpeak={speak}
                    onStopPlayback={cancelPlayback}
                    mascotSize={72}
                  />
                )}
              </div>

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 26 }}
                className="relative z-10 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-[#F7FFF9] shadow-[0_-8px_32px_rgba(45,106,79,0.15)]"
              >
                <div className="flex shrink-0 justify-center pt-3 pb-1">
                  <div className="h-1.5 w-12 rounded-full bg-[#95D5B2]/60" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
                  <CameraResultCard
                    result={result}
                    capturedImage={capturedImage}
                    onRetake={resetCamera}
                    onQuiz={onGoQuiz}
                  />

                  {isSupported && supertonicFailed && (
                    <p className="mt-3 text-center text-sm font-semibold text-red-600">
                      Không tải được giọng. Hãy tải lại trang nhé!
                    </p>
                  )}
                  {isSupported && !supertonicFailed && supertonicLoading && !voicesReady && (
                    <p className="mt-3 text-center text-sm text-green-700">
                      Đang tải giọng mascot…
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showPreCaptureMascot && (
        <FloatingMascot
          variant="idle"
          text={preCaptureSpeech.text}
          speechSegments={preCaptureSpeech.segments}
          speechKey={preCaptureSpeech.key}
          isSupported={isSupported}
          voicesReady={voicesReady}
          supertonicReady={supertonicReady}
          onSpeak={speak}
          onStopPlayback={cancelPlayback}
          autoSpeak={preCaptureSpeech.key !== "pre-loading" && !suppressIdleGreeting}
          mascotSize={64}
        />
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!capturedImage && !isProcessing && !cameraUnavailable && (
        <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-md p-6 pb-8 z-50">
          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={handleGalleryClick}
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30"
              aria-label="Chọn ảnh từ thư viện"
            >
              <Image size={28} className="text-white" />
            </button>

            <motion.button
              whileTap={!cameraReady ? undefined : { scale: 0.9 }}
              type="button"
              onClick={handleCapture}
              disabled={!cameraReady}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                cameraReady ? "bg-white" : "bg-gray-400 opacity-60 cursor-not-allowed"
              }`}
              aria-label="Chụp ảnh"
            >
              <div
                className={`w-16 h-16 border-4 rounded-full ${
                  cameraReady ? "border-gray-300" : "border-gray-500"
                }`}
              />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
