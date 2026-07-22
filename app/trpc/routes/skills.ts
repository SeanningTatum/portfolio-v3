import { Effect, Schema } from "effect";
import { createTRPCRouter, publicProcedure } from "..";
import { runProcedure } from "@/lib/effect-trpc";
import { SkillRepository } from "@/repositories/skill";
import { ListSkillsInput } from "@/lib/schemas/skill";

// Marketplace is public — no auth gating.
export const skillsRouter = createTRPCRouter({
  list: publicProcedure
    .input(Schema.standardSchemaV1(ListSkillsInput))
    .query(({ ctx, input }) =>
      runProcedure(
        ctx.runtime,
        Effect.gen(function* () {
          const repo = yield* SkillRepository;
          return yield* repo.list(input);
        })
      )
    ),
});
