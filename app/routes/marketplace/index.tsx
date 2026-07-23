import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  IconArrowUpRight,
  IconRobot,
  IconScale,
  IconSearch,
  IconSparkles,
  IconTerminal2,
  IconWebhook,
} from "@tabler/icons-react";

import { PortfolioNav } from "@/components/portfolio-nav";
import { listSkills } from "@/lib/content/skills";
import { cn } from "@/lib/utils";
import type { SkillContent } from "@/lib/schemas/skill";
import type { Route } from "./+types/index";

export const handle = { i18n: ["marketplace", "projects"] };

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Marketplace — Sean" },
    {
      name: "description",
      content: "Claude Code skills, commands, and agents Sean built agentically.",
    },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  // Full unfiltered set from bundled markdown — category + search narrowing
  // happen client-side so the sidebar always shows every category with its
  // true count (same call as /projects makes for its filter pills).
  return { skills: listSkills() };
}

type SortMode = "az" | "newFirst";

export default function MarketplaceIndex({ loaderData }: Route.ComponentProps) {
  const { skills } = loaderData;
  const { t } = useTranslation("marketplace");
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("az");

  const activeCategory = searchParams.get("category");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const skill of skills) {
      counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
    }
    // Sidebar follows seed sortOrder (engineering → stack → workflow →
    // commands → agents), not alphabetical — the seed already encodes the
    // reading order. A Set dedupes while preserving first-seen order.
    const seen = new Set(skills.map((skill) => skill.category));
    return [...seen].map((category) => ({
      category,
      count: counts.get(category) ?? 0,
    }));
  }, [skills]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = skills.filter((skill) => {
      if (activeCategory && skill.category !== activeCategory) return false;
      if (!q) return true;
      return (
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.plugin.toLowerCase().includes(q)
      );
    });
    if (sort === "az") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filtered].sort(
      (a, b) =>
        Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name)
    );
  }, [skills, activeCategory, query, sort]);

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
        {/* Title block + search */}
        <header className="flex flex-col gap-6 pb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-6xl leading-[1.25] font-extrabold tracking-[-0.036em] text-carbon sm:text-7xl">
              {t("title")}
            </h1>
            <span
              className="font-mono text-xs font-extrabold tracking-wider text-graphite/60 uppercase"
              data-testid="marketplace-count"
            >
              {t("count", { count: visible.length })}
            </span>
          </div>

          <p className="max-w-xl font-medium text-graphite/70">{t("intro")}</p>

          <label className="relative block max-w-md">
            <IconSearch
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-graphite/50"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.label")}
              data-testid="marketplace-search"
              className="w-full rounded-[1.5px] border border-pale-stone bg-pure-white py-2.5 pr-4 pl-10 font-medium text-carbon transition-colors outline-none placeholder:text-graphite/40 focus:border-carbon"
            />
          </label>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Category list — sticky text list on desktop, scroll row on mobile */}
          <aside className="lg:w-52 lg:shrink-0">
            <nav
              data-testid="marketplace-categories"
              className="flex gap-x-5 gap-y-2 overflow-x-auto pb-2 lg:sticky lg:top-6 lg:flex-col lg:gap-y-3 lg:overflow-visible lg:pb-0"
            >
              <CategoryLink
                active={!activeCategory}
                onClick={() => setCategory(null)}
                label={t("sidebar.all")}
                count={skills.length}
                testId="category-all"
              />
              {categories.map(({ category, count }) => (
                <CategoryLink
                  key={category}
                  active={activeCategory === category}
                  onClick={() => setCategory(category)}
                  label={t(`categories.${category}`, {
                    defaultValue: category,
                  })}
                  count={count}
                  testId={`category-${category}`}
                />
              ))}
            </nav>
          </aside>

          {/* Grid + sort */}
          <section className="flex-1">
            <div className="flex items-center justify-end pb-4">
              <label className="flex items-center gap-2 font-mono text-[11px] font-extrabold tracking-wider text-graphite/50 uppercase">
                {t("sort.label")}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortMode)}
                  data-testid="marketplace-sort"
                  className="rounded-[1.5px] border border-pale-stone bg-pure-white px-2 py-1 font-mono text-[11px] font-extrabold tracking-wider text-carbon uppercase outline-none focus:border-carbon"
                >
                  <option value="az">{t("sort.az")}</option>
                  <option value="newFirst">{t("sort.newFirst")}</option>
                </select>
              </label>
            </div>

            {visible.length === 0 ? (
              <p
                className="py-16 text-center font-medium text-graphite/60"
                data-testid="marketplace-empty"
              >
                {t("empty")}
              </p>
            ) : (
              <div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="marketplace-grid"
              >
                {visible.map((skill) => (
                  <SkillCard key={skill.slug} skill={skill} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Request-a-tool banner — the page's single surface inversion */}
        <aside
          data-testid="marketplace-banner"
          className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[22px] bg-carbon p-8 sm:flex-row sm:items-center sm:p-10"
        >
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-extrabold tracking-[-0.036em] text-pure-white">
              {t("banner.title")}
            </h2>
            <p className="max-w-md font-medium text-white/60">
              {t("banner.body")}
            </p>
          </div>
          <a
            href="mailto:sean@casperstudios.xyz"
            className="rounded-[1.5px] bg-pure-white px-5 py-2.5 font-bold whitespace-nowrap text-carbon transition-opacity hover:opacity-90"
          >
            {t("banner.cta")}
          </a>
        </aside>
      </main>
    </div>
  );
}

interface CategoryLinkProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  testId: string;
}

/**
 * Sidebar category entry — plain text list per the marketplace spec (NOT
 * pills; text scans better past 6 categories). Active = carbon 700.
 */
function CategoryLink({
  active,
  onClick,
  label,
  count,
  testId,
}: CategoryLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-baseline gap-2 text-left whitespace-nowrap transition-colors",
        active
          ? "font-bold text-carbon"
          : "font-medium text-graphite/60 hover:text-carbon"
      )}
    >
      {label}
      <span className="font-mono text-[10px] font-extrabold text-graphite/40">
        {count}
      </span>
    </button>
  );
}

const TYPE_ICONS = {
  skill: IconSparkles,
  command: IconTerminal2,
  agent: IconRobot,
  rule: IconScale,
  hook: IconWebhook,
} as const;

/**
 * Marketplace card per the design spec: icon in a soft square, name (700),
 * one-liner (500), SF Mono footer with a hairline top border. `NEW` badge as
 * SF Mono outline — never colored. Uniform heights via line-clamp + mt-auto
 * footer. Links out to the plugin's GitHub folder.
 */
function SkillCard({ skill }: { skill: SkillContent }) {
  const { t } = useTranslation("marketplace");
  const Icon =
    TYPE_ICONS[skill.type as keyof typeof TYPE_ICONS] ?? IconSparkles;

  return (
    <a
      href={skill.repoUrl}
      target="_blank"
      rel="noreferrer"
      data-testid={`skill-card-${skill.slug}`}
      className="group flex flex-col gap-4 rounded-[20px] border border-pale-stone bg-pure-white p-5 transition-colors hover:border-carbon"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-14 items-center justify-center rounded-[25px] bg-canvas-mist">
          <Icon className="size-6 text-carbon" stroke={1.75} aria-hidden />
        </span>
        <span className="flex items-center gap-2">
          {skill.isNew && (
            <span className="rounded-[1.5px] border border-carbon px-1.5 py-0.5 font-mono text-[10px] font-extrabold tracking-wider text-carbon uppercase">
              {t("badgeNew")}
            </span>
          )}
          <IconArrowUpRight
            className="size-4 text-graphite/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-carbon"
            aria-hidden
          />
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-carbon">{skill.name}</h3>
        <p className="line-clamp-2 text-sm font-medium text-graphite/70">
          {skill.description}
        </p>
      </div>

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-pale-stone pt-3">
        <span className="font-mono text-[10px] font-extrabold tracking-wider text-graphite/50 uppercase">
          {t(`types.${skill.type}`, { defaultValue: skill.type })}
        </span>
        <span className="truncate font-mono text-[10px] font-extrabold tracking-wider text-graphite/40 uppercase">
          {skill.plugin}
        </span>
      </div>
    </a>
  );
}
