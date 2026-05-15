import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera as CameraIcon, X, Zap, RotateCcw, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

export function Camera() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock starting a camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.log("Camera not accessible in this environment", err));
    }
  }, []);

  const handleCapture = () => {
    setIsProcessing(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setResult("Monarch Butterfly");
    }, 2500);
  };

  const resetCamera = () => {
    setResult(null);
  };

  return (
    <div className="flex flex-col h-screen bg-black relative font-['Nunito',sans-serif]">
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <button onClick={() => navigate("/app")} className="bg-black/40 p-3 rounded-full text-white backdrop-blur-md">
          <X size={24} />
        </button>
        <button className="bg-black/40 p-3 rounded-full text-white backdrop-blur-md">
          <Zap size={24} />
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
        {/* Real camera video element would go here */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        
        {/* Mock background for when camera fails */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-50 mix-blend-overlay"></div>

        {/* Viewfinder Frame */}
        {!result && !isProcessing && (
          <div className="relative w-64 h-64 border-4 border-white/50 rounded-3xl z-10">
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-3xl"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-3xl"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-3xl"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-3xl"></div>
          </div>
        )}

        {/* Processing State */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-24 h-24 border-8 border-green-500/30 border-t-green-400 rounded-full"
                />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-400" size={32} />
              </div>
              <p className="text-white font-bold text-xl mt-6 animate-pulse">GreenLens AI is thinking...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              className="absolute bottom-0 w-full bg-white rounded-t-3xl p-6 z-40 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-green-600 font-bold mb-1">
                    <Check size={20} className="bg-green-100 p-0.5 rounded-full" /> Match Found!
                  </div>
                  <h2 className="text-3xl font-black text-gray-900">{result}</h2>
                  <p className="text-gray-500 font-semibold mt-2">A beautiful pollinator known for its migration.</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-2xl border-2 border-orange-200 text-center">
                  <span className="block text-orange-600 font-black text-xl">+50</span>
                  <span className="block text-orange-500 font-bold text-xs uppercase">XP</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={resetCamera} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <RotateCcw size={20} /> Try Again
                </button>
                <button className="flex-[2] bg-green-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-200">
                  Add to Collection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Capture Button */}
      {!result && !isProcessing && (
        <div className="absolute bottom-10 left-0 w-full flex justify-center z-20 pb-20">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleCapture}
            className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full p-2 border-4 border-white/50 flex items-center justify-center"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
              <CameraIcon size={32} className="text-green-600" />
            </div>
          </motion.button>
        </div>
      )}
    </div>
  );
}
