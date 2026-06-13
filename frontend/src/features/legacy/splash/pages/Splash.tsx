import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Leaf } from "lucide-react";

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-400 to-green-600 font-['Nunito',sans-serif]">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, duration: 1.5 }}
        className="bg-white p-6 rounded-full shadow-2xl mb-6"
      >
        <Leaf size={80} className="text-green-500" strokeWidth={2.5} />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-5xl font-black text-white tracking-wide drop-shadow-md"
      >
        GreenLens
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-green-100 text-xl font-bold mt-2"
      >
        Kids
      </motion.p>
    </div>
  );
}
