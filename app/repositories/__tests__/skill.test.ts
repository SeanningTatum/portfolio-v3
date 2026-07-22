import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer, Exit, Cause } from "effect";
import { SkillRepository } from "../skill";
import { chainable, makeTestDatabase } from "@/services/database.test-layer";
import { QueryError } from "@/models/errors/repository";

const provideStub = (stub: unknown) =>
  SkillRepository.Default.pipe(Layer.provide(makeTestDatabase(stub)));

const throwingStub = {
  select: () => {
    throw new Error("boom");
  },
};

const sampleSkills = [
  {
    id: "seed-skill-client-review",
    slug: "client-review",
    name: "Client Review",
    description: "Turn any HTML doc into an offline commentable artifact.",
    type: "skill",
    category: "engineering",
    plugin: "engineering-toolkit",
    marketplaceRepo: "sean-skills",
    repoUrl:
      "https://github.com/SeanningTatum/marketplace/tree/main/plugins/engineering-toolkit",
    isNew: true,
    sortOrder: 0,
  },
  {
    id: "seed-skill-auth",
    slug: "auth",
    name: "Auth",
    description: "Better Auth authentication patterns and conventions.",
    type: "skill",
    category: "stack-conventions",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl:
      "https://github.com/SeanningTatum/claude-plugins/tree/main/plugins/cf-saas-stack",
    isNew: false,
    sortOrder: 6,
  },
  {
    id: "seed-skill-pr-checker",
    slug: "pr-checker",
    name: "PR Checker",
    description: "Validate that changes follow project standards before a PR.",
    type: "command",
    category: "commands",
    plugin: "cf-saas-stack",
    marketplaceRepo: "seanningtatum-plugins",
    repoUrl:
      "https://github.com/SeanningTatum/claude-plugins/tree/main/plugins/cf-saas-stack",
    isNew: false,
    sortOrder: 43,
  },
];

describe("SkillRepository.list", () => {
  it.effect("returns all skills ordered by sortOrder then name", () => {
    const stub = { select: () => chainable(sampleSkills) };
    return Effect.gen(function* () {
      const repo = yield* SkillRepository;
      const result = yield* repo.list();
      expect(result).toEqual(sampleSkills);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("filters by category when provided", () => {
    const filtered = [sampleSkills[1]];
    const stub = { select: () => chainable(filtered) };
    return Effect.gen(function* () {
      const repo = yield* SkillRepository;
      const result = yield* repo.list({ category: "stack-conventions" });
      expect(result).toEqual(filtered);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("filters by type when provided", () => {
    const filtered = [sampleSkills[2]];
    const stub = { select: () => chainable(filtered) };
    return Effect.gen(function* () {
      const repo = yield* SkillRepository;
      const result = yield* repo.list({ type: "command" });
      expect(result).toEqual(filtered);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("filters by combined category + type", () => {
    const filtered = [sampleSkills[2]];
    const stub = { select: () => chainable(filtered) };
    return Effect.gen(function* () {
      const repo = yield* SkillRepository;
      const result = yield* repo.list({
        category: "commands",
        type: "command",
      });
      expect(result).toEqual(filtered);
    }).pipe(Effect.provide(provideStub(stub)));
  });

  it.effect("fails with QueryError when select throws", () =>
    Effect.gen(function* () {
      const repo = yield* SkillRepository;
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
