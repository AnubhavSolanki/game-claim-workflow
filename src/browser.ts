import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "puppeteer";
import { config } from "./config.js";

puppeteer.use(StealthPlugin());

export async function launchBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    headless: config.chrome.headless,
    userDataDir: config.chrome.userDataDir,
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
