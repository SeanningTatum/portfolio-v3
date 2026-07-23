import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import { SkillType, SkillContent } from "../skill";

const decode = <A, I>(s: Schema.Schema<A, I>) => Schema.decodeUnknownEither(s);

const validSkill = {
  slug: "client-review",
  name: "Client Review",
  description: "Turn any HTML doc into an offline commentable artifact.",
  type: "skill",
  category: "engineering",
  plugin: "engineering-toolkit",
  repoUrl:
    "https://github.com/SeanningTatum/marketplace/tree/main/plugins/engineering-toolkit/skills/client-review",
  isNew: true,
  sortOrder: 0,
};

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

describe("SkillContent", () => {
  it("decodes a valid skill", () => {
    expect(decode(SkillContent)(validSkill)._tag).toBe("Right");
  });

  it("rejects an invalid type", () => {
    expect(decode(SkillContent)({ ...validSkill, type: "plugin" })._tag).toBe(
      "Left"
    );
  });

  it("rejects a missing required field", () => {
    const { repoUrl, ...noUrl } = validSkill;
    expect(decode(SkillContent)(noUrl)._tag).toBe("Left");
  });

  it("rejects a non-boolean isNew", () => {
    expect(decode(SkillContent)({ ...validSkill, isNew: "yes" })._tag).toBe(
      "Left"
    );
  });

  it("rejects a non-number sortOrder", () => {
    expect(
      decode(SkillContent)({ ...validSkill, sortOrder: "0" })._tag
    ).toBe("Left");
  });
});
