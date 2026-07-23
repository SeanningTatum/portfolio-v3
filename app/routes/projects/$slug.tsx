import { isRouteErrorResponse, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

import { PortfolioNav } from "@/components/portfolio-nav";
import { MacosFrame } from "@/components/macos-frame";
import { ProjectCover } from "@/components/project-cover";
import { getCaseStudy } from "@/lib/content/projects";
import { cn, splitParagraphs } from "@/lib/utils";
import type { Route } from "./+types/$slug";

export const handle = { i18n: ["projects"] };

// Fixed SF Mono eyebrows/subheads (design tokens, not user copy) per
// `.brain/high-level-architecture/design-language.md` "/projects/:id" —
// literal `01 — WHY` / `02 — HOW` / `03 — SOLUTION` labels are part of the
// visual identity, same precedent as the untranslated STACK/category tokens
// documented in `.brain/codebase/i18n.md` ("projects namespace"). Kept as
// plain constants rather than i18n keys; only genuine copy (prev/next
// labels, 404 message, back-to-projects link) goes through `t(...)`.
const SECTION_CONFIG = [
  { key: "why", index: "01", eyebrow: "WHY", heading: "Why" },
  { key: "how", index: "02", eyebrow: "HOW", heading: "How" },
  { key: "solution", index: "03", eyebrow: "SOLUTION", heading: "Solution" },
] as const;

export function meta({ data }: Route.MetaArgs) {
  if (!data) {
    return [{ title: "Project not found — Sean" }];
  }
  return [
    { title: `${data.project.title} — Sean` },
    { name: "description", content: data.project.summary },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  // Content is bundled markdown (see `@/lib/content/projects`), not a DB/tRPC
  // read — `getCaseStudy` returns the project + prev/next, or `undefined` for
  // an unknown slug. Translate the miss into React Router's throw-a-Response
  // 404 convention so the route-level `ErrorBoundary` below renders the
  // on-brand not-found page. Anything else is left to bubble to root.
  const caseStudy = getCaseStudy(params.slug);
  if (!caseStudy) {
    throw new Response("Not Found", { status: 404 });
  }
  return caseStudy;
}

export default function ProjectCaseStudy({ loaderData }: Route.ComponentProps) {
  const { project, prev, next } = loaderData;
  const { t } = useTranslation("projects");

  const metaEntries = [
    project.client ? { label: "CLIENT", value: project.client } : null,
    { label: "ROLE", value: project.role },
    { label: "STACK", value: project.stack.join(" · ") },
    { label: "YEAR", value: String(project.year) },
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  const sections = SECTION_CONFIG.map((section) => ({
    ...section,
    body: project[section.key],
  })).filter(
    (section): section is (typeof SECTION_CONFIG)[number] & { body: string } =>
      Boolean(section.body)
  );

  const stats = project.statsJson ?? [];

  return (
    <div className="min-h-svh bg-canvas-mist">
      <PortfolioNav />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-6">
        <header className="flex flex-col gap-4 pb-10">
          <h1
            data-testid="case-study-title"
            className="text-5xl leading-[1.25] font-extrabold tracking-[-0.036em] text-carbon sm:text-6xl"
          >
            {project.title}
          </h1>
          <p className="max-w-2xl font-medium text-graphite/70">
            {project.summary}
          </p>
        </header>

        <div
          data-testid="case-study-meta"
          className={cn(
            "mb-10 grid grid-cols-2 divide-x divide-pale-stone border-y border-pale-stone",
            metaEntries.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"
          )}
        >
          {metaEntries.map((entry) => (
            <div key={entry.label} className="flex flex-col gap-1 px-4 py-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-graphite/50">
                {entry.label}
              </span>
              <span className="font-bold text-carbon">{entry.value}</span>
            </div>
          ))}
        </div>

        <MacosFrame
          className="mb-14 w-full"
          contentClassName="aspect-video w-full"
        >
          {project.heroImageUrl ? (
            <img
              src={project.heroImageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <ProjectCover project={project} hero />
          )}
        </MacosFrame>

        {sections.length > 0 && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[160px_1fr]">
            <nav data-testid="case-study-toc" className="hidden lg:block">
              <div className="sticky top-10 flex flex-col gap-3">
                {sections.map((section) => (
                  <a
                    key={section.key}
                    href={`#${section.key}`}
                    className="font-mono text-[11px] font-semibold uppercase tracking-wider text-graphite/50 transition-colors hover:text-carbon"
                  >
                    {section.index} — {section.eyebrow}
                  </a>
                ))}
              </div>
            </nav>

            <div className="flex max-w-[680px] flex-col gap-14">
              {sections.map((section) => (
                <section
                  key={section.key}
                  id={section.key}
                  data-testid={`case-study-${section.key}`}
                  className="scroll-mt-10"
                >
                  <h2 className="mb-4 flex items-baseline gap-3 text-2xl font-bold text-carbon">
                    <span
                      className="font-mono text-[11px] font-extrabold tracking-[0.18em] text-graphite/50 uppercase"
                      aria-hidden
                    >
                      {section.index}
                    </span>
                    {section.heading}
                  </h2>
                  <div className="flex flex-col gap-4 leading-[1.25] text-graphite/80">
                    {splitParagraphs(section.body).map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {stats.length > 0 && (
          <div
            data-testid="case-study-stats"
            className="mt-16 grid grid-cols-2 gap-8 border-t border-pale-stone pt-10 sm:grid-cols-3"
          >
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-4xl font-extrabold tracking-[-0.036em] text-carbon">
                  {stat.value}
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-graphite/50">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {(prev || next) && (
          <footer className="mt-20 flex flex-col gap-6 border-t border-pale-stone pt-8 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Link
                to={`/projects/${prev.slug}`}
                data-testid="case-study-prev"
                className="group flex items-center gap-2"
              >
                <IconArrowLeft
                  className="size-4 shrink-0 text-carbon transition-transform group-hover:-translate-x-0.5"
                  aria-hidden
                />
                <span className="flex flex-col">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-graphite/50">
                    {t("caseStudy.prev")}
                  </span>
                  <span className="font-bold text-carbon">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to={`/projects/${next.slug}`}
                data-testid="case-study-next"
                className="group flex items-center gap-2 sm:flex-row-reverse sm:text-right"
              >
                <IconArrowRight
                  className="size-4 shrink-0 text-carbon transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
                <span className="flex flex-col sm:items-end">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-graphite/50">
                    {t("caseStudy.next")}
                  </span>
                  <span className="font-bold text-carbon">{next.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
          </footer>
        )}
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation("projects");

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="flex min-h-svh flex-col bg-canvas-mist">
        <PortfolioNav />
        <main className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1
            data-testid="case-study-not-found-title"
            className="text-4xl font-extrabold tracking-[-0.036em] text-carbon"
          >
            {t("caseStudy.notFound.title")}
          </h1>
          <p className="max-w-md font-medium text-graphite/70">
            {t("caseStudy.notFound.message")}
          </p>
          <Link
            to="/projects"
            data-testid="case-study-back-to-projects"
            className="rounded-[1.5px] bg-carbon px-4 py-2 font-bold text-pure-white transition-opacity hover:opacity-90"
          >
            {t("caseStudy.notFound.back")}
          </Link>
        </main>
      </div>
    );
  }

  // Anything that isn't the 404 case we own — bubble to root's generic
  // ErrorBoundary rather than duplicating its unexpected-error handling.
  throw error;
}
