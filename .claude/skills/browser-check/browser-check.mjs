// browser-check.mjs
//
// Drives the user's REAL, installed Chrome (their profile, their logins) via
// Playwright's launchPersistentContext, navigates to a URL, captures a full-page
// screenshot plus console errors and failed network requests, and prints a JSON
// summary to stdout.
//
// Usage:
//   node browser-check.mjs "<url>" "<outName>" "<profile>"
//
//   <url>      required. e.g. http://localhost:5173/admin
//   <outName>  optional. screenshot base name, default "check"
//   <profile>  optional. Chrome profile dir name, default "Default"

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [, , urlArg, outNameArg, profileArg] = process.argv;

if (!urlArg) {
  console.error(JSON.stringify({ error: 'Usage: node browser-check.mjs "<url>" "<outName>" "<profile>"' }));
  process.exit(1);
}

const url = urlArg;
const outName = outNameArg || 'check';
const profile = profileArg || 'Default';

const shotsDir = path.join(__dirname, 'shots');
fs.mkdirSync(shotsDir, { recursive: true });
const screenshotPath = path.join(shotsDir, `${outName}.png`);

// Windows Chrome "User Data" root (holds Default, Profile 1, Profile 2, ...).
// Playwright's userDataDir wants the profile's own dir OR the root + a
// --profile-directory arg telling Chrome which profile under it to load.
function chromeUserDataRoot() {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, 'Google', 'Chrome', 'User Data');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  }
  return path.join(os.homedir(), '.config', 'google-chrome');
}

const userDataRoot = chromeUserDataRoot();

const result = {
  url,
  profile,
  screenshot: screenshotPath,
  status: null,
  consoleErrors: [],
  failedRequests: [],
  error: null,
};

let context;
try {
  context = await chromium.launchPersistentContext(userDataRoot, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    args: [
      '--start-maximized',
      `--profile-directory=${profile}`,
    ],
  });
} catch (err) {
  result.error =
    `Failed to launch Chrome with profile "${profile}". ` +
    `Make sure Chrome is fully closed first (it locks the profile while running). ` +
    `Original error: ${err.message}`;
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

try {
  const page = context.pages()[0] || (await context.newPage());

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      result.consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    result.failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText || 'unknown',
    });
  });

  page.on('pageerror', (err) => {
    result.consoleErrors.push(`[pageerror] ${err.message}`);
  });

  const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  result.status = response ? response.status() : null;

  await page.bringToFront();
  // Let async console/network activity settle before capturing.
  await page.waitForTimeout(1500);

  await page.screenshot({ path: screenshotPath, fullPage: true });
} catch (err) {
  result.error = err.message;
} finally {
  console.log(JSON.stringify(result, null, 2));
  await context.close();
}
