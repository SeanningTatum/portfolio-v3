import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { BootLoader } from "@/components/boot-loader";
import { HeroScene } from "@/components/hero-scene";
import { SoundToggle } from "@/components/sound-toggle";
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
  const [energy, setEnergy] = useState(0);
  const [booted, setBooted] = useState(false);

  const excite = () => setEnergy(1);
  const calm = () => setEnergy(0);
  const markBooted = useCallback(() => setBooted(true), []);

  // A GPU that never produces a frame (or loses its context for good) must
  // not trap visitors behind the boot screen — the dark stage + portals are
  // a complete page on their own.
  useEffect(() => {
    const timer = setTimeout(markBooted, BOOT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [markBooted]);

  return (
    <div
      data-testid="home-hero"
      className="relative flex min-h-svh flex-col overflow-hidden bg-[#141416]"
    >
      <BootLoader done={booted} />

      {/* The render is the page — full-bleed, behind everything */}
      <HeroScene
        transparent
        energy={energy}
        onFirstFrame={markBooted}
        onContextLost={markBooted}
        className="absolute inset-0 h-auto w-auto"
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

      {/* Identity block — quiet, top-left */}
      <div className="relative z-10 px-6 sm:px-10">
        <h1
          data-testid="hero-headline"
          className="home-reveal max-w-sm text-base leading-[1.25] font-bold text-white/85"
        >
          {t("hero.name")}
          <span className="block font-medium text-white/50">
            {t("hero.role")}
          </span>
        </h1>
      </div>

      {/* Corner labels — on the stage */}
      <div className="absolute top-24 right-6 z-10 flex flex-col items-end gap-2 sm:right-10">
        <StageLabel className="static">GMT+8</StageLabel>
        <SoundToggle />
      </div>
      <StageLabel className="top-1/2 left-6 hidden -translate-y-1/2 sm:block sm:left-10">
        v3.0
      </StageLabel>
      <StageLabel className="top-1/2 right-6 hidden -translate-y-1/2 text-right sm:block sm:right-10">
        PORTFOLIO — 2026
      </StageLabel>

      {/* Spacer — the knot lives here */}
      <div className="flex-1" aria-hidden />

      {/* Availability line above the portals */}
      <p className="home-reveal relative z-10 px-6 pb-4 font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase [animation-delay:250ms] sm:px-10">
        {t("hero.location")}
        <span className="px-1.5" aria-hidden>
          ·
        </span>
        {t("hero.availability")}
      </p>

      {/* The portals — navigation as the page's typographic event */}
      <nav className="relative z-10 grid grid-cols-1 border-t border-white/15 sm:grid-cols-2">
        <Portal
          to="/projects"
          testId="hero-cta-work"
          index="01"
          label={t("portals.work")}
          hint={t("portals.work_hint")}
          onExcite={excite}
          onCalm={calm}
          className="sm:border-r sm:border-white/15"
          delayMs={350}
        />
        <Portal
          to="/marketplace"
          testId="hero-cta-marketplace"
          index="02"
          label={t("portals.marketplace")}
          hint={t("portals.marketplace_hint")}
          onExcite={excite}
          onCalm={calm}
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
        "group home-reveal relative flex items-end justify-between gap-4 px-6 py-7 transition-colors duration-300 hover:bg-white/[0.04] sm:px-10 sm:py-9",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/40 uppercase">
          {index} — {hint}
        </span>
        {/* No hover on touch — portals rest brighter below sm */}
        <span className="text-[clamp(2.6rem,6.5vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.036em] text-white/70 transition-colors duration-300 group-hover:text-pure-white sm:text-white/25">
          {label}
        </span>
      </span>
      <span
        className="pb-1 text-2xl text-white/40 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-pure-white sm:text-3xl"
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
