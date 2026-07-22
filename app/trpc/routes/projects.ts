import { Effect, Schema } from "effect";
import { createTRPCRouter, publicProcedure } from "..";
import { runProcedure } from "@/lib/effect-trpc";
import { ProjectRepository } from "@/repositories/project";
import { ListProjectsInput, GetProjectBySlugInput } from "@/lib/schemas/project";

// Portfolio is public — no auth gating on either procedure.
export const projectsRouter = createTRPCRouter({
  list: publicProcedure
    .input(Schema.standardSchemaV1(ListProjectsInput))
    .query(({ ctx, input }) =>
      runProcedure(
        ctx.runtime,
        Effect.gen(function* () {
          const repo = yield* ProjectRepository;
          return yield* repo.list(input);
        })
      )
    ),

  getBySlug: publicProcedure
    .input(Schema.standardSchemaV1(GetProjectBySlugInput))
    .query(({ ctx, input }) =>
      runProcedure(
        ctx.runtime,
        Effect.gen(function* () {
          const repo = yield* ProjectRepository;
          return yield* repo.getBySlug(input);
        })
      )
    ),

  // Case-study page (feat-009) needs the project row + prev/next in one
  // round trip. New procedure rather than folding into `getBySlug` — the
  // list page's card grid only ever needs the bare project row via
  // `getBySlug`'s existing shape (kept unchanged, avoids widening every
  // caller's payload), while the detail page needs project+prev+next
  // together. Composed here (not inside the repo) so `ProjectRepository`
  // keeps one query per method per `rules/repository.md`.
  getCaseStudy: publicProcedure
    .input(Schema.standardSchemaV1(GetProjectBySlugInput))
    .query(({ ctx, input }) =>
      runProcedure(
        ctx.runtime,
        Effect.gen(function* () {
          const repo = yield* ProjectRepository;
          const project = yield* repo.getBySlug(input);
          const adjacent = yield* repo.getAdjacent(input);
          return { project, ...adjacent };
        })
      )
    ),
});
