# OpenCode Agent Instructions

## Project Setup
- Uses Bun package manager (from bun.lock)
- Install: `bun install`
- Dev server: `bun run dev`
- Build: `bun run build`
- Start: `bun run start`
- Lint: `bun run lint`

## Code Structure
- Next.js 16 with app router (pages in `/app`)
- Global styles: `/app/globals.css`
- Layout: `/app/layout.tsx`
- Components: `/components` directory
- Entry point: `/app/page.tsx`

## Development Notes
- TypeScript enabled (tsconfig.json present)
- Tailwind CSS 4 configured
- Uses Radix UI primitives for accessible components
- No test framework configured yet
- ESLint with Next.js config