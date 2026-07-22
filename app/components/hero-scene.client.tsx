import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  RoundedBox,
} from "@react-three/drei";
import { CanvasTexture, type Group, type MeshBasicMaterial } from "three";

import { approach, parallaxTarget, spinSpeed } from "@/lib/hero-scene-utils";
import {
  CRT_SCRIPT,
  INITIAL_TYPE_STATE,
  advanceType,
  isComplete,
  visibleLines,
  type TypeState,
} from "@/lib/crt-script";

// In-canvas WebGL colors — not UI chrome, so raw hex is intentional here
// (three.js materials take color values, not CSS classes). Per the design
// language, neon green exists ONLY inside this render.
const NEON_GREEN = "#39ff14";
const CHROME_WHITE = "#ffffff";
const PHOSPHOR_BG = "#0a0d0a";

const SCREEN_W = 512;
const SCREEN_H = 384;
const SCREEN_ROWS = 9;
const HOLD_AFTER_COMPLETE_S = 2.6;

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

/** Draw the phosphor terminal frame onto the offscreen 2D canvas. */
function drawScreen(
  ctx: CanvasRenderingContext2D,
  state: TypeState,
  cursorOn: boolean,
  time: number,
  emoji: string | null,
  emojiAlpha: number
) {
  // Faint green-black tube glow — brighter center, darker edges.
  const bg = ctx.createRadialGradient(
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_H / 5,
    SCREEN_W / 2,
    SCREEN_H / 2,
    SCREEN_W / 1.4
  );
  bg.addColorStop(0, "#0c130c");
  bg.addColorStop(1, "#050705");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Phosphor flicker — tiny brightness wobble, the tube never sits still.
  // The terminal crossfades OUT as the portal emoji takes over the screen.
  const flicker = 0.93 + 0.07 * Math.sin(time * 23) * Math.sin(time * 7.3);
  ctx.globalAlpha = flicker * (1 - emojiAlpha);

  ctx.font = "700 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.shadowColor = NEON_GREEN;
  ctx.shadowBlur = 12;
  ctx.fillStyle = NEON_GREEN;

  const rows = visibleLines(state, SCREEN_ROWS);
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
  ctx.globalAlpha = 1;

  // Portal emoji — takes over the screen as a centered phosphor sprite
  // (terminal text crossfades out above), glowing like everything else on
  // the tube. Scanlines and vignette (below) roll over it so it belongs.
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

  // Scanlines — the CRT signature (slow vertical roll, like a real tube).
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  const roll = Math.floor((time * 10) % 4);
  for (let y = -4 + roll; y < SCREEN_H; y += 4) {
    ctx.fillRect(0, y, SCREEN_W, 2);
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
}

/**
 * OBJECT_02 — CRT. A chrome retro terminal whose screen live-types an
 * agentic coding session in phosphor green (the AI-fluency story, told by
 * the object itself). The monitor sways gently and follows the pointer;
 * portal-CTA energy speeds the typing and flares the lasers behind it.
 */
function CrtSculpture({ energy = 0, emoji = null, onFirstFrame }: HeroSceneCanvasProps) {
  const group = useRef<Group>(null);
  const sway = useRef<Group>(null);
  const laserA = useRef<MeshBasicMaterial>(null);
  const laserB = useRef<MeshBasicMaterial>(null);
  const eased = useRef(0);
  const lastEmoji = useRef<string | null>(null);
  const firedFirstFrame = useRef(false);
  const type = useRef<{ state: TypeState; carry: number; hold: number }>({
    state: INITIAL_TYPE_STATE,
    carry: 0,
    hold: 0,
  });

  const { texture, ctx } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const context = canvas.getContext("2d")!;
    const tex = new CanvasTexture(canvas);
    return { texture: tex, ctx: context };
  }, []);

  useFrame((state, delta) => {
    if (!group.current || !sway.current) return;
    if (!firedFirstFrame.current) {
      firedFirstFrame.current = true;
      onFirstFrame?.();
    }
    eased.current = approach(eased.current, energy, delta, 5);

    // Typing: idle ~13 cps, excited ~46 cps (spinSpeed reused as the easer).
    const cps = spinSpeed(eased.current, 13, 46);
    const t = type.current;
    if (isComplete(t.state)) {
      t.hold += delta;
      if (t.hold > HOLD_AFTER_COMPLETE_S) {
        t.state = INITIAL_TYPE_STATE;
        t.carry = 0;
        t.hold = 0;
      }
    } else {
      t.carry += cps * delta;
      const whole = Math.floor(t.carry);
      if (whole > 0) {
        t.state = advanceType(t.state, whole);
        t.carry -= whole;
      }
    }

    // Redraw the phosphor screen (cursor blinks at ~1.9Hz). The emoji fades
    // with the eased energy — remember the last one so it fades OUT too.
    if (emoji) lastEmoji.current = emoji;
    const cursorOn = Math.floor(state.clock.elapsedTime * 1.9) % 2 === 0;
    drawScreen(
      ctx,
      t.state,
      cursorOn,
      state.clock.elapsedTime,
      lastEmoji.current,
      eased.current
    );
    texture.needsUpdate = true;

    // Gentle sway — the screen must keep facing the viewer, so no full spin.
    const swaySpeed = 0.3 + eased.current * 0.35;
    sway.current.rotation.y =
      Math.sin(state.clock.elapsedTime * swaySpeed) * 0.16;
    sway.current.rotation.x =
      Math.sin(state.clock.elapsedTime * swaySpeed * 0.7) * 0.05;

    // Lasers flare with energy.
    const heat = 0.55 + eased.current * 0.45;
    if (laserA.current) laserA.current.opacity = heat;
    if (laserB.current) laserB.current.opacity = heat * 0.9;

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

  return (
    <group ref={group}>
      <group ref={sway} position={[0, 0.18, 0]}>
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
        {/* Vent slits under the screen — 80s front-panel detail */}
        {[-0.55, -0.3, -0.05].map((x) => (
          <mesh key={x} position={[x, -0.86, 0.505]}>
            <boxGeometry args={[0.2, 0.035, 0.02]} />
            <meshStandardMaterial color="#26282a" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
        {/* Power LED — the one neon dot on the hardware */}
        <mesh position={[1.08, -0.86, 0.505]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshBasicMaterial color={NEON_GREEN} toneMapped={false} />
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

      {/* Neon lasers crossing behind the terminal */}
      <mesh position={[0, 0, -1.7]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.012, 0.012, 16, 12]} />
        <meshBasicMaterial
          ref={laserA}
          color={NEON_GREEN}
          toneMapped={false}
          transparent
          opacity={0.75}
        />
      </mesh>
      <mesh position={[0, 0, -2.1]} rotation={[0, 0, -Math.PI / 3.2]}>
        <cylinderGeometry args={[0.012, 0.012, 16, 12]} />
        <meshBasicMaterial
          ref={laserB}
          color={NEON_GREEN}
          toneMapped={false}
          transparent
          opacity={0.68}
        />
      </mesh>
    </group>
  );
}

/**
 * R3F canvas for the home 3D hero. `.client.tsx` suffix keeps three.js and
 * friends out of the Workers (SSR) bundle — React Router's Vite plugin strips
 * client modules from the server build. Only ever rendered after hydration
 * via the lazy wrapper in `hero-scene.tsx`.
 */
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
      <CrtSculpture energy={energy} emoji={emoji} onFirstFrame={onFirstFrame} />
      {/* Premium grounding: soft contact shadow pools the monitor onto the
          stage. frames={1} renders it once — cheap, context-safe. */}
      <ContactShadows
        position={[0, -1.62, 0]}
        opacity={0.5}
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
        small cubemap. Replaces the HDR `preset="studio"`: the HDR fetch +
        PMREM generation was blowing up the WebGL context (context lost ~2.5s
        after load — the "shows for a split second then gone" bug), and it
        pulled from a CDN at runtime. This is generated locally, is a fraction
        of the GPU cost, and keeps the chrome reflective.
      */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          intensity={2.2}
          position={[0, 3, 4]}
          scale={[10, 4, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.2}
          position={[-5, 1, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 3, 1]}
          color="#e8e8ee"
        />
        <Lightformer
          intensity={1.4}
          position={[5, -1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={0.5}
          position={[0, -4, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 6, 1]}
          color="#c9c9d2"
        />
      </Environment>
    </Canvas>
  );
}
