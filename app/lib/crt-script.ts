/**
 * Pure typing state machine for the CRT terminal screen texture
 * (`hero-scene.client.tsx`). Kept free of three.js/canvas so it stays
 * unit-testable in plain Vitest — see `__tests__/crt-script.test.ts`.
 */

/** The looping phosphor script — a real agentic session, compressed. */
export const CRT_SCRIPT: readonly string[] = [
  "$ claude 'ship the feature'",
  "> Read(.brain/recipes/add-feature.md)",
  "> Edit(app/routes/projects.tsx)",
  "> Bash(bun run test)",
  "  273 passed (273)",
  "> Agent(feature-verifier) ... PASS",
  "$ git push",
  "  deployed to cloudflare workers",
  "$ █",
];

export interface TypeState {
  /** Index of the line currently being typed. */
  line: number;
  /** Number of characters of that line already visible. */
  char: number;
}

export const INITIAL_TYPE_STATE: TypeState = { line: 0, char: 0 };

/** True once every line of `script` is fully typed. */
export function isComplete(
  state: TypeState,
  script: readonly string[] = CRT_SCRIPT
): boolean {
  return state.line >= script.length;
}

/**
 * Advance the state by `chars` typed characters, flowing across line
 * boundaries. Completed states stay put (caller decides when to restart).
 * Negative/zero `chars` is a no-op.
 */
export function advanceType(
  state: TypeState,
  chars: number,
  script: readonly string[] = CRT_SCRIPT
): TypeState {
  let { line, char } = state;
  let budget = Math.max(0, Math.floor(chars));
  while (budget > 0 && line < script.length) {
    const remaining = script[line].length - char;
    if (budget >= remaining) {
      budget -= remaining;
      line += 1;
      char = 0;
    } else {
      char += budget;
      budget = 0;
    }
  }
  return { line, char };
}

/**
 * The lines currently visible on screen: all fully-typed lines plus the
 * partial current one, clamped to the last `maxRows` rows (terminal scroll).
 */
export function visibleLines(
  state: TypeState,
  maxRows: number,
  script: readonly string[] = CRT_SCRIPT
): string[] {
  const done = script.slice(0, Math.min(state.line, script.length));
  const rows = [...done];
  if (state.line < script.length && state.char > 0) {
    rows.push(script[state.line].slice(0, state.char));
  }
  return rows.slice(Math.max(0, rows.length - maxRows));
}
