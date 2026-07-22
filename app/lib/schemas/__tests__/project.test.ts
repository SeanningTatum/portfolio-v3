import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { ListProjectsInput, GetProjectBySlugInput } from "../project";

const decode = <A, I>(s: Schema.Schema<A, I>) => Schema.decodeUnknownEither(s);

describe("ListProjectsInput", () => {
  it("decodes an empty payload", () => {
    expect(decode(ListProjectsInput)({})._tag).toBe("Right");
  });

  it("decodes a category filter", () => {
    expect(decode(ListProjectsInput)({ category: "saas" })._tag).toBe("Right");
  });

  it("rejects a non-string category", () => {
    expect(decode(ListProjectsInput)({ category: 42 })._tag).toBe("Left");
  });
});

describe("GetProjectBySlugInput", () => {
  it("decodes a slug", () => {
    expect(decode(GetProjectBySlugInput)({ slug: "portfolio-v3" })._tag).toBe(
      "Right"
    );
  });

  it("rejects a missing slug", () => {
    expect(decode(GetProjectBySlugInput)({})._tag).toBe("Left");
  });

  it("rejects a non-string slug", () => {
    expect(decode(GetProjectBySlugInput)({ slug: 1 })._tag).toBe("Left");
  });
});
