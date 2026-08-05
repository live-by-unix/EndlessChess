// Bot AI: negamax with alpha-beta pruning + piece-square evaluation + light randomness.
import {
  PIECE_VALUE, generateLegalMoves, makeMove, unmakeMove, inCheck
} from './chessEngine';

// Piece-square tables (white's perspective, index 0 = a1 .. 63 = h8).
const PST = {
  p: [
    0,0,0,0,0,0,0,0,
    5,10,10,-20,-20,10,10,5,
    5,-5,-10,0,0,-10,-5,5,
    0,0,0,20,20,0,0,0,
    5,5,10,25,25,10,5,5,
    10,10,20,30,30,20,10,10,
    50,50,50,50,50,50,50,50,
    0,0,0,0,0,0,0,0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,0,5,5,0,-20,-40,
    -30,5,10,15,15,10,5,-30,
    -30,0,15,20,20,15,0,-30,
    -30,5,15,20,20,15,5,-30,
    -30,0,10,15,15,10,0,-30,
    -40,-20,0,0,0,0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,5,0,0,0,0,5,-10,
    -10,10,10,10,10,10,10,-10,
    -10,0,10,10,10,10,0,-10,
    -10,5,5,10,10,5,5,-10,
    -10,0,5,10,10,5,0,-10,
    -10,0,0,0,0,0,0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
    0,0,0,5,5,0,0,0,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    5,10,10,10,10,10,10,5,
    0,0,0,0,0,0,0,0,
  ],
  q: [
    -20,-10,-10,-5,-5,-10,-10,-20,
    -10,0,5,0,0,0,0,-10,
    -10,5,5,5,5,5,0,-10,
    0,0,5,5,5,5,0,-5,
    -5,0,5,5,5,5,0,-5,
    -10,0,5,5,5,5,0,-10,
    -10,5,0,0,0,0,5,-10,
    -20,-10,-10,-5,-5,-10,-10,-20,
  ],
  k: [
    20,30,10,0,0,10,30,20,
    20,20,0,0,0,0,20,20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
  ],
};

const MATE = 1000000;

function evaluate(state) {
  // White-positive material + positional score.
  let score = 0;
  const { board } = state;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p) continue;
    const sign = p.color === 'w' ? 1 : -1;
    const mirror = p.color === 'w' ? sq : (sq ^ 56);
    const pst = PST[p.type] ? PST[p.type][mirror] : 0;
    score += sign * (PIECE_VALUE[p.type] + pst);
  }
  return score;
}

function negamax(state, depth, alpha, beta, color) {
  if (depth === 0) {
    return color === 'w' ? evaluate(state) : -evaluate(state);
  }
  const moves = generateLegalMoves(state, color);
  if (moves.length === 0) {
    if (inCheck(state.board, color)) return -MATE - depth;
    return 0;
  }
  let best = -Infinity;
  for (const m of moves) {
    const undo = makeMove(state, m);
    const score = -negamax(state, depth - 1, -beta, -alpha, color === 'w' ? 'b' : 'w');
    unmakeMove(state, m, undo);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function chooseMove(state, color, { depth = 2, randomness = 10 } = {}) {
  const moves = generateLegalMoves(state, color);
  if (moves.length === 0) return null;
  shuffle(moves);
  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const undo = makeMove(state, m);
    let score = -negamax(state, depth - 1, -Infinity, Infinity, color === 'w' ? 'b' : 'w');
    unmakeMove(state, m, undo);
    score += (Math.random() - 0.5) * randomness;
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove;
}