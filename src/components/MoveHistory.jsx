import React, { useEffect, useRef } from "react";
import { Download } from "lucide-react";

export default function MoveHistory({ history, mode, onExport }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      no: i / 2 + 1,
      white: history[i] ? history[i].san : "",
      black: history[i + 1] ? history[i + 1].san : "",
    });
  }

  return (
    <div className="flex w-full flex-col rounded-2xl bg-white/[0.03] ring-1 ring-white/10 backdrop-blur lg:sticky lg:top-6">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-[10px] tracking-[0.3em] text-white/50 uppercase">
          Move history
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] text-[#c9a96a]/70 uppercase">
            {mode === "endless" ? "Perpetual" : "Finite"}
          </span>
          <button
            onClick={onExport}
            disabled={history.length === 0}
            className="flex h-7 items-center gap-1 rounded-full bg-white/5 px-2.5 text-[9px] tracking-[0.2em] text-white/60 uppercase ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5"
            title="Export moves as CSV"
          >
            <Download size={11} />
            CSV
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="max-h-[34vh] overflow-y-auto px-1 py-1 lg:max-h-[64vh]"
      >
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs tracking-wide text-white/30">
            Awaiting first move…
          </p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="odd:bg-white/[0.02]">
                  <td className="w-8 py-1.5 pl-2 pr-1 text-right text-[11px] tabular-nums text-white/30">
                    {r.no}.
                  </td>
                  <td className="py-1.5 pl-2 pr-1 font-mono text-[13px] text-white/85">
                    {r.white}
                  </td>
                  <td className="py-1.5 pl-2 pr-1 font-mono text-[13px] text-white/55">
                    {r.black}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}