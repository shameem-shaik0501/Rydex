import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Play } from "lucide-react";
import CinematicMountainRoad from "../components/CinematicMountainRoad";

function Splash() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/home")}
      className="relative min-h-screen w-full flex flex-col justify-center items-center
                 bg-transparent text-white cursor-pointer select-none overflow-hidden"
    >
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto backdrop-blur-xs">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6 shadow-xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Seamless Self-Drive Car Rental
        </div>

        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-wider bg-gradient-to-r from-white via-blue-100 to-sky-300 bg-clip-text text-transparent drop-shadow-lg">
          Rydex
        </h1>

        <p className="mt-4 text-xl sm:text-2xl text-blue-100/90 font-light tracking-wide drop-shadow-md">
          Drive your dream. Rent with confidence.
        </p>

        <div className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-sm shadow-2xl border border-blue-400/40 backdrop-blur-md transition-all transform hover:scale-105">
          <span>Start Your Journey</span>
          <Play className="w-3.5 h-3.5 fill-current" />
        </div>

        <p className="mt-4 text-xs text-blue-300/70">
          Click anywhere to explore the fleet
        </p>
      </div>

      {/* Admin Login at the very corner bottom left of the very first page */}
      <div className="fixed bottom-5 left-5 z-50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/login?role=admin");
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-blue-500/60 shadow-2xl backdrop-blur-md text-xs font-bold transition group cursor-pointer"
          title="Operations Desk Admin Login (nazeer / nazeer)"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">Admin Login</span>
          <Lock className="w-3 h-3 text-slate-400 group-hover:text-slate-200 ml-0.5" />
        </button>
      </div>
    </div>
  );
}

export default Splash;
