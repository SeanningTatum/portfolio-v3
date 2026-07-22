import { Link } from "react-router";
import { useTranslation } from "react-i18next";

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
          className="hidden font-bold text-carbon sm:inline-flex"
        >
          {t("nav.projects")}
        </Link>
        <Link
          to="/marketplace"
          data-testid="nav-marketplace"
          className="hidden font-medium text-graphite/70 transition-colors hover:text-carbon sm:inline-flex"
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
