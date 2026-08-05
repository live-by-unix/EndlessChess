import React from "react";
import { Pause, Play, RotateCcw, Eye, EyeOff } from "lucide-react";

export default function GameControls({
  mode,
  onModeChange,
  paused,
  onTogglePause,
  onReset,
  theater,
  onToggleTheater,
  moveCount,
  status,
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode switch */}
      <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10 backdrop-blur">
        <button
          onClick={() => onModeChange("fixed")}
          className={
            "px-5 py-2 text-xs font-medium tracking-[0.2em] uppercase rounded-full transition-all duration-300 " +
            (mode === "fixed"
              ? "bg-[#c9a96a] text-black shadow"
              : "text-white/60 hover:text-white/90")
          }
        >
          Fixed
        </button>
        <button
          onClick={() => onModeChange("endless")}
          className={
            "px-5 py-2 text-xs font-medium tracking-[0.2em] uppercase rounded-full transition-all duration-300 " +
            (mode === "endless"
              ? "bg-[#c9a96a] text-black shadow"
              : "text-white/60 hover:text-white/90")
          }
        >
          Endless
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePause}
          disabled={status.over && mode === "fixed"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          title={paused ? "Resume" : "Pause"}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>

        <button
          onClick={onReset}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={onToggleTheater}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          title="Toggle theater mode (F3)"
        >
          {theater ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-white/35">
        <span>{moveCount} moves</span>
        <span className="h-3 w-px bg-white/15" />
        <span>F3 to hide UI</span>
      </div>
    </div>
  );
}