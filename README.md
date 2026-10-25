# ZYRIC.TECH

**75 free online tools. Zero servers. Zero uploads. Zero sign-ups.**

A junk-drawer of everyday tools that run **100% in your browser** — your files and data never leave your device. No accounts, no tracking, no "sign up to see your result" nonsense. Includes 9 **signature tools** you won't find on any other tool site.

![Zyric](public/logo.svg)

## Highlights

- **75 working tools** across 12 categories
- **100% client-side** — tools process everything locally (one optional API route powers the Website Launch Checker)
- **Signature exclusives** — File Submission Checker, Before-You-Open File Inspector, Spreadsheet Health Inspector, Document Change Explainer, Batch File Renamer, Website Launch Readiness Checker, Personal Expiry Calendar, Project Handover Pack Builder, Privacy Scrubber
- **Local persistence** — notes, trackers, expiry items and settings save to `localStorage`
- **Keyboard-first** — `⌘K` / `Ctrl+K` or `/` opens the command palette, `←` / `→` walks between tools
- **Custom design system** — sticker-brutalist UI: hard shadows, outlined mega-type, film grain, boot preloader, custom cursor, magnetic buttons, scramble-decode text, easter eggs

## Categories

Signature · CSS & Design · Notes & Writing · Daily Trackers · Calculators · Converters · Time & Focus · Generators & Dev · Image & Color · Web & Marketing · Business & Money · Random & Fun

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS 4
- shadcn/ui primitives (heavily re-skinned)
- Framer Motion
- localStorage (no database required)

## Run Locally

```bash
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

See [DEPLOY.md](./DEPLOY.md) for the full walkthrough — pushing to GitHub, one-click Vercel deploy, and connecting a custom domain (e.g. `zyric.tech`).

## Privacy Model

- Tools never upload your files; processing happens in your browser.
- The **only** network call is the optional Website Launch Checker (`/api/site-check`), which fetches the URL you type from a serverless function — it never touches your files.
- No analytics, no cookies, no accounts.
