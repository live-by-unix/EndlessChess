import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const GLYPH = { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" };

const SQUARES = Array.from({ length: 64 }, (_, i) => {
  const displayRank = Math.floor(i / 8);
  const file = i % 8;
  const dark = (displayRank + file) % 2 === 1;
  return { i, dark };
});

const fileLetter = (sq) => String.fromCharCode(97 + (sq % 8));
const rankNumber = (sq) => Math.floor(sq / 8) + 1;

const centerOf = (sq) => {
  const f = sq % 8;
  const r = Math.floor(sq / 8);
  return { x: (f + 0.5) * 12.5, y: (7 - r + 0.5) * 12.5 };
};

export default function ChessBoard({ pieces, lastMove, checkSquare, moveKey }) {
  const arrow = lastMove
    ? (() => {
        const a = centerOf(lastMove.from);
        const b = centerOf(lastMove.to);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const shorten = 0.32;
        return {
          x1: a.x,
          y1: a.y,
          x2: b.x - dx * shorten,
          y2: b.y - dy * shorten,
        };
      })()
    : null;

  return (
    <div className="relative w-full aspect-square select-none">
      {/* Squares */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 shadow-2xl">
        {SQUARES.map(({ i, dark }) => {
          const displayRank = Math.floor(i / 8);
          const file = i % 8;
          const actualSq = (7 - displayRank) * 8 + file;
          const isLast =
            lastMove && (lastMove.from === actualSq || lastMove.to === actualSq);
          const isCheck = checkSquare === actualSq;
          return (
            <div
              key={i}
              className={"relative " + (dark ? "bg-[#3a322a]" : "bg-[#e7ddc9]")}
            >
              {isLast && (
                <div className="absolute inset-0 bg-[#c9a96a]/25 ring-1 ring-inset ring-[#c9a96a]/70" />
              )}
              {isCheck && (
                <div className="absolute inset-0 bg-rose-500/40 ring-1 ring-inset ring-rose-400/70" />
              )}
            </div>
          );
        })}
      </div>

      {/* Move arrow */}
      {arrow && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="move-arrow"
              markerWidth="5"
              markerHeight="5"
              refX="2.5"
              refY="2.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L5,2.5 L0,5 Z" fill="#c9a96a" />
            </marker>
          </defs>
          <motion.line
            key={moveKey}
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            stroke="#c9a96a"
            strokeWidth="1.4"
            strokeLinecap="round"
            markerEnd="url(#move-arrow)"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.7, pathLength: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </svg>
      )}

      {/* Coordinate labels */}
      <div className="pointer-events-none absolute inset-0">
        {SQUARES.filter(({ i }) => i % 8 === 0).map(({ i }) => {
          const displayRank = Math.floor(i / 8);
          const file = 0;
          const actualSq = (7 - displayRank) * 8 + file;
          return (
            <span
              key={i}
              className={
                "absolute text-[9px] font-medium tracking-wide sm:text-[11px] " +
                (displayRank % 2 === 0 ? "text-[#3a322a]/70" : "text-[#e7ddc9]/70")
              }
              style={{ left: "2px", top: `calc(${displayRank * 12.5}% + 2px)` }}
            >
              {rankNumber(actualSq)}
            </span>
          );
        })}
        {SQUARES.filter(({ i }) => Math.floor(i / 8) === 7).map(({ i }) => {
          const file = i % 8;
          const displayRank = 7;
          const actualSq = (7 - displayRank) * 8 + file;
          return (
            <span
              key={i}
              className={
                "absolute text-[9px] font-medium tracking-wide sm:text-[11px] " +
                (displayRank % 2 === 1 ? "text-[#3a322a]/70" : "text-[#e7ddc9]/70")
              }
              style={{
                right: `${(7 - file) * 12.5 + 0.4}%`,
                bottom: "2px",
              }}
            >
              {fileLetter(actualSq)}
            </span>
          );
        })}
      </div>

      {/* Pieces */}
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {pieces.map((p) => {
            const file = p.square % 8;
            const rank = Math.floor(p.square / 8);
            const displayRank = 7 - rank;
            const left = file * 12.5;
            const top = displayRank * 12.5;
            return (
              <motion.div
                key={p.id}
                className="absolute flex items-center justify-center"
                style={{ width: "12.5%", height: "12.5%" }}
                initial={{ left: `${left}%`, top: `${top}%`, scale: 0.6, opacity: 0 }}
                animate={{ left: `${left}%`, top: `${top}%`, scale: 1, opacity: 1 }}
                exit={{ scale: 1.7, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 26,
                  opacity: { duration: 0.12 },
                }}
              >
                <span
                  className={
                    "text-[clamp(20px,7.2vw,68px)] leading-none " +
                    (p.color === "w" ? "text-[#f7f1e3]" : "text-[#16140f]")
                  }
                  style={{
                    textShadow:
                      p.color === "w"
                        ? "0 1px 2px rgba(0,0,0,0.55), 0 0 3px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.4)"
                        : "0 1px 2px rgba(255,255,255,0.18), 0 0 3px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {GLYPH[p.type]}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}