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
