/**
 * Devtools easter egg — ASCII CRT + a note for the kind of visitor who
 * opens the console, plus a global `hire()`. Strings live here (pure,
 * unit-tested); the one-time side effect is `printConsoleEgg`, called from
 * the home route on mount.
 */

export const CONSOLE_ART = String.raw`
   ┌─────────────────────────┐
   │  ┌───────────────────┐  │
   │  │ $ whoami          │  │
   │  │ > sean urgel      │  │
   │  │ $ █               │  │
   │  └───────────────────┘  │
   │   ═══════════════   ●   │
   └────────┬───┬────────────┘
       ┌────┴───┴────┐
       └─────────────┘
        OBJECT_02 — CRT`;

export const CONSOLE_GREETING =
  "you opened the console. obviously we should talk.\n" +
  "type hire() — or just email sean@casperstudios.xyz";

export const HIRE_MESSAGE =
  "PERMISSION GRANTED ✓\n" +
  "→ sean@casperstudios.xyz\n" +
  "subject idea: 'saw the CRT, let's build'";

/** Console-ish shape so tests can pass a recorder instead of the real one. */
interface ConsoleLike {
  log: (...args: unknown[]) => void;
}

/**
 * Print the egg and register `window.hire`. Guarded so HMR/StrictMode
 * double-mounts don't spam the console.
 */
export function printConsoleEgg(
  con: ConsoleLike,
  target: Record<string, unknown>
): void {
  if (target.__crtEggPrinted) return;
  target.__crtEggPrinted = true;
  con.log(
    `%c${CONSOLE_ART}\n\n%c${CONSOLE_GREETING}`,
    "color:#39ff14;font-family:monospace;",
    "color:#b4b4b4;font-family:monospace;"
  );
  target.hire = () => {
    con.log(`%c${HIRE_MESSAGE}`, "color:#39ff14;font-family:monospace;");
    return "sean@casperstudios.xyz";
  };
}
