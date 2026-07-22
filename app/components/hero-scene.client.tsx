import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import type { Group, Mesh, MeshBasicMaterial } from "three";

import { approach, parallaxTarget, spinSpeed } from "@/lib/hero-scene-utils";

// In-canvas WebGL colors — not UI chrome, so raw hex is intentional here
// (three.js materials take color values, not CSS classes). Per the design
// language, neon green exists ONLY inside this render.
const NEON_GREEN = "#39ff14";
const CHROME_WHITE = "#ffffff";

export interface HeroSceneCanvasProps {
  /**
   * 0 = idle drift, 1 = a portal CTA is hovered — the knot spins up and the
   * lasers flare. Eased in-scene, so flipping the prop is cheap.
   */
  energy?: number;
}

/** Thin neon "laser" beam — slim cylinder, tone-mapping off so it stays hot. */
function LaserLine({
  position,
  rotation,
  materialRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  materialRef?: React.Ref<MeshBasicMaterial>;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.012, 0.012, 16, 12]} />
      <meshBasicMaterial
        ref={materialRef}
        color={NEON_GREEN}
        toneMapped={false}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

/**
 * One chrome torus knot (the single dominant object) + two neon laser lines
 * crossing diagonally behind it. The knot idles in a slow spin; hovering a
 * portal CTA feeds `energy` in and the whole thing wakes up — faster spin,
 * hotter lasers. This is the only moving element on the home page.
 */
function ChromeSculpture({ energy = 0 }: HeroSceneCanvasProps) {
  const group = useRef<Group>(null);
  const knot = useRef<Mesh>(null);
  const laserA = useRef<MeshBasicMaterial>(null);
  const laserB = useRef<MeshBasicMaterial>(null);
  const eased = useRef(0);

  useFrame((state, delta) => {
    if (!group.current || !knot.current) return;
    // Ease toward the requested energy level, then derive spin + laser heat.
    eased.current = approach(eased.current, energy, delta, 5);
    const speed = spinSpeed(eased.current);
    knot.current.rotation.y += delta * speed;
    knot.current.rotation.x += delta * speed * 0.32;
    // Lasers flare from a whisper to full beam with energy.
    const heat = 0.55 + eased.current * 0.45;
    if (laserA.current) laserA.current.opacity = heat;
    if (laserB.current) laserB.current.opacity = heat * 0.9;
    // Subtle mouse parallax on the whole group, eased frame-rate-independently.
    const target = parallaxTarget(state.pointer.x, state.pointer.y);
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
      <mesh ref={knot}>
        <torusKnotGeometry args={[1.05, 0.34, 256, 48]} />
        <meshPhysicalMaterial
          color={CHROME_WHITE}
          metalness={1}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <LaserLine
        position={[0, 0, -1.5]}
        rotation={[0, 0, Math.PI / 4]}
        materialRef={laserA}
      />
      <LaserLine
        position={[0, 0, -1.9]}
        rotation={[0, 0, -Math.PI / 3.2]}
        materialRef={laserB}
      />
    </group>
  );
}

/**
 * R3F canvas for the home 3D hero. `.client.tsx` suffix keeps three.js and
 * friends out of the Workers (SSR) bundle — React Router's Vite plugin strips
 * client modules from the server build. Only ever rendered after hydration
 * via the lazy wrapper in `hero-scene.tsx`.
 */
export default function HeroSceneCanvas({ energy = 0 }: HeroSceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 2]}
      // Transparent canvas — the dark plate is the DOM wrapper behind it
      // (hero-scene.tsx), so a failed/blank WebGL paint degrades gracefully.
      gl={{ antialias: true, alpha: true }}
    >
      <ChromeSculpture energy={energy} />
      {/* drei-bundled studio HDR for the chrome reflections. */}
      <Environment preset="studio" />
    </Canvas>
  );
}
