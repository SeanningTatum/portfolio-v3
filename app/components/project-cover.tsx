import { cn } from "@/lib/utils";
import type { ProjectContent } from "@/lib/schemas/project";

interface ProjectCoverProps {
  project: Pick<ProjectContent, "slug" | "title" | "year" | "category">;
  /** Taller composition for the case-study hero. */
  hero?: boolean;
  className?: string;
}

/**
 * Generative editorial cover — the designed stand-in for a project screenshot.
 * Dark graphite plate on the light page (surface inversion, no shadows), with
 * the project title set huge and deliberately cropped at the right edge, a
 * mono index row on top, and hairline crosshair marks. Deterministic per
 * project — no image assets required, always on-brand.
 */
export function ProjectCover({ project, hero = false, className }: ProjectCoverProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative size-full overflow-hidden bg-[#161618] select-none",
        className
      )}
    >
      {/* Mono index row */}
      <div className="absolute inset-x-4 top-3 flex items-baseline justify-between sm:inset-x-5 sm:top-4">
        <span className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/45 uppercase">
          {project.slug}
        </span>
        <span className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-white/45 uppercase">
          {project.year}
        </span>
      </div>

      {/* Crosshair marks — quiet Lusion-style registration points */}
      <CrossMark className="top-9 left-4 sm:left-5" />
      <CrossMark className="right-4 bottom-4 sm:right-5" />

      {/* Cropped display title — runs off the right edge on purpose */}
      <div
        className={cn(
          "absolute -right-[6%] bottom-0 left-4 sm:left-5",
          hero ? "bottom-2" : "-bottom-1"
        )}
      >
        <p
          className={cn(
            "font-extrabold tracking-[-0.036em] whitespace-nowrap text-pure-white/90",
            hero
              ? "text-[clamp(4rem,10vw,9rem)] leading-none"
              : "text-[clamp(3rem,6vw,5rem)] leading-none"
          )}
        >
          {project.title}
        </p>
      </div>

      {/* Category tag */}
      <span className="absolute right-4 top-9 rounded-[1.5px] border border-white/25 px-1.5 py-0.5 font-mono text-[9px] font-extrabold tracking-[0.18em] text-white/55 uppercase sm:right-5">
        {project.category}
      </span>
    </div>
  );
}

function CrossMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute font-mono text-[10px] font-extrabold text-white/30",
        className
      )}
    >
      +
    </span>
  );
}
