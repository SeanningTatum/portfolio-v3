import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
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
  /** Fires once, on the first successfully rendered frame. */
  onFirstFrame?: () => void;
  /** Fires if the WebGL context is lost and doesn't come back. */
  onContextLost?: () => void;
}

/** Draw the phosphor terminal frame onto the offscreen 2D canvas. */
function drawScreen(
  ctx: CanvasRenderingContext2D,
  state: TypeState,
  cursorOn: boolean
) {
  ctx.fillStyle = PHOSPHOR_BG;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  ctx.font = "700 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.shadowColor = NEON_GREEN;
  ctx.shadowBlur = 10;
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

  // Scanlines — the CRT signature.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  for (let y = 0; y < SCREEN_H; y += 4) {
    ctx.fillRect(0, y, SCREEN_W, 2);
  }
}

/**
 * OBJECT_02 — CRT. A chrome retro terminal whose screen live-types an
 * agentic coding session in phosphor green (the AI-fluency story, told by
 * the object itself). The monitor sways gently and follows the pointer;
 * portal-CTA energy speeds the typing and flares the lasers behind it.
 */
function CrtSculpture({ energy = 0, onFirstFrame }: HeroSceneCanvasProps) {
  const group = useRef<Group>(null);
  const sway = useRef<Group>(null);
  const laserA = useRef<MeshBasicMaterial>(null);
  const laserB = useRef<MeshBasicMaterial>(null);
  const eased = useRef(0);
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

    // Redraw the phosphor screen (cursor blinks at ~1.9Hz).
    const cursorOn = Math.floor(state.clock.elapsedTime * 1.9) % 2 === 0;
    drawScreen(ctx, t.state, cursorOn);
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
      <group ref={sway} position={[0, 0.12, 0]}>
        {/* Monitor shell — chrome */}
        <RoundedBox args={[2.7, 2.05, 1.5]} radius={0.14} smoothness={4}>
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.14}
          />
        </RoundedBox>
        {/* Screen bezel inset */}
        <RoundedBox args={[2.3, 1.68, 0.1]} radius={0.06} position={[0, 0.02, 0.72]}>
          <meshStandardMaterial color="#1b1d1b" metalness={0.4} roughness={0.6} />
        </RoundedBox>
        {/* Phosphor screen — live canvas texture, emissive (unlit + untone-mapped) */}
        <mesh position={[0, 0.02, 0.785]}>
          <planeGeometry args={[2.08, 1.5]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* Neck + base — chrome */}
        <mesh position={[0, -1.25, -0.1]}>
          <cylinderGeometry args={[0.22, 0.28, 0.5, 24]} />
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.12}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[0, -1.55, -0.1]}>
          <cylinderGeometry args={[0.85, 0.95, 0.14, 40]} />
          <meshPhysicalMaterial
            color={CHROME_WHITE}
            metalness={1}
            roughness={0.12}
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
      <CrtSculpture energy={energy} onFirstFrame={onFirstFrame} />
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
