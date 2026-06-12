import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { Home, Camera, Puzzle, User, FileQuestion } from "lucide-react";
import { useAuth } from "@/redux/authStore";
import { logout } from "@/services/authService";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuth();

  const handleLogout = async () => {
    await logout();
    clearAuth();
    navigate("/login", { replace: true });
  };

  const isCamera = location.pathname.includes("/camera");

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[#e8f8ef]">
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>

      {/* Bottom nav — matches UI sample */}
      {!isCamera && (
        <nav className="shrink-0 bg-[#d4f5e4] border-t-2 border-green-200/80 px-2 pt-2 pb-safe pb-3 relative">
          <div className="flex items-end justify-around">
            <TabItem to="/app" end icon={<Home size={26} strokeWidth={2.5} />} label="Trang Chủ" />
            <TabItem to="/app/quiz" icon={<FileQuestion size={26} strokeWidth={2.5} />} label="Câu Đố" />

            <NavLink
              to="/app/camera"
              className={({ isActive }) =>
                `relative flex flex-col items-center -mt-8 ${isActive ? "scale-105" : ""}`
              }
            >
              <div
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                  isCamera
                    ? "bg-gradient-to-br from-green-400 to-green-600"
                    : "bg-gradient-to-br from-[#4ade80] to-[#22c55e]"
                }`}
              >
                <Camera size={30} className="text-white" strokeWidth={2.5} />
                <span className="absolute -top-1 -right-1 text-lg">⭐</span>
              </div>
              <span className="text-[10px] font-bold text-green-800 mt-1">Camera</span>
            </NavLink>

            <TabItem to="/app/game" icon={<Puzzle size={26} strokeWidth={2.5} />} label="Mini Game" />
            <TabItem to="/app/profile" icon={<User size={26} strokeWidth={2.5} />} label="Hồ Sơ" />
          </div>
        </nav>
      )}
    </div>
  );
}

function TabItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 min-w-[56px] py-1 ${
          isActive ? "text-green-700" : "text-green-600/70"
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
    </NavLink>
  );
}
