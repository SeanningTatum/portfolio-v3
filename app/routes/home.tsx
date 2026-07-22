import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { BootLoader } from "@/components/boot-loader";
import { HeroScene } from "@/components/hero-scene";
import { SoundToggle } from "@/components/sound-toggle";
import { printConsoleEgg } from "@/lib/console-egg";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/home";

/** Give a dead/absent GPU this long before dropping the boot screen anyway. */
const BOOT_TIMEOUT_MS = 5000;

export const handle = { i18n: ["home", "projects"] };

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Sean Urgel — Full-stack Engineer" },
    {
      name: "description",
      content:
        "Portfolio of Sean Urgel — full-stack engineer building agentic products.",
    },
  ];
}

/**
 * Home — "the console". The whole viewport is the dark render stage: chrome
 * knot center, nav overlaid in white, and the two destinations set as giant
 * typographic portals docked at the bottom. Hovering a portal feeds energy
 * into the 3D scene (spin-up + laser flare); clicking rides a view
 * transition into the page. Inner pages stay light — home is the machine.
 * Spec: `.brain/high-level-architecture/design-language.md` (HOME + 2026-07-21
 * amendments).
 */
export default function Home() {
  const { t } = useTranslation("home");
  const { t: tNav } = useTranslation("projects");
  const [hovered, setHovered] = useState<"work" | "marketplace" | null>(null);
  const [booted, setBooted] = useState(false);

  const energy = hovered ? 1 : 0;
  // Each portal projects its own phosphor sprite onto the CRT.
  const emoji =
    hovered === "work" ? "🛠️" : hovered === "marketplace" ? "🤖" : null;
  const markBooted = useCallback(() => setBooted(true), []);

  // A GPU that never produces a frame (or loses its context for good) must
  // not trap visitors behind the boot screen — the dark stage + portals are
  // a complete page on their own.
  useEffect(() => {
    const timer = setTimeout(markBooted, BOOT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [markBooted]);

  // For the visitor who opens devtools: ASCII CRT + a global hire().
  useEffect(() => {
    printConsoleEgg(console, window as unknown as Record<string, unknown>);
  }, []);

  return (
    <div
      data-testid="home-hero"
      className="relative flex min-h-svh flex-col overflow-hidden bg-[#141416]"
    >
      <BootLoader done={booted} />

      {/* Premium stage atmosphere — soft spotlight pool behind the object +
          fine photographic grain. Pure DOM, so it survives a dead GPU. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_52%_at_50%_36%,#232328_0%,#141416_72%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* The render is the page — full-bleed above the portal bar */}
      <HeroScene
        transparent
        energy={energy}
        emoji={emoji}
        onFirstFrame={markBooted}
        onContextLost={markBooted}
        className="absolute inset-x-0 top-0 bottom-64 h-auto w-auto sm:bottom-40"
      />

      {/* Overlay nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <Link
          to="/"
          data-testid="projects-wordmark"
          className="text-lg font-extrabold tracking-[-0.036em] text-pure-white"
        >
          {tNav("nav.wordmark")}
        </Link>
        <a
          href="mailto:sean@casperstudios.xyz"
          data-testid="nav-cta"
          className="rounded-[1.5px] border border-white/30 px-4 py-2 text-sm font-bold whitespace-nowrap text-pure-white transition-colors hover:border-pure-white hover:bg-pure-white hover:text-carbon"
        >
          {tNav("nav.cta")}
        </a>
      </header>

      {/* Identity block — description top-left */}
      <div className="relative z-10 px-6 sm:px-10">
        <h1
          data-testid="hero-headline"
          className="home-reveal max-w-56 text-base leading-[1.25] font-bold text-white/85 sm:max-w-xs"
        >
          {t("hero.role")}
        </h1>
      </div>

      {/* Sound control — top-right, under the nav CTA */}
      <SoundToggle className="absolute top-24 right-6 z-10 sm:right-10" />
      <StageLabel className="top-1/2 right-6 hidden -translate-y-1/2 text-right sm:block sm:right-10">
        PORTFOLIO — 2026
      </StageLabel>

      {/* Spacer — the object lives here */}
      <div className="flex-1" aria-hidden />

      {/* Meta row above the portals — availability left, version right */}
      <div className="home-reveal relative z-10 flex items-baseline justify-between gap-4 px-6 pb-4 [animation-delay:250ms] sm:px-10">
        <p className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase">
          {t("hero.location")}
          <span className="px-1.5" aria-hidden>
            ·
          </span>
          {t("hero.availability")}
        </p>
        <StageLabel className="static">v3.0</StageLabel>
      </div>

      {/* The portals — navigation as the page's typographic event.
          Opaque ink bar so the render never drowns the type. */}
      <nav className="relative z-10 grid grid-cols-1 border-t border-white/15 bg-[#141416] sm:grid-cols-2">
        <Portal
          to="/projects"
          testId="hero-cta-work"
          index="01"
          label={t("portals.work")}
          hint={t("portals.work_hint")}
          onExcite={() => setHovered("work")}
          onCalm={() => setHovered(null)}
          className="sm:border-r sm:border-white/15"
          delayMs={350}
        />
        <Portal
          to="/marketplace"
          testId="hero-cta-marketplace"
          index="02"
          label={t("portals.marketplace")}
          hint={t("portals.marketplace_hint")}
          onExcite={() => setHovered("marketplace")}
          onCalm={() => setHovered(null)}
          className="border-t border-white/15 sm:border-t-0"
          delayMs={450}
        />
      </nav>
    </div>
  );
}

interface PortalProps {
  to: string;
  testId: string;
  index: string;
  label: string;
  hint: string;
  onExcite: () => void;
  onCalm: () => void;
  className?: string;
  delayMs?: number;
}

/**
 * A portal: one destination as a giant typographic bar. Outlined-feeling
 * ghost type at rest; hover fills it white, slides the arrow, and (via
 * onExcite) wakes the 3D scene. Click navigates with a view transition.
 */
function Portal({
  to,
  testId,
  index,
  label,
  hint,
  onExcite,
  onCalm,
  className,
  delayMs = 0,
}: PortalProps) {
  return (
    <Link
      to={to}
      viewTransition
      data-testid={testId}
      onMouseEnter={onExcite}
      onMouseLeave={onCalm}
      onFocus={onExcite}
      onBlur={onCalm}
      className={cn(
        // Hover = full surface inversion (the design language's core move):
        // the whole bar flips white, type flips carbon.
        "group home-reveal relative flex items-end justify-between gap-4 px-6 py-7 transition-colors duration-300 hover:bg-pure-white sm:px-10 sm:py-9",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase transition-colors duration-300 group-hover:text-carbon/60">
          {index} — {hint}
        </span>
        {/* No hover on touch — portals rest brighter below sm */}
        <span className="text-[clamp(2.6rem,6.5vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.036em] text-white/80 transition-colors duration-300 group-hover:text-carbon sm:text-white/60">
          {label}
        </span>
      </span>
      <span
        className="pb-1 text-2xl text-white/40 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-carbon sm:text-3xl"
        aria-hidden
      >
        ↗
      </span>
    </Link>
  );
}

/** Tiny corner-anchored SF Mono utility label on the dark stage. */
function StageLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase",
        className
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}
