import { describe, it, expect } from "vitest";
import { Effect, Exit, Cause } from "effect";
import { parseSkillFile, sortSkills, listSkills } from "../skills";
import { ContentParseError } from "@/models/errors/content";
import type { SkillContent } from "@/lib/schemas/skill";

const validRaw = [
  "---",
  "slug: client-review",
  "name: Client Review",
  "description: Turn any HTML doc into an offline commentable artifact.",
  "type: skill",
  "category: engineering",
  "plugin: engineering-toolkit",
  "repoUrl: https://github.com/x/y/tree/main/plugins/engineering-toolkit/skills/client-review",
  "isNew: true",
  "sortOrder: 0",
  "---",
].join("\n");

const expectFailure = (exit: Exit.Exit<unknown, ContentParseError>) => {
  expect(Exit.isFailure(exit)).toBe(true);
  if (Exit.isFailure(exit)) {
    const failure = Cause.failureOption(exit.cause);
    expect(failure._tag).toBe("Some");
    if (failure._tag === "Some") {
      expect(failure.value).toBeInstanceOf(ContentParseError);
    }
  }
};

describe("parseSkillFile", () => {
  it("parses a valid file into a SkillContent", () => {
    const skill = Effect.runSync(parseSkillFile("sample.md", validRaw));
    expect(skill.slug).toBe("client-review");
    expect(skill.type).toBe("skill");
    expect(skill.isNew).toBe(true);
    expect(skill.sortOrder).toBe(0);
  });

  it("fails with ContentParseError on malformed frontmatter", () => {
    const exit = Effect.runSyncExit(parseSkillFile("bad.md", "no frontmatter"));
    expectFailure(exit);
  });

  it("fails with ContentParseError when a required field is missing", () => {
    const noName = validRaw.replace("name: Client Review\n", "");
    const exit = Effect.runSyncExit(parseSkillFile("bad.md", noName));
    expectFailure(exit);
  });

  it("fails with ContentParseError on an invalid type literal", () => {
    const badType = validRaw.replace("type: skill", "type: plugin");
    const exit = Effect.runSyncExit(parseSkillFile("bad.md", badType));
    expectFailure(exit);
  });
});

describe("sortSkills", () => {
  it("orders by ascending sortOrder, then name", () => {
    const make = (
      slug: string,
      sortOrder: number,
      name: string
    ): SkillContent =>
      ({
        slug,
        name,
        description: "",
        type: "skill",
        category: "x",
        plugin: "p",
        repoUrl: "u",
        isNew: false,
        sortOrder,
      }) as SkillContent;

    const sorted = sortSkills([
      make("c", 2, "C"),
      make("a", 0, "A"),
      make("b", 1, "B"),
    ]);
    expect(sorted.map((s) => s.slug)).toEqual(["a", "b", "c"]);
  });
});

// Exercises the real bundled content/skills/*.md files via import.meta.glob.
describe("content module (bundled markdown)", () => {
  it("lists all seeded skills, ordered by sortOrder", () => {
    const skills = listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(7);
    const orders = skills.map((s) => s.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("every skill has a valid marketplace repoUrl and known type", () => {
    const types = new Set(["skill", "command", "agent", "rule", "hook"]);
    for (const skill of listSkills()) {
      expect(skill.repoUrl.startsWith("https://github.com/")).toBe(true);
      expect(types.has(skill.type)).toBe(true);
    }
  });
});
