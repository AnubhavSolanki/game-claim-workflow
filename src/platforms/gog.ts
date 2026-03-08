import type { Page } from "puppeteer";
import { waitAndClick, delay } from "../utils.js";

const SELECTORS = {
  claimButton: ".tw-button--full-width > .tw-button__text",
  gogClaimButton: "button.button",
  redeemButton: "button.primary",
};

export async function claimGog(page: Page): Promise<void> {
  await delay(5000);

  // Click claim button on Prime page
  await waitAndClick(page, SELECTORS.claimButton, { timeout: 5000 });
  console.log("[GOG] Clicked claim button");

  await delay(2000);

  // Click "Claim" on GOG popup
  await waitAndClick(page, SELECTORS.gogClaimButton, { timeout: 5000 });
  console.log("[GOG] Clicked Claim on GOG");

  await delay(1000);

  // Click "Redeem"
  await waitAndClick(page, SELECTORS.redeemButton, { timeout: 5000 });
  console.log("[GOG] Clicked Redeem");

  await delay(2000);

  // Switch to GOG tab if opened
  const pages = await page.browser().pages();
  const gogPage = pages[pages.length - 1];
  if (gogPage && gogPage !== page) {
    await gogPage.bringToFront();
    console.log("[GOG] Switched to GOG tab");
    await delay(3000);
    await page.bringToFront();
  }
}
