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
