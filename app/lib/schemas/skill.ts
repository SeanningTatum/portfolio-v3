import { Schema } from "effect";

export const SkillType = Schema.Literal(
  "skill",
  "command",
  "agent",
  "rule",
  "hook"
);
export type SkillType = typeof SkillType.Type;

export const ListSkillsInput = Schema.Struct({
  category: Schema.optional(Schema.String),
  type: Schema.optional(SkillType),
});
export type ListSkillsInput = typeof ListSkillsInput.Type;
