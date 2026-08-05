import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import ChessBoard from "@/components/ChessBoard";
import GameControls from "@/components/GameControls";
import MoveHistory from "@/components/MoveHistory";
import { createGameState, makeMove, getGameStatus, findKing, inCheck, moveToSAN } from "@/lib/chessEngine";
import { chooseMove } from "@/lib/chessBot";

let pieceIdCounter = 1;

function buildPiecesFromState(state) {
  const pieces = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (p) pieces.push({ id: pieceIdCounter++, type: p.type, color: p.color, square: sq });
  }
  return pieces;
}

function applyMoveToPieces(pieces, move, movedColor) {
  const moving = pieces.find((p) => p.square === move.from);
  if (!moving) return pieces;
  let next = pieces.filter((p) => p.square !== move.to);
  if (move.enPassant) {
    const capSq = movedColor === "w" ? move.to - 8 : move.to + 8;
    next = next.filter((p) => p.square !== capSq);
  }
  next = next.map((p) =>
    p.id === moving.id ? { ...p, square: move.to, type: move.promotion || p.type } : p
  );
  if (move.castling) {
    const tr = Math.floor(move.to / 8);
    const tf = move.to % 8;
    if (tf === 6) {
      const from = tr * 8 + 7;
      const to = tr * 8 + 5;
      next = next.map((p) => (p.square === from ? { ...p, square: to } : p));
    } else {
      const from = tr * 8 + 0;
      const to = tr * 8 + 3;
      next = next.map((p) => (p.square === from ? { ...p, square: to } : p));
    }
  }
  return next;
}

function resetGame(stateRef, setPieces, setMoveCount, setStatus, setLastMove, setHistory) {
  const fresh = createGameState();
  stateRef.current = fresh;
  setPieces(buildPiecesFromState(fresh));
  setMoveCount(0);
  setStatus({ over: false, result: null });
  setLastMove(null);
  setHistory([]);
}

export default function Home() {
  const [mode, setMode] = useState("fixed");
  const [paused, setPaused] = useState(false);
  const [theater, setTheater] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [status, setStatus] = useState({ over: false, result: null });
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState([]);
  const stateRef = useRef(createGameState());

  useEffect(() => {
    const fresh = createGameState();
    stateRef.current = fresh;
    setPieces(buildPiecesFromState(fresh));
  }, []);

  // F3 theater toggle (global)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "F3") {
        e.preventDefault();
        setTheater((t) => !t);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const switchMode = useCallback(
    (m) => {
      setMode(m);
      setPaused(false);
      resetGame(stateRef, setPieces, setMoveCount, setStatus, setLastMove, setHistory);
    },
    []
  );

  const handleReset = useCallback(() => {
    setPaused(false);
    resetGame(stateRef, setPieces, setMoveCount, setStatus, setLastMove, setHistory);
  }, []);

  // Main move loop
  useEffect(() => {
    if (paused) return;
    if (status.over && mode === "fixed") return;

    const delay = mode === "fixed" ? 620 : 460;
    const timer = setTimeout(() => {
      const state = stateRef.current;
      const color = state.turn;

      const cfg =
        mode === "fixed"
          ? { depth: 3, randomness: 6 }
          : { depth: 2, randomness: 28 };

      const move = chooseMove(state, color, cfg);
      if (!move) return;

      const san = moveToSAN(state, move);
      makeMove(state, move);
      const movedColor = color;
      setLastMove(move);
      setPieces((prev) => applyMoveToPieces(prev, move, movedColor));
      setMoveCount((c) => c + 1);
      setHistory((h) => {
        const next = [...h, { san, color }];
        return next.length > 1000 ? next.slice(next.length - 1000) : next;
      });

      const st = getGameStatus(state);
      if (st.over) {
        if (mode === "endless") {
          // silently begin a new game to keep the duel perpetual
          setTimeout(() => {
            resetGame(stateRef, setPieces, setMoveCount, setStatus, setLastMove, setHistory);
          }, 1400);
        } else {
          setStatus(st);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [paused, status.over, mode, moveCount, theater]);

  const checkSquare =
    status.over && status.result !== "draw"
      ? findKing(
          stateRef.current.board,
          status.result === "white_wins" ? "b" : "w"
        )
      : inCheck(stateRef.current.board, stateRef.current.turn)
      ? findKing(stateRef.current.board, stateRef.current.turn)
      : null;

  const resultLabel =
    status.result === "white_wins"
      ? "White prevails"
      : status.result === "black_wins"
      ? "Black prevails"
      : status.result === "draw"
      ? "Draw"
      : null;

  const handleExportCSV = () => {
    const rows = [];
    for (let i = 0; i < history.length; i += 2) {
      rows.push({
        no: i / 2 + 1,
        white: history[i] ? history[i].san : "",
        black: history[i + 1] ? history[i + 1].san : "",
      });
    }
    const csv = [
      "Move,White,Black",
      ...rows.map((r) => `${r.no},${r.white},${r.black}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `endless-chess-${mode}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#08070a] text-white">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,169,106,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,18,24,0.9),#08070a_60%)]" />
      </div>

      <AnimatePresence>
        {!theater && (
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center pt-8 sm:pt-10"
          >
            <h1 className="font-display text-2xl sm:text-3xl font-light tracking-[0.35em] text-white/90 uppercase">
              Endless Chess
            </h1>
            <p className="mt-2 text-[10px] sm:text-[11px] tracking-[0.4em] text-white/35 uppercase">
              {mode === "fixed" ? "A finite duel" : "A perpetual struggle"}
            </p>
            <Link
              to="/about"
              className="mt-4 text-[10px] tracking-[0.3em] text-white/30 uppercase transition-colors hover:text-[#c9a96a]"
            >
              About
            </Link>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Board */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-[1100px] flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
          <div className="flex w-full max-w-[min(92vw,82vh)] flex-col items-center gap-6">
            <div className="w-full">
              <ChessBoard pieces={pieces} lastMove={lastMove} checkSquare={checkSquare} moveKey={moveCount} />
            </div>

          <AnimatePresence>
            {!theater && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full"
              >
                <GameControls
                  mode={mode}
                  onModeChange={switchMode}
                  paused={paused}
                  onTogglePause={() => setPaused((p) => !p)}
                  onReset={handleReset}
                  theater={theater}
                  onToggleTheater={() => setTheater((t) => !t)}
                  moveCount={moveCount}
                  status={status}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <AnimatePresence>
            {!theater && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full lg:w-72"
              >
                <MoveHistory history={history} mode={mode} onExport={handleExportCSV} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Result overlay (fixed mode) */}
      <AnimatePresence>
        {status.over && mode === "fixed" && resultLabel && !theater && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-5 px-8"
            >
              <p className="text-[10px] tracking-[0.5em] text-[#c9a96a] uppercase">
                Match concluded
              </p>
              <p className="font-display text-4xl sm:text-5xl font-light tracking-[0.2em] text-white uppercase">
                {resultLabel}
              </p>
              <button
                onClick={handleReset}
                className="mt-2 rounded-full bg-[#c9a96a] px-7 py-2.5 text-xs font-medium tracking-[0.25em] uppercase text-black transition hover:brightness-110"
              >
                Play again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theater exit hint */}
      <AnimatePresence>
        {theater && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 2 }}
            className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-[10px] tracking-[0.4em] text-white/20 uppercase"
          >
            Press F3 to return
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}