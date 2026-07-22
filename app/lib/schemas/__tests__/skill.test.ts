import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { SkillType, ListSkillsInput } from "../skill";

const decode = <A, I>(s: Schema.Schema<A, I>) => Schema.decodeUnknownEither(s);

describe("SkillType", () => {
  it("decodes each valid literal", () => {
    for (const value of ["skill", "command", "agent", "rule", "hook"]) {
      expect(decode(SkillType)(value)._tag).toBe("Right");
    }
  });

  it("rejects an unknown literal", () => {
    expect(decode(SkillType)("plugin")._tag).toBe("Left");
  });
});

describe("ListSkillsInput", () => {
  it("decodes an empty payload", () => {
    expect(decode(ListSkillsInput)({})._tag).toBe("Right");
  });

  it("decodes a category filter", () => {
    expect(decode(ListSkillsInput)({ category: "engineering" })._tag).toBe(
      "Right"
    );
  });

  it("decodes a type filter", () => {
    expect(decode(ListSkillsInput)({ type: "command" })._tag).toBe("Right");
  });

  it("decodes a combined category + type filter", () => {
    expect(
      decode(ListSkillsInput)({ category: "commands", type: "command" })._tag
    ).toBe("Right");
  });

  it("rejects a non-string category", () => {
    expect(decode(ListSkillsInput)({ category: 42 })._tag).toBe("Left");
  });

  it("rejects an invalid type", () => {
    expect(decode(ListSkillsInput)({ type: "plugin" })._tag).toBe("Left");
  });
});
