import { useState, useRef, useEffect } from "react";
import {
  Camera as CameraIcon,
  Zap,
  FlipVertical,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { uploadImage, type CameraAnalysisResult } from "@/services/cameraApi";
import { useReward } from "@/state/rewardStore";

export default function CameraModule() {
  const { addXp } = useReward();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CameraAnalysisResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not access camera";
        setCameraError(message);
      }
    }

    if (!capturedImage) {
      setupCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage]);

  const analyzeImage = async (imageDataUrl?: string) => {
    setAnalyzing(true);
    try {
      const data = await uploadImage(imageDataUrl);
      setResult(data);
      addXp(data.xp);
    } finally {
      setAnalyzing(false);
    }
  };

  const capturePhoto = () => {
    if (cameraError) {
      setIsCapturing(true);
      setTimeout(() => setIsCapturing(false), 150);
      const sample =
        "https://images.unsplash.com/photo-1555169062-013468b47731?w=800&q=80";
      setCapturedImage(sample);
      analyzeImage(sample);
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imgDataUrl);
      analyzeImage(imgDataUrl);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 relative overflow-hidden">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : cameraError ? (
          <div className="text-white text-center p-6 flex flex-col items-center">
            <div className="bg-slate-800 p-4 rounded-full mb-4">
              <CameraIcon size={32} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">Camera Access Denied</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Tap the shutter to use a sample photo and test the AI scanner.
            </p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}

        {isCapturing && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-150" />
        )}

        {analyzing && (
          <div className="absolute inset-0 bg-black/40 z-40 flex flex-col items-center justify-center">
            <p className="text-green-400 font-mono font-bold tracking-wider">ANALYZING...</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {result && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md uppercase">
                {result.type}
              </span>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{result.name}</h2>
              <span className="text-slate-400 text-xs font-bold flex items-center mt-1">
                <CheckCircle2 size={12} className="mr-1 text-green-500" /> {result.confidence}% Match
              </span>
            </div>
            <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600 font-bold text-center">
              <span className="text-xl">+{result.xp}</span>
              <span className="text-[10px] uppercase block">XP</span>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100">
            <h3 className="text-blue-800 font-bold text-sm mb-1">Fun Fact</h3>
            <p className="text-blue-600 text-sm font-medium">{result.funFact}</p>
          </div>
          <button
            type="button"
            onClick={resetCamera}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl"
          >
            Scan Another Subject
          </button>
        </div>
      )}

      {!result && (
        <div className="h-32 bg-black flex items-center justify-around px-8 pb-4">
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white"
          >
            <ImageIcon size={20} />
          </button>
          <button
            type="button"
            onClick={capturePhoto}
            disabled={analyzing}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 disabled:opacity-50"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </button>
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white"
          >
            <FlipVertical size={20} />
          </button>
        </div>
      )}

      {!result && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
          <div className="bg-black/40 backdrop-blur-md text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-400" /> Auto
          </div>
          <p className="text-white text-sm font-medium">Point at plants or animals</p>
        </div>
      )}
    </div>
  );
}
