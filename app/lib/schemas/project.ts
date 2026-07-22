import { Schema } from "effect";

export const ListProjectsInput = Schema.Struct({
  category: Schema.optional(Schema.String),
});
export type ListProjectsInput = typeof ListProjectsInput.Type;

export const GetProjectBySlugInput = Schema.Struct({
  slug: Schema.String,
});
export type GetProjectBySlugInput = typeof GetProjectBySlugInput.Type;
