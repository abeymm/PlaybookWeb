# Web Landing Page & Platform

Next.js web application for Golf Playbook - landing page, printing platform, and user dashboard.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework (App Router) |
| TypeScript | Type-safe development |
| Tailwind CSS v4 | Styling |
| shadcn/ui | Component library |
| Magic UI | Premium animations |
| Amplify Hosting | Deployment |
| maplibre-gl | Map rendering (`/admin` courseData viewer) |
| terra-draw (+ maplibre adapter) | Polygon/vertex editing (`/admin` editor) |

## Architecture

This is a **separate project** from the Backend. It connects to the shared Backend via `amplify_outputs.json`.

```
Backend/                    ← Shared backend (auth, API, storage)
   └── amplify_outputs.json

Web/                        ← This project
   └── (copy amplify_outputs.json when needed)
```

## Project Structure

```
Web/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Landing page
│   │   └── globals.css     # Global styles + theme
│   ├── components/
│   │   └── ui/             # shadcn + Magic UI components
│   └── lib/
│       └── utils.ts        # Utility functions
├── amplify.yml             # Amplify Hosting build config
├── tailwind.config.ts      # Tailwind configuration
└── package.json
```

## Theme

Colors match the iOS app:
- **Primary**: `#FFBF00` (golden amber)
- **Background (dark)**: `#08401B` (dark green)

Defined in `src/app/globals.css` using OKLCH color space.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev          # http://localhost:3000

# Build for production
npm run build

# Run linter
npm run lint
```

## Deployment

### Amplify Hosting (via AWS Console)
1. Go to AWS Amplify Console → "Create new app" → "Host web app"
2. Connect Git repository
3. Select `Web/` as app root
4. Amplify auto-detects `amplify.yml`
5. Deploy

### Custom Domains
- Production: `playbook.golf` → main branch
- Sandbox: `sandbox.playbook.golf` → sandbox branch

## Using Backend Features

To add auth, API calls, or storage:

1. Copy `amplify_outputs.json` from Backend:
   ```bash
   cp ../Backend/amplify_outputs.json .
   ```

2. Configure Amplify in a client component:
   ```typescript
   'use client';
   import { Amplify } from 'aws-amplify';
   import outputs from '../amplify_outputs.json';

   Amplify.configure(outputs);
   ```

3. Use Amplify libraries for auth, data, storage.

**Existing auth precedent (reuse this pattern):** `src/app/dashboard/DashboardShell.tsx` wraps the
course-operator dashboard in `<Authenticator>` (from `@aws-amplify/ui-react`) after calling
`Amplify.configure(outputs)` at module scope. `/admin` follows the same pattern in a slimmer shell
(`src/app/admin/_components/AdminShell.tsx`) and additionally checks the Cognito `admin` group.

## /admin — courseData Dashboard

Operational console for the model-generated courseData (`[OSMCourse]` JSON). Browse the
`AWSCourseIndex`, view/edit polygons on a NAIP-true map, triage a review queue, and publish
approved data to clients via reversible server-side flips. **Desktop-only** (min viewport
1440×900). All pages are `'use client'` (no `adapter-nextjs` SSR auth).

### Architecture

```
src/lib/coursedata/         ← shared logic (framework-free, unit-tested)
  types.ts        [OSMCourse]/OSMHole/OSMFeature + CourseIndexRow (SPEC shapes; ported from
                  Backend osm-proxy-function/types.ts, cited in-file)
  geo.ts          THE coordinate module: {lat,lng} ⇄ GeoJSON [lng,lat], boundary rings,
                  swap detection, courseKeyFor/osmIdFromKey. Every map/editor path imports this.
  featureTags.ts  FEATURE_TAGS (port of coursedata_common.py); `tree` greyed (no iOS case)
  validator.ts    client preflight — mirrors validate_coursedata.py findings/codes (save gate only;
                  server remains the authority)
  colors.ts       per-class map palette (port of iOS SurfaceTypeMapStyle.swift) + review chip palette
  edit.ts         PURE reducers: class change rewrites tags.golf; hole reassign keeps
                  featureIds/teeIds/greenIds/fairwayIds consistent; delete cleans ids
  queue.ts        review-queue ranking (demand → qc) + bulk-approve eligibility
  publish.ts      serving-flip audience wording + hazard checks
  autosave.ts     debounced localStorage draft + stale-vs-regenerated (R9)
  saveFlow.ts     preflight-gate + verdict classification (etag-conflict)
  api.ts          Amplify generateClient (raw GraphQL docs) + aws-amplify/storage helpers

src/app/admin/
  layout.tsx + _components/AdminShell.tsx   slim shell + admin-group gate
  _components/       ui.tsx, states.tsx, hooks.ts, PageHeader.tsx (dependency-free primitives)
  page.tsx           → redirect /admin/review
  review/            triage queue (J/K nav, A/X/F triage keys, save-and-advance, bulk-approve)
  courses/           AWSCourseIndex browser (filters, demand column, togglable columns)
  courses/[osmId]/   the core screen — QC strip + map (flex-1) + docked tabs; CourseMap +
                     CourseDetail + Panels (dynamic-imported, ssr:false)
  jobs/ storage/ metrics/   read-only ledger · prefix browser · coverage+hazard counters
```

### The admin gate is UX-only

`AdminShell` reads `cognito:groups` from the JWT and shows a 403 view for non-admins. This is **not**
a security boundary — the real authz is server-side: every write goes through AppSync mutations
gated by `allow.group('admin')` plus the editor Lambda's group re-check. A user who bypasses the
client gate still cannot mutate anything. No new read surface is exposed (`AWSCourseIndex` and
`public/*` are already guest-readable by design).

### Staging save flow (never sends multi-MB JSON through AppSync)

1. `validator.ts` preflight — any error-level finding blocks the upload (warnings never block).
2. `uploadStaging()` puts the edited JSON to `public/osm-cache-mlgen/staging/{courseKey}.{uuid}.json`.
3. `saveCourseData(courseKey, 'mlgen', stagingKey, baseETag)` — the Lambda reads staging, re-validates
   (the gate), conditional-writes the canonical object (`If-Match: baseETag`), and updates the index.
4. The coded verdict is surfaced verbatim; on `version-conflict`/`etag-conflict` a recovery dialog
   offers reload-and-reapply.

`baseETag` comes from `listCourseDataVersions()`. Boundary is view-only (E11).

### Run against a sandbox

```bash
# Deploy Backend schema first (adds the mlgen/review fields + editor mutations):
cd ../Backend && npx ampx sandbox

# Sync amplify_outputs.json into Web (prefer the existing script over a manual cp):
cd ../Web && ./Scripts/switch-amplify-env.sh    # or: cp ../Backend/amplify_outputs.json .

npm run dev        # http://localhost:3000/admin  (sign in as an admin-group user)
npx vitest run     # coursedata lib unit tests
```

The dashboard codes against the SPEC contract with raw GraphQL document strings, so it expects the
Backend schema (new `AWSCourseIndex` mlgen/review/batch fields + `saveCourseData` /
`listCourseDataVersions` / `restoreCourseDataVersion` / `deleteCourseArtifact` mutations +
`osmResolveCourse(contentVersion)`) to be deployed. If a field/mutation name in the deployed schema
differs, the generated GraphQL field names are centralized in `src/lib/coursedata/api.ts` (`GQL`).

## Components

### shadcn/ui (Base)
- Button, Card, Badge, Separator

### Magic UI (Animations)
- AnimatedShinyText - Shimmering text effect
- ShimmerButton - Animated CTA button
- BlurFade - Fade-in with blur
- BentoGrid - Feature grid layout
- Marquee - Scrolling testimonials
- WordRotate - Rotating text
- Particles - Background particles

### Adding Components

```bash
# shadcn components
npx shadcn@latest add [component]

# Magic UI components
npx shadcn@latest add "https://magicui.design/r/[component]"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Node.js version (requires 18+) |
| Import errors | Magic UI uses named exports: `{ Component }` |
| Theme not applying | Check globals.css OKLCH values |
| Backend features not working | Ensure amplify_outputs.json is present |

## gstack (recommended)

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted workflows.
Install it for the best experience:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Skills like /qa, /ship, /review, /investigate, and /browse become available after install.
Use /browse for all web browsing. Use ~/.claude/skills/gstack/... for gstack file paths.
