# Project Worklog

---
Task ID: 1
Agent: Main agent (Z.ai)
Task: Build zyric.tech — a free online tools website with 23 self-contained tools users can use directly on the site (no external links)

Work Log:
- Clarified requirements with user via AskUserQuestion (source site, style, features, language)
- Researched "zyric.tech": domain currently NXDOMAIN; closest resolving variant zyric-tech.com serves the Qamarix Academy site; fully mapped the Qamarix ecosystem (AyBay, Hishab, Quran Words, Academy, Comarix Ad, Tamkin) via curl + HTML parsing
- First build iteration: Qamarix free-tools directory site (dark tech style)
- User clarified twice: they want their OWN functional tools built INTO the website (notes app, trackers, daily usage apps) — users never leave the site. Pivoted to a full multi-tool web app
- Installed `qrcode` + `@types/qrcode` for the QR generator tool
- Built architecture:
  - `src/components/zyric/hooks.tsx` — useLocalStorage (hydration-safe via queueMicrotask), CopyButton, uid, date helpers, shared style constants
  - `src/components/zyric/registry.tsx` — 23 tools in 7 categories with search keywords
  - `src/components/zyric/text-tools.tsx` — Quick Notes (multi-note, pin, colors, autosave), Word Counter, Case Converter (9 cases), Lorem Ipsum
  - `src/components/zyric/tracker-tools.tsx` — Expense Tracker (income/expense, categories, currency picker, balance), Habit Tracker (7-day grid, streaks), To-Do List (priorities, filters), Water Tracker (daily goal, auto-reset)
  - `src/components/zyric/calc-tools.tsx` — Percentage (3 modes), Loan/EMI, BMI (metric/imperial), Age Calculator, Date Difference
  - `src/components/zyric/convert-time-tools.tsx` — Unit Converter (length/weight/data/speed/temperature), Currency Converter (12 currencies, offline rates), Pomodoro Timer (25/5/15 with auto-breaks), Stopwatch (laps)
  - `src/components/zyric/dev-tools.tsx` — Password Generator (crypto RNG, strength meter), UUID Generator, Base64/URL Encoder-Decoder, JSON Formatter/Validator, QR Code Maker (colors + PNG download)
  - `src/components/zyric/random-tools.tsx` — Coin Flip, Dice Roller, Random Numbers (unique option), List Picker
  - `src/components/zyric/zyric-app.tsx` — app shell: sticky header, desktop sidebar + mobile Sheet nav, hero with search, category grids, tool view, "/" keyboard shortcut
- Fixed 6 lint issues: JSX computed member access in tag (MODES[m].icon → extracted ModeIcon), react-hooks/set-state-in-effect violations (refactored to useMemo derivations, lazy state initializers, queueMicrotask), ref access during render (moved to useEffect), removed unused eslint-disable directives
- Corrected tool count from 22 → 23 (dynamic TOOL_COUNT + metadata)
- Full browser verification with agent-browser

Stage Summary:
- 23 working tools across 7 categories, all client-side, all persisted tools save to localStorage
- Verified: Notes create+autosave, Expense entries ($1000 income − $250 expense = $750 balance), Password "Very strong" + crypto RNG, QR canvas 260×260 render, search→Enter→open flow, Pomodoro start/pause, UUID generation, Unit conversion (1 km = 1,000 m), mobile no-overflow, hamburger menu, sticky footer, zero console/page errors, lint clean
- Deliverable: single-page Next.js 16 app at `/` (src/app/page.tsx → ZyricApp), dev server on port 3000

---
Task ID: 2
Agent: Main agent (Z.ai)
Task: Expand zyric.tech from 23 to 55 tools — add 8 unique "Signature" tools (differentiation strategy) + 24 everyday tools from user's reference lists (all-free-tool.com, freetools.org, 10015.io categories)

Work Log:
- Built 8 signature/differentiator tools per user's strategy doc (rank-at-the-top play):
  - File Submission Checker (batch validation: allowed/required exts, size caps, naming regex, dupes, pass/fail report download) — fixed required-vs-allowed logic after browser testing (required is batch-level "must include", not per-file)
  - Before-You-Open File Inspector (magic byte signatures for 24 formats, extension-mismatch detection, SHA-256, Shannon entropy, ZIP central-directory entry listing with risky-file flags)
  - Spreadsheet Health Inspector (CSV parser, per-column type inference, duplicate rows/IDs, mixed types, ISO vs local date mix, padded whitespace, numbers-as-text, cleaned CSV export)
  - Document Change Explainer (LCS line diff with prefix/suffix trim + 700x700 cap, word-level change highlighting, ignore case/whitespace options, change report download)
  - Personal Expiry Calendar (localStorage, 9 categories, warn-days, status colors, .ics calendar export)
  - Project Handover Pack Builder (5 project-type templates, checkbox progress, README.md generator, JSON save)
  - Privacy Scrubber (regex+Luhn detection of emails/phones/cards/IBANs/IPs/DOB + custom terms, per-type toggles, block/label redaction modes)
  - Website Launch Readiness Checker — needs backend: created src/app/api/site-check/route.ts (Node fetch with 12s timeout, 19 checks: title/meta/viewport/lang/canonical/OG/favicon/h1/alts/robots/sitemap/compression/security headers/mixed content/weight/speed, weighted 0-100 score + grade + "why it matters" explanations); verified live against example.com (score 61, grade C)
- Added 24 everyday tools: Text Sorter & Dedupe, Find & Replace (regex), offline Text Summarizer (extractive, stopwords+position scoring), Slug Generator, Discount (stacked math explained), VAT/GST (add+remove), Tip & Split, Timestamp Converter (live clock), Number Base Converter (bigint, base 2-36), Roman Numerals (both ways + validation), Countdown Timer (presets, WebAudio bell), Hash Generator (SHA-1/256/384/512), Regex Tester (flags, groups, cheatsheet), Markdown Previewer (added marked dep), Image Compressor (canvas WebP/JPEG), Image Resizer (ratio lock + presets), Image to Base64 (data URL/HTML/CSS snippets), Favicon Generator (9 sizes), Color Converter (hex/rgb/hsl + tints/shades), Palette Generator (5 harmonies + saved palettes), Contrast Checker (WCAG AA/AAA), Gradient Maker (linear/radial CSS), Invoice Generator (line items, tax, totals in words, print-to-PDF via @media print CSS in globals.css), Number to Words (cheque-style, 7 currencies)
- Registry: 10 categories now (Signature first w/ Gem icon, + Image & Color, Business), ToolMeta badge union + "unique" (amber "Signature" badge), homepage dedicated "Signature tools — only here" showcase section above category grid
- Fixed lint: duplicate useMemo import (500 error), Button missing import, render-time components (Row/Pickers) extracted/Inlined, unused eslint-disable directives, Set-in-localStorage (stored as string[]), useMemo side-effect setState
- Fixed react-hooks/preserve-manual-memoization by converting handover readme useMemo to plain function
- Updated layout.tsx metadata to 55 tools incl. signature tool keywords
- Full browser verification (agent-browser): all 55 tools render, submission checker verdicts correct (3 files → 2 pass/1 fail), diff word-highlight works, CSV demo finds dupes/whitespace/mixed, live site check works, expiry item persists across reload, invoice totals ($2,750) + words ("Two thousand, seven hundred and fifty dollars only"), SHA-1("hello world") correct, privacy scrubber finds 4 items + redacts, image 635.6KB→8.4KB (99%), file inspector catches .exe-named PDF, mobile 390px no overflow, sheet nav works, zero console/page errors, lint clean
- Note: sidebar physical clicks below viewport fold fail in agent-browser (custom ScrollArea) — JS click + taller viewport confirmed real interaction works; not an app bug

Stage Summary:
- 55 fully working tools across 10 categories, all client-side (one optional backend API for site checking)
- 8 signature tools exclusively on Zyric = the differentiation/ranking strategy
- Deliverable: single-page Next.js 16 app at / (page.tsx → ZyricApp), dev server on port 3000, lint clean, browser-verified
