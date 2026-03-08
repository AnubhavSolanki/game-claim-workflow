import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";
import { config } from "./config.js";

puppeteer.use(StealthPlugin());

function findChromeExecutable(): string | undefined {
  const envPath = config.chrome.executablePath;
  if (envPath) return envPath;

  // Auto-detect Chrome on macOS
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];

  for (const p of macPaths) {
    try {
      fs.accessSync(p);
      return p;
    } catch {
      // not found, try next
    }
  }

  return undefined;
}

export async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const executablePath = findChromeExecutable();
  if (executablePath) {
    console.log(`[Browser] Using Chrome at: ${executablePath}`);
  } else {
    console.log("[Browser] Using Puppeteer's bundled Chromium (set CHROME_EXECUTABLE_PATH for real Chrome)");
  }

  const browser = await puppeteer.launch({
    headless: config.chrome.headless,
    userDataDir: config.chrome.userDataDir,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  return { browser, page };
}
