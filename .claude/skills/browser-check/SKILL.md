---
name: browser-check
description: Drive real Chrome (the user's profile + logins) to open a URL, click through the running app, screenshot it, capture console/network errors, and autonomously fix issues found. Use when asked to "open my browser", visually check a page, verify a UI change in the real app, or run an observe→fix→recheck loop. Triggers: "check it in the browser", "open the browser and look", "screenshot the app", "browser-check".
---

# browser-check

Gives Claude eyes on the running app: launches the user's real Chrome (with their
logins) via Playwright, navigates, screenshots, and captures errors. Combine with
Edit/Write to close the observe → diagnose → fix → re-check loop.

## Setup (one-time)
- Playwright + Chrome installed inside this skill dir (`node_modules/`).
- Helper: `browser-check.mjs`. Screenshots land in `shots/`.

## How to run a check
Run from the skill directory so `playwright` resolves:

```
cd .claude/skills/browser-check && node browser-check.mjs "<url>" "<outName>" "<profile>"
```

- `<url>` — e.g. `http://localhost:5173/admin`
- `<outName>` — screenshot base name (optional)
- `<profile>` — Chrome profile: `Default`, `Profile 1`, … (optional, default `Default`)

Then **Read** `shots/<outName>.png` to see the page, and inspect the JSON output for
`status`, `consoleErrors`, and `failedRequests`.

## Preconditions
1. **Close Chrome first** — Chrome locks the profile while open; the launch fails otherwise.
2. **Dev server running** for local URLs. Start it in the background: `npm run dev`
   (Vite serves on http://localhost:5173). Confirm with a curl before navigating.
3. Pick the right **profile** — the user's admin / Stripe / test logins may live in a
   specific profile (Default or Profile 1–5). Ask if unsure which.

## The autonomous loop
1. Start dev server if needed; confirm it responds.
2. Run `browser-check.mjs` against the target URL.
3. Read the screenshot + error JSON.
4. If something's wrong, locate the cause in `src/`, Edit the fix.
5. Re-run the check on the same URL and compare. Repeat until clean.
6. Summarize what was broken and what changed.

## Visibility (required)
The user wants to WATCH the automation on their screen. Always run **headed**
(`headless: false`), **maximized** (`viewport: null` + `--start-maximized`), and call
`page.bringToFront()` so the window surfaces in front of their other windows. Never run
headless or let the window stay hidden in the background.

## Notes
- Full-page screenshots; window is maximized (not a fixed viewport).
- For multi-step flows (login → navigate → click), extend `browser-check.mjs` or write a
  one-off script in the scratchpad using the same `launchPersistentContext` setup.
- This is CLI-based, so it works without reloading Claude Code. The `.mcp.json` at repo
  root adds live Playwright MCP tools too, but those require a session reload.
