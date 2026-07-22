/**
 * Matrix-rain state machine for the CRT screen. Pure and deterministic —
 * callers inject `rng` (tests pass a stub) and glyphs come from an integer
 * hash so a redraw at the same tick renders the same rain.
 */

export interface MatrixColumn {
  /** Row position of the stream head (fractional — advances smoothly). */
  y: number;
  /** Rows per second. */
  speed: number;
  /** Visible trail length in rows. */
  len: number;
}

export interface MatrixState {
  cols: MatrixColumn[];
  rows: number;
}

const MIN_SPEED = 4;
const MAX_SPEED = 14;
const MIN_LEN = 4;
const MAX_LEN = 12;

/** Half-width katakana + digits — the classic rain charset. */
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789Z:・.=*+-<>";

function spawn(rows: number, rng: () => number, aboveScreen: boolean): MatrixColumn {
  return {
    // New streams start above the screen so they "fall in".
    y: aboveScreen ? -rng() * rows : rng() * rows,
    speed: MIN_SPEED + rng() * (MAX_SPEED - MIN_SPEED),
    len: MIN_LEN + Math.floor(rng() * (MAX_LEN - MIN_LEN + 1)),
  };
}

export function initMatrix(
  colCount: number,
  rows: number,
  rng: () => number
): MatrixState {
  return {
    rows,
    cols: Array.from({ length: colCount }, () => spawn(rows, rng, false)),
  };
}

/** Advance every stream; streams whose tail left the screen respawn on top. */
export function stepMatrix(
  state: MatrixState,
  dt: number,
  rng: () => number
): MatrixState {
  const cols = state.cols.map((c) => {
    const y = c.y + c.speed * dt;
    if (y - c.len > state.rows) return spawn(state.rows, rng, true);
    return { ...c, y };
  });
  return { ...state, cols };
}

/**
 * Deterministic glyph for a cell. `tick` (coarse time step) mutates glyphs
 * in place so the rain shimmers without any per-cell state.
 */
export function matrixGlyph(col: number, row: number, tick: number): string {
  let h = (col * 73856093) ^ (row * 19349663) ^ (tick * 83492791);
  h = (h ^ (h >>> 13)) >>> 0;
  return GLYPHS[h % GLYPHS.length];
}
