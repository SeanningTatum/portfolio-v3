import { Data } from "effect";

/**
 * Raised when a bundled markdown content file (e.g. `content/projects/*.md`)
 * cannot be parsed or fails Effect Schema validation. Content is trusted,
 * build-time data — this error exists so a malformed file fails loudly (in
 * tests and at module load) instead of silently rendering broken output.
 */
export class ContentParseError extends Data.TaggedError("ContentParseError")<{
  readonly file: string;
  readonly reason: string;
}> {}

export type ContentError = ContentParseError;
