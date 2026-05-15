import { Outlet, Link, useLocation } from "react-router";
import { Home, Camera, Brain, Trophy, Gamepad2 } from "lucide-react";
import { motion } from "motion/react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/app", icon: Home, label: "Home" },
    { path: "/app/camera", icon: Camera, label: "AI Cam" },
    { path: "/app/quiz", icon: Brain, label: "Quiz" },
    { path: "/app/game", icon: Gamepad2, label: "Play" },
    { path: "/app/rewards", icon: Trophy, label: "Rewards" },
  ];

  return (
    <div className="flex flex-col h-screen bg-green-50 font-['Nunito',sans-serif]">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t-4 border-green-200 rounded-t-3xl shadow-lg px-6 py-3 flex justify-between items-center z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                  isActive ? "bg-green-500 text-white shadow-md shadow-green-300" : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                <Icon size={28} strokeWidth={isActive ? 3 : 2} />
              </motion.div>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-green-500"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
