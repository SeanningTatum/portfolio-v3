import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Splits a plain-text case-study field (WHY/HOW/SOLUTION) into paragraphs on
 * blank lines. No markdown parsing by design — `.brain/high-level-
 * architecture/design-language.md` ("/projects/:id") calls for short
 * (≤3-4 line) paragraphs, not rich text — a double-newline split is enough.
 * Trims each paragraph and drops empties (leading/trailing blank lines,
 * `\r\n\r\n`, etc).
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
