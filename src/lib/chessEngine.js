// Minimal chess engine: board, move generation, legality, game-over detection.
// Square index 0 = a1, 7 = h1, 56 = a8, 63 = h8 (rank * 8 + file).

export const PIECE_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const KNIGHT_DELTAS = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
const KING_DELTAS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const ROOK_DELTAS = [[1,0],[-1,0],[0,1],[0,-1]];
const BISHOP_DELTAS = [[1,1],[1,-1],[-1,1],[-1,-1]];
const QUEEN_DELTAS = [...ROOK_DELTAS, ...BISHOP_DELTAS];

const rankOf = (sq) => Math.floor(sq / 8);
const fileOf = (sq) => sq % 8;
const onBoard = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
const toSq = (r, f) => r * 8 + f;

export const fileLetter = (sq) => String.fromCharCode(97 + (sq % 8));
export const rankNumber = (sq) => Math.floor(sq / 8) + 1;
export const squareName = (sq) => fileLetter(sq) + rankNumber(sq);

export function createInitialBoard() {
  const board = new Array(64).fill(null);
  const back = ['r','n','b','q','k','b','n','r'];
  for (let i = 0; i < 8; i++) {
    board[i] = { type: back[i], color: 'w' };
    board[8 + i] = { type: 'p', color: 'w' };
    board[48 + i] = { type: 'p', color: 'b' };
    board[56 + i] = { type: back[i], color: 'b' };
  }
  return board;
}

export function createGameState() {
  const board = createInitialBoard();
  return {
    board,
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    halfmove: 0,
  };
}

export function findKing(board, color) {
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p && p.type === 'k' && p.color === color) return sq;
  }
  return -1;
}

export function isSquareAttacked(board, sq, byColor) {
  const tr = rankOf(sq), tf = fileOf(sq);
  // Pawn attacks: a pawn of byColor attacks diagonally forward.
  const pr = byColor === 'w' ? tr - 1 : tr + 1;
  for (const df of [-1, 1]) {
    const f = tf + df;
    if (onBoard(pr, f)) {
      const p = board[toSq(pr, f)];
      if (p && p.color === byColor && p.type === 'p') return true;
    }
  }
  for (const [dr, df] of KNIGHT_DELTAS) {
    const r = tr + dr, f = tf + df;
    if (onBoard(r, f)) {
      const p = board[toSq(r, f)];
      if (p && p.color === byColor && p.type === 'n') return true;
    }
  }
  for (const [dr, df] of KING_DELTAS) {
    const r = tr + dr, f = tf + df;
    if (onBoard(r, f)) {
      const p = board[toSq(r, f)];
      if (p && p.color === byColor && p.type === 'k') return true;
    }
  }
  for (const [dr, df] of BISHOP_DELTAS) {
    let r = tr + dr, f = tf + df;
    while (onBoard(r, f)) {
      const p = board[toSq(r, f)];
      if (p) { if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true; break; }
      r += dr; f += df;
    }
  }
  for (const [dr, df] of ROOK_DELTAS) {
    let r = tr + dr, f = tf + df;
    while (onBoard(r, f)) {
      const p = board[toSq(r, f)];
      if (p) { if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true; break; }
      r += dr; f += df;
    }
  }
  return false;
}

export function inCheck(board, color) {
  const k = findKing(board, color);
  if (k < 0) return false;
  return isSquareAttacked(board, k, color === 'w' ? 'b' : 'w');
}

export function generatePseudoMoves(state, color) {
  const moves = [];
  const { board } = state;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p || p.color !== color) continue;
    const r = rankOf(sq), f = fileOf(sq);
    if (p.type === 'p') {
      const dir = color === 'w' ? 1 : -1;
      const startRank = color === 'w' ? 1 : 6;
      const promoRank = color === 'w' ? 7 : 0;
      const r1 = r + dir;
      if (onBoard(r1, f) && !board[toSq(r1, f)]) {
        if (r1 === promoRank) moves.push({ from: sq, to: toSq(r1, f), promotion: 'q' });
        else moves.push({ from: sq, to: toSq(r1, f) });
        if (r === startRank) {
          const r2 = r + 2 * dir;
          if (!board[toSq(r2, f)]) moves.push({ from: sq, to: toSq(r2, f), double: true });
        }
      }
      for (const df of [-1, 1]) {
        const f1 = f + df;
        if (!onBoard(r1, f1)) continue;
        const t = toSq(r1, f1);
        if (board[t] && board[t].color !== color) {
          if (r1 === promoRank) moves.push({ from: sq, to: t, promotion: 'q' });
          else moves.push({ from: sq, to: t });
        } else if (state.enPassant === t) {
          moves.push({ from: sq, to: t, enPassant: true });
        }
      }
    } else if (p.type === 'n') {
      for (const [dr, df] of KNIGHT_DELTAS) {
        const r1 = r + dr, f1 = f + df;
        if (!onBoard(r1, f1)) continue;
        const t = toSq(r1, f1);
        if (!board[t] || board[t].color !== color) moves.push({ from: sq, to: t });
      }
    } else if (p.type === 'k') {
      for (const [dr, df] of KING_DELTAS) {
        const r1 = r + dr, f1 = f + df;
        if (!onBoard(r1, f1)) continue;
        const t = toSq(r1, f1);
        if (!board[t] || board[t].color !== color) moves.push({ from: sq, to: t });
      }
      const rank = color === 'w' ? 0 : 7;
      const opp = color === 'w' ? 'b' : 'w';
      if (r === rank && f === 4) {
        const kingside = color === 'w' ? state.castling.wK : state.castling.bK;
        const queenside = color === 'w' ? state.castling.wQ : state.castling.bQ;
        if (kingside && !board[toSq(rank,5)] && !board[toSq(rank,6)] &&
            board[toSq(rank,7)] && board[toSq(rank,7)].type === 'r' &&
            board[toSq(rank,7)].color === color &&
            !isSquareAttacked(board, toSq(rank,4), opp) &&
            !isSquareAttacked(board, toSq(rank,5), opp) &&
            !isSquareAttacked(board, toSq(rank,6), opp)) {
          moves.push({ from: sq, to: toSq(rank,6), castling: true });
        }
        if (queenside && !board[toSq(rank,1)] && !board[toSq(rank,2)] && !board[toSq(rank,3)] &&
            board[toSq(rank,0)] && board[toSq(rank,0)].type === 'r' &&
            board[toSq(rank,0)].color === color &&
            !isSquareAttacked(board, toSq(rank,4), opp) &&
            !isSquareAttacked(board, toSq(rank,3), opp) &&
            !isSquareAttacked(board, toSq(rank,2), opp)) {
          moves.push({ from: sq, to: toSq(rank,2), castling: true });
        }
      }
    } else {
      const deltas = p.type === 'r' ? ROOK_DELTAS : p.type === 'b' ? BISHOP_DELTAS : QUEEN_DELTAS;
      for (const [dr, df] of deltas) {
        let r1 = r + dr, f1 = f + df;
        while (onBoard(r1, f1)) {
          const t = toSq(r1, f1);
          if (!board[t]) moves.push({ from: sq, to: t });
          else { if (board[t].color !== color) moves.push({ from: sq, to: t }); break; }
          r1 += dr; f1 += df;
        }
      }
    }
  }
  return moves;
}

export function makeMove(state, move) {
  const undo = {
    castling: { ...state.castling },
    enPassant: state.enPassant,
    halfmove: state.halfmove,
    turn: state.turn,
    capturedPiece: null,
    capturedSq: null,
  };
  const board = state.board;
  const piece = board[move.from];
  undo.capturedPiece = board[move.to];
  undo.capturedSq = move.to;

  board[move.to] = piece;
  board[move.from] = null;

  if (move.enPassant) {
    const capSq = piece.color === 'w' ? move.to - 8 : move.to + 8;
    undo.capturedPiece = board[capSq];
    undo.capturedSq = capSq;
    board[capSq] = null;
  }
  if (move.promotion) {
    board[move.to] = { type: move.promotion, color: piece.color };
  }
  if (move.castling) {
    const tr = rankOf(move.to);
    if (fileOf(move.to) === 6) {
      board[toSq(tr, 5)] = board[toSq(tr, 7)];
      board[toSq(tr, 7)] = null;
    } else {
      board[toSq(tr, 3)] = board[toSq(tr, 0)];
      board[toSq(tr, 0)] = null;
    }
  }
  // Castling rights
  if (piece.type === 'k') {
    if (piece.color === 'w') { state.castling.wK = false; state.castling.wQ = false; }
    else { state.castling.bK = false; state.castling.bQ = false; }
  }
  if (piece.type === 'r') {
    if (move.from === 0) state.castling.wQ = false;
    if (move.from === 7) state.castling.wK = false;
    if (move.from === 56) state.castling.bQ = false;
    if (move.from === 63) state.castling.bK = false;
  }
  if (undo.capturedSq === 0) state.castling.wQ = false;
  if (undo.capturedSq === 7) state.castling.wK = false;
  if (undo.capturedSq === 56) state.castling.bQ = false;
  if (undo.capturedSq === 63) state.castling.bK = false;

  state.enPassant = move.double ? (move.from + move.to) / 2 : null;
  state.halfmove = (piece.type === 'p' || undo.capturedPiece) ? 0 : state.halfmove + 1;
  state.turn = state.turn === 'w' ? 'b' : 'w';
  return undo;
}

export function unmakeMove(state, move, undo) {
  const board = state.board;
  const piece = board[move.from]; // wrong, source is empty now
  // restore moving piece to origin
  const movedPiece = board[move.to];
  if (move.promotion) {
    board[move.from] = { type: 'p', color: movedPiece.color };
  } else {
    board[move.from] = movedPiece;
  }
  board[move.to] = null;
  if (move.enPassant) {
    const capSq = undo.capturedSq;
    board[capSq] = undo.capturedPiece;
    board[move.to] = null;
  } else if (undo.capturedPiece) {
    board[undo.capturedSq] = undo.capturedPiece;
  }
  if (move.castling) {
    const tr = rankOf(move.to);
    if (fileOf(move.to) === 6) {
      board[toSq(tr, 7)] = board[toSq(tr, 5)];
      board[toSq(tr, 5)] = null;
    } else {
      board[toSq(tr, 0)] = board[toSq(tr, 3)];
      board[toSq(tr, 3)] = null;
    }
  }
  state.castling = undo.castling;
  state.enPassant = undo.enPassant;
  state.halfmove = undo.halfmove;
  state.turn = undo.turn;
}

export function generateLegalMoves(state, color) {
  const pseudo = generatePseudoMoves(state, color);
  const legal = [];
  for (const move of pseudo) {
    const undo = makeMove(state, move);
    if (!inCheck(state.board, color)) legal.push(move);
    unmakeMove(state, move, undo);
  }
  return legal;
}

function isInsufficientMaterial(board) {
  const nonKings = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p && p.type !== 'k') nonKings.push({ p, sq });
  }
  if (nonKings.length === 0) return true;
  if (nonKings.length === 1 && (nonKings[0].p.type === 'n' || nonKings[0].p.type === 'b')) return true;
  if (nonKings.length === 2 && nonKings.every(n => n.p.type === 'b')) {
    const c1 = Math.floor(nonKings[0].sq / 8) + (nonKings[0].sq % 8);
    const c2 = Math.floor(nonKings[1].sq / 8) + (nonKings[1].sq % 8);
    if ((c1 % 2) === (c2 % 2)) return true;
  }
  return false;
}

export function getGameStatus(state) {
  const moves = generateLegalMoves(state, state.turn);
  if (moves.length === 0) {
    if (inCheck(state.board, state.turn)) {
      return { over: true, result: state.turn === 'w' ? 'black_wins' : 'white_wins' };
    }
    return { over: true, result: 'draw' };
  }
  if (state.halfmove >= 100) return { over: true, result: 'draw' };
  if (isInsufficientMaterial(state.board)) return { over: true, result: 'draw' };
  return { over: false, moves };
}

// Standard algebraic notation for a move, given the pre-move state.
export function moveToSAN(state, move) {
  const board = state.board;
  const piece = board[move.from];
  const dest = squareName(move.to);
  let san = '';

  if (move.castling) {
    san = fileOf(move.to) === 6 ? 'O-O' : 'O-O-O';
  } else if (piece.type === 'p') {
    const isCapture = !!board[move.to] || move.enPassant;
    if (isCapture) san = fileLetter(move.from) + 'x' + dest;
    else san = dest;
    if (move.promotion) san += '=' + move.promotion.toUpperCase();
  } else {
    san = piece.type.toUpperCase();
    const legal = generateLegalMoves(state, piece.color);
    const others = [];
    for (const m of legal) {
      if (m.to === move.to && m.from !== move.from) {
        const o = board[m.from];
        if (o && o.type === piece.type) others.push(m.from);
      }
    }
    if (others.length > 0) {
      const sameFile = others.some((s) => fileOf(s) === fileOf(move.from));
      const sameRank = others.some((s) => rankOf(s) === rankOf(move.from));
      if (!sameFile) san += fileLetter(move.from);
      else if (!sameRank) san += rankNumber(move.from);
      else san += squareName(move.from);
    }
    if (board[move.to]) san += 'x';
    san += dest;
  }

  // check / checkmate suffix
  const undo = makeMove(state, move);
  const opp = state.turn;
  if (inCheck(state.board, opp)) {
    const oppMoves = generateLegalMoves(state, opp);
    san += oppMoves.length === 0 ? '#' : '+';
  }
  unmakeMove(state, move, undo);
  return san;
}