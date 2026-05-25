import { describe, it, expect } from "vitest";
import {
  parseLegalMarkdownContent,
  LegalParseError,
} from "../src/lib/legal";

const VALID_FRONTMATTER = `---
title: Terms of Service
version: 2026-05-24
effective_date: 2026-05-24
requires_reacceptance: true
summary: A short summary of the changes.
seo_description: An SEO description.
intro: |
  Welcome to the Service. By using it you accept these Terms.
---

## 1. Hello

This is **the body** of the terms.

- item one
- item two
`;

describe("parseLegalMarkdownContent", () => {
  it("parses valid frontmatter and renders body to HTML", async () => {
    const doc = await parseLegalMarkdownContent(VALID_FRONTMATTER, "test", "terms");

    expect(doc.slug).toBe("terms");
    expect(doc.frontmatter.title).toBe("Terms of Service");
    expect(doc.frontmatter.version).toBe("2026-05-24");
    expect(doc.frontmatter.effective_date).toBe("2026-05-24");
    expect(doc.frontmatter.requires_reacceptance).toBe(true);
    expect(doc.frontmatter.summary).toBe("A short summary of the changes.");
    expect(doc.frontmatter.seo_description).toBe("An SEO description.");
    expect(doc.frontmatter.intro).toContain("Welcome to the Service");
  });

  it("renders markdown body to HTML with proper tags", async () => {
    const doc = await parseLegalMarkdownContent(VALID_FRONTMATTER, "test", "terms");

    expect(doc.body_html).toContain("<h2>1. Hello</h2>");
    expect(doc.body_html).toContain("<strong>the body</strong>");
    expect(doc.body_html).toContain("<li>item one</li>");
    expect(doc.body_html).toContain("<li>item two</li>");
  });

  it("renders intro frontmatter as separate HTML when present", async () => {
    const doc = await parseLegalMarkdownContent(VALID_FRONTMATTER, "test", "terms");

    expect(doc.intro_html).toBeDefined();
    expect(doc.intro_html).toContain("<p>Welcome to the Service");
  });

  it("omits intro_html when intro frontmatter is absent", async () => {
    const noIntro = VALID_FRONTMATTER.replace(
      /intro: \|\n  Welcome to the Service\. By using it you accept these Terms\.\n/,
      "",
    );
    const doc = await parseLegalMarkdownContent(noIntro, "test", "terms");

    expect(doc.intro_html).toBeUndefined();
  });

  it("throws LegalParseError when title is missing", async () => {
    const bad = VALID_FRONTMATTER.replace("title: Terms of Service\n", "");

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      LegalParseError,
    );
    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /Missing or empty required string field: title/,
    );
  });

  it("throws LegalParseError when version is missing", async () => {
    const bad = VALID_FRONTMATTER.replace("version: 2026-05-24\n", "");

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /Missing or invalid required date field: version/,
    );
  });

  it("throws LegalParseError when summary is missing", async () => {
    const bad = VALID_FRONTMATTER.replace(
      "summary: A short summary of the changes.\n",
      "",
    );

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /Missing or empty required string field: summary/,
    );
  });

  it("throws LegalParseError when requires_reacceptance is missing", async () => {
    const bad = VALID_FRONTMATTER.replace("requires_reacceptance: true\n", "");

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /requires_reacceptance must be a boolean/,
    );
  });

  it("throws LegalParseError when requires_reacceptance is not a boolean", async () => {
    const bad = VALID_FRONTMATTER.replace(
      "requires_reacceptance: true",
      "requires_reacceptance: yes",
    );

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /requires_reacceptance must be a boolean/,
    );
  });

  it("throws LegalParseError when version format is invalid", async () => {
    const bad = VALID_FRONTMATTER.replace(
      "version: 2026-05-24",
      "version: May 24 2026",
    );

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /version must match YYYY-MM-DD/,
    );
  });

  it("throws LegalParseError when effective_date format is invalid", async () => {
    const bad = VALID_FRONTMATTER.replace(
      "effective_date: 2026-05-24",
      "effective_date: tomorrow",
    );

    await expect(parseLegalMarkdownContent(bad, "test.md")).rejects.toThrow(
      /effective_date must match YYYY-MM-DD/,
    );
  });

  it("accepts version with .N suffix for hotfix releases", async () => {
    const versioned = VALID_FRONTMATTER.replace(
      "version: 2026-05-24",
      "version: 2026-05-24.1",
    );

    const doc = await parseLegalMarkdownContent(versioned, "test", "terms");
    expect(doc.frontmatter.version).toBe("2026-05-24.1");
  });

  it("throws LegalParseError when frontmatter is entirely missing", async () => {
    const raw = "## Just a heading\n\nbody";

    await expect(parseLegalMarkdownContent(raw, "test.md")).rejects.toThrow(
      LegalParseError,
    );
  });

  it("includes the source name in error messages", async () => {
    const bad = VALID_FRONTMATTER.replace("title: Terms of Service\n", "");

    await expect(
      parseLegalMarkdownContent(bad, "terms.md"),
    ).rejects.toThrow(/\[legal:terms\.md\]/);
  });
});

describe("integration: real terms.md and privacy.md", () => {
  it("parses the real terms.md without error", async () => {
    const { loadLegalDocument } = await import("../src/lib/legal");
    const doc = await loadLegalDocument("terms");

    expect(doc.frontmatter.title).toBe("Terms of Service");
    expect(doc.frontmatter.requires_reacceptance).toBe(true);
    expect(doc.body_html).toContain("Permitted Use of Printed Playbooks");
    expect(doc.body_html).toContain("B2B Services");
  });

  it("parses the real privacy.md without error", async () => {
    const { loadLegalDocument } = await import("../src/lib/legal");
    const doc = await loadLegalDocument("privacy");

    expect(doc.frontmatter.title).toBe("Privacy Policy");
    expect(doc.frontmatter.requires_reacceptance).toBe(false);
    expect(doc.body_html).toContain("AI Caddie");
    expect(doc.body_html).toContain("California Privacy Rights");
  });
});
