#!/usr/bin/env node
/**
 * Build script for legal assets (Terms, Privacy, manifest).
 *
 * Renders the markdown sources in src/content/legal/ into:
 *   - <outDir>/TOS.html             (standalone HTML, styled inline)
 *   - <outDir>/privacy.html         (standalone HTML, styled inline)
 *   - <outDir>/legal-manifest.json  (version manifest for iOS update detection)
 *
 * If --upload is passed, also uploads the three files to S3 with appropriate
 * Cache-Control headers:
 *   - HTML files:    max-age=3600           (1 hour freshness OK; manifest gates re-check)
 *   - manifest.json: no-cache, no-store     (always fresh; iOS reads this to decide if HTML changed)
 *
 * Usage:
 *   npm run build:legal-assets                          # build only, default outDir
 *   npm run build:legal-assets -- --out ./.legal-build  # custom outDir
 *   npm run build:legal-assets -- --upload              # build + S3 upload
 *   npm run build:legal-assets -- --dry-run             # build + print what would upload
 *
 * Env (required when --upload is passed):
 *   AMPLIFY_LEGAL_BUCKET   S3 bucket name (the Amplify Storage bucket)
 *   AWS_REGION             e.g. us-east-1
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  (or use IAM role attached to the build env)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseLegalMarkdownFile, type LegalDocument } from "../src/lib/legal";

interface BuildOptions {
  outDir: string;
  upload: boolean;
  dryRun: boolean;
  bucket?: string;
  region?: string;
}

interface ManifestEntry {
  version: string;
  effective_date: string;
  requires_reacceptance: boolean;
  summary: string;
  html_key: string;
}

interface Manifest {
  generated_at: string;
  tos: ManifestEntry;
  privacy: ManifestEntry;
}

const S3_KEYS = {
  tos_html: "public/docs/TOS.html",
  privacy_html: "public/docs/privacy.html",
  manifest: "public/docs/legal-manifest.json",
} as const;

const CACHE_CONTROL = {
  html: "max-age=3600",
  manifest: "no-cache, no-store, must-revalidate",
} as const;

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c] ?? c;
  });
}

function standaloneHtml(doc: LegalDocument): string {
  const title = escapeHtml(doc.frontmatter.title);
  const intro = doc.intro_html ?? "";
  const body = doc.body_html;
  const lastUpdated = doc.frontmatter.version;
  const effective = doc.frontmatter.effective_date;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 18px 48px;
    color: #1a1a1a;
    background: #fafafa;
    line-height: 1.6;
    font-size: 16px;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e6e6e6; background: #0b0b0b; }
    a { color: #ffcc33; }
  }
  h1 { font-size: 1.8rem; margin: 0 0 0.5rem; }
  h2 { font-size: 1.25rem; margin-top: 2rem; }
  h3 { font-size: 1.05rem; margin-top: 1.5rem; }
  p, li { margin: 0.6rem 0; }
  ul, ol { padding-left: 1.4rem; }
  strong { font-weight: 600; }
  a { color: #006633; text-decoration: underline; }
  .meta { color: #6a6a6a; font-size: 0.9rem; margin-bottom: 1.5rem; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Last Updated: ${escapeHtml(lastUpdated)} | Effective Date: ${escapeHtml(effective)}</p>
${intro}
${body}
</body>
</html>
`;
}

function parseArgs(argv: string[]): BuildOptions {
  const opts: BuildOptions = {
    outDir: ".legal-build",
    upload: false,
    dryRun: false,
    bucket: process.env.AMPLIFY_LEGAL_BUCKET,
    region: process.env.AWS_REGION,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" && argv[i + 1]) {
      opts.outDir = argv[++i];
    } else if (a === "--upload") {
      opts.upload = true;
    } else if (a === "--dry-run") {
      opts.dryRun = true;
    }
  }
  return opts;
}

async function buildAssets(opts: BuildOptions): Promise<{
  outDir: string;
  manifest: Manifest;
  artifacts: Array<{ file: string; absPath: string; key: string; contentType: string; cacheControl: string }>;
}> {
  const legalDir = path.resolve(process.cwd(), "src/content/legal");
  const outDir = path.resolve(process.cwd(), opts.outDir);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`[legal-build] Reading markdown sources from ${legalDir}`);

  const tos = await parseLegalMarkdownFile(path.join(legalDir, "terms.md"), "terms");
  const privacy = await parseLegalMarkdownFile(path.join(legalDir, "privacy.md"), "privacy");

  const tosHtml = standaloneHtml(tos);
  const privacyHtml = standaloneHtml(privacy);

  const manifest: Manifest = {
    generated_at: new Date().toISOString(),
    tos: {
      version: tos.frontmatter.version,
      effective_date: tos.frontmatter.effective_date,
      requires_reacceptance: tos.frontmatter.requires_reacceptance,
      summary: tos.frontmatter.summary,
      html_key: S3_KEYS.tos_html,
    },
    privacy: {
      version: privacy.frontmatter.version,
      effective_date: privacy.frontmatter.effective_date,
      requires_reacceptance: privacy.frontmatter.requires_reacceptance,
      summary: privacy.frontmatter.summary,
      html_key: S3_KEYS.privacy_html,
    },
  };

  const tosOut = path.join(outDir, "TOS.html");
  const privacyOut = path.join(outDir, "privacy.html");
  const manifestOut = path.join(outDir, "legal-manifest.json");

  await fs.writeFile(tosOut, tosHtml, "utf-8");
  await fs.writeFile(privacyOut, privacyHtml, "utf-8");
  await fs.writeFile(manifestOut, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`[legal-build] Wrote ${path.relative(process.cwd(), outDir)}/`);
  console.log(`[legal-build]   TOS.html (${tosHtml.length} bytes)`);
  console.log(`[legal-build]   privacy.html (${privacyHtml.length} bytes)`);
  console.log(`[legal-build]   legal-manifest.json`);
  console.log(
    `[legal-build] tos: version=${manifest.tos.version} requires_reacceptance=${manifest.tos.requires_reacceptance}`,
  );
  console.log(
    `[legal-build] privacy: version=${manifest.privacy.version} requires_reacceptance=${manifest.privacy.requires_reacceptance}`,
  );

  return {
    outDir,
    manifest,
    artifacts: [
      {
        file: "TOS.html",
        absPath: tosOut,
        key: S3_KEYS.tos_html,
        contentType: "text/html; charset=utf-8",
        cacheControl: CACHE_CONTROL.html,
      },
      {
        file: "privacy.html",
        absPath: privacyOut,
        key: S3_KEYS.privacy_html,
        contentType: "text/html; charset=utf-8",
        cacheControl: CACHE_CONTROL.html,
      },
      {
        file: "legal-manifest.json",
        absPath: manifestOut,
        key: S3_KEYS.manifest,
        contentType: "application/json; charset=utf-8",
        cacheControl: CACHE_CONTROL.manifest,
      },
    ],
  };
}

async function uploadArtifacts(
  artifacts: Awaited<ReturnType<typeof buildAssets>>["artifacts"],
  bucket: string,
  region: string,
): Promise<void> {
  // Dynamic import keeps @aws-sdk/client-s3 out of the page bundle (build-only dep).
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region });

  for (const a of artifacts) {
    const body = await fs.readFile(a.absPath);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: a.key,
        Body: body,
        ContentType: a.contentType,
        CacheControl: a.cacheControl,
      }),
    );
    console.log(
      `[legal-build] Uploaded s3://${bucket}/${a.key} (Cache-Control: ${a.cacheControl})`,
    );
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const { artifacts } = await buildAssets(opts);

  if (opts.dryRun) {
    console.log("[legal-build] --dry-run: skipping S3 upload. Planned uploads:");
    for (const a of artifacts) {
      console.log(
        `[legal-build]   s3://${opts.bucket ?? "<AMPLIFY_LEGAL_BUCKET unset>"}/${a.key}  (Cache-Control: ${a.cacheControl})`,
      );
    }
    return;
  }

  if (!opts.upload) {
    console.log("[legal-build] --upload not passed; build artifacts written locally only.");
    return;
  }

  if (!opts.bucket || !opts.region) {
    throw new Error(
      "Upload requires AMPLIFY_LEGAL_BUCKET and AWS_REGION env vars (got bucket=" +
        String(opts.bucket) +
        ", region=" +
        String(opts.region) +
        ").",
    );
  }

  await uploadArtifacts(artifacts, opts.bucket, opts.region);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[legal-build] FATAL: ${message}`);
  process.exitCode = 1;
});
