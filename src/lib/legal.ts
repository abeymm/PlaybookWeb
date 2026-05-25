import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export type LegalSlug = "terms" | "privacy";

export interface LegalFrontmatter {
  title: string;
  version: string;
  effective_date: string;
  requires_reacceptance: boolean;
  summary: string;
  seo_description?: string;
  intro?: string;
}

export interface LegalDocument {
  slug: LegalSlug;
  frontmatter: LegalFrontmatter;
  body_html: string;
  intro_html?: string;
  markdown: string;
}

export class LegalParseError extends Error {
  constructor(message: string, public readonly source: string) {
    super(`[legal:${source}] ${message}`);
    this.name = "LegalParseError";
  }
}

const REQUIRED_STRING_FIELDS = ["title", "summary"] as const;
const REQUIRED_DATE_FIELDS = ["version", "effective_date"] as const;

const VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}(\.\d+)?$/;

// YAML auto-coerces unquoted ISO-8601 dates (e.g. 2026-05-24) into Date objects.
// Accept either a string or Date so contributors aren't forced to quote.
function coerceToDateString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return undefined;
}

function validateFrontmatter(
  data: Record<string, unknown>,
  source: string,
): LegalFrontmatter {
  for (const field of REQUIRED_STRING_FIELDS) {
    const value = data[field];
    if (typeof value !== "string" || value.trim() === "") {
      throw new LegalParseError(
        `Missing or empty required string field: ${field}`,
        source,
      );
    }
  }

  const dateValues: Record<string, string> = {};
  for (const field of REQUIRED_DATE_FIELDS) {
    const coerced = coerceToDateString(data[field]);
    if (!coerced) {
      throw new LegalParseError(
        `Missing or invalid required date field: ${field}`,
        source,
      );
    }
    if (!VERSION_PATTERN.test(coerced)) {
      throw new LegalParseError(
        `${field} must match YYYY-MM-DD or YYYY-MM-DD.N, got "${coerced}"`,
        source,
      );
    }
    dateValues[field] = coerced;
  }

  if (typeof data.requires_reacceptance !== "boolean") {
    throw new LegalParseError(
      `requires_reacceptance must be a boolean, got ${typeof data.requires_reacceptance}`,
      source,
    );
  }

  return {
    title: data.title as string,
    version: dateValues.version,
    effective_date: dateValues.effective_date,
    requires_reacceptance: data.requires_reacceptance,
    summary: data.summary as string,
    seo_description:
      typeof data.seo_description === "string"
        ? data.seo_description
        : undefined,
    intro: typeof data.intro === "string" ? data.intro : undefined,
  };
}

async function renderMarkdown(markdown: string): Promise<string> {
  const processed = await remark().use(remarkHtml).process(markdown);
  return String(processed);
}

export async function parseLegalMarkdownContent(
  raw: string,
  source = "<inline>",
  slug: LegalSlug = "terms",
): Promise<LegalDocument> {
  const parsed = matter(raw);
  const frontmatter = validateFrontmatter(
    parsed.data as Record<string, unknown>,
    source,
  );

  const body_html = await renderMarkdown(parsed.content);
  const intro_html = frontmatter.intro
    ? await renderMarkdown(frontmatter.intro)
    : undefined;

  return {
    slug,
    frontmatter,
    body_html,
    intro_html,
    markdown: parsed.content,
  };
}

export async function parseLegalMarkdownFile(
  filePath: string,
  slug: LegalSlug,
): Promise<LegalDocument> {
  const raw = await fs.readFile(filePath, "utf-8");
  return parseLegalMarkdownContent(raw, path.basename(filePath), slug);
}

export const LEGAL_DIR = path.join(process.cwd(), "src", "content", "legal");

export async function loadLegalDocument(
  slug: LegalSlug,
): Promise<LegalDocument> {
  return parseLegalMarkdownFile(path.join(LEGAL_DIR, `${slug}.md`), slug);
}
