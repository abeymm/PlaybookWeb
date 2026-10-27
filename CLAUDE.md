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

## /book — the course book sales page

Landing page for the printed per-course strategy book (launch collection: top US golf destinations;
purchases go through a Shopify link). Mobile first, its own palette and type (Barlow / Barlow
Condensed via `next/font`, `book-*` tokens in `globals.css`), no shared site header.

```
src/lib/book/
  catalog.ts   OWNER-EDITED: launch courses (tee, level, optional per-course buyUrl/price); the buy
               URL from NEXT_PUBLIC_BOOK_BUY_URL (a .example placeholder until set); BOOK_PRICING
               (single "$49", env override NEXT_PUBLIC_BOOK_PRICE; packs enabled: "$89" for two and
               "$39 each" from three; free shipping from "$100"; no
               public group price, no discount-code field); book facts (edition year, pages, size, smallest type)
  forms.ts     pure validation for the course-request form (unit-tested)
  delivery.ts  the provider seam behind BOOK_FORMS_DELIVERY: "log" (dev default; writes the
               submission to the server log) or unconfigured (503 in production until the owner
               picks an email service or storage — see the TODO(owner) block)
src/app/book/
  layout.tsx          fonts, metadata, OG image, JSON-LD (FAQ entries with owner placeholders excluded)
  page.tsx            section order: Header · Hero (course selector, buy, price, packs line, hole-13 spread) ·
                      Stakes · Results (three plain sentences + the play-later paragraph) · WhyABook (empathy,
                      three bullets, specs line, cover) · WhyThisBook · CompanionApp · SampleSection (public PDF link) ·
                      Faq · FinalCta (price, packs line, buy) · RequestBand (the "Don't see your course?" form) · Footer ·
                      StickyBuyBar (phones)
  _components/copy.ts ALL page copy, in page order (source: Marketing/Shopify/book-how-it-works-2026-10-27.md;
                      structure per Marketing/Shopify/book-page-review-2026-10-27.md;
                      wording per Marketing/Shopify/book-page-storybrand-2026-10-27.md)
  _images.ts          generated manifest of public/book/*.webp (hole 13 = book pages 28–29, how-to = page 2);
                      app-hole-map.webp is cropped from iOS/Docs/Plans/Book-Look-In-App-2026-10-27/app/app-hole-map.png
src/app/api/book/
  request/route.ts    POST {email, course, groupSize?, website?} → 200 | 400 fields | 413 | 503 unconfigured;
                      `website` is the honeypot;
                      `groupSize` (1–999) serves tournaments and groups (the FAQ and the request band point there)
```

Rules the page keeps: never name a data source or method, no competitor names, no score promises,
no course counts; the app has one section (the companion-app band after the why-this-book grid; "the only" appears there once, in the eyebrow, owner-confirmed 2026-10-27). Eyebrow labels appear only on the three feature rows and the app band; the hero eyebrow is the collection and edition. The sample PDF is the public file
public/book/sample-tpc-stadium.pdf (owner approved 2026-10-27); no email capture at the top of the
page. Images are regenerated from the book PDF and
`Marketing/Shopify/crops-2026-10-27` (cwebp, q82), never edited by hand.

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
