/**
 * Interactive terminal for the CRT — the visitor can just start typing on
 * the home page and the tube answers. Pure state machine: keystrokes go
 * through `terminalKey`, commands through `runCommand`. Rendering, focus
 * rules, and mode switching live in `hero-scene.client.tsx`.
 *
 * Screen budget: ~34 chars per row at the tube's font — keep every output
 * line inside that.
 */

export const TERMINAL_PROMPT = "guest@sean:~$ ";
/** Prompt is 14 chars — this keeps the input on one screen row. */
export const MAX_INPUT_CHARS = 19;

export interface TerminalState {
  /** Scrollback (rendering clamps to the visible rows). */
  lines: string[];
  /** Current input buffer (without the prompt). */
  input: string;
}

/** Modes a command can switch the screen into. */
export type TerminalModeSwitch = "matrix" | "pong" | "starfield" | "exit";

export interface CommandResult {
  output: string[];
  modeSwitch?: TerminalModeSwitch;
  clear?: boolean;
}

export interface KeyResult {
  state: TerminalState;
  modeSwitch?: TerminalModeSwitch;
}

export function initTerminal(): TerminalState {
  return {
    lines: [
      "URGEL-OS v3.0 — guest session",
      "type 'help' for commands",
      "",
    ],
    input: "",
  };
}

const HELP: string[] = [
  "  help          this list",
  "  whoami        who are you",
  "  ls            look around",
  "  cat <file>    read a file",
  "  contact       reach sean",
  "  matrix        follow the rabbit",
  "  pong          1972 forever",
  "  starfield     punch it",
  "  clear         wipe screen",
  "  exit          back to the demo",
];

/** Execute a full command line. Exported for direct unit testing. */
export function runCommand(raw: string): CommandResult {
  const cmd = raw.trim().replace(/\s+/g, " ");
  const lower = cmd.toLowerCase();

  if (cmd === "") return { output: [] };

  switch (lower) {
    case "help":
      return { output: HELP };
    case "whoami":
      return {
        output: ["guest — but this machine belongs", "to sean urgel. try 'contact'."],
      };
    case "ls":
      return { output: ["projects/ marketplace/ secrets.txt"] };
    case "cat secrets.txt":
      return {
        output: [
          "you actually looked. respect.",
          "mention 'phosphor' when you",
          "email — sean will know.",
        ],
      };
    case "contact":
      return {
        output: ["sean@casperstudios.xyz", "calgary, canada — open to select", "projects"],
      };
    case "sudo hire sean":
      return {
        output: [
          "PERMISSION GRANTED ✓",
          "excellent decision.",
          "→ sean@casperstudios.xyz",
        ],
      };
    case "hire":
    case "hire sean":
      return { output: ["hire: try 'sudo hire sean'"] };
    case "matrix":
      return { output: ["follow the white rabbit…"], modeSwitch: "matrix" };
    case "pong":
      return { output: ["deploying paddles…"], modeSwitch: "pong" };
    case "starfield":
      return { output: ["punch it."], modeSwitch: "starfield" };
    case "clear":
      return { output: [], clear: true };
    case "exit":
      return { output: ["bye."], modeSwitch: "exit" };
    default:
      break;
  }

  if (lower.startsWith("sudo "))
    return { output: ["guest is not in the sudoers file.", "this incident will be reported."] };
  if (lower.startsWith("cat "))
    return { output: [`cat: ${cmd.slice(4)}: permission denied`] };
  if (lower === "cat") return { output: ["cat: which file? try 'ls'"] };
  return { output: [`${cmd.split(" ")[0]}: command not found (help?)`] };
}

/**
 * Feed one keyboard key into the terminal. Accepts printable single chars,
 * "Enter" and "Backspace"; everything else is ignored. Enter echoes the
 * prompt line, runs the command, and appends its output.
 */
export function terminalKey(state: TerminalState, key: string): KeyResult {
  if (key === "Backspace") {
    return { state: { ...state, input: state.input.slice(0, -1) } };
  }
  if (key === "Enter") {
    const echoed = [...state.lines, TERMINAL_PROMPT + state.input];
    const result = runCommand(state.input);
    const lines = result.clear ? [] : [...echoed, ...result.output];
    return {
      state: { lines, input: "" },
      modeSwitch: result.modeSwitch,
    };
  }
  if (key.length === 1 && key >= " " && key <= "~") {
    if (state.input.length >= MAX_INPUT_CHARS) return { state };
    return { state: { ...state, input: state.input + key } };
  }
  return { state };
}
