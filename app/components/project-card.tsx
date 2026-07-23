import { Link } from "react-router";
import { IconArrowUpRight } from "@tabler/icons-react";
import { MacosFrame } from "@/components/macos-frame";
import { ProjectCover } from "@/components/project-cover";
import { getProjectMeta } from "@/lib/project-meta";
import { cn } from "@/lib/utils";
import type { ProjectContent } from "@/lib/schemas/project";

interface ProjectCardProps {
  project: ProjectContent;
  /**
   * Full-width horizontal treatment for the one featured card per grid
   * (design spec: "/projects (list)" — one full-width featured card per 4
   * items). Caller decides which project(s) get this via `project.featured`.
   */
  featured?: boolean;
}

/**
 * Project grid card per the desktop.fm design language
 * (`.brain/high-level-architecture/design-language.md`): thumbnail in a mini
 * macOS-chrome frame, title (700), one-line summary (500, muted), SF Mono
 * meta row `YEAR · STACK · ROLE`. Hover swaps the hairline border for
 * carbon + slides the arrow — no shadow, no lift.
 */
export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const meta = getProjectMeta(project);

  return (
    <Link
      to={`/projects/${project.slug}`}
      data-testid={`project-card-${project.slug}`}
      className={cn(
        "group flex flex-col gap-4 rounded-[22px] border border-pale-stone bg-pure-white p-4 transition-colors hover:border-carbon",
        featured && "md:col-span-2 md:flex-row md:items-center md:gap-8 md:p-6"
      )}
    >
      <MacosFrame
        compact
        className={cn("w-full shrink-0", featured && "md:w-1/2")}
        contentClassName="aspect-video w-full"
      >
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <ProjectCover
            project={project}
            className="transition-transform duration-500 group-hover:scale-[1.015]"
          />
        )}
      </MacosFrame>

      <div className={cn("flex flex-1 flex-col gap-2", featured && "md:gap-3")}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-bold text-carbon",
              featured ? "text-2xl" : "text-lg"
            )}
          >
            {project.title}
          </h3>
          <IconArrowUpRight
            className="mt-1 size-4 shrink-0 text-carbon transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </div>
        <p className="line-clamp-1 font-medium text-graphite/70">
          {project.summary}
        </p>
        <p className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-graphite/50">
          {meta.join(" · ")}
        </p>
      </div>
    </Link>
  );
}
