import { Outlet, NavLink } from "react-router";
import { Home, Camera, BrainCircuit, Trophy } from "lucide-react";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-green-50 text-slate-800 font-sans selection:bg-green-200">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2 text-green-600 font-bold text-xl tracking-tight">
          <div className="bg-green-500 text-white p-1.5 rounded-xl">
            <Camera size={20} />
          </div>
          GreenLens Kids
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
            🔥 5
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full border-2 border-blue-500 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-lg mx-auto bg-white shadow-xl sm:border-x border-slate-100 relative">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-100 pb-safe z-10 sticky bottom-0 w-full">
        <div className="max-w-lg mx-auto flex justify-around">
          <NavItem to="/" icon={<Home />} label="Home" />
          <NavItem to="/camera" icon={<Camera />} label="AI Camera" />
          <NavItem to="/quiz" icon={<BrainCircuit />} label="Quiz" />
          <NavItem to="/rewards" icon={<Trophy />} label="Rewards" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
          isActive ? "text-green-600" : "text-slate-400 hover:text-green-500"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive ? "scale-110 drop-shadow-sm" : ""} transition-transform duration-200`}>
            {icon}
          </div>
          <span className={`text-xs font-semibold ${isActive ? "opacity-100" : "opacity-70"}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
