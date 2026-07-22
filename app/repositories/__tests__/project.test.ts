import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer, Exit, Cause } from "effect";
import { ProjectRepository } from "../project";
import { chainable, makeTestDatabase } from "@/services/database.test-layer";
import { NotFoundError, QueryError } from "@/models/errors/repository";

const provideStub = (stub: unknown) =>
  ProjectRepository.Default.pipe(Layer.provide(makeTestDatabase(stub)));

const throwingStub = {
  select: () => {
    throw new Error("boom");
  },
};

const sampleProjects = [
  {
    id: "seed-portfolio-v3",
    slug: "portfolio-v3",
    title: "portfolio-v3",
    summary: "This very site — Cloudflare Workers + tRPC + Effect TS.",
    category: "saas",
    year: 2026,
    stack: ["react-router", "cloudflare-workers", "effect"],
    role: "Solo builder",
    thumbnailUrl: null,
    featured: true,
    sortOrder: 0,
  },
  {
    id: "seed-day-trader",
    slug: "day-trader",
    title: "Day Trader",
    summary: "Paper-trading simulator with live market data.",
    category: "tooling",
    year: 2025,
    stack: ["next.js", "postgres"],
    role: "Full-stack engineer",
    thumbnailUrl: null,
    featured: false,
    sortOrder: 1,
  },
];

describe("ProjectRepository.list", () => {
  it.effect("returns projects ordered featured desc then sortOrder", () => {
    const stub = { select: () => chainable(sampleProjects) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.list();
      expect(result).toEqual(sampleProjects);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("filters by category when provided", () => {
    const filtered = [sampleProjects[1]];
    const stub = { select: () => chainable(filtered) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.list({ category: "tooling" });
      expect(result).toEqual(filtered);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("fails with QueryError when select throws", () =>
    Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const exit = yield* Effect.exit(repo.list());
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const failure = Cause.failureOption(exit.cause);
        expect(failure._tag).toBe("Some");
        if (failure._tag === "Some") {
          expect(failure.value).toBeInstanceOf(QueryError);
        }
      }
    }).pipe(Effect.provide(provideStub(throwingStub)))
  );
});

describe("ProjectRepository.getBySlug", () => {
  it.effect("returns the project when found", () => {
    const stub = { select: () => chainable([sampleProjects[0]]) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.getBySlug({ slug: "portfolio-v3" });
      expect(result).toEqual(sampleProjects[0]);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("fails with NotFoundError when missing", () => {
    const stub = { select: () => chainable([]) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const exit = yield* Effect.exit(repo.getBySlug({ slug: "missing" }));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const failure = Cause.failureOption(exit.cause);
        expect(failure._tag).toBe("Some");
        if (failure._tag === "Some") {
          expect(failure.value).toBeInstanceOf(NotFoundError);
          expect((failure.value as NotFoundError).entity).toBe("project");
          expect((failure.value as NotFoundError).identifier).toBe("missing");
        }
      }
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("fails with QueryError when select throws", () =>
    Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const exit = yield* Effect.exit(repo.getBySlug({ slug: "portfolio-v3" }));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const failure = Cause.failureOption(exit.cause);
        expect(failure._tag).toBe("Some");
        if (failure._tag === "Some") {
          expect(failure.value).toBeInstanceOf(QueryError);
        }
      }
    }).pipe(Effect.provide(provideStub(throwingStub)))
  );
});

describe("ProjectRepository.getAdjacent", () => {
  // Local 3-row fixture (distinct from `sampleProjects`) so prev/next can be
  // asserted unambiguously — with only 2 rows, wrap-around makes prev===next
  // for either project, which doesn't exercise the "true middle" case.
  const threeRows = [
    { slug: "alpha", title: "Alpha" },
    { slug: "beta", title: "Beta" },
    { slug: "gamma", title: "Gamma" },
  ];

  it.effect("returns prev/next for a middle project", () => {
    const stub = { select: () => chainable(threeRows) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.getAdjacent({ slug: "beta" });
      expect(result).toEqual({
        prev: { slug: "alpha", title: "Alpha" },
        next: { slug: "gamma", title: "Gamma" },
      });
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("wraps around: first project's prev is the last", () => {
    const stub = { select: () => chainable(threeRows) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.getAdjacent({ slug: "alpha" });
      expect(result).toEqual({
        prev: { slug: "gamma", title: "Gamma" },
        next: { slug: "beta", title: "Beta" },
      });
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("wraps around: last project's next is the first", () => {
    const stub = { select: () => chainable(threeRows) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.getAdjacent({ slug: "gamma" });
      expect(result).toEqual({
        prev: { slug: "beta", title: "Beta" },
        next: { slug: "alpha", title: "Alpha" },
      });
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("returns null/null when only one project exists", () => {
    const stub = { select: () => chainable([threeRows[0]]) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.getAdjacent({ slug: "alpha" });
      expect(result).toEqual({ prev: null, next: null });
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("returns null/null when the slug isn't found", () => {
    const stub = { select: () => chainable(threeRows) };
    return Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const result = yield* repo.getAdjacent({ slug: "missing" });
      expect(result).toEqual({ prev: null, next: null });
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("fails with QueryError when select throws", () =>
    Effect.gen(function* () {
      const repo = yield* ProjectRepository;
      const exit = yield* Effect.exit(repo.getAdjacent({ slug: "alpha" }));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const failure = Cause.failureOption(exit.cause);
        expect(failure._tag).toBe("Some");
        if (failure._tag === "Some") {
          expect(failure.value).toBeInstanceOf(QueryError);
        }
      }
    }).pipe(Effect.provide(provideStub(throwingStub)))
  );
});
