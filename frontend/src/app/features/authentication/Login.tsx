import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Leaf, User, Lock, ArrowRight } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      navigate("/app");
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-green-50 font-['Nunito',sans-serif] px-6 py-12">
      <div className="flex flex-col items-center mt-10 mb-12">
        <div className="mb-4">
          <div className="w-28 h-28 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-5xl">♻️</div>
        </div>
        <h1 className="text-4xl font-black text-green-900">Welcome Back!</h1>
        <p className="text-green-600 font-semibold mt-2 text-lg">Ready for a new adventure?</p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleLogin} 
        className="flex flex-col gap-6 w-full max-w-sm mx-auto"
      >
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400">
            <User size={24} />
          </div>
          <input 
            type="text" 
            placeholder="Explorer Name" 
            className="w-full bg-white border-4 border-green-200 text-green-900 rounded-3xl py-4 pl-14 pr-4 font-bold text-lg outline-none focus:border-green-500 transition-colors shadow-sm"
            required
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400">
            <Lock size={24} />
          </div>
          <input 
            type="password" 
            placeholder="Secret Password" 
            className="w-full bg-white border-4 border-green-200 text-green-900 rounded-3xl py-4 pl-14 pr-4 font-bold text-lg outline-none focus:border-green-500 transition-colors shadow-sm"
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white rounded-3xl py-4 font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-green-300 mt-4 disabled:opacity-70"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              Let's Go! <ArrowRight size={24} strokeWidth={3} />
            </>
          )}
        </motion.button>
      </motion.form>
      
      <div className="mt-8 text-center">
        <p className="text-green-700 font-bold">
          New explorer? <span className="text-green-500 underline decoration-2 underline-offset-4 cursor-pointer">Join here!</span>
        </p>
      </div>
    </div>
  );
}
