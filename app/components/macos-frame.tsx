import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MacosFrameProps {
  children: ReactNode;
  /** Optional title-bar label, rendered centered in SF Mono. */
  title?: string;
  className?: string;
  /** Applied to the content wrapper below the title bar. */
  contentClassName?: string;
  /** Shrinks dot size + bar padding for card-scale (non-hero) usage. */
  compact?: boolean;
}

/**
 * Reusable macOS-style window-chrome card — grayscale traffic-light dots +
 * title bar, white surface, soft 20-25px radius, hairline `--pale-stone`
 * border. Frames media/3D content per the desktop.fm design language
 * (`.brain/high-level-architecture/design-language.md`, "Core system" +
 * "Global rules"). Shared by the home hero, project cards, and case-study
 * hero images — keep this generic, no page-specific styling here.
 */
export function MacosFrame({
  children,
  title,
  className,
  contentClassName,
  compact = false,
}: MacosFrameProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[22px] border border-pale-stone bg-pure-white",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center gap-1.5 border-b border-pale-stone",
          compact ? "px-2.5 py-1.5" : "px-4 py-2.5"
        )}
      >
        <span
          className={cn("rounded-full bg-silver-mist", compact ? "size-1.5" : "size-2.5")}
          aria-hidden
        />
        <span
          className={cn("rounded-full bg-silver-mist", compact ? "size-1.5" : "size-2.5")}
          aria-hidden
        />
        <span
          className={cn("rounded-full bg-silver-mist", compact ? "size-1.5" : "size-2.5")}
          aria-hidden
        />
        {title ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-x-0 text-center font-mono font-semibold uppercase tracking-wider text-graphite/70",
              compact ? "text-[9px]" : "text-[11px]"
            )}
          >
            {title}
          </span>
        ) : null}
      </div>
      <div className={cn("min-h-0 flex-1", contentClassName)}>{children}</div>
    </div>
  );
}
