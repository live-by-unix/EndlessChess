import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Github } from "lucide-react";

export default function About() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#08070a] text-white">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,169,106,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,18,24,0.9),#08070a_60%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16"
      >
        <p className="text-[10px] tracking-[0.5em] text-[#c9a96a] uppercase">
          About
        </p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-light tracking-[0.15em] text-white uppercase">
          Endless Chess
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/55">
          A digital art installation disguised as a game. Two autonomous bots
          play a standard chess match — either to a decisive conclusion in
          <span className="text-white/80"> Fixed </span> mode, or locked in a
          perpetual, unresolving struggle in
          <span className="text-white/80"> Endless </span> mode. The spectator's
          role is central: watching intelligence held in infinite tension.
        </p>

        <div className="mt-10 space-y-4">
          <div className="flex flex-col gap-1 border-t border-white/10 pt-5">
            <span className="text-[10px] tracking-[0.3em] text-white/35 uppercase">
              Author
            </span>
            <span className="font-mono text-base text-white/85">live-by-unix</span>
          </div>

          <div className="flex flex-col gap-1 border-t border-white/10 pt-5">
            <span className="text-[10px] tracking-[0.3em] text-white/35 uppercase">
              Source
            </span>
            <a
              href="https://github.com/live-by-unix/endless-chess"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-2 font-mono text-sm text-white/70 transition-colors hover:text-[#c9a96a]"
            >
              <Github size={16} />
              github.com/live-by-unix/endless-chess
            </a>
          </div>
        </div>

        <Link
          to="/"
          className="mt-12 inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-[10px] tracking-[0.3em] text-white/70 uppercase ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Return to the board
        </Link>
      </motion.main>
    </div>
  );
}