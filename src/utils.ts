import type { Page, Frame, ElementHandle } from "puppeteer";

/**
 * Wait for a selector and click it. Supports CSS and XPath.
 */
export async function waitAndClick(
  page: Page | Frame,
  selector: string,
  options: { timeout?: number; xpath?: boolean } = {}
): Promise<void> {
  const { timeout = 5000, xpath = false } = options;

  if (xpath) {
    await page.waitForSelector(`::-p-xpath(${selector})`, { timeout });
    const elements = await page.$$(`::-p-xpath(${selector})`);
    if (elements.length === 0) throw new Error(`XPath element not found: ${selector}`);
    await elements[0].click();
  } else {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
  }
}

/**
 * Check if an element exists on the page within a timeout.
 */
export async function elementExists(
  page: Page | Frame,
  selector: string,
  options: { timeout?: number; xpath?: boolean } = {}
): Promise<boolean> {
  const { timeout = 1000, xpath = false } = options;

  try {
    if (xpath) {
      await page.waitForSelector(`::-p-xpath(${selector})`, { timeout });
    } else {
      await page.waitForSelector(selector, { timeout });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content from an element.
 */
export async function getElementText(
  page: Page | Frame,
  selector: string,
  options: { timeout?: number; xpath?: boolean } = {}
): Promise<string> {
  const { timeout = 5000, xpath = false } = options;

  if (xpath) {
    await page.waitForSelector(`::-p-xpath(${selector})`, { timeout });
    const elements = await page.$$(`::-p-xpath(${selector})`);
    if (elements.length === 0) throw new Error(`XPath element not found: ${selector}`);
    return (await elements[0].evaluate((el) => el.textContent)) || "";
  } else {
    await page.waitForSelector(selector, { timeout });
    const el = await page.$(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    return (await el.evaluate((el) => el.textContent)) || "";
  }
}

/**
 * Get an iframe from the page by selector.
 */
export async function getIframe(page: Page, selector: string): Promise<Frame> {
  await page.waitForSelector(selector, { timeout: 10000 });
  const handle = (await page.$(selector)) as ElementHandle<HTMLIFrameElement>;
  if (!handle) throw new Error(`Iframe not found: ${selector}`);
  const frame = await handle.contentFrame();
  if (!frame) throw new Error(`Could not get content frame for: ${selector}`);
  return frame;
}

/**
 * Fill a form field — clears existing value first.
 */
export async function fillField(
  page: Page | Frame,
  selector: string,
  value: string,
  options: { timeout?: number; xpath?: boolean } = {}
): Promise<void> {
  const { timeout = 5000, xpath = false } = options;

  if (xpath) {
    await page.waitForSelector(`::-p-xpath(${selector})`, { timeout });
    const elements = await page.$$(`::-p-xpath(${selector})`);
    if (elements.length === 0) throw new Error(`XPath element not found: ${selector}`);
    await elements[0].click({ clickCount: 3 });
    await elements[0].type(value);
  } else {
    await page.waitForSelector(selector, { timeout });
    const el = await page.$(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    await el.click({ clickCount: 3 });
    await el.type(value);
  }
}

/**
 * Delay execution for a given number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function up to N times with a delay between attempts.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delayMs?: number; label?: string } = {}
): Promise<T> {
  const { attempts = 3, delayMs = 2000, label = "operation" } = options;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts) throw error;
      console.log(`[Retry] ${label} failed (attempt ${i}/${attempts}), retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  throw new Error("Unreachable");
}

/**
 * Take a screenshot and return base64 string.
 */
export async function takeScreenshot(page: Page): Promise<string> {
  const buffer = await page.screenshot({ encoding: "base64" });
  return buffer as string;
}

/**
 * Navigate to a URL and wait for load.
 */
export async function navigateTo(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
}
