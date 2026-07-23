/**
 * Minimal, dependency-free frontmatter + markdown-section parser for bundled
 * content files. Not a general YAML/markdown parser — just enough for our
 * `content/projects/*.md` shape (a `---` fenced `key: value` block + `##`
 * sections). Pure functions, no throw — callers decide how to surface a
 * malformed result (the content module maps `ok: false` to a tagged
 * `ContentParseError`).
 */

export interface Frontmatter {
  readonly data: Record<string, unknown>;
  readonly body: string;
}

export type FrontmatterResult =
  | { readonly ok: true; readonly value: Frontmatter }
  | { readonly ok: false; readonly reason: string };

// Leading `---` fence, block contents (lazy), closing `---` fence on its own
// line, then the rest of the document as the body.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/;

/**
 * Coerces a raw frontmatter value string into a JS value. If it parses as
 * JSON (number, boolean, null, quoted string, array, object) that value is
 * used; otherwise it is treated as a bare (unquoted) string. This lets
 * `year: 2026`, `featured: true`, `stack: ["a", "b"]` and
 * `role: Solo builder` all coexist without quoting the common case.
 */
function coerceValue(raw: string): unknown {
  if (raw === "") return "";
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Parses a `---` fenced frontmatter block off the top of `raw`, returning the
 * decoded key/value data plus the remaining markdown body. Fails (`ok: false`)
 * when there is no well-formed fenced block or a block line lacks a `key:`.
 */
export function parseFrontmatter(raw: string): FrontmatterResult {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return {
      ok: false,
      reason:
        "missing or malformed frontmatter block (expected a leading `---` fenced block)",
    };
  }

  const [, block, body] = match;
  const data: Record<string, unknown> = {};

  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const colon = line.indexOf(":");
    if (colon === -1) {
      return {
        ok: false,
        reason: `invalid frontmatter line (expected "key: value"): ${JSON.stringify(line)}`,
      };
    }

    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    data[key] = coerceValue(value);
  }

  return { ok: true, value: { data, body: body ?? "" } };
}

/**
 * Splits a markdown body into a map of lowercased `## heading` → trimmed
 * section text. Content before the first `##` heading is ignored. A heading
 * with no text under it is omitted (empty string sections are dropped).
 */
export function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current !== null) {
      const text = buffer.join("\n").trim();
      if (text !== "") sections[current] = text;
    }
  };

  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      flush();
      current = heading[1].trim().toLowerCase();
      buffer = [];
    } else if (current !== null) {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}
