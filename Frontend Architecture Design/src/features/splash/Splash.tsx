import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Leaf } from "lucide-react";
import { isAuthenticated } from "@/services/tokenStorage";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated() ? "/app" : "/login");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-400 to-green-600">
      <div className="bg-white p-6 rounded-full shadow-2xl mb-6 animate-bounce">
        <Leaf size={80} className="text-green-500" strokeWidth={2.5} />
      </div>
      <h1 className="text-5xl font-black text-white tracking-wide drop-shadow-md">GreenLens</h1>
      <p className="text-green-100 text-xl font-bold mt-2">Kids</p>
    </div>
  );
}
