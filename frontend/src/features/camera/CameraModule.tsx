import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera as CameraIcon, X, RotateCcw, Image, Clock, Factory, Globe, Trash2, Home } from "lucide-react";
import { useNavigate } from "react-router";

interface WasteInfo {
  object: string;
  type: string;
  binColor: string;
  binIcon: string;
  decomposition: string;
  suggestion: string;
  impact: string;
}

export default function CameraModule() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [wasteInfo, setWasteInfo] = useState<WasteInfo | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCapture = () => {
    setIsProcessing(true);

    if (cameraError) {
      setTimeout(() => {
        setIsProcessing(false);
        setCapturedImage("captured");
        setWasteInfo({
          object: "Chai Nhựa",
          type: "Tái Chế",
          binColor: "Xanh Lá",
          binIcon: "♻️",
          decomposition: "10 ngày - 1 triệu năm",
          suggestion: "Tái chế!",
          impact: "Giảm ô nhiễm"
        });
        navigate("/app/camera?result=true", { replace: true });
      }, 2000);
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imgDataUrl);

      setTimeout(() => {
        setIsProcessing(false);
        setWasteInfo({
          object: "Chai Nhựa",
          type: "Tái Chế",
          binColor: "Xanh Lá",
          binIcon: "♻️",
          decomposition: "10 ngày - 1 triệu năm",
          suggestion: "Tái chế!",
          impact: "Giảm ô nhiễm"
        });
        navigate("/app/camera?result=true", { replace: true });
      }, 2000);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setWasteInfo(null);
    navigate("/app/camera", { replace: true });
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setCapturedImage(imageDataUrl);
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          setWasteInfo({
            object: "Chai Nhựa",
            type: "Tái Chế",
            binColor: "Xanh Lá",
            binIcon: "♻️",
            decomposition: "10 ngày - 1 triệu năm",
            suggestion: "Tái chế!",
            impact: "Giảm ô nhiễm"
          });
          navigate("/app/camera?result=true", { replace: true });
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className={`flex flex-col h-screen bg-black relative font-['Nunito',sans-serif] ${capturedImage && wasteInfo ? '' : 'overflow-hidden'}`}>
      {/* Hidden File Input for Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Back to Home Button */}
      {!capturedImage && !isProcessing && (
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => navigate("/app")}
            className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center"
          >
            <Home size={24} className="text-white" />
          </button>
        </div>
      )}

      {/* Camera View */}
      <div className={`flex-1 relative bg-gray-900 ${capturedImage && wasteInfo ? 'overflow-y-auto' : ''}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Mock background for when camera fails */}
        {cameraError && !capturedImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <CameraIcon size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold opacity-70">Camera đang khởi động...</p>
            </div>
          </div>
        )}

        {/* Object Detection Frame */}
        {!capturedImage && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-64 h-64 border-4 border-teal-400 rounded-2xl z-10">
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400 text-4xl animate-pulse">
                🎯
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Captured Image with Info Overlay */}
        <AnimatePresence>
          {capturedImage && wasteInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col z-40"
            >
              {/* Captured Image Background */}
              <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900">
                {capturedImage !== "captured" ? (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-9xl">🥤</div>
                  </div>
                )}

                {/* Detection Frame on captured image */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative w-64 h-64 border-4 border-blue-300 rounded-2xl">
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-blue-300 rounded-tl-lg"></div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-blue-300 rounded-tr-lg"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-blue-300 rounded-bl-lg"></div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-blue-300 rounded-br-lg"></div>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-green-50 rounded-t-3xl p-6 shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-green-800">Thông Tin Rác</h2>
                  <button
                    onClick={resetCamera}
                    className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center"
                  >
                    <X size={20} className="text-green-700" />
                  </button>
                </div>

                {/* Object Info */}
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🥤</span>
                    <h3 className="text-2xl font-black text-gray-900">{wasteInfo.object}</h3>
                  </div>
                  <p className="text-green-700 font-bold">Loại Rác: {wasteInfo.type} (Màu {wasteInfo.binColor})</p>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Bin Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-center mb-2">
                      <div className="flex gap-1">
                        <div className="w-6 h-8 bg-blue-500 rounded-sm"></div>
                        <div className="w-6 h-8 bg-green-500 rounded-sm"></div>
                        <div className="w-6 h-8 bg-orange-500 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Trash2 size={16} className="text-gray-600" />
                      <p className="text-sm font-bold text-gray-700">Thùng: {wasteInfo.binColor}</p>
                    </div>
                  </div>

                  {/* Decomposition Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-center mb-2">
                      <Clock size={24} className="text-gray-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 text-center">Phân hủy:</p>
                    <p className="text-xs font-semibold text-gray-500 text-center">{wasteInfo.decomposition}</p>
                  </div>

                  {/* Suggestion Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-center mb-2">
                      <Factory size={24} className="text-gray-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 text-center">Gợi ý:</p>
                    <p className="text-xs font-semibold text-green-600 text-center">{wasteInfo.suggestion}</p>
                  </div>

                  {/* Impact Card */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-center mb-2">
                      <Globe size={24} className="text-gray-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 text-center">Tác động:</p>
                    <p className="text-xs font-semibold text-green-600 text-center">{wasteInfo.impact}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetCamera}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} /> Chụp lại
                  </button>
                  <button className="flex-1 bg-green-500 text-white py-3 rounded-2xl font-bold shadow-lg">
                    Lưu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Controls (Bottom) */}
      {!capturedImage && !isProcessing && (
        <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-md p-6 pb-8 z-50">
          <div className="flex items-center justify-center gap-8">
            {/* Gallery Button */}
            <button
              onClick={handleGalleryClick}
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Image size={28} className="text-white" />
            </button>

            {/* Capture Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCapture}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <div className="w-16 h-16 border-4 border-gray-300 rounded-full"></div>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
