import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BootLoaderProps {
  /** Flip to true when the render is live — the loader fades out and unmounts. */
  done: boolean;
}

/**
 * Fullscreen boot screen for the home console — same ink plate as the stage,
 * shown until the first WebGL frame renders (or the parent times out on a
 * dead GPU and flips `done` anyway). Mono status line with a blinking block
 * cursor and an indeterminate hairline sweep — the CRT aesthetic booting
 * itself. Fades out over 600ms, then unmounts. Reduced-motion users get no
 * sweep and an instant dismissal (CSS-gated).
 */
export function BootLoader({ done }: BootLoaderProps) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 650);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;

  return (
    <div
      data-testid="boot-loader"
      aria-hidden={done}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#141416] transition-opacity duration-[600ms]",
        done ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <p className="font-mono text-[11px] font-extrabold tracking-[0.25em] text-white/70 uppercase">
        object_02 — crt
      </p>
      <div className="h-px w-44 overflow-hidden bg-white/15">
        <div className="boot-sweep h-full w-1/3 bg-white/80" />
      </div>
      <p className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase">
        booting render
        <span className="boot-blink" aria-hidden>
          {" "}
          █
        </span>
      </p>
    </div>
  );
}
