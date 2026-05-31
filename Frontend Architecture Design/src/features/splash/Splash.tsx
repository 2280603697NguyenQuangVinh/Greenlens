import { useEffect } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated } from "@/services/tokenStorage";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated() ? "/app" : "/login", { replace: true });
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full max-w-lg mx-auto bg-[#7ed957] flex items-center justify-center overflow-hidden">
      <div className="text-center text-white">
        <div className="text-7xl mb-4">♻️</div>
        <h1 className="text-4xl font-black">GreenLens Kids</h1>
        <p className="text-lg mt-1">Learn by Playing & Exploring</p>
      </div>
    </div>
  );
}
