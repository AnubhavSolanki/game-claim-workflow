import type { Page } from "puppeteer";
import { fillField, waitAndClick, delay, getIframe } from "../utils.js";

const SELECTORS = {
  copyCodeInput: "[data-a-target='copy-code-input'] input",
  redeemIframe: "#redeem-iframe",
  codeInput: `//input[@name='tokenString']`,
  nextButton: `//button[contains(text(), 'Next')]`,
  confirmButton: `//button[text()='Confirm']`,
};

export async function claimXbox(page: Page): Promise<void> {
  // Copy the redeem code from Prime page
  const codeInput = await page.$(SELECTORS.copyCodeInput);
  if (!codeInput) throw new Error("Could not find redeem code input");
  const xboxCode = await codeInput.evaluate((el) => (el as HTMLInputElement).value);
  if (!xboxCode) throw new Error("Xbox redeem code is empty");
  console.log(`[Xbox] Copied redeem code: ${xboxCode}`);

  // Open Microsoft redeem page in a new tab
  const redeemPage = await page.browser().newPage();
  await redeemPage.goto("https://account.microsoft.com/billing/redeem", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  console.log("[Xbox] Opened Microsoft redeem page");

  await delay(5000);

  try {
    // Get the redeem iframe
    const frame = await getIframe(redeemPage, SELECTORS.redeemIframe);
    console.log("[Xbox] Found redeem iframe");

    // Fill the code
    await fillField(frame, SELECTORS.codeInput, xboxCode, { xpath: true, timeout: 5000 });
    console.log("[Xbox] Filled redeem code");

    // Click Next
    await waitAndClick(frame, SELECTORS.nextButton, { xpath: true, timeout: 5000 });
    console.log("[Xbox] Clicked Next");

    await delay(3000);

    // Click Confirm
    await waitAndClick(frame, SELECTORS.confirmButton, { xpath: true, timeout: 5000 });
    console.log("[Xbox] Clicked Confirm");

    await delay(3000);
  } finally {
    await redeemPage.close();
    await page.bringToFront();
  }
}
