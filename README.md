# Spenty

Open-source expense and split tracker. Create groups, add members, log expenses, and settle up—no sign-up required. Share a code (and optional password) to collaborate.

## Features

- **Expense groups** — Create a group, get a shareable code
- **Members & expenses** — Add people, log who paid what and how to split
- **Splits** — See who owes whom and settle up
- **Optional password** — Lock groups with a password
- **i18n** — Multiple languages via [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- **PWA-ready** — Web app manifest and icons included

## Stack

| Layer | Tech |
|-------|------|
| Framework | [TanStack Start](https://tanstack.com/start) (React, Vite, SSR) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS |
| Backend / DB | [Supabase](https://supabase.com/) |
| Deploy | [Vercel](https://vercel.com/) |

Also: TanStack Router, TanStack Query, Paraglide i18n, Biome (lint/format), Vitest.

## Getting started

### Prerequisites

- Node 18+
- pnpm

### Install & run

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:3000`.

### Environment

Create a `.env` (or `.env.local`) with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_ANON_KEY=your-anon-key
```

Use the same vars on Vercel for production.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run Vitest tests |
| `pnpm lint` | Biome lint |
| `pnpm format` | Biome format |
| `pnpm check` | Lint + format check |

## Adding UI components

This project uses shadcn (latest). Add components with:

```bash
pnpm dlx shadcn@latest add <component-name>
```

Example: `pnpm dlx shadcn@latest add button`

## Deploying to Vercel

1. Push the repo to GitHub (or connect your Git provider in Vercel).
2. In Vercel, create a new project and import the repo.
3. Set **Framework Preset** to **Vite** (or let Vercel detect it).
4. Add env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`.
5. Deploy. TanStack Start works with Vercel’s Node/serverless runtime.

## Project structure

```
src/
├── api/           # Supabase / server data access
├── components/    # UI + feature components (incl. shadcn ui/)
├── hooks/         # Data & mutation hooks (expenses, groups, members, splits)
├── lib/           # Utils, Supabase client, formatting
├── routes/        # TanStack Router file-based routes
├── integrations/ # TanStack Query provider, devtools
└── paraglide/     # Generated i18n (from project.inlang / messages)
```

## License

Open source. See [LICENSE](./LICENSE) in the repo.
