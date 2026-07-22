import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Slim top nav shared by the public portfolio surfaces (`/projects`,
 * `/projects/:slug`, ...): wordmark left, projects/marketplace links + one
 * filled `#111` CTA right (design spec: `.brain/high-level-architecture/
 * design-language.md`, HOME "Slim nav" + global rules). Extracted from
 * `routes/projects/index.tsx` (feat-008) when the case-study page (feat-009)
 * needed the identical nav — kept generic, no page-specific styling here.
 */
export function PortfolioNav() {
  const { t } = useTranslation("projects");
  // Active section = bold carbon; the other link stays muted. Path check
  // tolerates the optional `/:lng` locale prefix.
  const { pathname } = useLocation();
  const onMarketplace = pathname.includes("/marketplace");
  const linkClass = (active: boolean) =>
    cn(
      "hidden sm:inline-flex",
      active
        ? "font-bold text-carbon"
        : "font-medium text-graphite/70 transition-colors hover:text-carbon"
    );

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link
        to="/"
        data-testid="projects-wordmark"
        className="text-lg font-extrabold tracking-[-0.036em] text-carbon"
      >
        {t("nav.wordmark")}
      </Link>
      <nav className="flex items-center gap-3 sm:gap-6">
        <Link
          to="/projects"
          data-testid="nav-projects"
          className={linkClass(!onMarketplace)}
        >
          {t("nav.projects")}
        </Link>
        <Link
          to="/marketplace"
          data-testid="nav-marketplace"
          className={linkClass(onMarketplace)}
        >
          {t("nav.marketplace")}
        </Link>
        <a
          href="mailto:sean@casperstudios.xyz"
          data-testid="nav-cta"
          className="whitespace-nowrap rounded-[1.5px] bg-carbon px-4 py-2 font-bold text-pure-white transition-opacity hover:opacity-90"
        >
          {t("nav.cta")}
        </a>
      </nav>
    </header>
  );
}
