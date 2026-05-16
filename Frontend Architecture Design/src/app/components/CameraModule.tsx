import { useState, useRef, useEffect } from "react";
import { Camera as CameraIcon, Zap, FlipVertical, Image as ImageIcon, CheckCircle2 } from "lucide-react";

export default function CameraModule() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err: any) {
        setCameraError(err.message || "Could not access camera");
      }
    }

    if (!capturedImage) {
      setupCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [capturedImage]);

  const capturePhoto = () => {
    if (cameraError) {
      // Simulate capture if camera failed
      setIsCapturing(true);
      setTimeout(() => setIsCapturing(false), 150);
      setCapturedImage("https://images.unsplash.com/photo-1555169062-013468b47731?w=800&q=80"); // Sample bird image
      analyzeImage();
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    // Simulate shutter effect
    setTimeout(() => setIsCapturing(false), 150);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imgDataUrl);
      analyzeImage();
    }
  };

  const analyzeImage = () => {
    setAnalyzing(true);
    // Simulate AI API call
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        name: "Monarch Butterfly",
        type: "Insect",
        confidence: 98,
        funFact: "They travel up to 3,000 miles during migration!",
        xp: 50
      });
    }, 2500);
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 relative overflow-hidden animate-in fade-in duration-300">
      {/* Viewfinder */}
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
              We couldn't access your camera. But don't worry, you can still test the feature!
            </p>
            <p className="text-green-400 font-bold text-sm">
              Tap the shutter to use a sample photo
            </p>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Shutter Flash overlay */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-150" />
        )}
        
        {/* Scanning Overlay */}
        {analyzing && (
          <div className="absolute inset-0 bg-black/40 z-40 flex flex-col items-center justify-center">
            <div className="w-48 h-48 border-2 border-green-500 rounded-2xl relative animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-400" />
            </div>
            <p className="mt-6 text-green-400 font-mono font-bold tracking-wider">ANALYZING AI MODEL...</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Result Panel */}
      {result && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md uppercase">
                  {result.type}
                </span>
                <span className="text-slate-400 text-xs font-bold flex items-center">
                  <CheckCircle2 size={12} className="mr-1 text-green-500" /> {result.confidence}% Match
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-800">{result.name}</h2>
            </div>
            <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600 font-bold flex flex-col items-center">
              <span className="text-xl">+{result.xp}</span>
              <span className="text-[10px] uppercase">XP Earned</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100">
            <h3 className="text-blue-800 font-bold text-sm mb-1">💡 Fun Fact!</h3>
            <p className="text-blue-600 text-sm font-medium">{result.funFact}</p>
          </div>
          
          <button 
            onClick={resetCamera}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform"
          >
            Scan Another Subject
          </button>
        </div>
      )}

      {/* Camera Controls */}
      {!result && (
        <div className="h-32 bg-black flex items-center justify-around px-8 pb-4">
          <button className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white active:scale-90 transition-transform">
            <ImageIcon size={20} />
          </button>
          
          <button 
            onClick={capturePhoto}
            disabled={analyzing}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform disabled:opacity-50"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </button>
          
          <button className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white active:scale-90 transition-transform">
            <FlipVertical size={20} />
          </button>
        </div>
      )}

      {/* Header Overlay */}
      {!result && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
          <div className="bg-black/40 backdrop-blur-md text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-400" /> Auto
          </div>
          <p className="text-white text-sm font-medium drop-shadow-md">
            Point at plants or animals
          </p>
        </div>
      )}

      {/* CSS for custom scan animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
