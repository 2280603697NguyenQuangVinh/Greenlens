import { Gamepad2, Lock, Sparkles, Recycle, TreePine } from "lucide-react";
import { Link } from "react-router";

const GAMES = [
  {
    id: "recycle",
    title: "Recycle Sorting",
    description: "Sort items into the right bins",
    icon: Recycle,
    color: "bg-blue-100 text-blue-600",
    available: true,
  },
  {
    id: "forest",
    title: "Forest Runner",
    description: "Dodge obstacles and collect leaves",
    icon: TreePine,
    color: "bg-green-100 text-green-600",
    available: false,
  },
  {
    id: "pollinator",
    title: "Pollinator Quest",
    description: "Help bees find flowers",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-600",
    available: false,
  },
];

export default function MiniGameModule() {
  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
        <Gamepad2 className="text-green-500" /> Mini Games
      </h1>
      <p className="text-slate-500 text-sm font-medium mb-6">
        Placeholder module — game logic will connect via API layer later.
      </p>

      <div className="flex flex-col gap-4">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <div
              key={game.id}
              className={`relative bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm ${
                !game.available ? "opacity-70" : ""
              }`}
            >
              {!game.available && (
                <Lock size={16} className="absolute top-4 right-4 text-slate-400" />
              )}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${game.color}`}>
                  <Icon size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{game.title}</h3>
                  <p className="text-sm text-slate-500">{game.description}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={!game.available}
                className={`mt-4 w-full py-3 rounded-2xl font-bold text-sm ${
                  game.available
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {game.available ? "Play (Mock)" : "Coming Soon"}
              </button>
            </div>
          );
        })}
      </div>

      <Link to="/app" className="block mt-8 text-center text-green-600 font-bold text-sm hover:underline">
        ← Back to Home
      </Link>
    </div>
  );
}
