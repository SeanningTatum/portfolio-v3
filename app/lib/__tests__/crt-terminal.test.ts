import { describe, it, expect } from "vitest";
import {
  MAX_INPUT_CHARS,
  TERMINAL_PROMPT,
  initTerminal,
  runCommand,
  terminalKey,
  type TerminalState,
} from "../crt-terminal";

const empty: TerminalState = { lines: [], input: "" };

describe("terminalKey", () => {
  it("appends printable characters", () => {
    const { state } = terminalKey(empty, "h");
    expect(state.input).toBe("h");
  });

  it("backspace removes the last character", () => {
    const { state } = terminalKey({ ...empty, input: "help" }, "Backspace");
    expect(state.input).toBe("hel");
  });

  it("ignores non-printable keys", () => {
    expect(terminalKey(empty, "ArrowLeft").state.input).toBe("");
    expect(terminalKey(empty, "Shift").state.input).toBe("");
  });

  it("caps the input length", () => {
    let s = empty;
    for (let i = 0; i < MAX_INPUT_CHARS + 10; i++) {
      s = terminalKey(s, "x").state;
    }
    expect(s.input).toHaveLength(MAX_INPUT_CHARS);
  });

  it("enter echoes the prompt line and appends output", () => {
    const typed = { ...empty, input: "whoami" };
    const { state } = terminalKey(typed, "Enter");
    expect(state.input).toBe("");
    expect(state.lines[0]).toBe(TERMINAL_PROMPT + "whoami");
    expect(state.lines.length).toBeGreaterThan(1);
  });

  it("enter on 'clear' wipes the scrollback", () => {
    const s: TerminalState = { lines: ["a", "b"], input: "clear" };
    const { state } = terminalKey(s, "Enter");
    expect(state.lines).toEqual([]);
  });

  it("enter surfaces mode switches", () => {
    const { modeSwitch } = terminalKey({ ...empty, input: "matrix" }, "Enter");
    expect(modeSwitch).toBe("matrix");
  });
});

describe("runCommand", () => {
  it("help lists every documented command", () => {
    const { output } = runCommand("help");
    for (const cmd of ["whoami", "ls", "contact", "matrix", "pong", "starfield", "exit"]) {
      expect(output.join("\n")).toContain(cmd);
    }
  });

  it("sudo hire sean grants permission", () => {
    const { output } = runCommand("sudo hire sean");
    expect(output.join("\n")).toContain("PERMISSION GRANTED");
    expect(output.join("\n")).toContain("sean@casperstudios.xyz");
  });

  it("other sudo gets the classic warning", () => {
    const { output } = runCommand("sudo rm -rf /");
    expect(output.join("\n")).toContain("not in the sudoers file");
  });

  it("ls reveals secrets.txt and cat secrets.txt pays off", () => {
    expect(runCommand("ls").output.join(" ")).toContain("secrets.txt");
    expect(runCommand("cat secrets.txt").output.join(" ")).toContain("phosphor");
  });

  it("cat of anything else is denied", () => {
    expect(runCommand("cat kernel").output[0]).toContain("permission denied");
  });

  it("mode commands switch modes", () => {
    expect(runCommand("pong").modeSwitch).toBe("pong");
    expect(runCommand("starfield").modeSwitch).toBe("starfield");
    expect(runCommand("exit").modeSwitch).toBe("exit");
  });

  it("is case- and whitespace-tolerant", () => {
    expect(runCommand("  SUDO  HIRE  SEAN ").output[0]).toContain("PERMISSION");
  });

  it("unknown commands fail politely", () => {
    expect(runCommand("vim").output[0]).toContain("command not found");
  });

  it("empty input outputs nothing", () => {
    expect(runCommand("   ").output).toEqual([]);
  });

  it("every output line fits the 34-char screen row", () => {
    const commands = [
      "help",
      "whoami",
      "ls",
      "contact",
      "sudo hire sean",
      "sudo make me a sandwich",
      "cat secrets.txt",
      "hire",
      "vim",
      "matrix",
      "pong",
      "starfield",
      "exit",
    ];
    for (const cmd of commands) {
      for (const line of runCommand(cmd).output) {
        expect(line.length, `"${line}" (${cmd})`).toBeLessThanOrEqual(34);
      }
    }
  });
});

describe("initTerminal", () => {
  it("greets and points at help", () => {
    const s = initTerminal();
    expect(s.lines.join(" ")).toContain("help");
    expect(s.input).toBe("");
  });
});
