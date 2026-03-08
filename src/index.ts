import cron from "node-cron";
import { config } from "./config.js";
import { launchBrowser } from "./browser.js";
import { claimAmazonPrimeGames } from "./platforms/amazon-prime.js";
import { claimEpicGames } from "./platforms/epic-games.js";
import { notifySummary, notifyError, type ClaimResult } from "./notify.js";

async function runClaimWorkflow(): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Game Claim Workflow - ${new Date().toISOString()}`);
  console.log(`${"=".repeat(60)}\n`);

  const results: ClaimResult[] = [];
  let browser;

  try {
    const launched = await launchBrowser();
    browser = launched.browser;
    const page = launched.page;

    // Amazon Prime Gaming
    if (config.platforms.amazon) {
      console.log("\n--- Amazon Prime Gaming ---\n");
      try {
        const amazonResult = await claimAmazonPrimeGames(page);
        results.push(amazonResult);
      } catch (error) {
        await notifyError("Amazon Prime", "unexpected top-level error", error);
        results.push({
          platform: "Amazon Prime Gaming",
          claimed: [],
          skipped: [],
          errors: ["Top-level crash"],
        });
      }
    } else {
      console.log("[Amazon] Disabled, skipping");
    }

    // Epic Games Store
    if (config.platforms.epic) {
      console.log("\n--- Epic Games Store ---\n");
      try {
        const epicResult = await claimEpicGames(page);
        results.push(epicResult);
      } catch (error) {
        await notifyError("Epic Games", "unexpected top-level error", error);
        results.push({
          platform: "Epic Games Store",
          claimed: [],
          skipped: [],
          errors: ["Top-level crash"],
        });
      }
    } else {
      console.log("[Epic] Disabled, skipping");
    }

    // Send summary
    await notifySummary(results);
  } catch (error) {
    await notifyError("Workflow", "browser launch or fatal error", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function main(): Promise<void> {
  if (config.schedule.runOnce) {
    console.log("Running once...");
    await runClaimWorkflow();
  } else {
    console.log(`Scheduling with cron: ${config.schedule.cron}`);
    console.log("Running initial claim...");
    await runClaimWorkflow();

    cron.schedule(config.schedule.cron, () => {
      console.log("\n[Cron] Triggered scheduled run");
      runClaimWorkflow().catch((error) => {
        console.error("[Cron] Workflow failed:", error);
        notifyError("Workflow", "cron scheduled run failed", error);
      });
    });

    console.log(`\nWaiting for next scheduled run (${config.schedule.cron})...`);
  }
}

main().catch(console.error);
