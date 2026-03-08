import type { Page } from "puppeteer";
import { waitAndClick, elementExists, delay, retry, takeScreenshot, navigateTo } from "../utils.js";
import { notifySuccess, notifyError, notifySkip, type ClaimResult } from "../notify.js";
import { claimGog } from "./gog.js";
import { claimLegacyGame } from "./legacy-games.js";
import { claimXbox } from "./xbox.js";

const SELECTORS = {
  claimButtonHomepage: `//*[@data-a-target='offer-list-FGWP_FULL' and not(@data-a-target='offer-list-FGWP')]//p[text()='Claim game']`,
  claimButtonGamePage: "button.tw-button",
  collectedButton: `(//div[@id="offer-section-FGWP_FULL"]//div[contains(@class, "item-card__action")])[1]//p[text()="Collected"]`,
  freeTab: `id("SearchBar")/DIV[1]/DIV[1]/DIV[1]/DIV[2]/BUTTON[1]/DIV[1]/DIV[1]/P[1]`,
  gogIndicator: `//*[contains(text(), 'GOG')]`,
  legacyIndicator: `//*[text()='Legacy Games']`,
  xboxIndicator: `//*[contains(text(), 'Xbox')]`,
};

export async function claimAmazonPrimeGames(page: Page): Promise<ClaimResult> {
  const result: ClaimResult = { platform: "Amazon Prime Gaming", claimed: [], skipped: [], errors: [] };

  try {
    await navigateTo(page, "https://gaming.amazon.com/home");
    console.log("[Amazon] Opened Prime Gaming homepage");

    // Click "Free" tab
    try {
      await waitAndClick(page, SELECTORS.freeTab, { xpath: true, timeout: 5000 });
      console.log("[Amazon] Clicked Free tab");
      await delay(2000);
    } catch (error) {
      await notifyError("Amazon Prime", "clicking Free tab", error, await takeScreenshot(page));
      result.errors.push("Failed to click Free tab");
      return result;
    }

    // Main claim loop
    let iteration = 0;
    const MAX_ITERATIONS = 50;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      // Check if "Collected" is showing (all games claimed)
      const hasCollected = await elementExists(page, SELECTORS.collectedButton, { xpath: true, timeout: 500 });
      if (hasCollected) {
        console.log("[Amazon] All games collected, stopping loop");
        break;
      }

      // Check if "Claim game" button exists
      const hasClaimButton = await elementExists(page, SELECTORS.claimButtonHomepage, {
        xpath: true,
        timeout: 500,
      });
      if (!hasClaimButton) {
        console.log("[Amazon] No more claim buttons found, stopping loop");
        break;
      }

      try {
        // Click claim on homepage
        await retry(
          () =>
            waitAndClick(page, `(${SELECTORS.claimButtonHomepage})[1]`, { xpath: true, timeout: 5000 }),
          { attempts: 2, delayMs: 2000, label: "claim button homepage" }
        );
        console.log(`[Amazon] Clicked claim button (iteration ${iteration})`);

        await delay(2000);

        // Click claim on game page
        await retry(
          () => waitAndClick(page, SELECTORS.claimButtonGamePage, { timeout: 5000 }),
          { attempts: 2, delayMs: 2000, label: "claim button game page" }
        );
        console.log("[Amazon] Clicked claim on game page");

        await delay(2000);

        // Check for GOG game
        const isGog = await elementExists(page, SELECTORS.gogIndicator, { xpath: true, timeout: 1000 });
        if (isGog) {
          console.log("[Amazon] Detected GOG game, delegating...");
          try {
            await claimGog(page);
            result.claimed.push("GOG game");
            await notifySuccess("Amazon Prime (GOG)", "Successfully claimed GOG game");
          } catch (error) {
            await notifyError("Amazon Prime (GOG)", "claiming GOG game", error, await takeScreenshot(page));
            result.errors.push("GOG claim failed");
          }
        }

        // Check for Legacy game
        const isLegacy = await elementExists(page, SELECTORS.legacyIndicator, { xpath: true, timeout: 500 });
        if (isLegacy) {
          console.log("[Amazon] Detected Legacy game, delegating...");
          try {
            await claimLegacyGame(page);
            result.claimed.push("Legacy game");
            await notifySuccess("Amazon Prime (Legacy)", "Successfully claimed Legacy game");
          } catch (error) {
            await notifyError(
              "Amazon Prime (Legacy)",
              "claiming Legacy game",
              error,
              await takeScreenshot(page)
            );
            result.errors.push("Legacy claim failed");
          }
        }

        // Check for Xbox game
        const isXbox = await elementExists(page, SELECTORS.xboxIndicator, { xpath: true, timeout: 500 });
        if (isXbox) {
          console.log("[Amazon] Detected Xbox game, delegating...");
          try {
            await claimXbox(page);
            result.claimed.push("Xbox game");
            await notifySuccess("Amazon Prime (Xbox)", "Successfully redeemed Xbox game");
          } catch (error) {
            await notifyError(
              "Amazon Prime (Xbox)",
              "claiming Xbox game",
              error,
              await takeScreenshot(page)
            );
            result.errors.push("Xbox claim failed");
          }
        }

        // Regular claim (not GOG/Legacy/Xbox)
        if (!isGog && !isLegacy && !isXbox) {
          result.claimed.push(`Game ${iteration}`);
          await notifySuccess("Amazon Prime", `Successfully claimed game ${iteration}`);
        }

        // Navigate back to home for next iteration
        await navigateTo(page, "https://gaming.amazon.com/home");
        await delay(1000);

        // Click Free tab again
        try {
          await waitAndClick(page, SELECTORS.freeTab, { xpath: true, timeout: 5000 });
          await delay(2000);
        } catch {
          // Tab might already be selected
        }
      } catch (error) {
        await notifyError(
          "Amazon Prime",
          `claim loop iteration ${iteration}`,
          error,
          await takeScreenshot(page)
        );
        result.errors.push(`Iteration ${iteration} failed`);

        try {
          await navigateTo(page, "https://gaming.amazon.com/home");
          await delay(1000);
        } catch {
          break;
        }
      }
    }
  } catch (error) {
    await notifyError("Amazon Prime", "main flow", error);
    result.errors.push("Main flow failed");
  }

  return result;
}
