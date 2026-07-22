import { Suspense, lazy, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The actual R3F canvas lives in `hero-scene.client.tsx` (a React Router
 * `.client` module, stripped from the server bundle) and is lazy-loaded so
 * three.js never ships in the Workers build and only downloads on the client.
 */
const HeroSceneCanvas = lazy(() => import("./hero-scene.client"));

/**
 * Designed static state shown during SSR and while the canvas loads — same
 * dark plate as the render itself, with a mono status label, so the frame
 * never reads as an empty gray void even before (or without) WebGL.
 */
function SceneFallback() {
  return (
    <div aria-hidden className="relative h-full w-full select-none">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/35 uppercase">
        rendering —
      </span>
    </div>
  );
}

interface HeroSceneProps {
  className?: string;
  /** 0 = idle, 1 = a portal CTA is hovered (scene spins up, lasers flare). */
  energy?: number;
  /** Skip the dark plate when the parent already provides the dark stage. */
  transparent?: boolean;
}

/**
 * SSR-safe wrapper for the home 3D hero scene. Renders the silver-mist
 * fallback on the server and during hydration, then swaps in the WebGL
 * canvas once mounted (mounted-flag pattern — the lazy client import never
 * executes server-side).
 */
export function HeroScene({
  className,
  energy = 0,
  transparent = false,
}: HeroSceneProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      // The dark plate is DOM, not WebGL — if the GPU paints nothing the
      // frame still reads as a designed dark render field (and the canvas
      // itself stays transparent, layering the chrome object on top).
      className={cn(
        "relative h-full w-full",
        !transparent && "bg-[#141416]",
        className
      )}
      data-testid="hero-scene"
    >
      {mounted ? (
        <Suspense fallback={<SceneFallback />}>
          <HeroSceneCanvas energy={energy} />
        </Suspense>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
