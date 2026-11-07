# BROWSER: Claude tests your app in real Chrome and fixes its own bugs

You commented "BROWSER," so here's the setup.

Normally Claude writes the code and just tells you it works. Then you open it, and it doesn't.

`/browser-check` closes that gap. Claude opens your app in your real Chrome, takes screenshots, reads the console errors and failed network requests, fixes the code and checks again. It keeps going until the page actually works.

## The loop

1. Starts your dev server if it isn't running.
2. Opens the page in Chrome, using your real profile and logins.
3. Takes a full-page screenshot and **looks at it**.
4. Reads the **console errors** and **failed network requests**.
5. Finds the cause in your code and fixes it.
6. Checks the same page again, and repeats until it's clean.

By the time you look at the page, the obvious bugs are already gone.

## What you need

- Claude Code
- Node.js
- Google Chrome
- Windows. The script looks for Chrome's profile folder in the Windows location; on Mac or Linux, ask Claude to change that one path.

## Setup

1. Copy [`.claude/skills/browser-check/`](.claude/skills/browser-check/) into `~/.claude/skills/browser-check/`. That's `SKILL.md` and `browser-check.mjs`.
2. Install Playwright inside that folder:
   ```
   cd ~/.claude/skills/browser-check
   npm init -y
   npm install playwright
   ```
3. Restart Claude Code.

Or paste this into Claude Code:

```
Install the browser-check skill from
https://github.com/shubham01g/claude-code-browser/tree/main/.claude/skills/browser-check
into ~/.claude/skills, install playwright in that folder, and run a test check on https://example.com.
```

## How to use it

```
/browser-check http://localhost:5173/dashboard
```

Or just say *"check it in the browser"* after Claude changes some UI.

**Close Chrome first.** Chrome locks your profile while it's open, so the check can't start. If your logins live in another Chrome profile, tell Claude which one (`Profile 1`, `Profile 2`…).

The window opens visibly on purpose, so you can watch Claude click through your app.

## Make it stricter

Add this to your project's `CLAUDE.md` so "done" means tested:

```
After any UI change, run /browser-check on the affected page before saying it's done.
```

---

Made by [@shubham_gunjal_ai](https://instagram.com/shubham_gunjal_ai)
