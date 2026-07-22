import { Effect } from "effect";
import { and, asc, eq } from "drizzle-orm";
import { skill } from "@/db/schema";
import { Database } from "@/services/database";
import { tryQuery } from "@/lib/effect-utils";
import type { ListSkillsInput } from "@/lib/schemas/skill";

export class SkillRepository extends Effect.Service<SkillRepository>()(
  "app/SkillRepository",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* Database;

      const list = (input: ListSkillsInput = {}) =>
        Effect.gen(function* () {
          const conditions = [
            input.category ? eq(skill.category, input.category) : undefined,
            input.type ? eq(skill.type, input.type) : undefined,
          ].filter((c): c is NonNullable<typeof c> => c !== undefined);
          const condition =
            conditions.length > 0 ? and(...conditions) : undefined;

          return yield* tryQuery("skill", () =>
            db
              .select()
              .from(skill)
              .where(condition)
              .orderBy(asc(skill.sortOrder), asc(skill.name))
          );
        });

      return { list } as const;
    }),
  }
) {}
