import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import { ProjectCard } from "@/components/project-card";
import { PortfolioNav } from "@/components/portfolio-nav";
import { listProjects } from "@/lib/content/projects";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/index";

export const handle = { i18n: ["projects"] };

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Work — Sean" },
    {
      name: "description",
      content: "Selected projects, tools, and experiments.",
    },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  // Full unfiltered set from bundled markdown — category filtering is applied
  // client-side (via `?category=` search param) so the pill row can always
  // show the full category list regardless of the active filter.
  return { projects: listProjects() };
}

export default function ProjectsIndex({ loaderData }: Route.ComponentProps) {
  const { projects } = loaderData;
  const { t } = useTranslation("projects");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  const categories = useMemo(() => {
    const unique = new Set(projects.map((p) => p.category));
    return Array.from(unique).sort();
  }, [projects]);

  const visible = activeCategory
    ? projects.filter((p) => p.category === activeCategory)
    : projects;

  const setCategory = (category: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (category) next.set("category", category);
        else next.delete("category");
        return next;
      },
      { preventScrollReset: true }
    );
  };

  return (
    <div className="min-h-svh bg-canvas-mist">
      <PortfolioNav />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-6">
        <header className="flex flex-col gap-6 pb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-6xl leading-[1.25] font-extrabold tracking-[-0.036em] text-carbon sm:text-7xl">
              {t("title")}
            </h1>
            <span
              className="font-mono text-xs font-semibold tracking-wider text-graphite/60 uppercase"
              data-testid="projects-count"
            >
              {t("count", { count: visible.length })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2" data-testid="project-filters">
            <FilterPill
              active={!activeCategory}
              onClick={() => setCategory(null)}
              testId="filter-all"
            >
              {t("filters.all")}
            </FilterPill>
            {categories.map((category) => (
              <FilterPill
                key={category}
                active={activeCategory === category}
                onClick={() => setCategory(category)}
                testId={`filter-${category}`}
              >
                {category}
              </FilterPill>
            ))}
          </div>
        </header>

        {visible.length === 0 ? (
          <p
            className="py-16 text-center font-medium text-graphite/60"
            data-testid="projects-empty"
          >
            {t("empty")}
          </p>
        ) : (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            data-testid="projects-grid"
          >
            {visible.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                featured={project.featured}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}

function FilterPill({ active, onClick, children, testId }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "rounded-[1.5px] border border-carbon px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider uppercase transition-colors",
        active
          ? "bg-carbon text-pure-white"
          : "bg-pure-white text-carbon hover:bg-canvas-mist"
      )}
    >
      {children}
    </button>
  );
}
