import { Outlet, NavLink, useNavigate } from "react-router";
import { Home, Camera, BrainCircuit, Trophy, Calendar, Gamepad2, LogOut } from "lucide-react";
import { useAuth } from "@/state/authStore";
import { logout } from "@/features/auth/authService";

export default function Layout() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  const handleLogout = async () => {
    await logout();
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-green-50 text-slate-800 font-sans">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
          <div className="bg-green-500 text-white p-1.5 rounded-xl">
            <Camera size={20} />
          </div>
          GreenLens Kids
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 hidden sm:inline">
            {user?.name || "Explorer"}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full max-w-lg mx-auto bg-white shadow-xl sm:border-x border-slate-100">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-slate-100 sticky bottom-0 z-10">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          <NavItem to="/app" icon={<Home size={22} />} label="Home" end />
          <NavItem to="/app/daily" icon={<Calendar size={22} />} label="Daily" />
          <NavItem to="/app/camera" icon={<Camera size={22} />} label="Camera" />
          <NavItem to="/app/quiz" icon={<BrainCircuit size={22} />} label="Quiz" />
          <NavItem to="/app/game" icon={<Gamepad2 size={22} />} label="Play" />
          <NavItem to="/app/rewards" icon={<Trophy size={22} />} label="Rewards" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
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
        `flex flex-col items-center py-1 px-1 gap-0.5 text-[10px] font-semibold ${
          isActive ? "text-green-600" : "text-slate-400"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
