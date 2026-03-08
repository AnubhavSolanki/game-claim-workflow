import type { Page } from "puppeteer";
import {
  waitAndClick,
  elementExists,
  getElementText,
  delay,
  getIframe,
  takeScreenshot,
  navigateTo,
} from "../utils.js";
import { notifySuccess, notifyError, notifySkip, type ClaimResult } from "../notify.js";

const SELECTORS = {
  freeNow: (index: number) => `(//*[text()='Free Now'])[${index}]`,
  purchaseButton: `button[data-testid="purchase-cta-button"]`,
  continueButton: `//span[contains(text(), 'Continue')]`,
  paymentIframe: "iframe:nth-child(1)",
  placeOrderButton: "button.payment-btn",
  continueBrowsingButton: "button.eds_14hl3ljd",
  deviceNotCompatible: ".eds_1ypbntd5 > span",
};

export async function claimEpicGames(page: Page): Promise<ClaimResult> {
  const result: ClaimResult = { platform: "Epic Games Store", claimed: [], skipped: [], errors: [] };

  try {
    await navigateTo(page, "https://store.epicgames.com/en-US/");
    console.log("[Epic] Opened Epic Games Store");

    // Scroll down to free games section
    await page.evaluate(() => window.scrollBy({ top: 5000, behavior: "smooth" }));
    await delay(5000);

    let gameCount = 1;
    const MAX_GAMES = 20;

    while (gameCount <= MAX_GAMES) {
      // Check if free game exists at this index
      const hasFreeGame = await elementExists(page, SELECTORS.freeNow(gameCount), {
        xpath: true,
        timeout: 3000,
      });

      if (!hasFreeGame) {
        console.log(`[Epic] No more free games found at index ${gameCount}`);
        break;
      }

      try {
        // Click the free game
        await waitAndClick(page, SELECTORS.freeNow(gameCount), { xpath: true, timeout: 5000 });
        console.log(`[Epic] Clicked free game ${gameCount}`);

        await delay(3000);

        // Check if purchase button exists
        const hasPurchaseButton = await elementExists(page, SELECTORS.purchaseButton, { timeout: 5000 });

        if (!hasPurchaseButton) {
          const notCompatible = await elementExists(page, SELECTORS.deviceNotCompatible, { timeout: 1000 });
          if (notCompatible) {
            console.log(`[Epic] Game ${gameCount} not compatible with device, skipping`);
            result.skipped.push(`Game ${gameCount} (not compatible)`);
            await notifySkip("Epic Games", `Game ${gameCount} not compatible with this device`);
          } else {
            console.log(`[Epic] No purchase button for game ${gameCount}, skipping`);
            result.skipped.push(`Game ${gameCount} (no button)`);
          }
          await navigateTo(page, "https://store.epicgames.com/en-US/");
          await page.evaluate(() => window.scrollBy({ top: 5000, behavior: "smooth" }));
          await delay(3000);
          gameCount++;
          continue;
        }

        // Get button text to check if already in library
        const buttonText = await getElementText(page, SELECTORS.purchaseButton, { timeout: 5000 });

        if (buttonText.trim() === "In Library") {
          console.log(`[Epic] Game ${gameCount} already in library, skipping`);
          result.skipped.push(`Game ${gameCount} (in library)`);
          await notifySkip("Epic Games", `Game ${gameCount} already in library`);
          await navigateTo(page, "https://store.epicgames.com/en-US/");
          await page.evaluate(() => window.scrollBy({ top: 5000, behavior: "smooth" }));
          await delay(3000);
          gameCount++;
          continue;
        }

        // Click Get/Purchase button
        await waitAndClick(page, SELECTORS.purchaseButton, { timeout: 5000 });
        console.log("[Epic] Clicked Get button");

        await delay(2000);

        // Click Continue
        try {
          await waitAndClick(page, SELECTORS.continueButton, { xpath: true, timeout: 5000 });
          console.log("[Epic] Clicked Continue");
        } catch {
          console.log("[Epic] No Continue button, proceeding...");
        }

        await delay(3000);

        // Handle Place Order in iframe
        try {
          const iframe = await getIframe(page, SELECTORS.paymentIframe);
          const hasPlaceOrder = await elementExists(iframe, SELECTORS.placeOrderButton, { timeout: 10000 });
          if (hasPlaceOrder) {
            await waitAndClick(iframe, SELECTORS.placeOrderButton, { timeout: 5000 });
            console.log("[Epic] Clicked Place Order");
          }
        } catch (error) {
          console.log(
            "[Epic] Iframe/Place Order handling:",
            error instanceof Error ? error.message : error
          );
          await notifyError(
            "Epic Games",
            `Place Order for game ${gameCount}`,
            error,
            await takeScreenshot(page)
          );
          result.errors.push(`Game ${gameCount} Place Order failed`);
        }

        await delay(5000);

        // Click Continue Browsing
        try {
          const hasContinueBrowsing = await elementExists(page, SELECTORS.continueBrowsingButton, {
            timeout: 5000,
          });
          if (hasContinueBrowsing) {
            await waitAndClick(page, SELECTORS.continueBrowsingButton, { timeout: 5000 });
            console.log("[Epic] Clicked Continue Browsing");
          }
        } catch {
          console.log("[Epic] No Continue Browsing button");
        }

        result.claimed.push(`Game ${gameCount}`);
        await notifySuccess("Epic Games", `Successfully claimed game ${gameCount}`);

        await delay(2000);

        // Navigate back to store for next game
        await navigateTo(page, "https://store.epicgames.com/en-US/");
        await page.evaluate(() => window.scrollBy({ top: 5000, behavior: "smooth" }));
        await delay(3000);
      } catch (error) {
        await notifyError("Epic Games", `game ${gameCount} claim flow`, error, await takeScreenshot(page));
        result.errors.push(`Game ${gameCount} failed`);

        try {
          await navigateTo(page, "https://store.epicgames.com/en-US/");
          await page.evaluate(() => window.scrollBy({ top: 5000, behavior: "smooth" }));
          await delay(3000);
        } catch {
          break;
        }
      }

      gameCount++;
    }
  } catch (error) {
    await notifyError("Epic Games", "main flow", error);
    result.errors.push("Main flow failed");
  }

  return result;
}
