import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  RoundedBox,
} from "@react-three/drei";
import {
  CanvasTexture,
  type Group,
  type MeshBasicMaterial,
  type Points,
} from "three";

import { approach, parallaxTarget, spinSpeed } from "@/lib/hero-scene-utils";
import {
  INITIAL_TYPE_STATE,
  advanceType,
  isComplete,
  scriptForHour,
  visibleLines,
  type TypeState,
} from "@/lib/crt-script";
import {
  IDLE_TO_SAVER_S,
  canEnterSaver,
  nextMode,
  type ScreenMode,
} from "@/lib/crt-modes";
import {
  initMatrix,
  matrixGlyph,
  stepMatrix,
  type MatrixState,
} from "@/lib/matrix-rain";
import { PADDLE_H, initPong, stepPong, type PongState } from "@/lib/pong";
import {
  initStarfield,
  projectStar,
  stepStarfield,
  type StarfieldState,
} from "@/lib/starfield";
import { initDvd, stepDvd, type DvdState } from "@/lib/dvd-bounce";
import {
  TERMINAL_PROMPT,
  initTerminal,
  terminalKey,
  type TerminalState,
} from "@/lib/crt-terminal";
import {
  BOOT_TOTAL_S,
  OFF_TOTAL_S,
  bootFrame,
  offFrame,
} from "@/lib/boot-sequence";
import { clack, clackGapS, zap } from "@/lib/console-sound";

// In-canvas WebGL colors — not UI chrome, so raw hex is intentional here
// (three.js materials take color values, not CSS classes). Per the design
// language, neon green exists ONLY inside this render.
const NEON_GREEN = "#39ff14";
const LED_OFF_GREEN = "#123408";
const CHROME_WHITE = "#ffffff";

const SCREEN_W = 512;
const SCREEN_H = 384;
const SCREEN_ROWS = 9;
const HOLD_AFTER_COMPLETE_S = 2.6;
const FLOOR_Y = -1.62;

export interface HeroSceneCanvasProps {
  /** 0 = idle, 1 = a portal CTA is hovered — typing speeds up, lasers flare. */
  energy?: number;
  /** Emoji to project on the CRT while a portal is hovered (null = none). */
  emoji?: string | null;
  /** Fires once, on the first successfully rendered frame. */
  onFirstFrame?: () => void;
  /** Fires if the WebGL context is lost and doesn't come back. */
  onContextLost?: () => void;
}

/* ------------------------------------------------------------------ */
/* Phosphor emoji sprite                                                */
/* ------------------------------------------------------------------ */

/**
 * Render an emoji as a phosphor sprite: tiny offscreen draw → green multiply
 * (keeping luminance detail) → nearest-neighbor upscale for chunky CRT
 * pixels. Cached per emoji — the pipeline only reruns when it changes.
 */
const spriteCache = new Map<string, HTMLCanvasElement>();
function phosphorSprite(emoji: string): HTMLCanvasElement {
  const hit = spriteCache.get(emoji);
  if (hit) return hit;
  const tiny = document.createElement("canvas");
  tiny.width = 48;
  tiny.height = 48;
  const tctx = tiny.getContext("2d")!;
  // Grayscale first where supported, so the multiply keeps shading detail.
  tctx.filter = "grayscale(1)";
  tctx.font = "38px system-ui, sans-serif";
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillText(emoji, 24, 27);
  tctx.filter = "none";
  tctx.globalCompositeOperation = "multiply";
  tctx.fillStyle = NEON_GREEN;
  tctx.fillRect(0, 0, 48, 48);
  tctx.globalCompositeOperation = "destination-in";
  tctx.fillText(emoji, 24, 27);
  spriteCache.set(emoji, tiny);
  return tiny;
}

/* ------------------------------------------------------------------ */
/* The tube's little operating system — per-mode state + draw           */
/* ------------------------------------------------------------------ */

/** Everything the tube needs to render one frame of any mode. */
interface CrtOs {
  mode: ScreenMode;
  /** Seconds since the current mode started. */
  modeT: number;
  /** Attract-mode auto-typing (terminal, when the visitor isn't typing). */
  type: { state: TypeState; carry: number; hold: number };
  script: readonly string[];
  /** Interactive terminal session — null means attract mode. */
  term: TerminalState | null;
  matrix: MatrixState | null;
  pong: PongState | null;
  stars: StarfieldState | null;
  dvd: DvdState | null;
  /** Elapsed seconds of the power-off collapse, null when not powering off. */
  offT: number | null;
  /** Mode to return to when the screensaver wakes. */
  beforeSaver: ScreenMode;
  /** Clock time of the visitor's last pointer/keyboard input. */
  lastActive: number;
  lastClack: number;
}

function makeOs(): CrtOs {
  return {
    mode: "boot",
    modeT: 0,
    type: { state: INITIAL_TYPE_STATE, carry: 0, hold: 0 },
    script: scriptForHour(new Date().getHours()),
    term: null,
    matrix: null,
    pong: null,
    stars: null,
    dvd: null,
    offT: null,
    beforeSaver: "terminal",
    lastActive: 0,
    lastClack: 0,
  };
}

const MONO_FONT = "700 22px ui-monospace, SFMono-Regular, Menlo, monospace";

function drawTerminal(
  ctx: CanvasRenderingContext2D,
  os: CrtOs,
  cursorOn: boolean
) {
  ctx.font = MONO_FONT;
  ctx.textBaseline = "top";
  ctx.shadowColor = NEON_GREEN;
  ctx.shadowBlur = 12;
  ctx.fillStyle = NEON_GREEN;

  const rows = os.term
    ? [...os.term.lines, TERMINAL_PROMPT + os.term.input].slice(-SCREEN_ROWS)
    : visibleLines(os.type.state, SCREEN_ROWS, os.script);
  const lineH = 38;
  const padX = 26;
  const padY = 22;
  rows.forEach((row, i) => {
    ctx.fillText(row, padX, padY + i * lineH);
  });

  // Block cursor at the end of the last row.
  if (cursorOn) {
    const last = rows[rows.length - 1] ?? "";
    const x = padX + ctx.measureText(last).width + 4;
    const y = padY + Math.max(0, rows.length - 1) * lineH;
    ctx.fillRect(x, y + 2, 13, 26);
  }
}

const MATRIX_COL_W = 16;
const MATRIX_ROW_H = 20;

function drawMatrix(ctx: CanvasRenderingContext2D, state: MatrixState, time: number) {
  ctx.font = "700 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.shadowBlur = 0;
  const tick = Math.floor(time * 8);
  state.cols.forEach((c, col) => {
    const head = Math.floor(c.y);
    for (let k = 0; k < c.len; k++) {
      const row = head - k;
      if (row < 0 || row * MATRIX_ROW_H > SCREEN_H) continue;
      const alpha = k === 0 ? 1 : Math.max(0, 1 - k / c.len) * 0.8;
      ctx.fillStyle = k === 0 ? "#c8ffc0" : NEON_GREEN;
      ctx.globalAlpha = alpha;
      ctx.fillText(matrixGlyph(col, row, tick), col * MATRIX_COL_W, row * MATRIX_ROW_H);
    }
  });
  ctx.globalAlpha = 1;
}

function drawPong(ctx: CanvasRenderingContext2D, s: PongState) {
  const padL = 20;
  const padT = 14;
  const fieldW = SCREEN_W - padL * 2;
  const fieldH = SCREEN_H - padT * 2;
  const px = (x: number) => padL + x * fieldW;
  const py = (y: number) => padT + y * fieldH;

  ctx.shadowColor = NEON_GREEN;
  ctx.shadowBlur = 10;
  ctx.fillStyle = NEON_GREEN;

  // Center net.
  for (let y = padT; y < SCREEN_H - padT; y += 24) {
    ctx.globalAlpha = 0.35;
    ctx.fillRect(SCREEN_W / 2 - 2, y, 4, 12);
  }
  ctx.globalAlpha = 1;

  // Score.
  ctx.font = "700 44px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.globalAlpha = 0.75;
  ctx.fillText(`${s.scoreL}   ${s.scoreR}`, SCREEN_W / 2, 20);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  // Paddles + ball.
  const ph = PADDLE_H * fieldH;
  ctx.fillRect(px(0.02) - 4, py(s.leftY) - ph / 2, 8, ph);
  ctx.fillRect(px(0.98) - 4, py(s.rightY) - ph / 2, 8, ph);
  ctx.fillRect(px(s.ballX) - 5, py(s.ballY) - 5, 10, 10);
}

function drawStarfield(ctx: CanvasRenderingContext2D, state: StarfieldState) {
  ctx.shadowBlur = 6;
  ctx.shadowColor = NEON_GREEN;
  for (const star of state.stars) {
    const p = projectStar(star, SCREEN_W, SCREEN_H);
    if (p.x < 0 || p.x > SCREEN_W || p.y < 0 || p.y > SCREEN_H) continue;
    ctx.fillStyle = NEON_GREEN;
    ctx.globalAlpha = p.bright;
    ctx.fillRect(p.x, p.y, Math.max(1, p.size), Math.max(1, p.size));
  }
  ctx.globalAlpha = 1;
}

const DVD_W = 132 / SCREEN_W;
const DVD_H = 64 / SCREEN_H;

function drawSaver(ctx: CanvasRenderingContext2D, s: DvdState) {
  const x = s.x * SCREEN_W;
  const y = s.y * SCREEN_H;
  ctx.shadowColor = NEON_GREEN;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = NEON_GREEN;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, DVD_W * SCREEN_W, DVD_H * SCREEN_H);
  ctx.fillStyle = NEON_GREEN;
  ctx.font = "800 34px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.fillText("SEAN", x + 18, y + 14);

  ctx.shadowBlur = 0;
  ctx.font = "700 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.globalAlpha = 0.45;
  ctx.fillText(`corners: ${s.cornerHits}`, SCREEN_W - 130, SCREEN_H - 26);
  ctx.globalAlpha = 1;
}

function drawBoot(ctx: CanvasRenderingContext2D, t: number) {
  const frame = bootFrame(t);
  if (frame.phase === "raster") {
    // The classic power-on: a blinding horizontal line blooming into a raster.
    const litH = frame.expand * SCREEN_H;
    const y = (SCREEN_H - litH) / 2;
    ctx.fillStyle = "rgba(57, 255, 20, 0.08)";
    ctx.fillRect(0, y, SCREEN_W, litH);
    ctx.shadowColor = "#d8ffd0";
    ctx.shadowBlur = 24;
    ctx.fillStyle = frame.expand < 0.98 ? "#eaffe6" : "rgba(234,255,230,0.4)";
    ctx.fillRect(0, y - 2, SCREEN_W, 3);
    ctx.fillRect(0, y + litH - 1, SCREEN_W, 3);
    return;
  }
  ctx.font = MONO_FONT;
  ctx.textBaseline = "top";
  ctx.shadowColor = NEON_GREEN;
  ctx.shadowBlur = 12;
  ctx.fillStyle = NEON_GREEN;
  frame.lines.forEach((line, i) => {
    ctx.fillText(line, 26, 22 + i * 38);
  });
}

/** Power-off collapse — raster → line → dot → dark. Draws over everything. */
function drawPowerOff(ctx: CanvasRenderingContext2D, t: number) {
  const f = offFrame(t);
  ctx.fillStyle = "#020302";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  if (f.glow <= 0.01) return;
  const litH = Math.max(3, f.collapse * SCREEN_H);
  const litW = f.width * SCREEN_W;
  const x = (SCREEN_W - litW) / 2;
  const y = (SCREEN_H - litH) / 2;
  ctx.globalAlpha = f.glow;
  ctx.fillStyle = "rgba(57, 255, 20, 0.25)";
  ctx.fillRect(x, y, litW, litH);
  ctx.shadowColor = "#d8ffd0";
  ctx.shadowBlur = 26;
  ctx.fillStyle = "#eaffe6";
  ctx.fillRect(x, SCREEN_H / 2 - 1.5, litW, 3);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

/** Draw one full frame of the tube onto the offscreen 2D canvas. */
function drawScreen(
  ctx: CanvasRenderingContext2D,
  os: CrtOs,
  cursorOn: boolean,
  time: number,
  emoji: string | null,
  emojiAlpha: number
) {
  const powered = os.mode !== "off" && os.offT === null;

  // Faint green-black tube glow — brighter center, darker edges.
  const bg = ctx.createRadialGradient(
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_H / 5,
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_W / 1.4
  );
  bg.addColorStop(0, powered ? "#0c130c" : "#040504");
  bg.addColorStop(1, powered ? "#050705" : "#020302");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  if (os.offT !== null) {
    drawPowerOff(ctx, os.offT);
  } else if (powered) {
    // Phosphor flicker — tiny brightness wobble, the tube never sits still.
    // The content crossfades OUT as the portal emoji takes over the screen.
    const flicker = 0.93 + 0.07 * Math.sin(time * 23) * Math.sin(time * 7.3);
    ctx.globalAlpha = flicker * (1 - emojiAlpha);

    switch (os.mode) {
      case "boot":
        drawBoot(ctx, os.modeT);
        break;
      case "matrix":
        if (os.matrix) drawMatrix(ctx, os.matrix, time);
        break;
      case "pong":
        if (os.pong) drawPong(ctx, os.pong);
        break;
      case "starfield":
        if (os.stars) drawStarfield(ctx, os.stars);
        break;
      case "saver":
        if (os.dvd) drawSaver(ctx, os.dvd);
        break;
      default:
        drawTerminal(ctx, os, cursorOn);
    }
    ctx.globalAlpha = 1;

    // Portal emoji — takes over the screen as a centered phosphor sprite,
    // glowing like everything else on the tube. Scanlines and vignette
    // (below) roll over it so it belongs.
    if (emoji && emojiAlpha > 0.02) {
      const sprite = phosphorSprite(emoji);
      const size = 230 + 12 * Math.sin(time * 2.2); // slow breathing
      ctx.save();
      ctx.imageSmoothingEnabled = false; // chunky CRT pixels
      ctx.globalAlpha = emojiAlpha;
      ctx.shadowColor = NEON_GREEN;
      ctx.shadowBlur = 26;
      ctx.drawImage(
        sprite,
        (SCREEN_W - size) / 2,
        (SCREEN_H - size) / 2,
        size,
        size
      );
      ctx.restore();
    }
  }

  // Scanlines — the CRT signature (slow vertical roll, like a real tube).
  if (powered) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    const roll = Math.floor((time * 10) % 4);
    for (let y = -4 + roll; y < SCREEN_H; y += 4) {
      ctx.fillRect(0, y, SCREEN_W, 2);
    }
  }

  // Curved-glass vignette — dark corners sell the tube bulge.
  const vig = ctx.createRadialGradient(
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_H / 2.4,
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_W / 1.25
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Glass streak — the room's key light reflecting off the curved glass.
  // Drawn even when the tube is off (glass doesn't care about power).
  ctx.shadowBlur = 0;
  const streak = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H * 0.8);
  streak.addColorStop(0.18, "rgba(255,255,255,0)");
  streak.addColorStop(0.32, "rgba(255,255,255,0.055)");
  streak.addColorStop(0.4, "rgba(255,255,255,0.09)");
  streak.addColorStop(0.46, "rgba(255,255,255,0.04)");
  streak.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}

/* ------------------------------------------------------------------ */
/* Scene pieces                                                          */
/* ------------------------------------------------------------------ */

/**
 * Dust motes drifting up through the spotlight — one Points cloud, ~120
 * particles, positions updated in place. Nearly free, huge atmosphere.
 */
function DustMotes() {
  const ref = useRef<Points>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: 120 }, () => ({
        x: -4.5 + Math.random() * 9,
        y: -1.6 + Math.random() * 4.2,
        z: -2.5 + Math.random() * 4,
        speed: 0.03 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );
  const positions = useMemo(
    () => new Float32Array(seeds.length * 3),
    [seeds]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      positions[i * 3] = s.x + Math.sin(t * 0.18 + s.phase) * 0.25;
      positions[i * 3 + 1] = -1.6 + ((s.y + 1.6 + t * s.speed) % 4.2);
      positions[i * 3 + 2] = s.z;
    }
    const geo = ref.current?.geometry;
    if (geo) geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#8e8e98"
        transparent
        opacity={0.22}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * OBJECT_02 — CRT. A chrome retro terminal that is secretly a tiny OS:
 * attract-mode agentic session by default, an interactive prompt if you
 * just start typing, toy modes on click (matrix / pong / starfield), a DVD
 * screensaver when idle, and a real power ritual on the LED.
 */
function CrtSculpture({
  energy = 0,
  emoji = null,
  onFirstFrame,
}: HeroSceneCanvasProps) {
  const group = useRef<Group>(null);
  const sway = useRef<Group>(null);
  const laserA = useRef<MeshBasicMaterial>(null);
  const laserB = useRef<MeshBasicMaterial>(null);
  const led = useRef<MeshBasicMaterial>(null);
  const eased = useRef(0);
  const lastEmoji = useRef<string | null>(null);
  const firedFirstFrame = useRef(false);
  const os = useRef<CrtOs>(makeOs());
  const clock = useRef(0);

  const { texture, ctx } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const context = canvas.getContext("2d")!;
    const tex = new CanvasTexture(canvas);
    return { texture: tex, ctx: context };
  }, []);

  /** Enter a mode: reset its timer and lazily init its state. */
  const enterMode = (mode: ScreenMode) => {
    const o = os.current;
    o.mode = mode;
    o.modeT = 0;
    if (mode === "matrix" && !o.matrix)
      o.matrix = initMatrix(
        Math.floor(SCREEN_W / MATRIX_COL_W),
        Math.ceil(SCREEN_H / MATRIX_ROW_H),
        Math.random
      );
    if (mode === "pong" && !o.pong) o.pong = initPong();
    if (mode === "starfield" && !o.stars)
      o.stars = initStarfield(90, Math.random);
    if (mode === "saver") o.dvd = initDvd();
    if (mode === "terminal" && o.term === null) {
      // Back to attract — restart the tape from the top.
      o.type = { state: INITIAL_TYPE_STATE, carry: 0, hold: 0 };
    }
  };

  /** Wake from the screensaver back to whatever was on. */
  const wake = () => {
    const o = os.current;
    o.lastActive = clock.current;
    if (o.mode === "saver") enterMode(o.beforeSaver);
  };

  // Laser zap on the portal-hover rising edge.
  const prevEnergy = useRef(energy);
  useEffect(() => {
    if (energy === 1 && prevEnergy.current !== 1) zap();
    prevEnergy.current = energy;
  }, [energy]);

  // The visitor can just start typing — the tube answers. Global listener,
  // skipped when a real form control has focus or a modifier is held.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;

      const o = os.current;
      if (o.mode === "off" || o.mode === "boot" || o.offT !== null) return;

      const printable = e.key.length === 1 && e.key >= " " && e.key <= "~";
      if (!printable && e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Escape")
        return;

      wake();

      if (e.key === "Escape") {
        // Leave the interactive session, resume the attract tape.
        o.term = null;
        enterMode("terminal");
        return;
      }

      // First keystroke anywhere opens the interactive terminal.
      if (o.mode !== "terminal" || o.term === null) {
        o.term = o.term ?? initTerminal();
        o.mode = "terminal";
        o.modeT = 0;
      }

      const { state, modeSwitch } = terminalKey(o.term, e.key);
      o.term = state;
      clack();
      if (modeSwitch === "exit") {
        o.term = null;
        enterMode("terminal");
      } else if (modeSwitch) {
        enterMode(modeSwitch);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer movement anywhere counts as activity (wakes the screensaver).
  useEffect(() => {
    const onActive = () => wake();
    window.addEventListener("pointermove", onActive);
    window.addEventListener("pointerdown", onActive);
    return () => {
      window.removeEventListener("pointermove", onActive);
      window.removeEventListener("pointerdown", onActive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCursor = (c: string) => {
    document.body.style.cursor = c;
  };
  useEffect(() => () => setCursor(""), []);

  useFrame((state, delta) => {
    if (!group.current || !sway.current) return;
    if (!firedFirstFrame.current) {
      firedFirstFrame.current = true;
      onFirstFrame?.();
    }
    const o = os.current;
    const time = state.clock.elapsedTime;
    clock.current = time;
    o.modeT += delta;
    eased.current = approach(eased.current, energy, delta, 5);

    // Power-off collapse animation.
    if (o.offT !== null) {
      o.offT += delta;
      if (o.offT > OFF_TOTAL_S + 0.2) {
        o.offT = null;
        o.mode = "off";
      }
    }

    // Idle → screensaver.
    if (
      time - o.lastActive > IDLE_TO_SAVER_S &&
      canEnterSaver(o.mode) &&
      o.offT === null
    ) {
      o.beforeSaver = o.mode;
      enterMode("saver");
    }

    // Advance the current mode.
    switch (o.mode) {
      case "boot":
        if (o.modeT > BOOT_TOTAL_S) {
          o.term = null;
          enterMode("terminal");
        }
        break;
      case "terminal": {
        if (o.term) break; // interactive — the keyboard drives it
        // Attract typing: idle ~13 cps, excited ~46 cps.
        const cps = spinSpeed(eased.current, 13, 46);
        const t = o.type;
        if (isComplete(t.state, o.script)) {
          t.hold += delta;
          if (t.hold > HOLD_AFTER_COMPLETE_S) {
            o.type = { state: INITIAL_TYPE_STATE, carry: 0, hold: 0 };
          }
        } else {
          t.carry += cps * delta;
          const whole = Math.floor(t.carry);
          if (whole > 0) {
            t.state = advanceType(t.state, whole, o.script);
            t.carry -= whole;
            if (time - o.lastClack > clackGapS(cps)) {
              o.lastClack = time;
              clack();
            }
          }
        }
        break;
      }
      case "matrix":
        if (o.matrix) o.matrix = stepMatrix(o.matrix, delta, Math.random);
        break;
      case "pong":
        if (o.pong) o.pong = stepPong(o.pong, delta);
        break;
      case "starfield":
        if (o.stars) o.stars = stepStarfield(o.stars, delta, Math.random);
        break;
      case "saver":
        if (o.dvd) o.dvd = stepDvd(o.dvd, delta, DVD_W, DVD_H);
        break;
      default:
        break;
    }

    // Redraw the phosphor screen (cursor blinks at ~1.9Hz). The emoji fades
    // with the eased energy — remember the last one so it fades OUT too.
    if (emoji) lastEmoji.current = emoji;
    const cursorOn = Math.floor(time * 1.9) % 2 === 0;
    drawScreen(ctx, o, cursorOn, time, lastEmoji.current, eased.current);
    texture.needsUpdate = true;

    // Power LED tracks tube state.
    if (led.current)
      led.current.color.set(
        o.mode === "off" && o.offT === null ? LED_OFF_GREEN : NEON_GREEN
      );

    // Gentle sway — the screen must keep facing the viewer, so no full spin.
    const swaySpeed =
      (o.mode === "off" ? 0.18 : 0.3) + eased.current * 0.35;
    sway.current.rotation.y = Math.sin(time * swaySpeed) * 0.16;
    sway.current.rotation.x = Math.sin(time * swaySpeed * 0.7) * 0.05;

    // Lasers are an EVENT — dark at rest, sweeping in on portal hover.
    const heat = eased.current;
    if (laserA.current) laserA.current.opacity = heat * 0.9;
    if (laserB.current) laserB.current.opacity = heat * 0.8;

    // Pointer parallax on the whole group.
    const target = parallaxTarget(state.pointer.x, state.pointer.y, 0.16);
    group.current.rotation.x = approach(
      group.current.rotation.x,
      target.rotX,
      delta
    );
    group.current.rotation.y = approach(
      group.current.rotation.y,
      target.rotY,
      delta
    );
  });

  const handleTubeClick = () => {
    const o = os.current;
    if (o.offT !== null || o.mode === "boot") return;
    o.lastActive = clock.current;
    if (o.mode === "saver") {
      enterMode(o.beforeSaver);
      return;
    }
    if (o.mode === "off") return; // power is the LED's business
    enterMode(nextMode(o.mode));
  };

  const handleLedClick = () => {
    const o = os.current;
    o.lastActive = clock.current;
    if (o.offT !== null) return;
    if (o.mode === "off") {
      o.term = null;
      enterMode("boot");
    } else {
      o.offT = 0;
    }
  };

  return (
    // Slight drop so the base sits just above the reflective floor —
    // reflection + contact shadow visually connect them.
    <group ref={group} position={[0, -0.25, 0]}>
      <group
        ref={sway}
        position={[0, 0.18, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleTubeClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursor("pointer");
        }}
        onPointerOut={() => setCursor("")}
      >
        {/* Front shell — boxy 80s bezel, chrome */}
        <RoundedBox args={[2.7, 2.05, 1.0]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.14}
          />
        </RoundedBox>
        {/* Rear tube hump — the retro silhouette */}
        <RoundedBox
          args={[2.15, 1.65, 1.3]}
          radius={0.18}
          smoothness={4}
          position={[0, 0.05, -0.85]}
        >
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.14}
            clearcoat={1}
            clearcoatRoughness={0.2}
          />
        </RoundedBox>
        {/* Screen bezel inset */}
        <RoundedBox args={[2.3, 1.62, 0.1]} radius={0.06} position={[0, 0.09, 0.47]}>
          <meshStandardMaterial color="#1b1d1b" metalness={0.4} roughness={0.6} />
        </RoundedBox>
        {/* Phosphor screen — live canvas texture, emissive (unlit + untone-mapped) */}
        <mesh position={[0, 0.09, 0.535]}>
          <planeGeometry args={[2.08, 1.44]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* Brand plate — every real tube had a name */}
        <mesh position={[-0.78, -0.86, 0.505]}>
          <boxGeometry args={[0.52, 0.09, 0.02]} />
          <meshStandardMaterial color="#26282a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Vent slits under the screen — 80s front-panel detail */}
        {[-0.28, -0.03, 0.22].map((x) => (
          <mesh key={x} position={[x, -0.86, 0.505]}>
            <boxGeometry args={[0.2, 0.035, 0.02]} />
            <meshStandardMaterial color="#26282a" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
        {/* Brightness / contrast knobs — they did something once */}
        {[0.62, 0.82].map((x) => (
          <mesh key={x} position={[x, -0.86, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
            <meshStandardMaterial color="#3a3d40" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        {/* Power LED — the one neon dot on the hardware, and a real switch */}
        <mesh position={[1.08, -0.86, 0.505]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshBasicMaterial ref={led} color={NEON_GREEN} toneMapped={false} />
        </mesh>
        {/* Invisible hit halo — a 10px LED is a cruel click target */}
        <mesh
          position={[1.08, -0.86, 0.52]}
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            handleLedClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setCursor("pointer");
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setCursor("pointer"); // still over the tube group
          }}
        >
          <sphereGeometry args={[0.14, 12, 12]} />
        </mesh>
        {/* Chunky wedge base — no slim modern stand */}
        <mesh position={[0, -1.22, 0]}>
          <boxGeometry args={[1.9, 0.22, 1.35]} />
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.12}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[0, -1.38, 0.05]}>
          <boxGeometry args={[2.15, 0.14, 1.55]} />
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.16}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* Neon lasers behind the terminal — invisible at rest, they sweep in
          when a portal charges (opacity driven by eased energy). */}
      <mesh position={[0, 0, -1.7]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.012, 0.012, 16, 12]} />
        <meshBasicMaterial
          ref={laserA}
          color={NEON_GREEN}
          toneMapped={false}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh position={[0, 0, -2.1]} rotation={[0, 0, -Math.PI / 3.2]}>
        <cylinderGeometry args={[0.012, 0.012, 16, 12]} />
        <meshBasicMaterial
          ref={laserB}
          color={NEON_GREEN}
          toneMapped={false}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

/** Wires context-lost/restored listeners onto the renderer's canvas. */
function ContextGuard({ onContextLost }: { onContextLost?: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    let lostTimer: ReturnType<typeof setTimeout> | undefined;
    const handleLost = (e: Event) => {
      // preventDefault signals the browser we want a restore attempt.
      e.preventDefault();
      // Only report as dead if no restore lands within 3s.
      lostTimer = setTimeout(() => onContextLost?.(), 3000);
    };
    const handleRestored = () => clearTimeout(lostTimer);
    el.addEventListener("webglcontextlost", handleLost);
    el.addEventListener("webglcontextrestored", handleRestored);
    return () => {
      clearTimeout(lostTimer);
      el.removeEventListener("webglcontextlost", handleLost);
      el.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl, onContextLost]);
  return null;
}

/**
 * R3F canvas for the home 3D hero. `.client.tsx` suffix keeps three.js and
 * friends out of the Workers (SSR) bundle — React Router's Vite plugin strips
 * client modules from the server build. Only ever rendered after hydration
 * via the lazy wrapper in `hero-scene.tsx`.
 */
export default function HeroSceneCanvas({
  energy = 0,
  emoji = null,
  onFirstFrame,
  onContextLost,
}: HeroSceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 5.4], fov: 42 }}
      dpr={[1, 2]}
      // Transparent canvas — the dark plate is the DOM wrapper behind it
      // (hero-scene.tsx), so a failed/blank WebGL paint degrades gracefully.
      gl={{ antialias: true, alpha: true }}
    >
      <ContextGuard onContextLost={onContextLost} />
      {/* Fog melts the floor plane's far edge into the DOM stage color —
          no visible horizon seam. Near objects are untouched. */}
      <fog attach="fog" args={["#141416", 7, 17]} />
      <CrtSculpture energy={energy} emoji={emoji} onFirstFrame={onFirstFrame} />
      <DustMotes />

      {/* Reflective floor — the "expensive product shot" ground. Low-res +
          heavy blur keeps the second scene render cheap; the plane is near
          black so it melts into the DOM stage behind the canvas. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.01, 0]}>
        <planeGeometry args={[34, 34]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={9}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101012"
          metalness={0.55}
          mirror={0.6}
        />
      </mesh>

      {/* Soft contact shadow pools the monitor onto the floor. frames={1}
          renders it once — cheap, context-safe. */}
      <ContactShadows
        position={[0, FLOOR_Y + 0.005, 0]}
        opacity={0.55}
        scale={7}
        blur={2.6}
        far={2}
        resolution={256}
        frames={1}
      />
      {/* Phosphor spill — the screen's green faintly lighting the hardware. */}
      <pointLight
        color={NEON_GREEN}
        intensity={2.2}
        distance={4.5}
        position={[0, -0.4, 1.6]}
      />
      {/*
        Procedural studio environment — drei Lightformers rendered once to a
        small cubemap. NEVER swap this for an HDR preset (it killed the WebGL
        context — see design-language.md 2026-07-21 amendment). Chrome only
        reads as chrome when the reflections have CONTRAST: hard bright
        panels separated by real darkness, plus one warm strip for life.
      */}
      <Environment resolution={128} frames={1}>
        {/* Key strip — hard overhead slash */}
        <Lightformer
          intensity={6}
          position={[0, 4, 2]}
          rotation={[-Math.PI / 3, 0, 0]}
          scale={[9, 1.2, 1]}
          color="#ffffff"
        />
        {/* Top-front panel — lights the upper bezel so the front face isn't
            split into a hard two-tone */}
        <Lightformer
          intensity={3.4}
          position={[0, 3.2, 5]}
          rotation={[-Math.PI / 5, Math.PI, 0]}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
        {/* Left crisp vertical edge */}
        <Lightformer
          intensity={4.5}
          position={[-5, 0.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.4, 6, 1]}
          color="#ffffff"
        />
        {/* Right cool wide fill — softer, dimmer for asymmetry */}
        <Lightformer
          intensity={1.6}
          position={[5, 0, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[5, 3, 1]}
          color="#dfe3ee"
        />
        {/* Warm low strip — a hint of tungsten in the chrome's belly */}
        <Lightformer
          intensity={1.1}
          position={[1.5, -3.5, 2]}
          rotation={[Math.PI / 2.4, 0, 0]}
          scale={[7, 1, 1]}
          color="#ffd9b0"
        />
        {/* Faint rear rim so the tube hump separates from the void */}
        <Lightformer
          intensity={1.8}
          position={[0, 1.5, -5]}
          scale={[8, 2, 1]}
          color="#eef0f6"
        />
        {/* Frontal panel — the camera-side "softbox". Without it the front
            bezel mirrors the empty room and reads black, not chrome. */}
        <Lightformer
          intensity={2.6}
          position={[0, 0.8, 6]}
          rotation={[0, Math.PI, 0]}
          scale={[7, 3.2, 1]}
          color="#f4f4f8"
        />
      </Environment>
    </Canvas>
  );
}
