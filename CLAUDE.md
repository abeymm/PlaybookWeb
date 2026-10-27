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

## NAIP basemap (all map pages)

Browser maps load NAIP from the same-origin proxy `/api/naip/tile/{z}/{x}/{y}` (`NAIP_TILES` in
`src/lib/imagery/naipTiles.ts`), never from Planetary Computer directly. PC mosaic ids now expire (~24 h,
`pc1.<expiryEpoch>.<hash>`); the route registers the NAIP search on demand and caches the live id in memory
(`src/lib/imagery/naipMosaic.ts`), re-registering on expiry or a 404. Nothing to pin or refresh by hand.
Black basemap = check `curl localhost:3000/api/naip/tile/16/12398/26248` first.

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

## /local — the all-on-this-Mac courseData flow

A separate route from `/admin` (which is bound to the sandbox). Nothing under `/local` touches
Amplify, S3, or a Lambda: the page talks only to its own route handlers under `/local/api`, which
run on the dev server and read/spawn against the sibling repos. Hosted builds return 404 for every
handler (`isLocalFlowEnabled()` is true only under `next dev` (`NODE_ENV=development`); no runtime switch). The dev server binds 127.0.0.1 (`npm run dev` = `next dev -H 127.0.0.1`) and every
`/local/api` handler also refuses a `Host` other than localhost/127.0.0.1 and any cross-site `Origin` with 403.

```
src/lib/localflow/
  config.ts   SERVER-ONLY paths (PLAYBOOK_ROOT defaults to Web's parent) + the dev gate + course-key guard
  cohort.ts   pure: parse Scripts/regions/us/osm_cohort.json + name search (unit-tested)
  book.ts     pure: print_book argv/env builder, run listing + summaries, review.csv round-trip, served-file allowlist (unit-tested); bookTypes.ts client-safe shapes; bookServer.ts SERVER-ONLY secret + GolfAPI-id lookup
  strategy.ts pure: per-hole note chains (tee<layup<approach<green, then shotOrder), client rechain, haversine yd, add/delete layup, unsaved-edit diff, newest-archive pick, strategy_edit.py argv, path containment (unit-tested; client-safe); strategyServer.ts SERVER-ONLY: run payload loader + PUT runner with an injected exec (unit-tested with a fake)
  jobs.ts     pure: one-job-per-(kind,key) registry over an injected spawner (unit-tested)
  server.ts   SERVER-ONLY: cohort loader, the real spawner (logs to file), fs helpers
  types.ts    response shapes shared with the page (safe for client imports)
src/app/local/
  api/search            GET ?q=            search the local cohort (centerline-ready courses rank first)
  api/status/[key]      GET                cache/generated/report/playbook facts + both jobs + log tails
  api/course/[key]      GET ?source=…, PUT read the generated (or cache) JSON; save corrections (strict-validated)
  api/generate/[key]    POST, GET          generate_course.py (router: US→GolfAPI, else make_coursedata.py --backend local) → $LOCAL_FLOW_OUT_ROOT/coursedata_<key>/ (runbook layout)
  api/export/[key]      POST, GET          iOS PlaybookArchiveExportTool → /tmp/coursedata_<key>/playbook/
  api/export/[key]/file GET ?name=         download the .playbook
  api/book/[key]        POST, GET          Print book: core/print_book.py --course-json <generated JSON> --out <runDir>/print/<runId>/ (id secret from env PLAYBOOK_ID_SECRET, else Keychain `playbook-id-secret`; env-only, never argv/log/response; optional `playbook` as an absolute archive path and `inputsDir` → `--inputs-dir`, both must resolve inside the course's print dir); GET = job + log tail + runs list with summaries
  api/book/[key]/runs/[runId]/file     GET ?name=   allowlisted run files only (book.pdf, contact-sheet.png, report.json, review.csv, greens-contact.png, review-final.md, tee-check.md, run.json, book.log, release/*)
  api/book/[key]/runs/[runId]/review   GET, PUT     parsed review/review.csv; PUT {marks:{hole:yes|no|''}} rewrites owner_ok (other columns kept)
  api/book/[key]/runs/[runId]/strategy GET, PUT    GET = newest strategy/edited archive else strategy/final + review, changes, edit log, tees; PUT {baseArchiveId, notes} writes strategy/edited/edited-notes.json and runs core/strategy_edit.py synchronously (120 s; 422 = script rejected the notes, 504 = timeout, 409 = stale base id or build running); secret env-only
  api/book/[key]/runs/[runId]/release  POST         print_book.py --release --out <runDir> (the CLI is the review gate; 409 with its message when blocked)
  api/scorecard/search  GET ?q=&lat=&lng=  OpenGolfAPI course search (proximity-ranked near the course centre)
  api/scorecard/course/[id] GET            normalized scorecard preview (par/handicap/yards per hole, tees, rating/slope)
  api/scorecard/apply/[key] POST {id}      merge into runDir/input/<key>.json (Generate prefers it) AND the generated JSON
  course/[key]/strategy/[runId]   page: strategy review/edit (holes | NAIP map with draggable shot targets | shot list, flags, rule changes); Save → PUT strategy, then "Rebuild book with this plan" → POST book with playbook + inputsDir; linked from BookPanel's run cards ("Review strategy", "edited plan" chip)
  _components/strategy/ StrategyApp · StrategyMap · HoleList · ShotPanel
  _components/          CoursePicker · RunPanel · ScorecardPanel · LocalCourseView (reuses admin CourseMap/mapdata/Panels + edit.ts)
  (lib)  opengolfapi.ts SERVER-ONLY cache-first client (raw cache: Scripts/regions/us/cache_opengolfapi/raw, gitignored)
         scorecard.ts   pure: OpenGolfAPI → OSMHole.par/handicap/length + course parsMen/indexesMen/tees/rating/slope (unit-tested)
```

**Scorecards come from OpenGolfAPI** (opengolfapi.org, ODbL — attribution is written into
`tags["scorecard:attribution"]`), never from OSM `par` tags alone: OSM hole ways are often par-less
(Meadows at Sunriver has `par: 0` on all 18 and fails strict validation). Reads are keyless; set
`OPENGOLFAPI_KEY` for the `X-OpenGolf-Token` header (higher limits). The merge writes the pipeline's
passthrough keys (`build_coursedata_nosam._COURSE_PASSTHROUGH`), so applying BEFORE Generate feeds
real pars and per-tee lengths into generation; applying after only updates the app-facing fields.

**The scorecard merge is a cross-check, not a source of truth.** It fills values that are missing
or invalid, never overwrites an existing value, and writes everything that needs a human or tool
decision into the course's `checks` section (`OSMCourse.checks`, a pipeline passthrough key):

```
"checks": { "version": 1, "items": [ {
  "id": "par-disagreement:holes[4].par", "kind": "par-disagreement", "path": "holes[4].par",
  "severity": "warning", "status": "open",
  "msg": "hole 5: course par 3, scorecard par 4",
  "current": 3, "candidates": [{ "source": "opengolfapi", "id": "…", "value": 4 }],
  "evidence": ["scorecard:course-website", "distance:centerline-vs-par"],
  "createdAt": "…", "createdBy": "scorecard-merge" } ] }
```

Kinds today (`src/lib/localflow/checks.ts`, unit-tested): `par-disagreement`, `par-filled` (a
missing par taken from the card — verify), `par-placeholder-card` (flat card, not compared),
`handicap-missing`, `handicap-disagreement`, `hole-count-mismatch`, `total-par-mismatch`,
`yardage-vs-centerline` (card yardage vs the drawn centerline length, >15% and >25 yd: a shorter card
suggests a wrong hole/orientation, a longer one a dogleg or another tee), `identity-disagreement`
(name/phone/website). Ids are stable per (kind, path): re-running a producer refreshes its open
items and keeps `resolved`/`dismissed` ones. The course view's **Checks** tab lists them (open
first, jump to the hole); resolving them with other evidence is the following step.

Flow: search by name → pick → attach the OpenGolfAPI scorecard → Generate (≈4 min per 18 holes on Apple silicon; log tail streams) →
the map shows the result; edits use the same reducers as `/admin` and "Save to disk" writes back
(previous file kept as `<key>.prev.json`) → Export builds the `.playbook` with the app's own
import + export code (`iOS/PlaybookTests/Helpers/PlaybookArchiveExportTool.swift`; needs a booted
simulator) → download → AirDrop to a phone. The **Print book** panel (below Export) builds the 40-page book from the generated JSON (GolfAPI id prefilled from the JSON's `apiCourseId`), shows the contact sheet, lets you mark `owner_ok` per review row and release the PDF. Env overrides: `PLAYBOOK_ROOT`, `LOCAL_FLOW_OUT_ROOT`.

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
